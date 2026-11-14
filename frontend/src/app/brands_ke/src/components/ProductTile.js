import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../config/api';
import useAuthStore from '../store/authStore';
import './ProductTile.css';

const ProductTile = ({ product, onSizeSelect }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Check initial favorite state when component loads
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated || !product?.id) {
        setIsFavorite(false);
        return;
      }

      try {
        setIsCheckingFavorite(true);
        const response = await api.get(`/favorites/check/${product.id}/`);
        setIsFavorite(response.data.is_favorite || false);
      } catch (error) {
        // If error (e.g., 404), product is not favorited
        setIsFavorite(false);
      } finally {
        setIsCheckingFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [product?.id, isAuthenticated]);

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login or show toast
      return;
    }

    try {
      const response = await api.post(`/favorites/toggle/${product.id}/`);
      setIsFavorite(response.data.is_favorite || false);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSizeSelect) {
      onSizeSelect(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  // Get unique colors and put active color first
  const getUniqueColors = () => {
    const allColors = product.color_swatches || product.variants?.map(v => v.color).filter(Boolean) || [];
    
    // Get unique colors (case-insensitive)
    const uniqueColors = [];
    const seenColors = new Set();
    
    allColors.forEach(color => {
      const normalizedColor = color?.toLowerCase().trim();
      if (normalizedColor && !seenColors.has(normalizedColor)) {
        seenColors.add(normalizedColor);
        uniqueColors.push(color); // Keep original case
      }
    });
    
    // Get active product color (from first variant or primary image)
    const activeColor = product.variants?.[0]?.color || 
                       product.primary_color || 
                       uniqueColors[0];
    
    // Sort: active color first, then rest
    if (activeColor) {
      const activeIndex = uniqueColors.findIndex(c => 
        c?.toLowerCase().trim() === activeColor?.toLowerCase().trim()
      );
      if (activeIndex > 0) {
        const [active] = uniqueColors.splice(activeIndex, 1);
        uniqueColors.unshift(active);
      }
    }
    
    return uniqueColors;
  };

  const uniqueColors = getUniqueColors();
  const displaySwatches = uniqueColors.slice(0, 5);
  const remainingCount = uniqueColors.length - 5;

  return (
    <motion.div
      className="product-tile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.slug || product.id}`} className="product-tile-link">
        <div className="product-image-container">
          <img
            src={product.images?.[0]?.image_url || product.primary_image?.image_url || product.image_url || product.image || 'https://via.placeholder.com/300x375'}
            alt={product.name}
            className="product-image"
          />
          
          {discount && (
            <div className="discount-badge">
              -{discount}%
            </div>
          )}

          <button
            className={`favorite-button ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label="Add to favorites"
          >
            <FiHeart />
          </button>

          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            <FiShoppingBag />
          </button>
        </div>

        <div className="product-info">
          {product.brand && (
            <div className="product-brand">{product.brand.name || product.brand}</div>
          )}
          <h3 className="product-name">{product.name}</h3>
          
          <div className="product-price">
            {product.original_price && product.original_price > product.price ? (
              <>
                <span className="current-price">{formatPrice(product.price)}</span>
                <span className="original-price">{formatPrice(product.original_price)}</span>
              </>
            ) : (
              <span className="current-price">{formatPrice(product.price)}</span>
            )}
          </div>

          {displaySwatches.length > 0 && (
            <div className="color-swatches">
              {displaySwatches.map((color, index) => (
                <div
                  key={index}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {remainingCount > 0 && (
                <div className="color-swatch-more">+{remainingCount}</div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductTile;

