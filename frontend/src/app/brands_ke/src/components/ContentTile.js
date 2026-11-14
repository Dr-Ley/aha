import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './ContentTile.css';

const ContentTile = ({ brand }) => {
  // Brand-specific content
  const getBrandContent = () => {
    const brandName = brand?.name?.toLowerCase() || '';
    const brandSlug = brand?.slug || '';
    
    if (brandName.includes('adidas')) {
      return {
        heading: 'THREE STRIPES. ENDLESS POSSIBILITIES.',
        image: 'https://i.pinimg.com/736x/8a/87/2d/8a872d50e9bee81feed695cc57286aae.jpg',
        buttonText: 'SHOP ADIDAS COLLECTION',
        link: `/products?brand=${brandSlug || 'adidas'}`
      };
    } else if (brandName.includes('nike')) {
      return {
        heading: 'JUST DO IT. INNOVATION MEETS STYLE.',
        image: 'https://i.pinimg.com/1200x/a7/60/c9/a760c9c7fa1ade9cb45c5fb015d61041.jpg',
        buttonText: 'SHOP NIKE COLLECTION',
        link: `/products?brand=${brandSlug || 'nike'}`
      };
    } else if (brandName.includes('puma')) {
      return {
        heading: 'FOREVER FASTER. PERFORMANCE REDEFINED.',
        image: 'https://i.pinimg.com/1200x/04/46/c5/0446c58a15cfb344674ca883812d588b.jpg',
        buttonText: 'SHOP PUMA COLLECTION',
        link: `/products?brand=${brandSlug || 'puma'}`
      };
    } else {
      // Default content
      return {
        
        image: 'https://i.pinimg.com/1200x/26/d4/a5/26d4a5c4de7912b3cc41ee0dfc616a05.jpg',
        buttonText: 'SHOP COLLECTION',
        link: brandSlug ? `/products?brand=${brandSlug}` : '/products'
      };
    }
  };

  const content = getBrandContent();

  return (
    <section className="content-tile-section">
      <div className="content-tile-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="content-tile"
        >
          <div className="content-tile-image">
            <img
              src={content.image}
              alt={content.heading}
            />
          </div>
          <div className="content-tile-overlay">
            <div className="content-tile-text">
              <h2 className="content-tile-heading">
                {content.heading}
              </h2>
              <Link to={content.link} className="content-tile-button">
                {content.buttonText}
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContentTile;

