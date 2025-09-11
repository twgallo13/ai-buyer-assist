const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        keyPresent: !!process.env.GEMINI_API_KEY,
        version: "v1.0"
    });
});

// Deep analysis endpoint
app.post('/api/deep', async (req, res) => {
    const { query, rows } = req.body;

    // Mock response for when no API key is present or TODO for Gemini integration
    const mockResponse = {
        "summary": "Mock deep analysis (no key).",
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

        res.status(200).json(mockResponse);
    } catch (error) {
        console.error('Error in deep analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`API on :${PORT}`);
});