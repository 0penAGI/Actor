import { Actor } from 'apify';

export async function classifyShift(oldText, newText) {
    const client = Actor.newClient();

    const prompt = `
You are an SEO analyst.
Analyze semantic shift between two webpage texts.

Old:
"${oldText}"

New:
"${newText}"

Choose ONE:
- premium positioning
- conversion push
- trust & authority
- urgency / scarcity
- informational expansion
- unclear / minor change

Then give a 2–3 sentence summary.
`;

    const res = await client.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });

    return res.choices[0].message.content;
}
