import express from 'express';
import { Pool } from 'pg';
import { GoogleGenAI } from '@google/genai';
import type { Expense } from './src/types';

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '32kb' }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Rate limiting ──────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_CALLS = 10;
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

// ── DB helpers ─────────────────────────────────────────────────────────────
function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    name: String(row.name),
    status: row.status === 'inactive' ? 'inactive' : 'active',
    cost: Number(row.cost) || 0,
    utilization: Math.min(100, Math.max(0, Number(row.utilization) || 50)),
    recommendationKey: String(row.recommendation_key ?? ''),
    recommendationParam: row.recommendation_param != null ? String(row.recommendation_param) : undefined,
    isOptimized: Boolean(row.is_optimized),
  };
}

async function insertExpense(exp: Expense): Promise<void> {
  await pool.query(
    `INSERT INTO expenses (id, name, status, cost, utilization, recommendation_key, recommendation_param, is_optimized)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [exp.id, exp.name, exp.status, exp.cost, exp.utilization, exp.recommendationKey, exp.recommendationParam ?? null, exp.isOptimized]
  );
}

// Default seed data (mirrors geminiSimulator.ts DEFAULT_EXPENSES)
const DEFAULT_EXPENSES: Expense[] = [
  { id: '1', name: 'OpenAI Enterprise',  status: 'active',   cost: 1420, utilization: 42, recommendationKey: 'rec_openai',    recommendationParam: '$360', isOptimized: false },
  { id: '2', name: 'Claude.ai Team',     status: 'active',   cost: 480,  utilization: 68, recommendationKey: 'rec_claude',    recommendationParam: '$120', isOptimized: false },
  { id: '3', name: 'Midjourney Pro',     status: 'inactive', cost: 60,   utilization: 8,  recommendationKey: 'rec_midjourney', recommendationParam: '$60', isOptimized: false },
  { id: '4', name: 'Pinecone Standard',  status: 'active',   cost: 350,  utilization: 24, recommendationKey: 'rec_pinecone',  recommendationParam: '$150', isOptimized: false },
  { id: '5', name: 'Runway Gen-3 Max',   status: 'active',   cost: 125,  utilization: 52, recommendationKey: 'rec_runway',    recommendationParam: '$45', isOptimized: false },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/expenses — list all; seeds defaults on first run
app.get('/api/expenses', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses ORDER BY sort_order ASC');
    let expenses = rows.map(rowToExpense);
    if (expenses.length === 0) {
      for (const exp of DEFAULT_EXPENSES) await insertExpense(exp);
      expenses = DEFAULT_EXPENSES;
    }
    res.json({ expenses });
  } catch (err) {
    console.error('[GET /api/expenses]', err);
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

// POST /api/expenses — create a single expense
app.post('/api/expenses', async (req, res) => {
  try {
    const exp = req.body as Expense;
    await insertExpense(exp);
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/expenses]', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id — update (currently only isOptimized)
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOptimized } = req.body as { isOptimized: boolean };
    await pool.query('UPDATE expenses SET is_optimized = $1 WHERE id = $2', [isOptimized, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/expenses/:id]', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id — remove one
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/expenses/:id]', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// POST /api/expenses/reset — restore defaults
app.post('/api/expenses/reset', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses');
    for (const exp of DEFAULT_EXPENSES) await insertExpense(exp);
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/expenses/reset]', err);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

// POST /api/expenses/replace — replace all rows (used after AI parse)
app.post('/api/expenses/replace', async (req, res) => {
  try {
    const { expenses } = req.body as { expenses: Expense[] };
    await pool.query('DELETE FROM expenses');
    for (const exp of expenses) await insertExpense(exp);
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/expenses/replace]', err);
    res.status(500).json({ error: 'Failed to replace expenses' });
  }
});

// POST /api/parse — Gemini AI billing text parser
app.post('/api/parse', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
    ?? req.socket.remoteAddress ?? 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a minute and try again.' });
  }

  try {
    const { rawText } = req.body as { rawText: string };
    if (!rawText?.trim()) return res.status(400).json({ error: 'rawText is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an AI expense parser. Analyze the following billing text and extract AI/SaaS tool subscriptions.

Return ONLY valid JSON — no markdown, no explanation, no code fences — matching this exact schema:
{
  "expenses": [
    {
      "id": "<unique short string>",
      "name": "<tool name>",
      "status": "<active or inactive>",
      "cost": <monthly cost as a number>,
      "utilization": <estimated usage percentage 0-100>,
      "recommendationKey": "<brief optimization tip mentioning $param>",
      "recommendationParam": "<dollar amount to save, e.g. $120>",
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

    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    const text = response.text ?? '';
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(jsonText) as { expenses: unknown[] };
    if (!Array.isArray(parsed.expenses)) throw new Error('Invalid response shape');

    res.json({ expenses: parsed.expenses });
  } catch (err) {
    console.error('[POST /api/parse]', err);
    res.status(500).json({ error: 'Failed to parse billing text' });
  }
});

app.listen(PORT, () => console.log(`API server on port ${PORT}`));
