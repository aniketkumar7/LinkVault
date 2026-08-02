const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const { isGenericCollectionName, suggestCollectionFromUrl } = require('../utils/collectionSuggestions');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter: (_, file, cb) => {
        cb(null, file.mimetype.startsWith('image/'));
    }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash-lite,gemini-3-flash,gemini-2.5-flash-lite')
    .split(',')
    .map(model => model.trim())
    .filter(model => model && model !== PRIMARY_MODEL);

async function generateWithFallback(contents) {
    try {
        return await ai.models.generateContent({ model: PRIMARY_MODEL, contents });
    } catch (error) {
        const isQuotaError = error?.status === 429 || /quota|rate limit|resource exhausted/i.test(error?.message || '');
        if (!isQuotaError) throw error;
        let lastError = error;
        for (const model of FALLBACK_MODELS) {
            try {
                console.warn(`Gemini quota reached; retrying with ${model}`);
                return await ai.models.generateContent({ model, contents });
            } catch (fallbackError) {
                const fallbackQuotaError = fallbackError?.status === 429 || /quota|rate limit|resource exhausted/i.test(fallbackError?.message || '');
                if (!fallbackQuotaError) throw fallbackError;
                lastError = fallbackError;
            }
        }
        throw lastError;
    }
}

router.post('/recommend', async (req, res) => {
    try {
        const urls = Array.isArray(req.body.urls) ? req.body.urls.slice(0, 20) : [];
        const collections = Array.isArray(req.body.collections) ? req.body.collections : [];
        if (!urls.length) return res.status(400).json({ error: 'URLs array required' });
        const collectionList = collections.map(c => `- id: "${c.id}", name: "${c.name}", description: "${c.description || ''}"`).join('\n') || 'No collections available';
        const response = await generateWithFallback([{ role: 'user', parts: [{ text: `Recommend collections for these URLs. Existing collections:\n${collectionList}\n\nURLs:\n${urls.join('\n')}\n\nUse an existing collection only for a strong semantic match. Otherwise suggest a specific new collection. Return only JSON: [{"url":"...","collectionId":"uuid-or-null","suggestedCollection":{"name":"Name","color":"#hex"}|null,"recommendation":{"confidence":0,"reason":"short reason"}}]` }] }]);
        const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const suggestions = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        const byUrl = new Map(Array.isArray(suggestions) ? suggestions.map(item => [item.url, item]) : []);
        const allowedIds = new Set(collections.map(collection => collection.id));
        const links = urls.map(url => {
            const item = byUrl.get(url) || {};
            const collectionId = allowedIds.has(item.collectionId) ? item.collectionId : null;
            const suggested = item.suggestedCollection?.name ? item.suggestedCollection : (!collectionId ? suggestCollectionFromUrl(url) : null);
            return { url, collectionId, suggestedCollection: suggested, recommendation: item.recommendation || { confidence: 55, reason: 'Matched from the link domain and path.' } };
        });
        res.json({ links });
    } catch (error) {
        console.error('URL recommendation error:', error);
        res.status(500).json({ error: 'Failed to recommend collections' });
    }
});

/**
 * POST /api/screenshots/extract
 * Upload screenshots → Gemini extracts URLs + recommends collections
 */
