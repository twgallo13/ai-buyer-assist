// server.cjs
"use strict";
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

// Fail fast if key missing
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in .env");
    process.exit(1);
}

// v1.7 Budget & Ops: Usage tracking, caching, and rate caps
function today() {
    return new Date().toISOString().slice(0, 10);
}

function stableKey(obj) {
    return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
}

const ONE_DAY = 24 * 60 * 60 * 1000;
const CAP = Number(process.env.DAILY_CAP || 1000);
let USAGE = { date: today(), calls: 0, blocked: 0, cacheHits: 0, lastResetAt: Date.now() };
const CACHE = new Map(); // key -> { data, ts }
const CACHE_TTL_MS = ONE_DAY;

function rolloverIfNeeded() {
    if (USAGE.date !== today()) {
        USAGE = { date: today(), calls: 0, blocked: 0, cacheHits: 0, lastResetAt: Date.now() };
        // soft clear cache daily
        for (const [k, v] of CACHE.entries()) {
            if ((Date.now() - v.ts) > CACHE_TTL_MS) CACHE.delete(k);
        }
    }
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, keyPresent: true, version: "v1.8" });
});

// Usage endpoints
app.get('/api/usage', (req, res) => {
    rolloverIfNeeded();
    res.json({
        date: USAGE.date,
        calls: USAGE.calls,
        blocked: USAGE.blocked,
        cacheHits: USAGE.cacheHits,
        cap: CAP,
        cacheSize: CACHE.size
    });
});

app.post('/api/usage/reset', (req, res) => {
    rolloverIfNeeded();
    USAGE = { date: today(), calls: 0, blocked: 0, cacheHits: 0, lastResetAt: Date.now() };
    CACHE.clear();
    res.json({ ok: true, resetAt: USAGE.lastResetAt });
});

// Trends endpoint
app.get('/api/trends', async (req, res) => {
    try {
        const query = String(req.query.query || '');
        const out = await collectTrends(query, {});
        return res.json({ ok: true, ...out });
    } catch (e) {
        return res.json({ ok: true, items: [], sources: [], tookMs: 0 });
    }
});

// --- Helpers ---
function clamp(n) {
    const x = Number(n);
    if (Number.isFinite(x)) return Math.max(0, Math.min(100, Math.round(x)));
    return 50;
}

function mapGeminiToIndices(text) {
    // Expect a JSON block or key:value hints; be defensive
    try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const obj = JSON.parse(match[0]);
            return {
                demand: clamp(obj.demand),
                momentum: clamp(obj.momentum),
                saturation: clamp(obj.saturation),
                freshness: clamp(obj.freshness),
                styleFit: clamp(obj.styleFit),
            };
        }
    } catch (_) { }
    // Fallback: simple heuristics so we never 500
    return {
        demand: 65,
        momentum: 62,
        saturation: 40,
        freshness: 58,
        styleFit: 70,
    };
}

// --- v1.8 External Signals & Citations ---
const DEFAULT_TRENDS_TIMEOUT = Number(process.env.TRENDS_TIMEOUT_MS || 4000);
const ENABLE_STUB = String(process.env.TRENDS_ENABLE_STUB ?? 'true') === 'true';
const ENABLE_NEWS = String(process.env.TRENDS_ENABLE_NEWS ?? 'false') === 'false' ? false : true;
const ENABLE_SOCIAL = String(process.env.TRENDS_ENABLE_SOCIAL ?? 'false') === 'false' ? false : true;

// minimal stub provider
async function stubProvider(query) {
    const q = (query || '').toLowerCase();
    const items = [
        { title: 'Jordan 1 demand up YoY', url: 'https://example.com/j1-demand', source: 'stub-news', score: 78, topic: 'Jordan 1' },
        { title: 'Adidas Superstar steady momentum', url: 'https://example.com/superstar-momentum', source: 'stub-news', score: 62, topic: 'Superstar' },
        { title: 'Neutral tones trending in lifestyle', url: 'https://example.com/neutral-tones', source: 'stub-style', score: 71, topic: 'Color' },
        { title: 'Retro basketball silhouettes resurging', url: 'https://example.com/retro-bball', source: 'stub-style', score: 69, topic: 'Silhouette' },
        { title: 'HOKA popularity up in running', url: 'https://example.com/hoka-running', source: 'stub-news', score: 74, topic: 'Running' },
        { title: 'New Balance collab cadence high', url: 'https://example.com/nb-collabs', source: 'stub-news', score: 66, topic: 'Collab' },
    ];
    // simple filter by query tokens
    const tokens = q.split(/\s+/).filter(Boolean);
    const filtered = tokens.length
        ? items.filter(it => tokens.some(t => it.title.toLowerCase().includes(t) || it.topic.toLowerCase().includes(t)))
        : items;
    return filtered.slice(0, 6);
}

async function collectTrends(query, { timeoutMs = DEFAULT_TRENDS_TIMEOUT } = {}) {
    const start = Date.now();
    const tasks = [];
    const srcs = [];

    if (ENABLE_STUB) {
        tasks.push(stubProvider(query).catch(() => []));
        srcs.push('stub');
    }
    // placeholders for future real providers:
    if (ENABLE_NEWS) {
        // tasks.push(newsProvider(query).catch(()=>[]));
        srcs.push('news');
    }
    if (ENABLE_SOCIAL) {
        // tasks.push(socialProvider(query).catch(()=>[]));
        srcs.push('social');
    }

    if (!tasks.length) return { items: [], sources: [], tookMs: Date.now() - start };

    const withTimeout = Promise.race([
        Promise.all(tasks),
        new Promise(res => setTimeout(() => res([]), timeoutMs))
    ]);

    let results = await withTimeout;
    if (!Array.isArray(results)) results = [];
    // flatten
    const items = results.flat().filter(Boolean);
    return { items, sources: srcs, tookMs: Date.now() - start };
}

