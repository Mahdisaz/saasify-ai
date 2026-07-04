import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const BODY_SIZE_LIMIT = 32 * 1024; // 32 KB
const RATE_WINDOW_MS = 60_000;     // 1 minute
const RATE_MAX_CALLS = 10;         // max 10 parses per minute per IP

// Simple in-memory rate limiter
const rateCounts = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let entry = rateCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateCounts.set(ip, entry);
  }
  entry.count++;
  return entry.count > RATE_MAX_CALLS;
}

// Server-side API plugin — handles POST /api/parse with the real Gemini API.
// Runs only in Node.js (Vite dev server), so GEMINI_API_KEY never reaches the browser.
function apiPlugin(): Plugin {
  return {
    name: 'api-routes',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        '/api/parse',
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== 'POST') return next();

          const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.socket.remoteAddress ?? 'unknown';
          if (isRateLimited(ip)) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 429;
            res.end(JSON.stringify({ error: 'Too many requests — please wait a minute and try again.' }));
            return;
          }

          let body = '';
          let bodyBytes = 0;
          req.on('data', (chunk: Buffer) => {
            bodyBytes += chunk.byteLength;
            if (bodyBytes > BODY_SIZE_LIMIT) {
              req.destroy();
              return;
            }
            body += chunk.toString();
          });
          req.on('end', async () => {
            if (bodyBytes > BODY_SIZE_LIMIT) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 413;
              res.end(JSON.stringify({ error: 'Request body too large (max 32 KB)' }));
              return;
            }
            res.setHeader('Content-Type', 'application/json');
            try {
              const { rawText } = JSON.parse(body) as { rawText: string };

              if (!rawText || rawText.trim().length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'rawText is required' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });

              const prompt = `You are an AI expense parser. Analyze the following billing text and extract AI/SaaS tool subscriptions.

Return ONLY valid JSON — no markdown, no explanation, no code fences — matching this exact schema:
{
  "expenses": [
    {
      "id": "<unique short string>",
      "name": "<tool name>",
      "status": "<\"active\" or \"inactive\">",
      "cost": <monthly cost as a number>,
      "utilization": <estimated usage percentage 0-100>,
      "recommendationKey": "<brief optimization tip mentioning $param>",
      "recommendationParam": "<dollar amount to save, e.g. \"$120\">",
      "isOptimized": false
    }
  ]
}

Rules:
- Set status to "inactive" if the text mentions idle/unused/not logged in/no activity
- Estimate utilization based on usage signals (idle=5-15, moderate=40-65, heavy=75-95)
- recommendationKey should be a short actionable tip string ending with "save $param/mo"
- If no dollar cost is stated, omit that tool
- Return an empty expenses array if nothing parseable is found

Billing text to parse:
---
${rawText}
---`;

              const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
              });

              const text = response.text ?? '';
              // Strip any accidental markdown fences
              const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
              const parsed = JSON.parse(jsonText) as { expenses: unknown[] };

              if (!Array.isArray(parsed.expenses)) throw new Error('Invalid response shape');
              res.end(JSON.stringify({ expenses: parsed.expenses }));
            } catch (err) {
              console.error('[api/parse] error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to parse billing text' }));
            }
          });
        }
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [apiPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: true as const,
    },
  };
});