router.post('/extract', upload.array('screenshots', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const collectionsRaw = req.body.collections;
        const collections = collectionsRaw ? JSON.parse(collectionsRaw) : [];

        const collectionList = collections.length > 0
            ? collections.map(c => `- id: "${c.id}", name: "${c.name}", description: "${c.description || ''}", saved links: ${c.link_count || 0}`).join('\n')
            : 'No collections available';

        // Build parts: one text prompt + all images
        const parts = [
            {
                text: `You are analyzing screenshots to extract URLs and recommend collections.

Available collections:
${collectionList}

Important rules:
- Extract ALL visible URLs (http/https links, also reconstruct partial URLs if clearly visible).
- For each extracted URL, analyze the screenshot context and the URL itself to infer the likely purpose of the link.
- Recommend the most specific and useful collection name you can, based on what the link appears to be for (for example: UI Inspiration, AI Creators, Frontend Dev, Developer Resources, Product Tools, Media, Reading List, Design Systems, Finance, Travel, Productivity, Mac Apps, Wallpapers, Mockups, Media Tools, Utility Tools).
- If different links have clearly different purposes, give each a distinct collection name. Do not collapse unrelated links such as mac apps, wallpapers, mockups, productivity tools, and media utilities into one broad collection.
- Use the same collection name for multiple URLs that clearly belong to the same theme. Do not invent a different collection for every similar link.
- Do NOT default everything to generic names like "Design" unless the screenshot clearly shows that category only.
- If a URL is clearly for avatars, character generation, AI image creation, or creator tools, recommend an avatar/creator-oriented collection such as AI Creators.
- Only use an existing collection when it is a strong semantic match. Do not choose one merely because it exists or has a broad name.
- If no existing collection is a strong match, set collectionId to null and suggest a specific new collection name and a hex color that suits it.
- Include recommendation confidence from 0 to 100 and a short reason based on the URL or screenshot context.
- If multiple screenshots are provided, combine all URLs into one flat array. Deduplicate URLs.
- Prefer thoughtful recommendations over broad buckets. If a URL looks like an avatar or AI image generator, recommend an avatar/creator-oriented collection such as AI Creators.

Respond ONLY with a valid JSON array, no markdown, no explanation:
[{ "url": "https://...", "collectionId": "uuid-or-null", "suggestedCollection": { "name": "Name", "color": "#hexcolor" } | null, "recommendation": { "confidence": 0, "reason": "short explanation" } }]
`
            },
            ...req.files.map(file => ({
                inlineData: {
                    mimeType: file.mimetype,
                    data: file.buffer.toString('base64')
                }
            }))
        ];

        const response = await generateWithFallback([{ role: 'user', parts }]);

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // Strip markdown code fences if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let extracted;
        try {
            extracted = JSON.parse(cleaned);
        } catch {
            console.error('Gemini response parse error:', text);
            return res.status(422).json({ error: 'Could not parse Gemini response', raw: text });
        }

        if (!Array.isArray(extracted)) {
            return res.status(422).json({ error: 'Unexpected Gemini response format' });
        }

        // Validate URLs and normalize
        const allowedCollectionIds = new Set(collections.map(collection => collection.id));
        const valid = extracted.filter(item => {
            try { new URL(item.url); return true; } catch { return false; }
        }).map(item => {
            const collectionId = allowedCollectionIds.has(item.collectionId) ? item.collectionId : null;
            const fallback = suggestCollectionFromUrl(item.url);
            const suggested = item.suggestedCollection;
            const shouldUseFallback = !collectionId && (!suggested || !suggested.name || isGenericCollectionName(suggested.name));

            if (shouldUseFallback) {
                return {
                    ...item,
                    collectionId,
                    suggestedCollection: fallback,
                    recommendation: { confidence: 55, reason: 'Matched from the link domain and path.' },
                };
            }

            return {
                ...item,
                collectionId,
                recommendation: item.recommendation && Number.isFinite(Number(item.recommendation.confidence))
                    ? { confidence: Math.max(0, Math.min(100, Number(item.recommendation.confidence))), reason: String(item.recommendation.reason || '') }
                    : null,
            };
        });

        res.json({ links: valid });
    } catch (error) {
        console.error('Screenshot extraction error:', error);
        if (error.status === 429) {
            const retryMatch = error.message?.match(/(\d+)s"/);
            const wait = retryMatch ? `${retryMatch[1]}s` : 'a moment';
            return res.status(429).json({ error: `Gemini quota exceeded. Please retry in ${wait}.` });
        }
        res.status(500).json({ error: 'Failed to extract links from screenshots' });
    }
});

module.exports = router;
