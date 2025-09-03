# Assessment Generator Tools

A Next.js application for generating assessments and educational tools.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- ESLint

## Environment variables

Create a `.env.local` in the project root (already gitignored) and set:

```
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional but recommended for accurate, cited answers
TAVILY_API_KEY=your_tavily_key    # enables preferred web search
BING_API_KEY=your_bing_key        # fallback web search provider
LLM_SEED=42                       # deterministic outputs across runs
```

On Vercel, add these as Project → Settings → Environment Variables and redeploy.

## Web-cited QA endpoint

POST `/api/ai/answer`

Body example:

```
{
	"question": "What is the latest stable Next.js version and key features?",
	"allowWeb": true,
	"maxSources": 4,
	"domains": ["vercel.com", "nextjs.org"],
	"locale": "en-US"
}
```

Response:

```
{
	"success": true,
	"answer": "...",
	"sources": [
		{ "index": 1, "title": "...", "url": "..." }
	]
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
