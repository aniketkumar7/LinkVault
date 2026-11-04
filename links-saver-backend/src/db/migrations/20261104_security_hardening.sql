-- Security hardening (pre-launch audit). Run in the Supabase SQL editor.
-- CHECK constraints are NOT VALID: enforced for new/updated rows, existing rows untouched.
-- After cleaning old data you can run: ALTER TABLE ... VALIDATE CONSTRAINT <name>;

-- H4: only http(s) URLs of sane length can be stored, even via direct Supabase REST writes
ALTER TABLE public.useful_links DROP CONSTRAINT IF EXISTS useful_links_url_http;
ALTER TABLE public.useful_links
    ADD CONSTRAINT useful_links_url_http CHECK (url ~* '^https?://' AND length(url) <= 2048) NOT VALID;

-- M4: length limits on free-text fields
ALTER TABLE public.useful_links DROP CONSTRAINT IF EXISTS useful_links_text_lengths;
ALTER TABLE public.useful_links
    ADD CONSTRAINT useful_links_text_lengths CHECK (
        coalesce(length(note), 0) <= 5000
        AND coalesce(length(title), 0) <= 1000
        AND coalesce(length(description), 0) <= 5000
        AND coalesce(length(image_url), 0) <= 2048
        AND coalesce(length(favicon_url), 0) <= 2048
    ) NOT VALID;

ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_fields_valid;
ALTER TABLE public.collections
    ADD CONSTRAINT collections_fields_valid CHECK (
        length(name) BETWEEN 1 AND 120
        AND coalesce(length(description), 0) <= 2000
        AND color ~* '^#[0-9a-f]{6}$'
    ) NOT VALID;

-- M4: a link can only be filed into one of the owner's own collections
DROP POLICY IF EXISTS "Users can insert own links" ON public.useful_links;
CREATE POLICY "Users can insert own links"
    ON public.useful_links FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (collection_id IS NULL OR EXISTS (
            SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can update own links" ON public.useful_links;
CREATE POLICY "Users can update own links"
    ON public.useful_links FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (collection_id IS NULL OR EXISTS (
            SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()
        ))
    );

-- M2: public collections are served only by the backend (/api/shared/:slug, service role).
-- Stop anon/other users from listing every shared collection, slug and user_id via REST.
REVOKE SELECT ON public.collections FROM anon;
DROP POLICY IF EXISTS "Users can read own collections" ON public.collections;
CREATE POLICY "Users can read own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);
