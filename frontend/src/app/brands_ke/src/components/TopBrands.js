import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/api';
import './TopBrands.css';

const FALLBACK_BRANDS = [
  {
    id: 'dev-adidas',
    name: 'Adidas',
    gender: 'men',
    logo: { image: 'https://i.pinimg.com/1200x/1d/6c/e6/1d6ce60caa97c268c3d8560bc41e980b.jpg' },
  },
  {
    id: 'dev-nike',
    name: 'Nike',
    gender: 'women',
    logo: 'https://via.placeholder.com/160x80.png?text=Nike',
  },
];

const TopBrands = () => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/products/brands/');
        const allBrands = Array.isArray(response.data?.results)
          ? response.data.results
          : response.data;
        const normalizedBrands = Array.isArray(allBrands) ? allBrands : [];

        if (normalizedBrands.length === 0) {
          setBrands(FALLBACK_BRANDS);
          return;
        }
        
        // Filter for Adidas and Nike, or get first two brands
        const adidas = normalizedBrands.find(b => b.name?.toLowerCase().includes('adidas'));
        const nike = normalizedBrands.find(b => b.name?.toLowerCase().includes('nike'));
        
        const selectedBrands = [];
        if (adidas) selectedBrands.push({ ...adidas, gender: 'men' });
        if (nike) selectedBrands.push({ ...nike, gender: 'women' });
        
        // If we don't have both, fill with random brands
        if (selectedBrands.length < 2) {
          const remaining = normalizedBrands.filter(b => 
            !selectedBrands.some(sb => sb.id === b.id)
          );
          while (selectedBrands.length < 2 && remaining.length > 0) {
            const random = remaining[Math.floor(Math.random() * remaining.length)];
            selectedBrands.push({
              ...random,
              gender: selectedBrands.length === 0 ? 'men' : 'women'
            });
            remaining.splice(remaining.indexOf(random), 1);
          }
        }
        
        setBrands(selectedBrands.length > 0 ? selectedBrands : FALLBACK_BRANDS);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands(FALLBACK_BRANDS);
      }
    };

    fetchBrands();
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="top-brands">
      <h2 className="section-title">Top Brands</h2>
      <div className="brands-grid">
        {brands.map((brand, index) => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="brand-card"
          >
            <div className="brand-image-container">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="brand-image" />
              ) : (
                <div className="brand-placeholder">
                  <span>{brand.name}</span>
                </div>
              )}
            </div>
            <Link
              to={`/products?brand=${brand.id}&gender=${brand.gender}`}
              className="brand-button"
            >
              FOR {brand.gender === 'men' ? 'HIM' : 'HER'}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TopBrands;

