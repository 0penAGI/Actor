import { Actor } from 'apify';
import { embedText, cosineDistance } from './src/embedding.js';
import { loadPrevious, saveCurrent } from './src/storage.js';
import { classifyShift } from './src/classify.js';

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

Actor.main(async () => {
    Actor.log.info('SEO Semantic Shift Monitor v1 starting');

    const input = await Actor.getInput() || {};
    const {
        target_urls = [],
        text_selectors = [],
        shift_threshold = 0.1,
    } = input;

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    if (!hasOpenAI) {
        Actor.log.warning('OPENAI_API_KEY not found — semantic interpretation disabled');
    }

    const browser = await Actor.launchPlaywright();
    const page = await browser.newPage();

    const results = [];

    for (const url of target_urls) {
        Actor.log.info(`Scanning ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        for (const selector of text_selectors) {
            const text = await page
                .$eval(selector, el => el.innerText)
                .catch(() => null);

            if (!text) continue;

            const embedding = await embedText(text);
            const previous = await loadPrevious(url, selector);

            if (previous) {
                const drift = cosineDistance(embedding, previous.embedding);

                if (drift > shift_threshold) {
                    let interpretation = null;

                    if (hasOpenAI) {
                        interpretation = await classifyShift(
                            previous.text.slice(0, 800),
                            text.slice(0, 800)
                        );
                    }

                    results.push({
                        url,
                        selector,
                        semantic_drift_score: drift,
                        drift_category: interpretation
                            ? interpretation.split('\n')[0]
                            : 'unclassified (no LLM)',
                        human_summary: interpretation
                            ? interpretation
                            : 'Semantic drift detected, but no OpenAI API key provided for interpretation.',
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
