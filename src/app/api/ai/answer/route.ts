import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type SearchResult = { title: string; url: string; snippet?: string }

function stripHtml(html: string): string {
  // Minimal HTML to text; avoids extra deps
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchPagePreview(url: string, maxLen = 1500): Promise<string> {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } })
    const html = await res.text()
    const text = stripHtml(html)
    return text.slice(0, maxLen)
  } catch {
    return ''
  }
}

async function searchTavily(query: string, maxResults: number, domains?: string[]): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []
  const body: any = {
    api_key: apiKey,
    query,
    search_depth: 'advanced',
    max_results: Math.min(Math.max(maxResults, 1), 10),
    include_answer: false,
  }
  if (domains?.length) body.include_domains = domains

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return []
  const data = await res.json()
  const results: SearchResult[] = (data?.results || []).map((r: any) => ({ title: r.title, url: r.url, snippet: r.snippet }))
  return results
}

async function searchBing(query: string, maxResults: number): Promise<SearchResult[]> {
  const key = process.env.BING_API_KEY
  if (!key) return []
  const endpoint = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${Math.min(Math.max(maxResults, 1), 10)}`
  const res = await fetch(endpoint, { headers: { 'Ocp-Apim-Subscription-Key': key } })
  if (!res.ok) return []
  const data = await res.json()
  const items = data?.webPages?.value || []
  return items.map((it: any) => ({ title: it.name, url: it.url, snippet: it.snippet }))
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { question, allowWeb = true, maxSources = 5, domains, locale } = await req.json()
    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Invalid or missing question' }, { status: 400 })
    }

    // 1) Optional web search and retrieval
    let sources: SearchResult[] = []
    if (allowWeb) {
      // Prefer Tavily, fallback to Bing
      sources = await searchTavily(question, maxSources, Array.isArray(domains) ? domains : undefined)
      if (!sources.length) sources = await searchBing(question, maxSources)
    }

    // 2) Fetch previews for top sources
    const limited = sources.slice(0, Math.min(maxSources, 5))
    const contexts = await Promise.all(
      limited.map(async (s) => ({ ...s, preview: await fetchPagePreview(s.url) }))
    )

    const contextBlocks = contexts
      .filter(c => (c.preview || '').length > 80)
      .map((c, i) => `Source ${i + 1}: ${c.title}\nURL: ${c.url}\nContent: ${c.preview}`)
      .join('\n\n')

    // 3) Compose prompt for accurate, cited answer
    const system = [
      'You are a precise research assistant. Answer accurately and concisely.',
      'Cite sources inline like [1], [2] referencing the provided sources list.',
      'If the answer is not supported by the context, say you do not know.',
      locale ? `Use locale: ${locale}.` : ''
    ].filter(Boolean).join(' ')

    const user = [
      contextBlocks ? `Use these sources:\n\n${contextBlocks}\n\n` : 'No external sources available.\n\n',
      `Question: ${question}`,
      '',
      'Return strict JSON with: { "answer": string, "citations": Array<{index:number,title:string,url:string}> }',
    ].join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      seed: parseInt(process.env.LLM_SEED || '42'),
      max_tokens: 900,
      // @ts-ignore - enforce JSON output when supported
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return NextResponse.json({ success: false, error: 'Empty model response' }, { status: 502 })

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Last-resort cleanup of accidental fences
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      parsed = JSON.parse(cleaned)
    }

    const citations = Array.isArray(parsed.citations) ? parsed.citations : []
    // Map citations back to our sources to ensure valid URLs
    const normalizedCitations = citations.map((c: any) => {
      const idx = typeof c.index === 'number' ? c.index : 1
      const src = contexts[idx - 1]
      return src ? { index: idx, title: src.title, url: src.url } : null
    }).filter(Boolean)

    return NextResponse.json({ success: true, answer: parsed.answer, sources: normalizedCitations })

  } catch (err: any) {
    console.error('Answer API error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 })
  }
}
