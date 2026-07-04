# SaaSify AI — AI Cost Optimizer Dashboard

A React + Vite app for tracking, analyzing, and optimizing AI tool expenses (OpenAI, Claude, Midjourney, etc.) with Gemini-powered receipt/invoice parsing and multilingual support.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **AI**: Google Gemini (`@google/genai`) — used to parse billing text/invoices
- **Build**: Vite 6

## Running the app

```bash
npm run dev      # starts dev server on port 5000
npm run build    # production build
npm run lint     # TypeScript type check
```

The workflow "Start application" runs `npm run dev` and serves the app on port 5000.

## Required secrets

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Powers the AI-powered smart import / receipt parser |

Get a free key at https://aistudio.google.com/apikey

## Project structure

```
src/
  App.tsx              # Main app component (dashboard UI)
  geminiSimulator.ts   # Gemini AI parsing + default expense data
  translations.ts      # i18n strings (EN + other languages)
  types.ts             # Shared TypeScript types
  components/
    GlowChart.tsx      # Animated spend trend chart
index.html
vite.config.ts
```

## User preferences

- Keep existing project structure and stack
