/**
 * Fixed-window in-memory rate limiter. Each limiter owns its own store, so one
 * limiter's cleanup can never reset another's window. Keyed by user when the
 * request is authenticated (mount after auth), otherwise by IP — never by path,
 * so random URLs can't mint fresh buckets or grow memory.
 * Single-process only: use a shared store (e.g. Redis) if you run multiple instances.
 */
function rateLimit({ windowMs, max, message = 'Too many requests. Please try again shortly.' }) {
    const buckets = new Map();
    let lastCleanup = Date.now();

    return (req, res, next) => {
        const now = Date.now();
        if (now - lastCleanup > Math.min(windowMs, 60000)) {
            for (const [key, bucket] of buckets) {
                if (now - bucket.startedAt >= windowMs) buckets.delete(key);
            }
            lastCleanup = now;
        }

        const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
        const current = buckets.get(key);
        if (!current || now - current.startedAt >= windowMs) {
            buckets.set(key, { startedAt: now, count: 1 });
            return next();
        }
        current.count += 1;
        if (current.count > max) {
            res.setHeader('Retry-After', Math.ceil((current.startedAt + windowMs - now) / 1000));
            return res.status(429).json({ error: message });
        }
        next();
    };
}

module.exports = { rateLimit };
