const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { fetchMetadata } = require('../utils/metadataFetcher');
const { validateLinkInput } = require('../utils/validation');

/**
 * GET /api/links
 * Get all links for authenticated user with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { 
            favorite, 
            collection_id,
            tag,
            search,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        let query = supabase
            .from('useful_links')
            .select('*')
            .eq('user_id', req.user.id);

        // Apply filters
        if (favorite === 'true') query = query.eq('is_favorite', true);
        if (collection_id) query = query.eq('collection_id', collection_id);
        if (tag) query = query.contains('tags', [tag]);
        if (search) {
            query = query.or(`title.ilike.%${search}%,note.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        const validSorts = ['created_at', 'updated_at', 'title'];
        const sortField = validSorts.includes(sort) ? sort : 'created_at';
        query = query.order(sortField, { ascending: order === 'asc' });

        const { data, error } = await query;

        if (error) throw error;

        res.json({ links: data });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

/**
 * GET /api/links/check-duplicate
 * Check if a URL already exists
 */
router.get('/check-duplicate', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        const { data, error } = await supabase
            .from('useful_links')
            .select('id, title, created_at')
            .eq('user_id', req.user.id)
            .eq('url', url.trim())
            .maybeSingle();

        if (error) throw error;

        res.json({ 
            exists: !!data, 
            existing: data 
        });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({ error: 'Failed to check duplicate' });
    }
});

/**
 * GET /api/links/stats
 * Get link statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('useful_links')
            .select('is_favorite, tags')
            .eq('user_id', req.user.id);

        if (error) throw error;

        const stats = {
            total: data.length,
            favorites: 0,
            tags: []
        };

        const tagSet = new Set();

        data.forEach(link => {
            if (link.is_favorite) stats.favorites++;
            if (link.tags) link.tags.forEach(t => tagSet.add(t));
        });

        stats.tags = Array.from(tagSet).sort();

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * GET /api/links/export
 * Export all links as JSON
 */
router.get('/export', async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const { data, error } = await supabase
            .from('useful_links')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (format === 'csv') {
            const headers = ['url', 'title', 'note', 'tags', 'is_favorite', 'collection_id', 'created_at'];
            const csv = [
                headers.join(','),
                ...data.map(link => headers.map(h => {
                    let val = link[h];
                    if (Array.isArray(val)) val = val.join(';');
                    if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
                    return val ?? '';
                }).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=links-export.csv');
            return res.send(csv);
        }

        res.json({ 
            exported_at: new Date().toISOString(),
            count: data.length,
            links: data 
        });
    } catch (error) {
        console.error('Error exporting links:', error);
        res.status(500).json({ error: 'Failed to export links' });
    }
});

/**
 * POST /api/links
 * Create a new link with auto-fetched metadata
 */
router.post('/', async (req, res) => {
    try {
        const { url, note, tags, is_favorite, collection_id } = req.body;

        // Validate input
        const validation = validateLinkInput({ url, note });
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Fetch metadata from URL
        console.log(`Fetching metadata for: ${url}`);
        const metadata = await fetchMetadata(url);

        // Prepare link data
        const linkData = {
            user_id: req.user.id,
            url: url.trim(),
            note: note?.trim() || '',
            tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
            is_favorite: is_favorite || false,
            collection_id: collection_id || null,
            title: metadata.title || null,
            description: metadata.description || null,
            image_url: metadata.image || null,
            favicon_url: metadata.favicon || null
        };

        // Insert into database
        const { data, error } = await supabase
            .from('useful_links')
            .insert([linkData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Link saved: ${data.id}`);
        res.status(201).json({ link: data });
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({
            error: 'Failed to save link',
            details: error.message
        });
    }
});

/**
 * POST /api/links/bulk
 * Create multiple links at once
 */
router.post('/bulk', async (req, res) => {
    try {
        const { urls, tags, collection_id } = req.body;

        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array required' });
        }

        if (urls.length > 20) {
            return res.status(400).json({ error: 'Maximum 20 URLs at once' });
        }

        const results = {
            success: [],
            failed: [],
            duplicates: []
        };

        for (const urlItem of urls) {
            const url = typeof urlItem === 'string' ? urlItem : urlItem.url;
            const note = typeof urlItem === 'object' ? urlItem.note : '';

            try {
                // Check duplicate
                const { data: existing } = await supabase
                    .from('useful_links')
                    .select('id')
                    .eq('user_id', req.user.id)
                    .eq('url', url.trim())
                    .maybeSingle();

                if (existing) {
                    results.duplicates.push({ url, id: existing.id });
                    continue;
                }

                // Fetch metadata
                const metadata = await fetchMetadata(url);

                // Insert
                const { data, error } = await supabase
                    .from('useful_links')
                    .insert([{
                        user_id: req.user.id,
                        url: url.trim(),
                        note: note || '',
                        tags: tags || [],
                        collection_id: collection_id || null,
                        title: metadata.title || null,
                        description: metadata.description || null,
                        image_url: metadata.image || null,
                        favicon_url: metadata.favicon || null
                    }])
                    .select()
                    .single();

                if (error) throw error;
                results.success.push(data);
            } catch (err) {
                results.failed.push({ url, error: err.message });
            }
        }

        res.status(201).json(results);
    } catch (error) {
        console.error('Error bulk creating links:', error);
        res.status(500).json({ error: 'Failed to bulk create links' });
    }
});

/**
 * POST /api/links/:id/check-health
 * Check if a link is still alive
 */
router.post('/:id/check-health', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the link
        const { data: link, error: fetchError } = await supabase
            .from('useful_links')
            .select('url')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError || !link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Check if URL is reachable
        let isAlive = true;
        let statusCode = null;

        try {
            const response = await fetch(link.url, {
                method: 'HEAD',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ReelsLinksSaver/1.0)'
                }
            });
            statusCode = response.status;
            isAlive = response.ok;
        } catch {
            isAlive = false;
        }

        res.json({ 
            id, 
            url: link.url, 
            isAlive, 
            statusCode,
            checkedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking link health:', error);
        res.status(500).json({ error: 'Failed to check link health' });
    }
});

/**
 * PATCH /api/links/:id
 * Update a link
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { note, tags, is_favorite, collection_id } = req.body;

        const updates = {};
        if (note !== undefined) updates.note = note.trim();
        if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [];
        if (is_favorite !== undefined) updates.is_favorite = is_favorite;
        if (collection_id !== undefined) updates.collection_id = collection_id || null;

        const { data, error } = await supabase
            .from('useful_links')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ link: data });
    } catch (error) {
        console.error('Error updating link:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

/**
 * PATCH /api/links/:id/favorite
 * Toggle favorite status
 */
router.patch('/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params;

        // Get current state
        const { data: current } = await supabase
            .from('useful_links')
            .select('is_favorite')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!current) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Toggle
        const { data, error } = await supabase
            .from('useful_links')
            .update({ is_favorite: !current.is_favorite })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ link: data });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

/**
 * DELETE /api/links/:id
 * Delete a specific link
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('useful_links')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

module.exports = router;
