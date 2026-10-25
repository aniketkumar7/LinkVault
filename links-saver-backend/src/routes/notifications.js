const express = require('express');
const { supabase } = require('../config/supabase');
const { recordNotification } = require('../utils/notifications');

const router = express.Router();
const RETENTION_DAYS = 7;

function expiryCutoff() {
    return new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

async function removeExpiredNotifications() {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', expiryCutoff());
    if (error) throw error;
}

router.get('/', async (req, res) => {
    try {
        await removeExpiredNotifications();
        const { data, error } = await supabase
            .from('notifications')
            .select('id, type, title, message, created_at, read_at')
            .eq('user_id', req.user.id)
            .is('dismissed_at', null)
            .gte('created_at', expiryCutoff())
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ notifications: data });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.post('/import', async (req, res) => {
    try {
        const { saved, failed = 0, duplicates = 0 } = req.body;
        const counts = [saved, failed, duplicates];
        if (counts.some(count => !Number.isInteger(count) || count < 0 || count > 1000)) {
            return res.status(400).json({ error: 'Import counts must be whole numbers between 0 and 1000' });
        }
        if (saved === 0 && failed === 0) return res.json({ notification: null });

        let title;
        if (saved > 0 && failed > 0) title = 'Import partially completed';
        else if (saved > 0) title = 'Import complete';
        else title = 'Import needs attention';

        const parts = [];
        if (saved > 0) parts.push(`${saved} link${saved === 1 ? '' : 's'} saved`);
        if (failed > 0) parts.push(`${failed} couldn’t be imported`);
        if (duplicates > 0) parts.push(`${duplicates} duplicate${duplicates === 1 ? '' : 's'} skipped`);

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: req.user.id,
                type: 'import',
                title,
                message: parts.join(' · '),
            })
            .select('id, type, title, message, created_at, read_at')
            .single();

        if (error) throw error;
        res.status(201).json({ notification: data });
    } catch (error) {
        console.error('Error creating import notification:', error);
        res.status(500).json({ error: 'Failed to save import notification' });
    }
});

router.post('/profile-update', async (req, res) => {
    try {
        await recordNotification(req.user.id, 'profile_updated', 'Profile updated', 'Your name or avatar was changed.');
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error recording profile update:', error);
        res.status(500).json({ error: 'Failed to record profile update' });
    }
});

router.post('/password-update', async (req, res) => {
    try {
        await recordNotification(req.user.id, 'password_updated', 'Password changed', 'Your account password was updated.');
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error recording password update:', error);
        res.status(500).json({ error: 'Failed to record password update' });
    }
});

router.patch('/read-all', async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', req.user.id)
            .is('read_at', null)
            .is('dismissed_at', null);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

router.patch('/restore', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length > 500 || ids.some(id => typeof id !== 'string')) {
            return res.status(400).json({ error: 'A list of up to 500 notification ids is required' });
        }
        if (!ids.length) return res.json({ restored: [] });

        const { data, error } = await supabase
            .from('notifications')
            .update({ dismissed_at: null })
            .eq('user_id', req.user.id)
            .in('id', ids)
            .gte('created_at', expiryCutoff())
            .select('id');
        if (error) throw error;
        res.json({ restored: data.map(row => row.id) });
    } catch (error) {
        console.error('Error restoring notifications:', error);
        res.status(500).json({ error: 'Failed to restore notifications' });
    }
});

router.delete('/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ dismissed_at: new Date().toISOString() })
            .eq('user_id', req.user.id)
            .is('dismissed_at', null)
            .select('id');
        if (error) throw error;
        res.json({ dismissed: data.map(row => row.id) });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ dismissed_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .is('dismissed_at', null)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Notification not found' });
        res.json({ dismissed: data.id });
    } catch (error) {
        console.error('Error clearing notification:', error);
        res.status(500).json({ error: 'Failed to clear notification' });
    }
});

router.patch('/:id/read', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .is('dismissed_at', null)
            .select('id')
            .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Notification not found' });
        res.json({ read: data.id });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

module.exports = router;
