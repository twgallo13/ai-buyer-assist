"""Recommendation engine for purchase decisions."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from .trend_analyzer import TrendAnalyzer


class RecommendationEngine:
    """Generates AI-powered buying recommendations."""
    
    def __init__(self):
        self.trend_analyzer = TrendAnalyzer()
        
    def generate_recommendations(self, data: pd.DataFrame, user_preferences: Dict = None) -> Dict:
        """Generate comprehensive buying recommendations."""
        if data.empty:
            return {"status": "error", "message": "No data available for recommendations"}
            
        recommendations = {}
        
        # Analyze current trends
        price_trends = self.trend_analyzer.analyze_price_trends(data)
        demand_patterns = self.trend_analyzer.analyze_demand_patterns(data)
        categories = self.trend_analyzer.categorize_products(data)
        
        # Generate timing recommendations
        timing_rec = self._generate_timing_recommendations(price_trends, demand_patterns)
        
        # Generate product recommendations
        product_rec = self._generate_product_recommendations(data, categories, user_preferences)
        
        # Generate budget recommendations
        budget_rec = self._generate_budget_recommendations(price_trends, user_preferences)
        
        # Calculate confidence score
        confidence = self._calculate_confidence_score(data, price_trends, demand_patterns)
        
        recommendations = {
            "timing": timing_rec,
            "products": product_rec,
            "budget": budget_rec,
            "confidence_score": confidence,
            "market_summary": {
                "price_trend": price_trends.get("trend_direction", "unknown"),
                "demand_trend": demand_patterns.get("demand_trend", "unknown"),
                "market_volatility": price_trends.get("volatility", 0)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return recommendations
    
    def _generate_timing_recommendations(self, price_trends: Dict, demand_patterns: Dict) -> Dict:
        """Generate recommendations about when to buy."""
        timing = {
            "recommendation": "neutral",
            "reasoning": [],
            "best_time_frame": "within_week"
        }
        
        # Analyze price trends
        price_direction = price_trends.get("trend_direction", "stable")
        
        if price_direction == "decreasing":
            timing["recommendation"] = "wait"
            timing["reasoning"].append("Prices are decreasing - consider waiting for better deals")
            timing["best_time_frame"] = "within_month"
        elif price_direction == "increasing":
            timing["recommendation"] = "buy_soon"
            timing["reasoning"].append("Prices are increasing - buy sooner to avoid higher costs")
            timing["best_time_frame"] = "within_week"
        else:
            timing["recommendation"] = "neutral"
            timing["reasoning"].append("Prices are stable - timing is flexible")
            
        # Consider demand patterns
        demand_trend = demand_patterns.get("demand_trend", "stable")
        if demand_trend == "increasing":
            timing["reasoning"].append("Demand is increasing - availability may become limited")
            if timing["recommendation"] == "neutral":
                timing["recommendation"] = "buy_soon"
                
        # Seasonal considerations
        if "seasonal_patterns" in demand_patterns:
            seasonal = demand_patterns["seasonal_patterns"]
            current_month = datetime.now().month
            
            if seasonal.get("peak_month") == current_month:
                timing["reasoning"].append("Currently in peak demand season")
            elif seasonal.get("low_month") == current_month:
                timing["reasoning"].append("Currently in low demand season - good time for deals")
                timing["recommendation"] = "buy_now"
                
        return timing
    
    def _generate_product_recommendations(self, data: pd.DataFrame, categories: Dict, 
                                        user_preferences: Optional[Dict]) -> List[Dict]:
        """Generate product-specific recommendations."""
        recommendations = []
        
        if data.empty:
            return recommendations
            
        # Default preferences if none provided
        if user_preferences is None:
            user_preferences = {"budget_range": "mid_range", "priority": "value"}
            
        # Sort products by recommendation score
        scored_products = self._score_products(data, user_preferences)
        
        # Generate top recommendations
        top_products = scored_products.head(5)
        
        for _, product in top_products.iterrows():
            rec = {
                "product_id": str(product.get("id", "unknown")),
                "name": str(product.get("name", "Product")),
                "price": float(product.get("price", 0)),
                "score": float(product.get("recommendation_score", 0)),
                "reasoning": self._generate_product_reasoning(product, user_preferences)
            }
            recommendations.append(rec)
            
        return recommendations
    
    def _generate_budget_recommendations(self, price_trends: Dict, 
                                       user_preferences: Optional[Dict]) -> Dict:
        """Generate budget-related recommendations."""
        budget_rec = {
            "suggested_range": {},
            "savings_opportunities": [],
            "financing_advice": []
        }
        
        avg_price = price_trends.get("average_price", 0)
        price_range = price_trends.get("price_range", {})
        
        if avg_price > 0:
            # Suggest budget ranges based on market data
            budget_rec["suggested_range"] = {
                "budget": price_range.get("min", avg_price * 0.7),
                "mid_range": avg_price,
                "premium": price_range.get("max", avg_price * 1.5)
            }
            
            # Identify savings opportunities
            volatility = price_trends.get("volatility", 0)
            if volatility > avg_price * 0.1:
                budget_rec["savings_opportunities"].append(
                    "High price volatility detected - monitor for price drops"
                )
                
        # General financing advice
        if avg_price > 500:
            budget_rec["financing_advice"].append(
                "Consider financing options for high-value purchases"
            )
            
        return budget_rec
    
    def _score_products(self, data: pd.DataFrame, user_preferences: Dict) -> pd.DataFrame:
        """Score products based on various factors."""
        scored_data = data.copy()
        
        if scored_data.empty:
            return scored_data
            
        # Initialize recommendation score
        scored_data["recommendation_score"] = 0.0
        
        # Price scoring (lower price = higher score for budget-conscious users)
        if "price" in scored_data.columns:
            price_scores = self._normalize_inverse(scored_data["price"])
            scored_data["recommendation_score"] += price_scores * 0.4
            
        # Demand/popularity scoring
        if "quantity_sold" in scored_data.columns:
            demand_scores = self._normalize(scored_data["quantity_sold"])
            scored_data["recommendation_score"] += demand_scores * 0.3
            
        # Availability scoring
        if "availability" in scored_data.columns:
            avail_scores = self._normalize(scored_data["availability"])
            scored_data["recommendation_score"] += avail_scores * 0.3
            
        # Apply user preference weights
        priority = user_preferences.get("priority", "value")
        if priority == "price":
            # Boost price weight for price-sensitive users
            scored_data["recommendation_score"] = (
                self._normalize_inverse(scored_data["price"]) * 0.7 +
                scored_data["recommendation_score"] * 0.3
            )
        elif priority == "popularity":
            if "quantity_sold" in scored_data.columns:
                scored_data["recommendation_score"] = (
                    self._normalize(scored_data["quantity_sold"]) * 0.7 +
                    scored_data["recommendation_score"] * 0.3
                )
                
        return scored_data.sort_values("recommendation_score", ascending=False)
    
    def _normalize(self, series: pd.Series) -> pd.Series:
        """Normalize series to 0-1 range."""
        min_val = series.min()
        max_val = series.max()
        if max_val == min_val:
            return pd.Series(0.5, index=series.index)
        return (series - min_val) / (max_val - min_val)
    
    def _normalize_inverse(self, series: pd.Series) -> pd.Series:
        """Inverse normalize series (lower values get higher scores)."""
        normalized = self._normalize(series)
        return 1 - normalized
    
    def _generate_product_reasoning(self, product: pd.Series, user_preferences: Dict) -> List[str]:
        """Generate reasoning for product recommendation."""
        reasons = []
        
        price = product.get("price", 0)
        if price > 0:
            reasons.append(f"Competitive price point at ${price:.2f}")
            
        if "quantity_sold" in product.index and product["quantity_sold"] > 0:
            reasons.append(f"Popular item with {product['quantity_sold']} units sold")
            
        if "availability" in product.index and product["availability"] > 10:
            reasons.append("Good availability - in stock")
        elif "availability" in product.index and product["availability"] <= 10:
            reasons.append("Limited availability - act fast")
            
        score = product.get("recommendation_score", 0)
        if score > 0.8:
            reasons.append("Highly recommended based on market analysis")
        elif score > 0.6:
            reasons.append("Good value based on current trends")
            
        return reasons
    
    def _calculate_confidence_score(self, data: pd.DataFrame, price_trends: Dict, 
                                  demand_patterns: Dict) -> float:
        """Calculate confidence score for recommendations."""
        confidence = 0.5  # Base confidence
        
        # Data quality factors
        data_points = len(data)
        if data_points > 100:
            confidence += 0.2
        elif data_points > 50:
            confidence += 0.1
        elif data_points < 10:
            confidence -= 0.2
            
        # Trend clarity
        price_direction = price_trends.get("trend_direction", "stable")
        if price_direction != "insufficient_data":
            confidence += 0.1
            
        demand_direction = demand_patterns.get("demand_trend", "stable")
        if demand_direction != "insufficient_data":
            confidence += 0.1
            
        # Volatility consideration
        volatility = price_trends.get("volatility", 0)
        avg_price = price_trends.get("average_price", 1)
        if avg_price > 0 and volatility / avg_price < 0.1:
            confidence += 0.1  # Low volatility increases confidence
        elif avg_price > 0 and volatility / avg_price > 0.3:
            confidence -= 0.1  # High volatility decreases confidence
            
        return max(0.0, min(1.0, confidence))  # Clamp between 0 and 1