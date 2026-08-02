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
            ? collections.map(c => `- id: "${c.id}", name: "${c.name}"`).join('\n')
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
- If an existing collection fits, use that collectionId and set suggestedCollection to null.
- If no existing collection fits, set collectionId to null and suggest a new collection name and a hex color that suits it.
- If multiple screenshots are provided, combine all URLs into one flat array. Deduplicate URLs.
- Prefer thoughtful recommendations over broad buckets. If a URL looks like an avatar or AI image generator, recommend an avatar/creator-oriented collection such as AI Creators.

Respond ONLY with a valid JSON array, no markdown, no explanation:
[{ "url": "https://...", "collectionId": "uuid-or-null", "suggestedCollection": { "name": "Name", "color": "#hexcolor" } | null }]
`
            },
            ...req.files.map(file => ({
                inlineData: {
                    mimeType: file.mimetype,
                    data: file.buffer.toString('base64')
                }
            }))
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [{ role: 'user', parts }]
        });

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
        const valid = extracted.filter(item => {
            try { new URL(item.url); return true; } catch { return false; }
        }).map(item => {
            const fallback = suggestCollectionFromUrl(item.url);
            const suggested = item.suggestedCollection;
            const shouldUseFallback = !item.collectionId && (!suggested || !suggested.name || isGenericCollectionName(suggested.name));

            if (shouldUseFallback) {
                return {
                    ...item,
                    suggestedCollection: fallback,
                };
            }

            return item;
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
