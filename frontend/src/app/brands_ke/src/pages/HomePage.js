import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnnouncementBanner from '../components/AnnouncementBanner';
import FlashSaleCountdown from '../components/FlashSaleCountdown';
import TopNavbar from '../components/TopNavbar';
import BrandNavbar from '../components/BrandNavbar';
import HeroSection from '../components/HeroSection';
import TopBrands from '../components/TopBrands';
import TopCategories from '../components/TopCategories';
import BestDiscounts from '../components/BestDiscounts';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import ContentTile from '../components/ContentTile';
import './HomePage.css';

const HomePage = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="homepage">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isHeaderVisible ? 0 : -200 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="header-sections"
      >
        <AnnouncementBanner />
        <FlashSaleCountdown />
        <TopNavbar isVisible={isHeaderVisible} />
        
      </motion.div>

      <main className="homepage-content">
        <HeroSection />
        <TopBrands />
        <TopCategories />
        <BestDiscounts />
        <ContentTile />
        <Newsletter />
        <Footer />
      </main>
    </div>
  );
};

export default HomePage;
