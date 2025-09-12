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

### External Signals & Citations (v1.8)
- **Trends Aggregator**: Pluggable system for external trend signals
- **Citations**: Deep Analysis automatically includes relevant citations
- **Stub Provider**: Built-in mock provider with realistic footwear/apparel trends
- **Future Ready**: Hooks prepared for news and social media providers

#### Endpoint: `/api/trends?query=...`
Returns trend signals matching the query with titles, URLs, and sources.

#### Environment Variables
```bash
TRENDS_ENABLE_STUB=true     # Default: true (built-in provider)
TRENDS_ENABLE_NEWS=false    # Future: news API integration
TRENDS_ENABLE_SOCIAL=false  # Future: social media integration  
TRENDS_TIMEOUT_MS=4000      # Request timeout in milliseconds
```

#### How It Works
- Deep analysis automatically collects relevant trends for each query
- Results include citations with clickable links to sources
- Works without extra API keys (stub provider enabled by default)
- Graceful fallback - analysis continues even if trends fail

### Export & Usage & Shareable Links (v1.9)
- **CSV Export**: Single-run and batch analysis export with consistent column format
- **Usage Meter**: Real-time header display showing Deep calls vs budget with color-coded alerts
- **Shareable Sessions**: Generate permanent links to analysis results via ?run=<id>
- **Server-side Runs Storage**: All analysis results stored with unique IDs for sharing/export

#### Usage Behavior
- Header meter polls `/api/usage` every 20 seconds
- Shows "Deep: X / Budget" with green (under budget) or red (at/over budget)
- Budget configurable via `API_DAILY_BUDGET` environment variable (default: 500)

#### Export Features
- **Single Export**: "Export CSV" button downloads one-row CSV for current analysis
- **Batch Export**: Client-side CSV generation for batch results with multiple rows
- **Consistent Format**: timestamp,query,mode,verdict,demand,momentum,saturation,freshness,styleFit,confidence,sources
- **Download Names**: `ai-buyer-export-YYYY-MM-DD.csv` or `ai-buyer-batch-YYYY-MM-DD.csv`

#### Shareable Links
- "Copy Share Link" creates URLs like `?run=abc123` for permanent access
- Shared views show "Viewing a shared session (read-only)" banner
- Links work across sessions and browser instances
- Sessions page includes export and share buttons for each saved analysis

## API Endpoints

- `GET /api/health` - Health check with usage statistics
- `POST /api/deep` - Deep analysis with caching and rate limiting
- `GET /api/usage` - Usage statistics (deepCalls, quickCalls, budget)
- `POST /api/usage/reset` - Reset usage counters (development only)
- `GET /api/trends` - External trend signals and citations
- `GET /api/runs/:id` - Retrieve saved analysis run by ID
- `POST /api/quick` - Save quick analysis run (for completeness)
- `GET /api/export` - Export analysis results as CSV (single or batch)