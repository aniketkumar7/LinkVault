const test = require('node:test');
const assert = require('node:assert');
const { isPrivateIp, assertSafeHttpUrl } = require('./safeUrl');

test('blocks private, loopback, metadata and IPv6-wrapped forms', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.1', '172.20.0.1', '100.64.0.1', '0.0.0.0',
        '::1', '::', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '::ffff:10.0.0.1', '64:ff9b::7f00:1',
        '::127.0.0.1', 'fc00::1', 'fe80::1', '2002:7f00:1::', 'ff02::1']) {
        assert.equal(isPrivateIp(ip), true, ip);
    }
});

test('allows public addresses', () => {
    for (const ip of ['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111', '::ffff:1.1.1.1']) {
        assert.equal(isPrivateIp(ip), false, ip);
    }
});

test('rejects unsafe URLs before any network call', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'http://localhost/', 'http://[::ffff:127.0.0.1]/',
        'http://user:pw@example.com/', 'http://example.com:8080/', 'http://2130706433/']) {
        assert.throws(() => assertSafeHttpUrl(url), url);
    }
    assert.ok(assertSafeHttpUrl('https://example.com/a'));
});
