"""Command-line interface for AI Buyer Assist."""

import click
import pandas as pd
import json
from typing import Dict
from .data_manager import DataManager
from .trend_analyzer import TrendAnalyzer
from .recommendation_engine import RecommendationEngine


class AIBuyerAssistant:
    """Main assistant class that orchestrates all components."""
    
    def __init__(self):
        self.data_manager = DataManager()
        self.trend_analyzer = TrendAnalyzer()
        self.recommendation_engine = RecommendationEngine()
    
    def analyze_market(self, category: str = "electronics", days: int = 30) -> Dict:
        """Analyze market trends for a category."""
        # Load data
        data = self.data_manager.load_sample_data(category)
        recent_data = self.data_manager.get_latest_data(data, days)
        
        # Analyze trends
        price_trends = self.trend_analyzer.analyze_price_trends(recent_data)
        demand_patterns = self.trend_analyzer.analyze_demand_patterns(recent_data)
        categories = self.trend_analyzer.categorize_products(recent_data)
        
        return {
            "category": category,
            "analysis_period_days": days,
            "price_trends": price_trends,
            "demand_patterns": demand_patterns,
            "product_categories": categories,
            "data_points_analyzed": len(recent_data)
        }
    
    def get_recommendations(self, category: str = "electronics", user_id: str = "default") -> Dict:
        """Get buying recommendations for a category."""
        # Load data and user preferences
        data = self.data_manager.load_sample_data(category)
        user_prefs = self.data_manager.load_user_preferences(user_id)
        
        # Filter recent data
        recent_data = self.data_manager.get_latest_data(data, 30)
        
        # Generate recommendations
        recommendations = self.recommendation_engine.generate_recommendations(
            recent_data, user_prefs
        )
        
        return recommendations


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """AI Buyer Assist - Your AI-powered buying trend advisor."""
    pass


@cli.command()
@click.option('--category', '-c', default='electronics', 
              type=click.Choice(['electronics', 'clothing', 'home']),
              help='Product category to analyze')
@click.option('--days', '-d', default=30, type=int,
              help='Number of days to analyze (default: 30)')
@click.option('--output', '-o', type=click.Choice(['json', 'summary']), default='summary',
              help='Output format')
def analyze(category, days, output):
    """Analyze market trends for a product category."""
    assistant = AIBuyerAssistant()
    
    click.echo(f"Analyzing {category} market trends for the last {days} days...")
    
    try:
        analysis = assistant.analyze_market(category, days)
        
        if output == 'json':
            click.echo(json.dumps(analysis, indent=2, default=str))
        else:
            _print_analysis_summary(analysis)
            
    except Exception as e:
        click.echo(f"Error: {e}", err=True)


@cli.command()
@click.option('--category', '-c', default='electronics',
              type=click.Choice(['electronics', 'clothing', 'home']),
              help='Product category for recommendations')
@click.option('--user', '-u', default='default',
              help='User ID for personalized recommendations')
@click.option('--output', '-o', type=click.Choice(['json', 'summary']), default='summary',
              help='Output format')
def recommend(category, user, output):
    """Get AI-powered buying recommendations."""
    assistant = AIBuyerAssistant()
    
    click.echo(f"Generating recommendations for {category} category...")
    
    try:
        recommendations = assistant.get_recommendations(category, user)
        
        if output == 'json':
            click.echo(json.dumps(recommendations, indent=2, default=str))
        else:
            _print_recommendations_summary(recommendations)
            
    except Exception as e:
        click.echo(f"Error: {e}", err=True)


@cli.command()
@click.option('--category', '-c', default='electronics',
              type=click.Choice(['electronics', 'clothing', 'home']),
              help='Category to generate data for')
@click.option('--products', '-p', default=50, type=int,
              help='Number of products to generate')
@click.option('--days', '-d', default=90, type=int,
              help='Days of history to generate')
