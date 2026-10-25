-- Extend notification kinds for favorite and collection pin activity.
ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
        'import', 'link_added', 'link_edited', 'link_deleted',
        'link_favorited', 'link_unfavorited',
        'collection_created', 'collection_edited', 'collection_deleted',
        'collection_shared', 'collection_unshared', 'collection_pinned', 'collection_unpinned',
        'profile_updated', 'password_updated'
    ));
