import { Actor } from 'apify';

export async function loadPrevious(url, selector) {
    const store = await Actor.openKeyValueStore('STATE');
    return store.getValue(`${url}::${selector}`);
}

export async function saveCurrent(url, selector, data) {
    const store = await Actor.openKeyValueStore('STATE');
    await store.setValue(`${url}::${selector}`, data);
}
