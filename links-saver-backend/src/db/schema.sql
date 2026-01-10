-- Reels Links Saver - Database Schema v2
-- Run this in Supabase SQL Editor

-- Create the useful_links table
CREATE TABLE IF NOT EXISTS public.useful_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    note TEXT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    favicon_url TEXT,
    category TEXT,
    -- New fields v2
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'to_try' CHECK (status IN ('to_try', 'tried', 'useful', 'dead')),
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL
);

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#f97316',
    is_public BOOLEAN DEFAULT FALSE,
    share_slug TEXT UNIQUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_useful_links_user_id ON public.useful_links(user_id);
CREATE INDEX IF NOT EXISTS idx_useful_links_created_at ON public.useful_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_useful_links_category ON public.useful_links(category);
CREATE INDEX IF NOT EXISTS idx_useful_links_status ON public.useful_links(status);
CREATE INDEX IF NOT EXISTS idx_useful_links_is_favorite ON public.useful_links(is_favorite);
CREATE INDEX IF NOT EXISTS idx_useful_links_tags ON public.useful_links USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_useful_links_collection ON public.useful_links(collection_id);
CREATE INDEX IF NOT EXISTS idx_useful_links_url ON public.useful_links(url);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_share_slug ON public.collections(share_slug);

-- Enable Row Level Security
ALTER TABLE public.useful_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policies for useful_links
DROP POLICY IF EXISTS "Users can read own links" ON public.useful_links;
CREATE POLICY "Users can read own links"
    ON public.useful_links FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own links" ON public.useful_links;
CREATE POLICY "Users can insert own links"
    ON public.useful_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own links" ON public.useful_links;
CREATE POLICY "Users can update own links"
    ON public.useful_links FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own links" ON public.useful_links;
CREATE POLICY "Users can delete own links"
    ON public.useful_links FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for collections
DROP POLICY IF EXISTS "Users can read own collections" ON public.collections;
CREATE POLICY "Users can read own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own collections" ON public.collections;
CREATE POLICY "Users can insert own collections"
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections"
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections"
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON public.useful_links TO authenticated;
GRANT ALL ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon; -- For public shared collections

-- Migration: Add new columns if table already exists
DO $$ 
BEGIN
    -- Add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'useful_links' AND column_name = 'tags') THEN
        ALTER TABLE public.useful_links ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add is_favorite column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'useful_links' AND column_name = 'is_favorite') THEN
        ALTER TABLE public.useful_links ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'useful_links' AND column_name = 'status') THEN
        ALTER TABLE public.useful_links ADD COLUMN status TEXT DEFAULT 'to_try';
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'useful_links' AND column_name = 'updated_at') THEN
        ALTER TABLE public.useful_links ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add collection_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'useful_links' AND column_name = 'collection_id') THEN
        ALTER TABLE public.useful_links ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_useful_links_updated_at ON public.useful_links;
CREATE TRIGGER update_useful_links_updated_at
    BEFORE UPDATE ON public.useful_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
