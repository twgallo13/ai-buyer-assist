"""Tests for trend analyzer module."""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ai_buyer_assist.trend_analyzer import TrendAnalyzer


class TestTrendAnalyzer(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = TrendAnalyzer()
        
        # Create sample data
        dates = [datetime.now() - timedelta(days=x) for x in range(30, 0, -1)]
        self.sample_data = pd.DataFrame({
            'date': dates,
            'price': np.random.uniform(50, 150, 30),
            'quantity_sold': np.random.randint(10, 100, 30),
            'id': ['product_1'] * 30,
            'name': ['Test Product'] * 30
        })
    
    def test_analyze_price_trends_with_data(self):
        """Test price trend analysis with valid data."""
        result = self.analyzer.analyze_price_trends(self.sample_data)
        
        self.assertIsInstance(result, dict)
        self.assertIn('current_price', result)
        self.assertIn('average_price', result)
        self.assertIn('trend_direction', result)
        self.assertIn('volatility', result)
        
        # Check that prices are reasonable
        self.assertGreater(result['current_price'], 0)
        self.assertGreater(result['average_price'], 0)
        
    def test_analyze_price_trends_empty_data(self):
        """Test price trend analysis with empty data."""
        empty_df = pd.DataFrame()
        result = self.analyzer.analyze_price_trends(empty_df)
        
        self.assertIn('status', result)
        self.assertEqual(result['status'], 'error')
    
    def test_analyze_demand_patterns(self):
        """Test demand pattern analysis."""
        result = self.analyzer.analyze_demand_patterns(self.sample_data)
        
        self.assertIsInstance(result, dict)
        self.assertIn('average_demand', result)
        self.assertIn('demand_trend', result)
        
        # Check reasonable values
        self.assertGreater(result['average_demand'], 0)
    
    def test_categorize_products(self):
        """Test product categorization."""
        # Add more varied data for better categorization
        varied_data = pd.DataFrame({
            'price': [50, 100, 200, 400, 800],
            'quantity_sold': [10, 20, 15, 5, 2],
            'id': ['p1', 'p2', 'p3', 'p4', 'p5'],
            'name': ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
        })
        
        result = self.analyzer.categorize_products(varied_data)
        
        self.assertIsInstance(result, dict)
        self.assertIn('categories', result)
    
    def test_calculate_trend_direction(self):
        """Test trend direction calculation."""
        # Increasing trend
        increasing_series = pd.Series([1, 2, 3, 4, 5])
        result = self.analyzer._calculate_trend_direction(increasing_series)
        self.assertEqual(result, 'increasing')
        
        # Decreasing trend
        decreasing_series = pd.Series([5, 4, 3, 2, 1])
        result = self.analyzer._calculate_trend_direction(decreasing_series)
        self.assertEqual(result, 'decreasing')
        
        # Stable trend
        stable_series = pd.Series([3, 3.1, 2.9, 3, 3.05])
        result = self.analyzer._calculate_trend_direction(stable_series)
        self.assertEqual(result, 'stable')
        
        # Insufficient data
        short_series = pd.Series([1])
        result = self.analyzer._calculate_trend_direction(short_series)
        self.assertEqual(result, 'insufficient_data')


if __name__ == '__main__':
    unittest.main()