// --- Gemini client ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// --- Deep analysis ---
app.post("/api/deep", async (req, res) => {
    const { query, rows, model, temperature, reasoningLevel, settings } = req.body || {};
    const csvSize = Array.isArray(rows) ? rows.length : 0;
    const chosenModel = (typeof model === 'string' && model.trim()) ? model : MODEL_ID;
    const temp = Number.isFinite(Number(temperature)) ? Number(temperature) : 0.4;

    rolloverIfNeeded();

    // Check cache first
    const key = stableKey({ query, settings, mode: 'deep' });
    const hit = CACHE.get(key);
    if (hit && (Date.now() - hit.ts) < CACHE_TTL_MS) {
        USAGE.cacheHits++;
        return res.json({ ...hit.data, sources: Array.from(new Set([...(hit.data.sources || []), 'cache'])) });
    }

    // Check daily cap
    if (USAGE.calls >= CAP) {
        USAGE.blocked++;
        return res.json({
            ok: true,
            capped: true,
            verdict: 'Hold',
            indices: { demand: 50, momentum: 50, saturation: 50, freshness: 50, styleFit: 50 },
            summary: 'Daily AI budget cap reached. Showing conservative fallback.',
            confidence: 30,
            sources: ['cap'],
            timestamp: new Date().toISOString()
        });
    }

    // If key somehow missing at runtime, never 500 → mock
    if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
            summary: "Mock deep analysis (no API key present).",
            indices: { demand: 72, momentum: 68, saturation: 41, freshness: 64, styleFit: 77 },
            sources: ["mock"],
        });
    }

    try {
        const explainPrompt = reasoningLevel ? `
Also include an "explain" object with reasoning:
{
  "explain": {
    "mode": "deep",
    "factors": [
      {"label": "Factor name", "impact": "+|-|~", "note": "Brief explanation"},
      ...
    ],
    "inputs": {"query": "${query || ''}", "csvRows": ${csvSize}}
  }
}` : '';

        const sys = `
You are a retail trend assistant for footwear/apparel. Return concise KPIs (0–100) for:
- demand, momentum, saturation, freshness, styleFit
If CSV rows are provided, use them as context (velocity, sell-through, collections, categories, colors).
If NO rows are provided, infer from general retail knowledge and typical market dynamics for the query (brand, collection, category, color family).
ALWAYS return a single JSON object:
{
  "summary": "one or two sentences about outlook",
  "demand": 0-100,
  "momentum": 0-100,
  "saturation": 0-100,
  "freshness": 0-100,
  "styleFit": 0-100,
  "confidence": 0-100${explainPrompt ? ',\n  "explain": {...}' : ''}
}
${explainPrompt}
Keep it practical and honest. Higher "confidence" when CSV patterns are strong; lower when inferring without data.
`;

        const sampleRows = JSON.stringify((rows || []).slice(0, 5), null, 2);
        const user = [
            `Query: ${query || "(none)"}`,
            `CSV rows included: ${csvSize}`,
            `CSV sample (first up to 5):`,
            sampleRows || "(none)",
            "",
            "Respond with JSON only."
        ].join("\n");

        const modelClient = genAI.getGenerativeModel({
            model: chosenModel,
            generationConfig: { temperature: temp }
        });
        const prompt = sys + "\n\n" + user;
        const result = await modelClient.generateContent(prompt);

        const text = result.response.text();
        const indices = mapGeminiToIndices(text);

        // Try to parse the full JSON response
        let confidence = 60;
        let explain = null;
        let summary = "AI deep analysis complete.";

        try {
            const m = text.match(/\{[\s\S]*\}/);
            if (m) {
                const obj = JSON.parse(m[0]);

                if (typeof obj.confidence !== "undefined") {
                    const n = Number(obj.confidence);
                    if (Number.isFinite(n)) confidence = Math.max(0, Math.min(100, Math.round(n)));
                }

                if (obj.summary) {
                    summary = obj.summary;
                }

                if (obj.explain) {
                    explain = obj.explain;
                }
            }
        } catch { }

        // Fallback summary extraction
        if (summary === "AI deep analysis complete.") {
            const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)"/);
            if (summaryMatch && summaryMatch[1]) {
                summary = summaryMatch[1];
            }
        }

        // Increment calls count after successful Gemini call
        USAGE.calls++;

        const responseObj = {
            summary,
            indices,
            confidence,
            sources: ["gemini", csvSize > 0 ? "csv" : "no-csv"],
            timestamp: new Date().toISOString()
        };

        // Add explain if present
        if (explain) {
            responseObj.explain = explain;
        } else if (reasoningLevel) {
            // Provide fallback explain if requested but not returned
            responseObj.explain = {
                mode: 'deep',
                factors: [],
                inputs: { query: query || '', csvRows: csvSize }
            };
        }

        // Collect external trends/citations
        const trendOut = await collectTrends(query, {});
        if (trendOut.items?.length) {
            responseObj.citations = trendOut.items.map(({ title, url, source }) => ({ title, url, source }));
            responseObj.sources = Array.from(new Set([...(responseObj.sources || []), 'trends']));
        }

        // Store in cache
        CACHE.set(key, { data: responseObj, ts: Date.now() });

        return res.status(200).json(responseObj);
    } catch (error) {
        console.error("Deep analysis error:", error);
        // Never 500 — return a graceful fallback
        return res.status(200).json({
            summary: "Analysis failed upstream. Returning safe fallback.",
            indices: { demand: 55, momentum: 55, saturation: 45, freshness: 50, styleFit: 60 },
            sources: ["fallback"],
        });
    }
});

app.listen(PORT, () => {
    console.log(`API on :${PORT}`);
});