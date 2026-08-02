function normalizeHost(hostname) {
    return hostname.replace(/^www\./, '').toLowerCase();
}

function isGenericCollectionName(name) {
    if (!name) return true;
    const normalized = name.trim().toLowerCase();
    return ['design', 'saved links', 'general', 'misc', 'miscellaneous', 'other', 'links', 'tools', 'resources'].some(token => normalized === token || normalized.includes(token));
}

// Lightweight fallback only. The screenshot route should let the AI decide first,
// and this helper is only used when the model does not provide a clear recommendation.
function suggestCollectionFromUrl(url) {
    try {
        const parsed = new URL(url);
        const host = normalizeHost(parsed.hostname);
        const path = `${parsed.pathname} ${parsed.search}`.toLowerCase();
        const combined = `${host} ${path}`;

        if (combined.includes('avatar') || combined.includes('character') || combined.includes('portrait') || combined.includes('lensa') || combined.includes('midjourney') || combined.includes('civitai') || combined.includes('craiyon') || combined.includes('leonardo') || combined.includes('openart')) {
            return { name: 'AI Creators', color: '#F59E0B' };
        }

        if (combined.includes('dribbble') || combined.includes('behance') || combined.includes('mobbin') || combined.includes('ui8') || combined.includes('collectui')) {
            return { name: 'UI Inspiration', color: '#7C3AED' };
        }

        if (combined.includes('github') || combined.includes('stackoverflow') || combined.includes('dev.to') || combined.includes('medium')) {
            return { name: 'Developer Resources', color: '#0F766E' };
        }

        if (combined.includes('youtube') || combined.includes('vimeo') || combined.includes('twitch')) {
            return { name: 'Media', color: '#DC2626' };
        }

        if (combined.includes('figma') || combined.includes('notion') || combined.includes('linear') || combined.includes('notion.so')) {
            return { name: 'Product Tools', color: '#2563EB' };
        }

        if (combined.includes('tailwindcss') || combined.includes('vercel') || combined.includes('nextjs') || combined.includes('react.dev')) {
            return { name: 'Frontend Dev', color: '#0891B2' };
        }

        if (combined.includes('wallpaper') || combined.includes('wallspace') || combined.includes('backgrounds') || combined.includes('background')) {
            return { name: 'Wallpapers', color: '#F97316' };
        }

        if (combined.includes('mockup') || combined.includes('reframe')) {
            return { name: 'Mockups', color: '#8B5CF6' };
        }

        if (combined.includes('compress') || combined.includes('compressor') || combined.includes('resize') || combined.includes('video') || combined.includes('image')) {
            return { name: 'Media Tools', color: '#EC4899' };
        }

        if (combined.includes('invoice') || combined.includes('proposal') || combined.includes('tracker') || combined.includes('invoicing') || combined.includes('time')) {
            return { name: 'Productivity', color: '#10B981' };
        }

        if (combined.includes('newsletter') || combined.includes('letterbox') || combined.includes('clipboard') || combined.includes('screenshot')) {
            return { name: 'Utility Tools', color: '#6366F1' };
        }

        if (combined.includes('macapp') || combined.includes('mac-app') || combined.includes('macos') || combined.includes('mac app')) {
            return { name: 'Mac Apps', color: '#0EA5E9' };
        }

        return { name: 'Saved Links', color: '#64748B' };
    } catch {
        return { name: 'Saved Links', color: '#64748B' };
    }
}

module.exports = {
    isGenericCollectionName,
    suggestCollectionFromUrl,
};
