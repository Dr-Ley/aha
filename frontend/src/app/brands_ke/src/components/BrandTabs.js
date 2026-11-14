import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { getBrandTheme } from '../utils/brandThemes';
import './BrandTabs.css';

const BrandTabs = ({ activeBrand }) => {
  const [brands, setBrands] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
        setBrands([]);
      }
    };

    fetchBrands();
  }, []);

  const activeBrandObj = useMemo(() => {
    if (!currentBrand) return null;
    return brands.find(b => 
      b.slug === currentBrand || 
      b.id === currentBrand ||
      b.name?.toLowerCase().replace(/\s+/g, '-') === currentBrand
    );
  }, [brands, currentBrand]);

  const handleBrandClick = (brand) => {
    if (brand.id === 'all' || brand.slug === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?brand=${brand.slug || brand.id}`);
    }
    setIsExpanded(false);
  };

  const getBrandClass = (brand) => {
    const slug = brand.slug || brand.id || '';
    return slug.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="main-header__brand main-header__brand--hubpage-toggle">
      <div className={`main-header__brand-active main-header__brand-active--${getBrandClass(activeBrandObj || {})}`}></div>
      
      <ul className="main-header__brand-list">
        {activeBrandObj && (
          <li className={`main-header__brand-item main-header__brand-item--${getBrandClass(activeBrandObj)}`}>
            <Link
              to={`/products?brand=${activeBrandObj.slug || activeBrandObj.id}`}
              className={`main-header__brand-label main-header__brand-label--${getBrandClass(activeBrandObj)} main-header__brand-label--active`}
            >
              {activeBrandObj.logo ? (
                <img 
                  src={activeBrandObj.logo} 
                  alt={activeBrandObj.name}
                  className={`main-header__brand-logo main-header__brand-logo--${getBrandClass(activeBrandObj)}`}
                />
              ) : (
                <span>{activeBrandObj.name}</span>
              )}
            </Link>
          </li>
        )}
        
        {brands.filter(b => b.id !== activeBrandObj?.id && b.slug !== activeBrandObj?.slug).slice(0, 1).map((brand) => (
          <li key={brand.id} className={`main-header__brand-item main-header__brand-item--${getBrandClass(brand)}`}>
            <Link
              to={`/products?brand=${brand.slug || brand.id}`}
              className={`main-header__brand-label main-header__brand-label--${getBrandClass(brand)}`}
            >
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className={`main-header__brand-logo main-header__brand-logo--${getBrandClass(brand)}`}
                />
              ) : (
                <span>{brand.name}</span>
              )}
            </Link>
          </li>
        ))}
        
        <li className="main-header__brand-item main-header__brand-item--allbrands">
          <Link
            to="/products"
            className="main-header__brand-label main-header__brand-label--allbrands"
            title="All Brands"
          >
            All Brands
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default BrandTabs;

