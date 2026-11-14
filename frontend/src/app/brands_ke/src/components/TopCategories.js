import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../config/api';
import './TopCategories.css';

const FALLBACK_CATEGORIES = [
  { id: 'dev-cat-1', name: 'Sneakers', inventoryCount: 120 },
  { id: 'dev-cat-2', name: 'Apparel', inventoryCount: 95 },
  { id: 'dev-cat-3', name: 'Accessories', inventoryCount: 60 },
  { id: 'dev-cat-4', name: 'Kids', inventoryCount: 45 },
];

const TopCategories = () => {
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/products/categories/');
        const allCategories = Array.isArray(response.data?.results)
          ? response.data.results
          : response.data;
        const normalizedCategories = Array.isArray(allCategories) ? allCategories : [];

        if (normalizedCategories.length === 0) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }
        
        // Fetch products for each category to get inventory count
        const categoriesWithCount = await Promise.all(
          normalizedCategories.map(async (category) => {
            try {
              const productsResponse = await api.get(`/products/?category=${category.id}`);
              const totalInventory = productsResponse.data.results?.reduce((sum, product) => {
                return sum + (product.variants?.reduce((vSum, variant) => 
                  vSum + (variant.stock_quantity || 0), 0) || 0);
              }, 0) || 0;
              
              return { ...category, inventoryCount: totalInventory };
            } catch (error) {
              return { ...category, inventoryCount: 0 };
            }
          })
        );
        
        // Sort by inventory count (highest first)
        const sorted = categoriesWithCount.sort((a, b) => b.inventoryCount - a.inventoryCount);
        setCategories(sorted.length > 0 ? sorted : FALLBACK_CATEGORIES);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    fetchCategories();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (categories.length === 0) return null;

  return (
    <section className="top-categories">
      <h2 className="section-title">Top Categories</h2>
      <div className="categories-container">
        <button
          className="scroll-button scroll-left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <FiChevronLeft />
        </button>
        <div className="categories-scroll" ref={scrollRef}>
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="category-card"
            >
              <Link to={`/products?category=${category.id}`} className="category-link">
                <div className="category-image-container">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="category-image"
                    />
                  ) : (
                    <div className="category-placeholder">
                      <span>{category.name}</span>
                    </div>
                  )}
                </div>
                <div className="category-name">{category.name}</div>
              </Link>
            </motion.div>
          ))}
        </div>
        <button
          className="scroll-button scroll-right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
};

export default TopCategories;

