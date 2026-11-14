import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-title"
        >
          MEGA FLASH SALE
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hero-subtitle"
        >
          <p className="hero-subtitle-line1">Up to 70% OFF on Top Brands</p>
          <p className="hero-subtitle-line2">Limited time deals</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="hero-buttons"
        >
          <Link to="/products?gender=men" className="hero-button">
            MEN
          </Link>
          <Link to="/products?gender=women" className="hero-button">
            WOMEN
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

