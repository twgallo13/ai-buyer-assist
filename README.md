# AI Buyer Assist v1.7

A comprehensive retail trend analysis platform with budget management and caching capabilities.

## Features

### Analysis Modes
- **Quick Analysis**: Fast CSV-based trend analysis
- **Deep Analysis**: AI-powered analysis using Gemini with intelligent caching

### Data Quality & Validation (v1.6)
- CSV schema validator with friendly warnings
- Buyer presets that tune weights/thresholds (Footwear, Apparel, Regional US/EU)
- Guided Query Builder with chips and filters

### Budget & Ops (v1.7)
- **Daily Rate Caps**: Server-side per-day rate limiting
- **Intelligent Caching**: In-memory cache for Deep requests
- **Usage Dashboard**: Real-time metrics and cache statistics
- **Visual Banners**: Cache hits and rate cap notifications

## Budget & Ops Features

### What Counts as a Call
- Only Deep Analysis requests that reach Gemini API count toward daily limit
- Cache hits do not count toward the limit
- Quick Analysis is always free and unlimited

### What Happens at Cap
- When daily cap is reached, Deep Analysis gracefully degrades
- Returns conservative fallback analysis with 50% baseline scores
- Shows orange banner: "Daily AI budget cap reached. Showing conservative fallback."
- Cap resets automatically at midnight

### How Cache Works
- Cache key = hash of (query + settings + mode:'deep')
- 24-hour TTL (Time To Live)
- Automatic daily cleanup removes expired entries
- Cache hits show blue "From cache" banner

### Usage Dashboard
- Real-time metrics: date, calls, blocked requests, cache hits
- Current cap and cache size monitoring
- Refresh and Reset buttons (Reset for development only)

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional Budget Controls
DAILY_CAP=1000              # Default: 1000 calls per day
CACHE_TTL_HOURS=24          # Optional: cache TTL in hours
```

## Setup

```bash
# Install dependencies
cd app
npm install

# Start development servers
npm run dev     # Frontend on :5174
npm run server  # API on :3001
```

## Usage

1. **Load CSV**: Upload your retail data with headers like Collection, Category, Color Family, etc.
2. **Validate Data**: Review any CSV schema warnings in the validation banner
3. **Select Buyer Preset**: Choose from Footwear, Apparel, or Regional presets to tune analysis
4. **Build Query**: Use the Guided Query Builder or enter manual queries
5. **Analyze**: Run Quick (instant) or Deep (AI-powered) analysis
6. **Monitor Usage**: Check the Usage tab for budget and cache statistics

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/deep` - Deep analysis with caching and rate limiting
- `GET /api/usage` - Usage statistics
- `POST /api/usage/reset` - Reset usage counters (development only)