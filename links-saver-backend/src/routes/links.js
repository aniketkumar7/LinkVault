const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { fetchMetadata } = require('../utils/metadataFetcher');
const { recordNotification } = require('../utils/notifications');
const { validateLinkInput, normalizeUrl } = require('../utils/validation');

/**
 * GET /api/links
 * Get all links for authenticated user with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { 
            favorite, 
            collection_id,
            search,
            sort = 'created_at',
            order = 'desc',
            limit
        } = req.query;

        let query = supabase
            .from('useful_links')
            .select('*')
            .eq('user_id', req.user.id);

        // Apply filters
        if (favorite === 'true') query = query.eq('is_favorite', true);
        // collection_id=none -> links without a collection ("Unsorted")
        if (collection_id === 'none') query = query.is('collection_id', null);
        else if (collection_id) query = query.eq('collection_id', collection_id);
        // Strip PostgREST filter syntax chars so user input can't break the .or() expression
        const term = String(search || '').replace(/[,()*%\\]/g, ' ').trim().slice(0, 200);
        if (term) {
            query = query.or(`title.ilike.%${term}%,note.ilike.%${term}%,url.ilike.%${term}%,description.ilike.%${term}%`);
        }

        // Apply sorting
        const validSorts = ['created_at', 'updated_at', 'title'];
        const sortField = validSorts.includes(sort) ? sort : 'created_at';
        query = query.order(sortField, { ascending: order === 'asc' });

        const max = parseInt(limit, 10);
        if (max > 0) query = query.limit(Math.min(max, 200));

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
        const normalizedUrl = normalizeUrl(String(url));
        if (!normalizedUrl) return res.status(400).json({ error: 'Invalid URL format' });

        const { data, error } = await supabase
            .from('useful_links')
            .select('id, title, created_at')
            .eq('user_id', req.user.id)
            .eq('url', normalizedUrl)
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
            .select('is_favorite, collection_id, created_at')
            .eq('user_id', req.user.id);

        if (error) throw error;

        const stats = {
            total: data.length,
            favorites: 0,
            unsorted: 0,
            savedLast7Days: 0,
            tags: []
        };

        const tagSet = new Set();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        data.forEach(link => {
            if (link.is_favorite) stats.favorites++;
            if (!link.collection_id) stats.unsorted++;
            if (Date.parse(link.created_at) >= sevenDaysAgo) stats.savedLast7Days++;
        });

        stats.tags = [];

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
            const headers = ['url', 'title', 'note', 'is_favorite', 'collection_id', 'created_at'];
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
        const { url, note, is_favorite, collection_id, allow_duplicate } = req.body;

        // Validate input
        const validation = validateLinkInput({ url, note });
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        const normalizedUrl = normalizeUrl(url);

        // Check for duplicate unless explicitly allowed
        if (!allow_duplicate) {
            const { data: existingLink } = await supabase
                .from('useful_links')
                .select('id, title')
                .eq('user_id', req.user.id)
                .eq('url', normalizedUrl)
                .maybeSingle();

            if (existingLink) {
                return res.status(409).json({ 
                    error: 'This link already exists in your collection',
                    existing: existingLink
                });
            }
        }

        // Prepare link data
        const linkData = {
            user_id: req.user.id,
            url: normalizedUrl,
            note: note?.trim() || '',
            is_favorite: is_favorite || false,
            collection_id: collection_id || null,
            title: null,
            description: null,
            image_url: null,
            favicon_url: null
        };

        // Insert into database
        const { data, error } = await supabase
            .from('useful_links')
            .insert([linkData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Link saved: ${data.id}`);
        await recordNotification(req.user.id, 'link_added', 'Link saved', data.title || new URL(normalizedUrl).hostname);
        res.status(201).json({ link: data });
        fetchMetadata(normalizedUrl).then(async metadata => {
            await supabase.from('useful_links').update({
                title: metadata.title || null,
                description: metadata.description || null,
                image_url: metadata.image || null,
                favicon_url: metadata.favicon || null,
            }).eq('id', data.id).eq('user_id', req.user.id);
        }).catch(error => console.error(`Metadata fetch failed for ${normalizedUrl}:`, error.message));
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
        const { urls, collection_id } = req.body;

        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array required' });
        }

        if (urls.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 URLs per request' });
        }

        const results = {
            success: [],
            failed: [],
            duplicates: []
        };

        const importOne = async (urlItem) => {
            const rawUrl = typeof urlItem === 'string' ? urlItem : urlItem.url;
            const note = typeof urlItem === 'object' ? urlItem.note : '';

            try {
                const validation = validateLinkInput({ url: rawUrl, note });
                if (!validation.valid) throw new Error(validation.error);
                const url = normalizeUrl(rawUrl);
                // Check duplicate
                const { data: existing } = await supabase
                    .from('useful_links')
                    .select('id')
                    .eq('user_id', req.user.id)
                    .eq('url', url)
                    .maybeSingle();

                if (existing) {
                    results.duplicates.push({ url, id: existing.id });
                    return;
                }

                // Fetch metadata
                const metadata = await fetchMetadata(url);

                // Insert
                const { data, error } = await supabase
                    .from('useful_links')
                    .insert([{
                        user_id: req.user.id,
                        url,
                        note: note || '',
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
                results.failed.push({ url: rawUrl, error: err.message });
            }
        };

        // Process a small number in parallel so bulk imports are faster
        // without overwhelming remote sites or the database.
        const concurrency = 5;
        for (let index = 0; index < urls.length; index += concurrency) {
            await Promise.all(urls.slice(index, index + concurrency).map(importOne));
        }

        res.status(201).json(results);
    } catch (error) {
        console.error('Error bulk creating links:', error);
        res.status(500).json({ error: 'Failed to bulk create links' });
    }
});

router.patch('/bulk', async (req, res) => {
    try {
        const { ids, collection_id } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Link ids required' });
        const updates = {};
        if (collection_id !== undefined) updates.collection_id = collection_id || null;
        if (!Object.keys(updates).length) return res.status(400).json({ error: 'No updates provided' });
        const { data, error } = await supabase.from('useful_links').update(updates).in('id', ids).eq('user_id', req.user.id).select();
        if (error) throw error;
        res.json({ links: data });
    } catch (error) {
        console.error('Error applying bulk link updates:', error);
        res.status(500).json({ error: 'Failed to update links' });
    }
});

router.post('/:id/refresh-metadata', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: link, error: findError } = await supabase.from('useful_links').select('url').eq('id', id).eq('user_id', req.user.id).single();
        if (findError || !link) return res.status(404).json({ error: 'Link not found' });
        const metadata = await fetchMetadata(link.url);
        const { data, error } = await supabase.from('useful_links').update({
            title: metadata.title || null, description: metadata.description || null,
            image_url: metadata.image || null, favicon_url: metadata.favicon || null,
            updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', req.user.id).select().single();
        if (error) throw error;
        res.json({ link: data });
    } catch (error) {
        console.error('Error refreshing metadata:', error);
        res.status(500).json({ error: 'Failed to refresh metadata' });
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
        const { url, note, is_favorite, collection_id } = req.body;

        const updates = {};
        if (url !== undefined) {
            const normalizedUrl = normalizeUrl(url);
            if (!normalizedUrl) return res.status(400).json({ error: 'Valid URL is required' });
            const { data: duplicate } = await supabase
                .from('useful_links')
                .select('id')
                .eq('user_id', req.user.id)
                .neq('id', id)
                .eq('url', normalizedUrl)
                .maybeSingle();
            if (duplicate) return res.status(409).json({ error: 'This link already exists in your saved links' });
            updates.url = normalizedUrl;
        }
        if (note !== undefined) updates.note = note.trim();
        if (is_favorite !== undefined) updates.is_favorite = is_favorite;
        if (collection_id !== undefined) updates.collection_id = collection_id || null;

        const { data: previous } = await supabase
            .from('useful_links')
            .select('url, title, note, is_favorite, collection_id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .maybeSingle();

        const { data, error } = await supabase
            .from('useful_links')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        const changed = previous && Object.keys(updates).some(field => data[field] !== previous[field]);
        if (changed) {
            let label = data.title;
            if (!label) {
                try { label = new URL(data.url).hostname; } catch { label = 'Saved link'; }
            }
            await recordNotification(req.user.id, 'link_edited', 'Link updated', label);
        }
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
            .select('is_favorite, title, url')
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

        let label = data.title;
        if (!label) {
            try { label = new URL(data.url).hostname; } catch { label = 'Saved link'; }
        }
        await recordNotification(
            req.user.id,
            data.is_favorite ? 'link_favorited' : 'link_unfavorited',
            data.is_favorite ? 'Added to favorites' : 'Removed from favorites',
            label,
        );
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

        const { data: link } = await supabase
            .from('useful_links')
            .select('url, title')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .maybeSingle();

        const { error } = await supabase
            .from('useful_links')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        if (link) {
            let label = link.title;
            if (!label) {
                try { label = new URL(link.url).hostname; } catch { label = 'Saved link'; }
            }
            await recordNotification(req.user.id, 'link_deleted', 'Link deleted', label);
        }

        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

module.exports = router;
