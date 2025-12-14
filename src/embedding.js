import { env, pipeline } from '@xenova/transformers';

/* === CRITICAL FOR APIFY === */
env.allowLocalModels = false;
env.useBrowserCache = false;

let embedder = null;

export async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
    }
    return embedder;
}

export async function embedText(text) {
    const model = await getEmbedder();
    const output = await model(text, {
        pooling: 'mean',
        normalize: true,
    });
    return Array.from(output.data);
}

export function cosineDistance(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb));
}