def generate_data(category, products, days):
    """Generate sample market data for testing."""
    data_manager = DataManager()
    
    click.echo(f"Generating {products} products with {days} days of history for {category}...")
    
    try:
        data = data_manager.generate_sample_data(category, products, days)
        click.echo(f"Generated {len(data)} data points saved to data/{category}_data.csv")
        
        # Show sample
        click.echo("\nSample data:")
        click.echo(data.head().to_string(index=False))
        
    except Exception as e:
        click.echo(f"Error: {e}", err=True)


@cli.command()
@click.option('--user', '-u', default='default', help='User ID')
def preferences(user):
    """View or set user preferences."""
    data_manager = DataManager()
    
    try:
        prefs = data_manager.load_user_preferences(user)
        
        click.echo(f"Current preferences for user '{user}':")
        click.echo(json.dumps(prefs, indent=2))
        
        if click.confirm("Would you like to update preferences?"):
            _update_preferences(data_manager, user, prefs)
            
    except Exception as e:
        click.echo(f"Error: {e}", err=True)


def _print_analysis_summary(analysis: Dict):
    """Print a formatted summary of market analysis."""
    click.echo("\n" + "="*50)
    click.echo(f"MARKET ANALYSIS - {analysis['category'].upper()}")
    click.echo("="*50)
    
    # Price trends
    price_trends = analysis.get('price_trends', {})
    if price_trends:
        click.echo(f"\n📊 PRICE TRENDS:")
        click.echo(f"  Current Price: ${price_trends.get('current_price', 0):.2f}")
        click.echo(f"  Average Price: ${price_trends.get('average_price', 0):.2f}")
        click.echo(f"  Price Range: ${price_trends.get('price_range', {}).get('min', 0):.2f} - "
                  f"${price_trends.get('price_range', {}).get('max', 0):.2f}")
        click.echo(f"  Trend: {price_trends.get('trend_direction', 'unknown').replace('_', ' ').title()}")
        
        volatility = price_trends.get('volatility', 0)
        if volatility > price_trends.get('average_price', 1) * 0.1:
            click.echo(f"  ⚠️  High volatility detected: ${volatility:.2f}")
        else:
            click.echo(f"  ✅ Market stability: ${volatility:.2f}")
    
    # Demand patterns
    demand_patterns = analysis.get('demand_patterns', {})
    if demand_patterns:
        click.echo(f"\n📈 DEMAND PATTERNS:")
        click.echo(f"  Average Demand: {demand_patterns.get('average_demand', 0):.1f} units")
        click.echo(f"  Peak Demand: {demand_patterns.get('peak_demand', 0):.1f} units")
        click.echo(f"  Trend: {demand_patterns.get('demand_trend', 'unknown').replace('_', ' ').title()}")
        
        seasonal = demand_patterns.get('seasonal_patterns', {})
        if seasonal:
            if seasonal.get('has_seasonal_pattern'):
                peak_month = seasonal.get('peak_month', 1)
                months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                click.echo(f"  📅 Peak season: {months[peak_month-1]}")
    
    # Product categories
    categories = analysis.get('product_categories', {}).get('categories', {})
    if categories:
        click.echo(f"\n🏷️  PRODUCT CATEGORIES:")
        for cat_name, cat_info in categories.items():
            click.echo(f"  {cat_name.replace('_', ' ').title()}: {cat_info.get('count', 0)} products")
            if cat_info.get('avg_price'):
                click.echo(f"    Average price: ${cat_info['avg_price']:.2f}")
    
    click.echo(f"\n📋 Analysis based on {analysis.get('data_points_analyzed', 0)} data points")


