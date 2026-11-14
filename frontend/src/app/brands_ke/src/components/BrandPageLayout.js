import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnnouncementBanner from './AnnouncementBanner';
import FlashSaleCountdown from './FlashSaleCountdown';
import TopNavbar from './TopNavbar';
import BrandNavbar from './BrandNavbar';
import Newsletter from './Newsletter';
import Footer from './Footer';
import { getBrandTheme, applyBrandTheme } from '../utils/brandThemes';
import './BrandPageLayout.css';
import ContentTile from '../components/ContentTile';

const BrandPageLayout = ({ children }) => {
  const { brandSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const brandFromQuery = searchParams.get('brand');

  // Determine active brand from URL params or query string
  const activeBrandSlug = brandSlug || brandFromQuery || null;

  useEffect(() => {
    const theme = getBrandTheme(activeBrandSlug);
    applyBrandTheme(theme);
  }, [activeBrandSlug]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
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
    <div className="brand-page-layout">
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

      <main className="brand-page-content">
        {children}
      </main>

      <ContentTile />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default BrandPageLayout;

