"""Trend analysis module for market and product trends."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression


class TrendAnalyzer:
    """Analyzes market trends and product patterns."""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.trend_model = LinearRegression()
        
    def analyze_price_trends(self, data: pd.DataFrame) -> Dict:
        """Analyze price trends for products over time."""
        if data.empty:
            return {"status": "error", "message": "No data provided"}
            
        trends = {}
        
        # Calculate price trend direction
        if 'price' in data.columns and 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date'])
            data = data.sort_values('date')
            
            # Calculate moving averages
            data['price_ma_7'] = data['price'].rolling(window=7).mean()
            data['price_ma_30'] = data['price'].rolling(window=30).mean()
            
            # Determine trend direction
            recent_trend = self._calculate_trend_direction(data['price'].tail(7))
            
            trends = {
                "current_price": float(data['price'].iloc[-1]),
                "average_price": float(data['price'].mean()),
                "price_range": {
                    "min": float(data['price'].min()),
                    "max": float(data['price'].max())
                },
                "trend_direction": recent_trend,
                "volatility": float(data['price'].std()),
                "data_points": len(data)
            }
            
        return trends
    
    def analyze_demand_patterns(self, data: pd.DataFrame) -> Dict:
        """Analyze demand patterns and seasonality."""
        patterns = {}
        
        if 'quantity_sold' in data.columns and 'date' in data.columns:
            data['date'] = pd.to_datetime(data['date'])
            data = data.sort_values('date')
            
            # Calculate demand metrics
            patterns = {
                "average_demand": float(data['quantity_sold'].mean()),
                "peak_demand": float(data['quantity_sold'].max()),
                "demand_trend": self._calculate_trend_direction(data['quantity_sold']),
                "demand_volatility": float(data['quantity_sold'].std())
            }
            
            # Seasonal analysis if enough data
            if len(data) > 30:
                patterns["seasonal_patterns"] = self._detect_seasonality(data)
                
        return patterns
    
    def categorize_products(self, data: pd.DataFrame) -> Dict:
        """Categorize products based on price and demand patterns."""
        if data.empty or 'price' not in data.columns:
            return {"categories": {}}
            
        categories = {}
        
        # Use clustering to categorize products
        features = []
        if 'price' in data.columns:
            features.append('price')
        if 'quantity_sold' in data.columns:
            features.append('quantity_sold')
            
        if len(features) >= 2 and len(data) > 5:
            # Prepare features for clustering
            X = data[features].fillna(data[features].mean())
            X_scaled = self.scaler.fit_transform(X)
            
            # Determine optimal number of clusters (max 4)
            n_clusters = min(4, len(data) // 2, 3)
            if n_clusters > 1:
                kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                clusters = kmeans.fit_predict(X_scaled)
                
                # Categorize based on clusters
                data['cluster'] = clusters
                
                for i in range(n_clusters):
                    cluster_data = data[data['cluster'] == i]
                    category_name = self._determine_category_name(cluster_data, features)
                    
                    categories[category_name] = {
                        "count": len(cluster_data),
                        "avg_price": float(cluster_data['price'].mean()) if 'price' in features else None,
                        "price_range": {
                            "min": float(cluster_data['price'].min()),
                            "max": float(cluster_data['price'].max())
                        } if 'price' in features else None
                    }
                    
        return {"categories": categories}
    
    def _calculate_trend_direction(self, series: pd.Series) -> str:
        """Calculate trend direction from a series of values."""
        if len(series) < 2:
            return "insufficient_data"
            
        # Simple linear trend calculation
        x = np.arange(len(series))
        y = series.values
        
        # Handle NaN values
        mask = ~np.isnan(y)
        if np.sum(mask) < 2:
            return "insufficient_data"
            
        x_clean = x[mask]
        y_clean = y[mask]
        
        try:
            slope = np.polyfit(x_clean, y_clean, 1)[0]
            
            if slope > 0.1:
                return "increasing"
            elif slope < -0.1:
                return "decreasing"
            else:
                return "stable"
        except:
            return "stable"
    
    def _detect_seasonality(self, data: pd.DataFrame) -> Dict:
        """Detect seasonal patterns in the data."""
        data = data.copy()
        data['month'] = data['date'].dt.month
        data['day_of_week'] = data['date'].dt.dayofweek
        
        seasonal_info = {}
        
        if 'quantity_sold' in data.columns:
            # Monthly seasonality
            monthly_avg = data.groupby('month')['quantity_sold'].mean()
            peak_month = monthly_avg.idxmax()
            low_month = monthly_avg.idxmin()
            
            seasonal_info = {
                "peak_month": int(peak_month),
                "low_month": int(low_month),
                "monthly_variation": float(monthly_avg.std()),
                "has_seasonal_pattern": monthly_avg.std() > monthly_avg.mean() * 0.2
            }
            
        return seasonal_info
    
    def _determine_category_name(self, cluster_data: pd.DataFrame, features: List[str]) -> str:
        """Determine appropriate category name based on cluster characteristics."""
        if 'price' in features:
            avg_price = cluster_data['price'].mean()
            if avg_price > cluster_data['price'].quantile(0.75):
                return "premium"
            elif avg_price < cluster_data['price'].quantile(0.25):
                return "budget"
            else:
                return "mid_range"
        else:
            return f"category_{len(cluster_data)}_items"