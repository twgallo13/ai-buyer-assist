// server.cjs
"use strict";
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001;

// Fail fast if key missing
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in .env");
    process.exit(1);
}

// Budget cap (dev: in-memory)
let callsToday = 0;
let day = new Date().toDateString();
function withinCap(max) {
    const nowDay = new Date().toDateString();
    if (nowDay !== day) { day = nowDay; callsToday = 0; }
    if (callsToday >= max) return false;
    callsToday++; return true;
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, keyPresent: true, version: "v1.0" });
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

// --- Gemini client ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// --- Deep analysis ---
app.post("/api/deep", async (req, res) => {
    const { query, rows, model, temperature, reasoningLevel } = req.body || {};
    const csvSize = Array.isArray(rows) ? rows.length : 0;
    const chosenModel = (typeof model === 'string' && model.trim()) ? model : MODEL_ID;
    const temp = Number.isFinite(Number(temperature)) ? Number(temperature) : 0.4;

    // Budget cap check
    const cap = Number(process.env.BUDGET_CAP || 0) || 500;
    if (!withinCap(cap)) {
        return res.status(200).json({
            summary: "Budget cap reached — returning safe fallback.",
            indices: { demand: 55, momentum: 55, saturation: 45, freshness: 50, styleFit: 60 },
            sources: ["fallback", "cap"]
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