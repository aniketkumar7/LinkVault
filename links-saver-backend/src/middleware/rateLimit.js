const buckets = new Map();
let lastCleanup = 0;

function rateLimit({ windowMs, max, message = 'Too many requests. Please try again shortly.' }) {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        if (now - lastCleanup > 60000) {
            for (const [bucketKey, bucket] of buckets) {
                if (now - bucket.startedAt >= windowMs) buckets.delete(bucketKey);
            }
            lastCleanup = now;
        }
        const current = buckets.get(key);
        if (!current || now - current.startedAt >= windowMs) {
            buckets.set(key, { startedAt: now, count: 1 });
            return next();
        }
        current.count += 1;
        if (current.count > max) return res.status(429).json({ error: message });
        next();
    };
}

module.exports = { rateLimit };
