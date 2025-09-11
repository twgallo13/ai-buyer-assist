"""Data management module for sample data and data loading."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import os


class DataManager:
    """Manages data loading and sample data generation."""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        
    def load_sample_data(self, category: str = "electronics") -> pd.DataFrame:
        """Load or generate sample market data."""
        # Try to load existing data first
        file_path = os.path.join(self.data_dir, f"{category}_data.csv")
        
        if os.path.exists(file_path):
            return pd.read_csv(file_path)
        else:
            # Generate sample data
            return self.generate_sample_data(category)
    
    def generate_sample_data(self, category: str = "electronics", num_products: int = 50, 
                           days_of_history: int = 90) -> pd.DataFrame:
        """Generate realistic sample market data."""
        np.random.seed(42)  # For reproducible results
        
        # Product categories and their typical price ranges
        category_configs = {
            "electronics": {
                "base_price_range": (50, 2000),
                "products": ["Laptop", "Smartphone", "Tablet", "Headphones", "Camera", 
                           "Monitor", "Keyboard", "Mouse", "Speaker", "Smartwatch"]
            },
            "clothing": {
                "base_price_range": (20, 300),
                "products": ["T-Shirt", "Jeans", "Dress", "Jacket", "Shoes", 
                           "Sweater", "Shorts", "Skirt", "Coat", "Sneakers"]
            },
            "home": {
                "base_price_range": (25, 800),
                "products": ["Chair", "Table", "Lamp", "Bookshelf", "Sofa", 
                           "Bed", "Desk", "Mirror", "Rug", "Plant Pot"]
            }
        }
        
        config = category_configs.get(category, category_configs["electronics"])
        product_names = config["products"]
        price_range = config["base_price_range"]
        
        # Generate products
        products = []
        for i in range(num_products):
            product_name = np.random.choice(product_names)
            brand = f"Brand{chr(65 + (i % 10))}"  # Brand A, B, C, etc.
            
            base_price = np.random.uniform(price_range[0], price_range[1])
            
            # Generate time series data for each product
            dates = [datetime.now() - timedelta(days=x) for x in range(days_of_history, 0, -1)]
            
            for date in dates:
                # Add some price volatility and trends
                price_variation = np.random.normal(0, base_price * 0.05)  # 5% volatility
                
                # Add seasonal trends
                seasonal_factor = 1.0
                if date.month in [11, 12]:  # Holiday season
                    seasonal_factor = 1.1
                elif date.month in [1, 2]:  # Post-holiday
                    seasonal_factor = 0.9
                    
                # Add weekly patterns (lower prices on weekdays)
                if date.weekday() < 5:  # Weekday
                    weekly_factor = 0.98
                else:  # Weekend
                    weekly_factor = 1.02
                    
                final_price = base_price * seasonal_factor * weekly_factor + price_variation
                final_price = max(final_price, base_price * 0.5)  # Don't go below 50% of base
                
                # Generate demand based on price and other factors
                price_sensitivity = -0.5  # Demand decreases as price increases
                base_demand = np.random.uniform(5, 50)
                
                # Price effect on demand
                normalized_price = (final_price - price_range[0]) / (price_range[1] - price_range[0])
                demand = base_demand * (1 + price_sensitivity * normalized_price)
                
                # Add seasonality to demand
                demand *= seasonal_factor
                
                # Add some randomness
                demand += np.random.normal(0, demand * 0.2)
                demand = max(int(demand), 1)
                
                # Availability (higher for popular items)
                availability = max(int(demand * np.random.uniform(2, 8)), 10)
                
                product = {
                    "id": f"{category}_{i:03d}",
                    "name": f"{brand} {product_name}",
                    "category": category,
                    "brand": brand,
                    "price": round(final_price, 2),
                    "quantity_sold": demand,
                    "availability": availability,
                    "date": date.strftime("%Y-%m-%d"),
                    "rating": round(np.random.uniform(3.0, 5.0), 1)
                }
                products.append(product)
        
        df = pd.DataFrame(products)
        
        # Save sample data
        os.makedirs(self.data_dir, exist_ok=True)
        file_path = os.path.join(self.data_dir, f"{category}_data.csv")
        df.to_csv(file_path, index=False)
        
        return df
    
    def get_latest_data(self, data: pd.DataFrame, days: int = 7) -> pd.DataFrame:
        """Get the most recent data within specified days."""
        if data.empty or 'date' not in data.columns:
            return data
            
        data['date'] = pd.to_datetime(data['date'])
        cutoff_date = datetime.now() - timedelta(days=days)
        
        return data[data['date'] >= cutoff_date]
    
    def get_product_history(self, data: pd.DataFrame, product_id: str) -> pd.DataFrame:
        """Get historical data for a specific product."""
        if data.empty or 'id' not in data.columns:
            return pd.DataFrame()
            
        return data[data['id'] == product_id].sort_values('date')
    
    def aggregate_by_category(self, data: pd.DataFrame) -> pd.DataFrame:
        """Aggregate data by product category."""
        if data.empty:
            return data
            
        # Group by category and date, then aggregate
        agg_funcs = {
            'price': 'mean',
            'quantity_sold': 'sum',
            'availability': 'sum',
            'rating': 'mean'
        }
        
        available_cols = {col: agg_funcs[col] for col in agg_funcs if col in data.columns}
        
        if 'category' in data.columns and 'date' in data.columns:
            aggregated = data.groupby(['category', 'date']).agg(available_cols).reset_index()
            return aggregated
        else:
            return data
    
    def save_user_preferences(self, preferences: Dict, user_id: str = "default"):
        """Save user preferences to file."""
        prefs_dir = os.path.join(self.data_dir, "preferences")
        os.makedirs(prefs_dir, exist_ok=True)
        
        prefs_file = os.path.join(prefs_dir, f"{user_id}.json")
        with open(prefs_file, 'w') as f:
            json.dump(preferences, f, indent=2)
    
    def load_user_preferences(self, user_id: str = "default") -> Dict:
        """Load user preferences from file."""
        prefs_file = os.path.join(self.data_dir, "preferences", f"{user_id}.json")
        
        if os.path.exists(prefs_file):
            with open(prefs_file, 'r') as f:
                return json.load(f)
        else:
            # Return default preferences
            return {
                "budget_range": "mid_range",
                "priority": "value",
                "preferred_categories": ["electronics"],
                "max_price": 1000,
                "min_rating": 4.0
            }