const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const crypto = require('crypto');

/**
 * GET /api/collections
 * Get all collections for authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('collections')
            .select('*, useful_links(count)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to include link count
        const collections = data.map(c => ({
            ...c,
            link_count: c.useful_links?.[0]?.count || 0,
            useful_links: undefined
        }));

        res.json({ collections });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

/**
 * GET /api/collections/shared/:slug
 * Get a public shared collection (no auth required)
 */
router.get('/shared/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data: collection, error: colError } = await supabase
            .from('collections')
            .select('*')
            .eq('share_slug', slug)
            .eq('is_public', true)
            .single();

        if (colError || !collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const { data: links, error: linksError } = await supabase
            .from('useful_links')
            .select('id, url, title, description, image_url, favicon_url, note, category, tags, created_at')
            .eq('collection_id', collection.id)
            .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        res.json({ collection, links });
    } catch (error) {
        console.error('Error fetching shared collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

/**
 * GET /api/collections/:id
 * Get a specific collection with its links
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: collection, error: colError } = await supabase
            .from('collections')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (colError || !collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const { data: links, error: linksError } = await supabase
            .from('useful_links')
            .select('*')
            .eq('collection_id', id)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        res.json({ collection, links });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

/**
 * POST /api/collections
 * Create a new collection
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const { data, error } = await supabase
            .from('collections')
            .insert([{
                user_id: req.user.id,
                name: name.trim(),
                description: description?.trim() || null,
                color: color || '#f97316'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ collection: data });
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

/**
 * PATCH /api/collections/:id
 * Update a collection
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim() || null;
        if (color !== undefined) updates.color = color;

        const { data, error } = await supabase
            .from('collections')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ collection: data });
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

/**
 * POST /api/collections/:id/share
 * Generate a share link for a collection
 */
router.post('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;

        // Generate unique slug
        const slug = crypto.randomBytes(8).toString('hex');

        const { data, error } = await supabase
            .from('collections')
            .update({ 
                is_public: true, 
                share_slug: slug 
            })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ 
            collection: data,
            shareUrl: `/shared/${slug}`
        });
    } catch (error) {
        console.error('Error sharing collection:', error);
        res.status(500).json({ error: 'Failed to share collection' });
    }
});

/**
 * DELETE /api/collections/:id/share
 * Revoke share link for a collection
 */
router.delete('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('collections')
            .update({ 
                is_public: false, 
                share_slug: null 
            })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ collection: data });
    } catch (error) {
        console.error('Error revoking share:', error);
        res.status(500).json({ error: 'Failed to revoke share' });
    }
});

/**
 * DELETE /api/collections/:id
 * Delete a collection (links are kept but unassigned)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

module.exports = router;

