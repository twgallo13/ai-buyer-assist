# AI Buyer Assist

AI-powered buying trend advisor that helps you make informed purchasing decisions based on market analysis and trend predictions.

## Features

- **Market Trend Analysis**: Analyze price trends, demand patterns, and market volatility
- **AI-Powered Recommendations**: Get personalized buying recommendations based on your preferences
- **Product Categorization**: Automatically categorize products into budget, mid-range, and premium segments  
- **Timing Optimization**: Receive advice on the best time to make purchases
- **CLI Interface**: Easy-to-use command-line interface for quick analysis

## Installation

```bash
# Clone the repository
git clone https://github.com/twgallo13/ai-buyer-assist.git
cd ai-buyer-assist

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

## Quick Start

### 1. Generate Sample Data
```bash
ai-buyer generate-data --category electronics --products 50 --days 90
```

### 2. Analyze Market Trends
```bash
ai-buyer analyze --category electronics --days 30
```

### 3. Get Buying Recommendations
```bash
ai-buyer recommend --category electronics
```

### 4. Manage User Preferences
```bash
ai-buyer preferences --user your_username
```

## Usage Examples

### Market Analysis
```bash
# Analyze electronics market for the last 7 days
ai-buyer analyze -c electronics -d 7

# Get detailed JSON output
ai-buyer analyze -c clothing -d 30 -o json
```

### Getting Recommendations
```bash
# Get recommendations for home category
ai-buyer recommend -c home

# Get personalized recommendations
ai-buyer recommend -c electronics -u john_doe
```

### Working with Categories
Supported categories:
- `electronics`: Laptops, smartphones, tablets, etc.
- `clothing`: T-shirts, jeans, shoes, etc.  
- `home`: Furniture, appliances, decorations, etc.

## Sample Output

### Market Analysis
```
==================================================
MARKET ANALYSIS - ELECTRONICS
==================================================

📊 PRICE TRENDS:
  Current Price: $847.32
  Average Price: $823.45
  Price Range: $52.18 - $1,987.64
  Trend: Increasing
  ⚠️  High volatility detected: $410.23

📈 DEMAND PATTERNS:
  Average Demand: 32.4 units
  Peak Demand: 89.0 units
  Trend: Stable
  📅 Peak season: Nov

🏷️  PRODUCT CATEGORIES:
  Budget: 15 products
    Average price: $124.32
  Mid Range: 20 products
    Average price: $523.18
  Premium: 15 products
    Average price: $1,456.78
```

### Buying Recommendations
```
==================================================
AI BUYING RECOMMENDATIONS
==================================================
🎯 Confidence Score: 78.5%
   ⚡ Moderate confidence - Good recommendations

📊 MARKET SNAPSHOT:
  Price Trend: Increasing
  Demand Trend: Stable

⏰ TIMING RECOMMENDATION:
  🟡 BUY SOON - within week
     • Prices are increasing - buy sooner to avoid higher costs
     • Demand is increasing - availability may become limited

🛍️  TOP PRODUCT RECOMMENDATIONS:

  1. BrandA Laptop
     Price: $899.99
     Score: 0.87/1.0
     • Competitive price point at $899.99
     • Popular item with 45 units sold

  2. BrandB Smartphone  
     Price: $649.99
     Score: 0.82/1.0
     • Good value based on current trends
     • Good availability - in stock
```

## API Reference

### Core Classes

#### `TrendAnalyzer`
Analyzes market trends and patterns:
- `analyze_price_trends(data)`: Analyze price movements and volatility
- `analyze_demand_patterns(data)`: Detect demand trends and seasonality
- `categorize_products(data)`: Group products by price/demand characteristics

#### `RecommendationEngine`  
Generates AI-powered recommendations:
- `generate_recommendations(data, preferences)`: Create comprehensive buying advice
- User preferences: budget_range, priority, max_price, min_rating

#### `DataManager`
Handles data loading and management:
- `load_sample_data(category)`: Load market data for analysis
- `generate_sample_data(category, products, days)`: Create realistic test data
- `save_user_preferences(preferences, user_id)`: Store user settings

## Development

### Running Tests
```bash
python -m pytest tests/ -v
```

### Project Structure
```
ai-buyer-assist/
├── ai_buyer_assist/
│   ├── __init__.py
│   ├── cli.py              # Command-line interface
│   ├── trend_analyzer.py   # Market trend analysis
│   ├── recommendation_engine.py  # AI recommendations  
│   └── data_manager.py     # Data handling
├── tests/
│   ├── test_trend_analyzer.py
│   └── test_recommendation_engine.py
├── data/                   # Generated sample data
├── requirements.txt
└── setup.py
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue on GitHub.