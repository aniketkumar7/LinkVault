const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestCollectionFromUrl } = require('./collectionSuggestions');

test('suggests specific collections for common design and dev domains', () => {
    assert.deepEqual(suggestCollectionFromUrl('https://dribbble.com/shots/123'), {
        name: 'UI Inspiration',
        color: '#7C3AED',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://mobbin.com/browse/ios/apps'), {
        name: 'UI Inspiration',
        color: '#7C3AED',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://github.com'), {
        name: 'Developer Resources',
        color: '#0F766E',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://www.youtube.com/watch?v=abc'), {
        name: 'Media',
        color: '#DC2626',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://www.craiyon.com/'), {
        name: 'AI Creators',
        color: '#F59E0B',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://macapp.supply/'), {
        name: 'Mac Apps',
        color: '#0EA5E9',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://backgrounds.supply/'), {
        name: 'Wallpapers',
        color: '#F97316',
    });

    assert.deepEqual(suggestCollectionFromUrl('https://reframeit.io/'), {
        name: 'Mockups',
        color: '#8B5CF6',
    });
});
