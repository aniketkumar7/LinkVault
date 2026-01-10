# LinkVault

A personal web app to quickly save and organize useful links from social media videos (Reels, Shorts, TikToks, YouTube), and useful websites.

![LinkVault](links-saver-frontend/public/Logo.png)

## Features

- **Quick Save** - Paste a URL and save in seconds with auto-fetched metadata (title, description, image, favicon)
- **Collections** - Organize links into folders with custom colors and descriptions
- **Favorites** - Star important links for quick access
- **Search & Filter** - Find links by title, note, URL, tags, or collection
- **Bulk Import** - Import up to 20 URLs at once
- **Export** - Download your links as JSON or CSV
- **Duplicate Detection** - Warns you before saving a link you already have
- **Dark/Light Theme** - Toggle between themes with persistence
- **Responsive Design** - Works on desktop and mobile
- **Magic Link Auth** - Passwordless login via email

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS v4
- TanStack Query (React Query) for data fetching
- TanStack Virtual for list virtualization
- Sonner for toast notifications

### Backend
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- open-graph-scraper for metadata extraction

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd "Link Saver"
```

### 2. Set up Supabase

Create a new Supabase project and run this SQL in the SQL Editor:

```sql
-- Links table
CREATE TABLE useful_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    favicon_url TEXT,
    note TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL
);

-- Collections table
CREATE TABLE collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_public BOOLEAN DEFAULT FALSE,
    share_slug TEXT UNIQUE
);

-- Indexes
CREATE INDEX idx_useful_links_user_id ON useful_links(user_id);
CREATE INDEX idx_useful_links_url ON useful_links(url);
CREATE INDEX idx_useful_links_collection ON useful_links(collection_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Row Level Security
ALTER TABLE useful_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own links" ON useful_links
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own collections" ON collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public collections are viewable" ON collections
    FOR SELECT USING (is_public = true);
```

### 3. Configure environment variables

**Backend** (`links-saver-backend/.env`):
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Frontend** (`links-saver-frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 4. Install dependencies

```bash
# Backend
cd links-saver-backend
npm install

# Frontend
cd ../links-saver-frontend
npm install
```

### 5. Run the app

```bash
# Terminal 1 - Backend
cd links-saver-backend
npm run dev

# Terminal 2 - Frontend
cd links-saver-frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

### Links
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/links` | Get all links (with filters) |
| POST | `/api/links` | Create a new link |
| PATCH | `/api/links/:id` | Update a link |
| DELETE | `/api/links/:id` | Delete a link |
| PATCH | `/api/links/:id/favorite` | Toggle favorite |
| GET | `/api/links/check-duplicate` | Check if URL exists |
| POST | `/api/links/bulk` | Bulk import URLs |
| GET | `/api/links/stats` | Get statistics |
| GET | `/api/links/export` | Export links (JSON/CSV) |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | Get all collections |
| POST | `/api/collections` | Create a collection |
| PATCH | `/api/collections/:id` | Update a collection |
| DELETE | `/api/collections/:id` | Delete a collection |
| POST | `/api/collections/:id/share` | Share a collection |
| DELETE | `/api/collections/:id/share` | Unshare a collection |

## Project Structure

```
Link Saver/
├── links-saver-backend/
│   ├── src/
│   │   ├── config/         # Supabase client
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helpers (metadata fetcher, validation)
│   └── server.js           # Express entry point
│
├── links-saver-frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (useAuth, useLinks)
│   │   └── lib/            # API client, Supabase client
│   └── index.html
│
└── README.md
```

## License

MIT

