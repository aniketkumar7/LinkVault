const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const linksRouter = require('./routes/links');
const collectionsRouter = require('./routes/collections');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://your-frontend-domain.com'
        : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Reels Links Saver API',
        status: 'running',
        version: '1.0.0'
    });
});

// Protected routes
app.use('/api/links', authMiddleware, linksRouter);
app.use('/api/collections', authMiddleware, collectionsRouter);

// Public routes (shared collections)
app.get('/api/shared/:slug', async (req, res) => {
    const collectionsRouter = require('./routes/collections');
    // Forward to collections shared route
    req.url = `/shared/${req.params.slug}`;
    collectionsRouter.handle(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
