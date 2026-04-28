const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini'
const BASE = 'https://openrouter.ai/api/v1'

export async function chat(prompt, maxTokens = 1024) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://clearoffer.org',
      'X-Title': 'ClearOffer',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter error: ${res.status} — ${body}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export function parseJSON(text) {
  text = text.trim()
  if (text.startsWith('```')) {
    const parts = text.split('```')
    text = parts[1] || text
    if (text.startsWith('json')) text = text.slice(4)
  }
  return JSON.parse(text.trim())
}
