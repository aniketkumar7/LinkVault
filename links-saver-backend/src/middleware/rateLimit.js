const buckets = new Map();

function rateLimit({ windowMs, max, message = 'Too many requests. Please try again shortly.' }) {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
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
