-- Notification inbox. Run this migration in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'import', 'link_added', 'link_edited', 'link_deleted',
        'link_favorited', 'link_unfavorited',
        'collection_created', 'collection_edited', 'collection_deleted',
        'collection_shared', 'collection_unshared', 'collection_pinned', 'collection_unpinned',
        'profile_updated', 'password_updated'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.notifications TO service_role;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Supabase Cron (pg_cron) removes notifications at 7 days, whether read or not.
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('bookmarky-notification-retention')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'bookmarky-notification-retention'
);
SELECT cron.schedule(
    'bookmarky-notification-retention',
    '15 3 * * *',
    $$DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '7 days'$$
);
