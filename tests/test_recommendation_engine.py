"""Tests for recommendation engine."""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ai_buyer_assist.recommendation_engine import RecommendationEngine


class TestRecommendationEngine(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.engine = RecommendationEngine()
        
        # Create sample data
        dates = [datetime.now() - timedelta(days=x) for x in range(14, 0, -1)]
        self.sample_data = pd.DataFrame({
            'date': dates * 2,  # Two products
            'price': [100] * 14 + [200] * 14,
            'quantity_sold': list(range(10, 24)) + list(range(5, 19)),
            'availability': [50] * 14 + [30] * 14,
            'id': ['product_1'] * 14 + ['product_2'] * 14,
            'name': ['Budget Product'] * 14 + ['Premium Product'] * 14
        })
    
    def test_generate_recommendations_with_data(self):
        """Test recommendation generation with valid data."""
        result = self.engine.generate_recommendations(self.sample_data)
        
        self.assertIsInstance(result, dict)
        self.assertIn('timing', result)
        self.assertIn('products', result)
        self.assertIn('budget', result)
        self.assertIn('confidence_score', result)
        self.assertIn('market_summary', result)
        
        # Check confidence score is valid
        confidence = result['confidence_score']
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
    
    def test_generate_recommendations_empty_data(self):
        """Test recommendation generation with empty data."""
        empty_df = pd.DataFrame()
        result = self.engine.generate_recommendations(empty_df)
        
        self.assertIn('status', result)
        self.assertEqual(result['status'], 'error')
    
    def test_generate_recommendations_with_preferences(self):
        """Test recommendations with user preferences."""
        user_prefs = {
            'budget_range': 'budget',
            'priority': 'price',
            'max_price': 150
        }
        
        result = self.engine.generate_recommendations(self.sample_data, user_prefs)
        
        self.assertIsInstance(result, dict)
        self.assertIn('products', result)
        
        # Should prioritize lower-priced products
        products = result['products']
        if products:
            # First product should be reasonably priced
            first_product = products[0]
            self.assertLessEqual(first_product['price'], 150)
    
    def test_score_products(self):
        """Test product scoring functionality."""
        user_prefs = {'priority': 'price'}
        scored_data = self.engine._score_products(self.sample_data, user_prefs)
        
        self.assertIn('recommendation_score', scored_data.columns)
        
        # Check that scores are valid
        scores = scored_data['recommendation_score']
        self.assertTrue(all(score >= 0 for score in scores))
        self.assertTrue(all(score <= 1 for score in scores))
    
    def test_normalize_functions(self):
        """Test normalization helper functions."""
        test_series = pd.Series([1, 2, 3, 4, 5])
        
        # Test normal normalization
        normalized = self.engine._normalize(test_series)
        self.assertAlmostEqual(normalized.min(), 0.0)
        self.assertAlmostEqual(normalized.max(), 1.0)
        
        # Test inverse normalization
        inv_normalized = self.engine._normalize_inverse(test_series)
        self.assertAlmostEqual(inv_normalized.min(), 0.0)
        self.assertAlmostEqual(inv_normalized.max(), 1.0)
        # Higher original values should have lower inverse normalized values
        self.assertLess(inv_normalized.iloc[-1], inv_normalized.iloc[0])
    
    def test_calculate_confidence_score(self):
        """Test confidence score calculation."""
        price_trends = {
            'trend_direction': 'increasing',
            'volatility': 10,
            'average_price': 100
        }
        demand_patterns = {
            'demand_trend': 'stable'
        }
        
        confidence = self.engine._calculate_confidence_score(
            self.sample_data, price_trends, demand_patterns
        )
        
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)


if __name__ == '__main__':
    unittest.main()