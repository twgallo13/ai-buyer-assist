/* @ts-nocheck */
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: "1mb" }));

// health
app.get("/api/health", (_req, res) => {
  const keyPresent = !!(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());
  res.json({ ok: true, keyPresent, version: process.env.APP_VERSION || "v2.1.9" });
});

// version
app.get("/api/version", (_req, res) => {
  res.json({ version: process.env.APP_VERSION || "v2.1.9" });
});

// deep (safe placeholder)
app.post("/api/deep", (req, res) => {
  const query = (req.body && req.body.query) || "";
  const keyPresent = !!(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());

  if (!keyPresent) {
    return res.json({
      ok: true,
      sources: ["mock", "no-key"],
      result: {
        title: "Using safe mock (no API key detected)",
        verdict: "TEST",
        confidence: 42,
        kpis: { availability: 55, markdownRisk: 45, diversification: 50 },
        explain: [{ factor: "Credentials", impact: "negative", note: "Add GEMINI_API_KEY to .env" }],
        images: []
      }
    });
  }

  res.json({
    ok: true,
    sources: ["gemini"],
    result: {
      title: `Analysis for: ${query || "—"}`,
      verdict: "BUY",
      confidence: 73,
      kpis: { availability: 78, markdownRisk: 22, diversification: 64 },
      explain: [
        { factor: "Trend alignment", impact: "positive", note: "Strong cultural momentum." },
        { factor: "Markdown risk", impact: "neutral", note: "Low near-term markdown pressure." }
      ],
      images: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
