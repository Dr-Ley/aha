import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import './BestDiscounts.css';

const FALLBACK_PRODUCTS = [
  {
    id: 'dev-prod-1',
    name: 'Nike Air Zoom Pegasus 40',
    slug: 'nike-air-zoom-pegasus-40',
    price: 14500,
    final_price: 10875,
    discount_percentage: 25,
    primary_image: { image: 'https://via.placeholder.com/320x360.png?text=Pegasus+40' },
  },
  {
    id: 'dev-prod-2',
    name: 'Adidas Ultraboost Light',
    slug: 'adidas-ultraboost-light',
    price: 16000,
    final_price: 12000,
    discount_percentage: 25,
    primary_image: { image: 'https://via.placeholder.com/320x360.png?text=Ultraboost' },
  },
  {
    id: 'dev-prod-3',
    name: 'Puma Mirage Sport',
    slug: 'puma-mirage-sport',
    price: 12500,
    final_price: 8750,
    discount_percentage: 30,
    primary_image: { image: 'https://via.placeholder.com/320x360.png?text=Mirage+Sport' },
  },
  {
    id: 'dev-prod-4',
    name: 'New Balance 327',
    slug: 'new-balance-327',
    price: 13800,
    final_price: 10350,
    discount_percentage: 25,
    primary_image: { image: 'https://via.placeholder.com/320x360.png?text=NB+327' },
  },
  {
    id: 'dev-prod-5',
    name: 'Air Jordan 1 Mid',
    slug: 'air-jordan-1-mid',
    price: 18000,
    final_price: 13500,
    discount_percentage: 25,
    primary_image: { image: 'https://via.placeholder.com/320x360.png?text=AJ1+Mid' },
  },
];

const BestDiscounts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeGender, setActiveGender] = useState('unisex');
  const [centerIndex, setCenterIndex] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/?ordering=-discount_percentage&min_discount=10');
        const allProducts = Array.isArray(response.data?.results)
          ? response.data.results
          : response.data;
        const normalizedProducts = Array.isArray(allProducts) ? allProducts : [];
        const dataset = normalizedProducts.length > 0 ? normalizedProducts : FALLBACK_PRODUCTS;
        
        // Filter products that have variants (to determine gender)
        // For now, we'll use a simple approach - you can enhance this later
        setProducts(dataset);
        filterByGender(dataset, 'unisex');
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(FALLBACK_PRODUCTS);
        filterByGender(FALLBACK_PRODUCTS, 'unisex');
      }
    };

    fetchProducts();
  }, []);

  const filterByGender = (productsList, gender) => {
    // Filter products - in a real app, you'd filter by actual gender field
    // For now, we'll just take products with highest discounts
    const listToUse = Array.isArray(productsList) && productsList.length > 0
      ? productsList
      : FALLBACK_PRODUCTS;
    const sorted = [...listToUse]
      .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
      .slice(0, 5);
    
    setFilteredProducts(sorted);
    setCenterIndex(1);
  };

  const handleGenderChange = (gender) => {
    setActiveGender(gender);
    filterByGender(products, gender);
  };

  const handleImageClick = (index) => {
    if (index === centerIndex) {
      // Navigate to product detail
      const product = filteredProducts[index];
      if (product) {
        navigate(`/products/${product.slug}`);
      }
    } else {
      // Move clicked image to center
      setCenterIndex(index);
    }
  };

  const getImageStyle = (index) => {
    const offset = index - centerIndex;
    const scale = index === centerIndex ? 1.2 : 1;
    const opacity = Math.abs(offset) > 1 ? 0.3 : 0.7;
    const zIndex = index === centerIndex ? 10 : 5 - Math.abs(offset);
    
    return {
      transform: `translateX(${offset * 120}%) scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  if (filteredProducts.length === 0) return null;

  return (
    <section className="best-discounts">
      <h2 className="section-title">Best Discounts</h2>
      <div className="gender-tabs">
        <button
          className={`gender-tab ${activeGender === 'men' ? 'active' : ''}`}
          onClick={() => handleGenderChange('men')}
        >
          MEN
        </button>
        <button
          className={`gender-tab ${activeGender === 'women' ? 'active' : ''}`}
          onClick={() => handleGenderChange('women')}
        >
          WOMEN
        </button>
      </div>
      
      <div className="discounts-carousel-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGender}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="discounts-carousel"
          >
            {filteredProducts.map((product, index) => {
              const image = product.primary_image || product.images?.[0];
              const imageUrl = image?.image_url || image?.image;
              return (
                <motion.div
                  key={product.id}
                  initial={false}
                  animate={getImageStyle(index)}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className={`discount-item ${index === centerIndex ? 'center' : ''}`}
                  onClick={() => handleImageClick(index)}
                >
                  <div className="discount-image-container">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="discount-image"
                      />
                    ) : (
                      <div className="discount-placeholder">
                        <span>{product.name}</span>
                      </div>
                    )}
                    {product.discount_percentage > 0 && (
                      <div className="discount-badge">
                        -{product.discount_percentage}%
                      </div>
                    )}
                  </div>
                  {index === centerIndex && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="discount-info"
                    >
                      <h3 className="discount-product-name">{product.name}</h3>
                      <div className="discount-price">
                        <span className="original-price">KES {product.price}</span>
                        <span className="discounted-price">
                          KES {product.final_price?.toFixed(2) || product.price}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default BestDiscounts;

