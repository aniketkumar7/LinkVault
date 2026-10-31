const dns = require('dns').promises;
const net = require('net');

function isPrivateIp(address) {
    if (net.isIPv4(address)) {
        const [a, b] = address.split('.').map(Number);
        return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
            (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
    }
    if (net.isIPv6(address)) {
        const normalized = address.toLowerCase();
        return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
            normalized.startsWith('fd') || /^fe[89ab]/.test(normalized);
    }
    return true;
}

async function assertSafeHttpUrl(value) {
    let url;
    try { url = new URL(value); } catch { throw new Error('Invalid URL'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed');
    if (url.username || url.password) throw new Error('Credential-bearing URLs are not allowed');
    if (url.port && !['80', '443'].includes(url.port)) throw new Error('Non-standard ports are not allowed');
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || (net.isIP(hostname) && isPrivateIp(hostname))) {
        throw new Error('Private network URLs are not allowed');
    }
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('URL resolves to a private network');
    return url;
}

module.exports = { assertSafeHttpUrl, isPrivateIp };
