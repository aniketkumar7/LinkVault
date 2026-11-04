const dns = require('dns');
const net = require('net');
const { Agent, fetch } = require('undici');

// Every range a user-supplied URL must never reach (loopback, private, link-local,
// cloud metadata, CGNAT, multicast, documentation, IPv6 transition prefixes).
const blocked = new net.BlockList();
[
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
    ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
    ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([address, prefix]) => blocked.addSubnet(address, prefix, 'ipv4'));
[
    ['::', 96], // unspecified, loopback and IPv4-compatible (::a.b.c.d)
    ['64:ff9b::', 96], ['64:ff9b:1::', 48], // NAT64
    ['100::', 64], ['2001::', 32], ['2001:db8::', 32], ['2002::', 16], // discard, Teredo, docs, 6to4
    ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
].forEach(([address, prefix]) => blocked.addSubnet(address, prefix, 'ipv6'));

// ::ffff:a.b.c.d / ::ffff:7f00:1 -> a.b.c.d, so mapped addresses are checked as IPv4
function unmapIpv4(address) {
    const match = address.toLowerCase().match(/^::ffff:(?:0:)?(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/);
    if (!match) return null;
    if (match[1]) return match[1];
    const hi = parseInt(match[2], 16);
    const lo = parseInt(match[3], 16);
    return [hi >> 8, hi & 255, lo >> 8, lo & 255].join('.');
}

function isPrivateIp(address) {
    if (net.isIPv4(address)) return blocked.check(address, 'ipv4');
    if (net.isIPv6(address)) {
        const mapped = unmapIpv4(address);
        return mapped ? blocked.check(mapped, 'ipv4') : blocked.check(address, 'ipv6');
    }
    return true;
}

/** Cheap pre-check before any network work. The connect-time lookup below is the real guard. */
function assertSafeHttpUrl(value) {
    let url;
    try { url = new URL(value); } catch { throw new Error('Invalid URL'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed');
    if (url.username || url.password) throw new Error('Credential-bearing URLs are not allowed');
    if (url.port && !['80', '443'].includes(url.port)) throw new Error('Non-standard ports are not allowed');
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || (net.isIP(hostname) && isPrivateIp(hostname))) {
        throw new Error('Private network URLs are not allowed');
    }
    return url;
}

// Validates the IP the socket actually connects to, so DNS rebinding between
// "check" and "fetch" can't redirect the request to an internal address.
function safeLookup(hostname, options, callback) {
    dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
        if (error) return callback(error);
        if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
            return callback(new Error('URL resolves to a private network'));
        }
        if (options.all) return callback(null, addresses);
        callback(null, addresses[0].address, addresses[0].family);
    });
}

const safeDispatcher = new Agent({ connect: { lookup: safeLookup } });

const MAX_REDIRECTS = 3;

/**
 * Fetch a user-supplied URL safely: blocked private ranges at connect time,
 * redirects re-validated hop by hop, body capped at maxBytes.
 * Returns { status, ok, url, body } (body is a string, '' for HEAD).
 */
async function safeFetch(value, { method = 'GET', timeoutMs = 8000, maxBytes = 1024 * 1024 } = {}) {
    let url = assertSafeHttpUrl(value);
    const signal = AbortSignal.timeout(timeoutMs);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const response = await fetch(url, {
            method,
            redirect: 'manual',
            signal,
            dispatcher: safeDispatcher,
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; LinkVaultBot/1.0)', accept: 'text/html,application/xhtml+xml' },
        });

        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
            await response.body?.cancel();
            url = assertSafeHttpUrl(new URL(location, url).href);
            continue;
        }

        let body = '';
        if (method !== 'HEAD' && response.body) {
            const chunks = [];
            let size = 0;
            for await (const chunk of response.body) {
                size += chunk.length;
                if (size > maxBytes) break; // enough for <head> metadata; stop reading the rest
                chunks.push(chunk);
            }
            await response.body.cancel().catch(() => {});
            body = Buffer.concat(chunks).toString('utf8');
        }
        return { status: response.status, ok: response.ok, url: url.href, body };
    }
    throw new Error('Too many redirects');
}

module.exports = { assertSafeHttpUrl, isPrivateIp, safeFetch };
