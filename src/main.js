import { Actor } from 'apify';
import { chromium } from 'playwright';
import { embedText, cosineDistance } from './embedding.js';
import { loadPrevious, saveCurrent } from './storage.js';
import { classifyShift } from './classify.js';

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        target_urls = [],
        text_selectors = [],
        shift_threshold = 0.1,
    } = input;

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const results = [];

    for (const url of target_urls) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        for (const selector of text_selectors) {
            const text = await page.$eval(selector, el => el.innerText).catch(() => null);
            if (!text) continue;

            const embedding = await embedText(text);
            const previous = await loadPrevious(url, selector);

            if (previous) {
                const drift = cosineDistance(embedding, previous.embedding);

                if (drift > shift_threshold) {
                    const interpretation = await classifyShift(
                        previous.text.slice(0, 800),
                        text.slice(0, 800)
                    );

                    results.push({
                        url,
                        selector,
                        semantic_drift_score: drift,
                        drift_category: interpretation.split('\n')[0],
                        human_summary: interpretation,
                    });
                }
            }

            await saveCurrent(url, selector, {
                text,
                embedding,
                timestamp: Date.now(),
            });
        }
    }

    await browser.close();
    await Actor.pushData(results);
});
