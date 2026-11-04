/**
 * Validate URL format
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/** Normalize URLs so duplicate checks are consistent across the app. */
function normalizeUrl(value) {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input) return '';

    let url;
    try {
        url = new URL(input);
    } catch {
        return '';
    }
    // Only web links: blocks javascript:, data:, file: etc. from ever being stored/rendered
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
        url.port = '';
    }
    url.hash = '';
    url.pathname = url.pathname.replace(/\/$/, '') || '/';
    return url.toString();
}

/**
 * Validate link input data
 */
function validateLinkInput({ url, note }) {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return { valid: false, error: 'URL is required' };
    }

    if (!isValidUrl(url.trim())) {
        return { valid: false, error: 'Invalid URL format' };
    }

    if (url.length > 2048) {
        return { valid: false, error: 'URL is too long' };
    }

    if (note !== undefined && typeof note !== 'string') {
        return { valid: false, error: 'Note must be text' };
    }

    if (note && note.length > 5000) {
        return { valid: false, error: 'Note is too long (max 5000 characters)' };
    }

    return { valid: true };
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const isHexColor = value => typeof value === 'string' && HEX_COLOR.test(value);

/** Escape LIKE/ILIKE wildcards so user text matches literally. */
const escapeLike = value => String(value).replace(/[\\%_]/g, '\\$&');

module.exports = {
    isHexColor,
    escapeLike,
    isValidUrl,
    normalizeUrl,
    validateLinkInput
};
