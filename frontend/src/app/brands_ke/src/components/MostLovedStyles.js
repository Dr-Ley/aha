import React, { useState, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useQuery } from 'react-query';
import ProductTile from './ProductTile';
import api from '../config/api';
import './MostLovedStyles.css';

const MostLovedStyles = ({ brandId }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef(null);

  const { data: products = [], isLoading } = useQuery(
    ['most-loved', brandId],
    async () => {
      const params = new URLSearchParams();
      if (brandId) params.append('brand', brandId);
      params.append('sort', 'popular');
      params.append('limit', '10');
      
      const response = await api.get(`/products/?${params.toString()}`);
      return Array.isArray(response.data?.results) 
        ? response.data.results 
        : (Array.isArray(response.data) ? response.data : []);
    }
  );

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? scrollPosition - scrollAmount 
      : scrollPosition + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    
    setScrollPosition(newPosition);
  };

  if (isLoading || products.length === 0) return null;

  return (
    <section className="most-loved-section">
      <div className="most-loved-container">
        <div className="most-loved-header">
          <h2 className="most-loved-title">MOST LOVED STYLES</h2>
          <div className="most-loved-controls">
            <button
              className="nav-button"
              onClick={() => scroll('left')}
              disabled={scrollPosition <= 0}
            >
              <FiChevronLeft />
            </button>
            <button
              className="nav-button"
              onClick={() => scroll('right')}
              disabled={scrollPosition >= (scrollRef.current?.scrollWidth - scrollRef.current?.clientWidth || 0)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="most-loved-scroll" ref={scrollRef}>
          <div className="most-loved-grid">
            {products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostLovedStyles;

