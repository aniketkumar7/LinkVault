const ogs = require('open-graph-scraper');
const { safeFetch } = require('./safeUrl');

/**
 * Fetch metadata from a URL using open-graph-scraper
 * Returns title, description, image, and favicon
 */
async function fetchMetadata(url) {
    try {
        // Fetch ourselves (SSRF-safe, size-capped, redirects re-validated); OGS only parses the HTML
        const page = await safeFetch(url);
        if (!page.ok) return getFallbackMetadata(url);

        const { result, error } = await ogs({ html: page.body });

        if (error) {
            console.warn(`OGS error for ${url}:`, error);
            return getFallbackMetadata(url);
        }

        const origin = new URL(page.url).origin;
        const resolve = (u) => {
            if (!u) return null;
            try {
                const resolved = new URL(u, origin);
                return resolved.protocol === 'http:' || resolved.protocol === 'https:' ? resolved.href : null;
            } catch {
                return null;
            }
        };
        
        return {
            title: result.ogTitle || result.twitterTitle || result.dcTitle || extractDomainName(url),
            description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
            image: resolve(result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url),
            favicon: resolve(result.favicon) || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
        };
    } catch (error) {
        console.error(`Metadata fetch failed for ${url}:`, error.message);
        return getFallbackMetadata(url);
    }
}

/**
 * Fallback metadata when scraping fails
 */
function getFallbackMetadata(url) {
    try {
        const domain = new URL(url).hostname;
        return {
            title: extractDomainName(url),
            description: null,
            image: null,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
        };
    } catch {
        return {
            title: 'Saved Link',
            description: null,
            image: null,
            favicon: null
        };
    }
}

/**
 * Extract readable domain name from URL
 */
function extractDomainName(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '').split('.')[0];
    } catch {
        return 'Link';
    }
}

module.exports = { fetchMetadata };
