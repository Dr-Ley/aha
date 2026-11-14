import React, { useState, useEffect } from 'react';
import { FiGrid } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../config/api';
import './CategoryNavigation.css';

const CategoryNavigation = ({ brandId, selectedCategory, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Fetch all categories from database
        const response = await api.get('/products/categories/');
        const data = Array.isArray(response.data?.results) 
          ? response.data.results 
          : (Array.isArray(response.data) ? response.data : []);
        
        // Add "All Products" as first item
        setCategories([
          { id: 'all', name: 'All Products', icon: <FiGrid /> },
          ...data.map(cat => ({ ...cat, icon: null }))
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories
        setCategories([
          { id: 'all', name: 'All Products', icon: <FiGrid /> },
          { id: 'shoes', name: 'Shoes' },
          { id: 'clothing', name: 'Clothing' },
          { id: 'accessories', name: 'Accessories' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="category-navigation">
        
        <div className="category-scroll-container">
          <div className="category-scroll">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="category-item skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-navigation">
      <div className="category-scroll-container">
        <div className="category-scroll">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onCategorySelect(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="category-icon">
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name} 
                    className="category-image"
                  />
                ) : category.icon ? (
                  category.icon
                ) : (
                  <div className="category-placeholder-icon" />
                )}
              </div>
              <span className="category-name">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryNavigation;

