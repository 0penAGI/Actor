import { Actor } from 'apify';

export async function classifyShift(oldText, newText) {
    const prompt = `
You are an SEO analyst.
Analyze semantic shift between two versions of a webpage text.

Old version:
"${oldText}"

New version:
"${newText}"

Classify the shift using ONE category:
- premium positioning
- conversion push
- trust & authority
- urgency / scarcity
- informational expansion
- unclear / minor change

Then give a 2–3 sentence human-readable summary.
`;

    const client = Actor.newClient();
    const response = await client.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });

    return response.choices[0].message.content;
}

