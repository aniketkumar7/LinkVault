-- Notifications are written only by the backend (service role). Users may still read
-- their own inbox, but can no longer insert/edit/delete rows directly via Supabase REST
-- (e.g. forging a "Password changed" entry). Run in the Supabase SQL editor.

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;
REVOKE ALL ON public.notifications FROM anon;
