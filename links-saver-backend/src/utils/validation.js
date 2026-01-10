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

    if (note && note.length > 5000) {
        return { valid: false, error: 'Note is too long (max 5000 characters)' };
    }

    return { valid: true };
}

module.exports = {
    isValidUrl,
    validateLinkInput
};
