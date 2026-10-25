const { supabase } = require('../config/supabase');

async function recordNotification(userId, type, title, message) {
    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            type,
            title: String(title).slice(0, 120),
            message: String(message).slice(0, 300),
        });
        if (error) throw error;
    } catch (error) {
        // Activity history must never make the underlying save/edit/delete fail.
        console.error('Could not record activity notification:', error.message);
    }
}

module.exports = { recordNotification };
