import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { getBrandTheme } from '../utils/brandThemes';
import './BrandNavbar.css';

const BrandNavbar = ({ isVisible, activeBrand }) => {
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get active brand from prop or URL
  const currentBrand = activeBrand || searchParams.get('brand');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/products/brands/');
        const data = Array.isArray(response.data?.results) 
          ? response.data.results 
          : (Array.isArray(response.data) ? response.data : []);
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        // Fallback brands
        setBrands([
          { id: 'nike', name: 'Nike', slug: 'nike' },
          { id: 'adidas', name: 'Adidas', slug: 'adidas' },
          { id: 'zara', name: 'Zara', slug: 'zara' },
          { id: 'levis', name: "Levi's", slug: 'levis' },
          { id: 'lc-waikiki', name: 'LC Waikiki', slug: 'lc-waikiki' },
          { id: 'hugo-boss', name: 'Hugo Boss', slug: 'hugo-boss' },
          { id: 'woolworths', name: 'Woolworths', slug: 'woolworths' },
        ]);
      }
    };

    fetchBrands();
  }, []);

  // Reorder brands: active brand first, then "All Brands", then others
  const orderedBrands = useMemo(() => {
    if (!brands.length) return [];
    
    const activeBrandObj = brands.find(b => 
      b.slug === currentBrand || 
      b.id === currentBrand ||
      b.name?.toLowerCase().replace(/\s+/g, '-') === currentBrand
    );
    
    const otherBrands = brands.filter(b => 
      !(b.slug === currentBrand || 
        b.id === currentBrand ||
        b.name?.toLowerCase().replace(/\s+/g, '-') === currentBrand)
    );
    
    const result = [];
    if (activeBrandObj) result.push(activeBrandObj);
    result.push({ id: 'all', name: 'All Brands', slug: 'all' });
    result.push(...otherBrands);
    
    return result;
  }, [brands, currentBrand]);

  const handleBrandClick = (brand) => {
    if (brand.id === 'all' || brand.slug === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?brand=${brand.slug || brand.id}`);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.nav
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      exit={{ y: -50 }}
      transition={{ duration: 0.3 }}
      className="brand-navbar"
    >
      <div className="brand-navbar-container" style={{
        backgroundColor: 'var(--brand-navbar-bg, #fff)',
        color: 'var(--brand-navbar-text, #000)',
      }}>
        <div className="brand-tabs">
          {orderedBrands.map((brand) => {
            const isActive = brand.id === 'all' 
              ? !currentBrand 
              : (brand.slug === currentBrand || 
                 brand.id === currentBrand ||
                 brand.name?.toLowerCase().replace(/\s+/g, '-') === currentBrand);
            
            const theme = getBrandTheme(brand.slug || brand.id);
            
            return (
              <button
                key={brand.id}
                className={`brand-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleBrandClick(brand)}
                style={isActive ? {
                  color: theme.accentColor,
                  '--active-underline': theme.accentColor,
                } : {}}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BrandNavbar;