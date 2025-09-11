const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        keyPresent: Boolean(process.env.GEMINI_API_KEY),
        version: "v1.0"
    });
});

// Deep analysis endpoint
app.post('/api/deep', async (req, res) => {
    const { query, rows } = req.body;

    // Mock response for when no API key is present or fallback
    const mockResponse = {
        "summary": "Mock deep analysis (no API key present).",
        "indices": {
            "demand": 72,
            "momentum": 68,
            "saturation": 41,
            "freshness": 64,
            "styleFit": 77
        },
        "sources": ["mock"]
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'REPLACE_WITH_YOUR_REAL_KEY') {
        return res.status(200).json(mockResponse);
    }

    // TODO: Implement Gemini API integration
    // For now, return mock response even if key is present
    // When implementing Gemini integration, ensure response shape matches mockResponse
    try {
        // Placeholder for Gemini API call
        // const geminiResponse = await callGeminiAPI(query, rows);
        // const mappedResponse = mapGeminiResponse(geminiResponse);
        // res.json(mappedResponse);

        // Return mock for now, but never send 500
        res.status(200).json(mockResponse);
    } catch (error) {
        console.error('Error in deep analysis:', error);
        // On error, return mock with fallback source instead of 500
        const fallbackResponse = {
            ...mockResponse,
            "sources": ["mock", "fallback"]
        };
        res.status(200).json(fallbackResponse);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`API on :${PORT}`);
});