def _print_recommendations_summary(recommendations: Dict):
    """Print a formatted summary of recommendations."""
    click.echo("\n" + "="*50)
    click.echo("AI BUYING RECOMMENDATIONS")
    click.echo("="*50)
    
    # Confidence score
    confidence = recommendations.get('confidence_score', 0)
    confidence_pct = confidence * 100
    click.echo(f"🎯 Confidence Score: {confidence_pct:.1f}%")
    
    if confidence > 0.8:
        click.echo("   ✅ High confidence - Strong recommendations")
    elif confidence > 0.6:
        click.echo("   ⚡ Moderate confidence - Good recommendations")
    else:
        click.echo("   ⚠️  Lower confidence - Use with caution")
    
    # Market summary
    market = recommendations.get('market_summary', {})
    click.echo(f"\n📊 MARKET SNAPSHOT:")
    click.echo(f"  Price Trend: {market.get('price_trend', 'unknown').replace('_', ' ').title()}")
    click.echo(f"  Demand Trend: {market.get('demand_trend', 'unknown').replace('_', ' ').title()}")
    
    # Timing recommendation
    timing = recommendations.get('timing', {})
    if timing:
        click.echo(f"\n⏰ TIMING RECOMMENDATION:")
        rec = timing.get('recommendation', 'neutral')
        time_frame = timing.get('best_time_frame', 'flexible')
        
        if rec == 'buy_now':
            click.echo(f"  🟢 BUY NOW - {time_frame.replace('_', ' ')}")
        elif rec == 'buy_soon':
            click.echo(f"  🟡 BUY SOON - {time_frame.replace('_', ' ')}")
        elif rec == 'wait':
            click.echo(f"  🔴 WAIT - {time_frame.replace('_', ' ')}")
        else:
            click.echo(f"  ⚪ NEUTRAL - {time_frame.replace('_', ' ')}")
            
        for reason in timing.get('reasoning', []):
            click.echo(f"     • {reason}")
    
    # Product recommendations
    products = recommendations.get('products', [])
    if products:
        click.echo(f"\n🛍️  TOP PRODUCT RECOMMENDATIONS:")
        for i, product in enumerate(products[:3], 1):  # Show top 3
            click.echo(f"\n  {i}. {product.get('name', 'Unknown Product')}")
            click.echo(f"     Price: ${product.get('price', 0):.2f}")
            click.echo(f"     Score: {product.get('score', 0):.2f}/1.0")
            
            for reason in product.get('reasoning', [])[:2]:  # Show top 2 reasons
                click.echo(f"     • {reason}")
    
    # Budget recommendations
    budget = recommendations.get('budget', {})
    suggested_range = budget.get('suggested_range', {})
    if suggested_range:
        click.echo(f"\n💰 BUDGET RECOMMENDATIONS:")
        click.echo(f"  Budget Option: ${suggested_range.get('budget', 0):.2f}")
        click.echo(f"  Mid-Range: ${suggested_range.get('mid_range', 0):.2f}")
        click.echo(f"  Premium: ${suggested_range.get('premium', 0):.2f}")
        
        savings = budget.get('savings_opportunities', [])
        if savings:
            click.echo(f"  💡 Savings Tips:")
            for tip in savings:
                click.echo(f"     • {tip}")


def _update_preferences(data_manager: DataManager, user_id: str, current_prefs: Dict):
    """Interactive preference update."""
    new_prefs = current_prefs.copy()
    
    # Budget range
    budget_options = ['budget', 'mid_range', 'premium']
    click.echo(f"\nCurrent budget preference: {current_prefs.get('budget_range', 'mid_range')}")
    if click.confirm("Update budget range?"):
        new_budget = click.prompt("Budget range", 
                                type=click.Choice(budget_options),
                                default=current_prefs.get('budget_range', 'mid_range'))
        new_prefs['budget_range'] = new_budget
    
    # Priority
    priority_options = ['price', 'value', 'popularity', 'quality']
    click.echo(f"\nCurrent priority: {current_prefs.get('priority', 'value')}")
    if click.confirm("Update priority?"):
        new_priority = click.prompt("Priority", 
                                   type=click.Choice(priority_options),
                                   default=current_prefs.get('priority', 'value'))
        new_prefs['priority'] = new_priority
    
    # Max price
    click.echo(f"\nCurrent max price: ${current_prefs.get('max_price', 1000)}")
    if click.confirm("Update max price?"):
        new_max_price = click.prompt("Maximum price", type=float,
                                   default=current_prefs.get('max_price', 1000))
        new_prefs['max_price'] = new_max_price
    
    # Save preferences
    data_manager.save_user_preferences(new_prefs, user_id)
    click.echo(f"\n✅ Preferences updated for user '{user_id}'")


def main():
    """Main entry point for the CLI."""
    cli()


if __name__ == '__main__':
    main()