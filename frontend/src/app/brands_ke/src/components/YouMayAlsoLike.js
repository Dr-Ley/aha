import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/api';
import ProductTile from './ProductTile';
import './YouMayAlsoLike.css';

const YouMayAlsoLike = ({ cartItems = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarProducts();
  }, [cartItems]);

  const fetchSimilarProducts = async () => {
    setLoading(true);
    try {
      // Get categories and price ranges from cart items
      const categories = cartItems
        .map(item => item.product?.category?.id || item.product?.category)
        .filter(Boolean);
      
      const prices = cartItems
        .map(item => item.product?.price || item.product?.final_price || item.product?.discounted_price || 0)
        .filter(Boolean);

      if (categories.length === 0 && prices.length === 0) {
        // Fallback to general products
        const response = await api.get('/products/?limit=6');
        const allProducts = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
          ? response.data
          : [];
        setProducts(allProducts.slice(0, 6));
        setLoading(false);
        return;
      }

      // Calculate average price
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
        : 0;

      // Build query params
      const params = new URLSearchParams();
      if (categories.length > 0) {
        params.append('category', categories[0]); // Use first category
      }
      if (avgPrice > 0) {
        const minPrice = Math.max(0, avgPrice * 0.7);
        const maxPrice = avgPrice * 1.3;
        params.append('min_price', minPrice.toFixed(0));
        params.append('max_price', maxPrice.toFixed(0));
      }
      params.append('limit', '6');

      const response = await api.get(`/products/?${params.toString()}`);
      const allProducts = Array.isArray(response.data?.results)
        ? response.data.results
        : Array.isArray(response.data)
        ? response.data
        : [];

      // Filter out products already in cart
      const cartProductIds = cartItems.map(item => item.product?.id || item.id).filter(Boolean);
      const filtered = allProducts.filter(product => !cartProductIds.includes(product.id));
      
      setProducts(filtered.slice(0, 6));
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="you-may-also-like">
        <div className="you-may-also-like-container">
          <h2 className="section-title">You May Also Like</h2>
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="product-tile-skeleton" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="you-may-also-like">
      <div className="you-may-also-like-container">
        <h2 className="section-title">You May Also Like</h2>
        <div className="products-grid">
          {products.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              onSizeSelect={() => {}} // Can be implemented later
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouMayAlsoLike;

