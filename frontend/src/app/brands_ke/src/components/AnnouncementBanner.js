import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomBrand, setRandomBrand] = useState(null);

  const announcements = [
    {
      text: 'Get 15% off on your first order when you sign up |',
      link: '/register',
      linkText: 'Sign up',
    },
    {
      text: 'Buy 3 or more items and get free shipping |',
      link: null, // Will be set to random brand
      linkText: 'Buy now',
      isDynamic: true,
    },
    {
      text: 'All items in stock. For more items check ',
      link: 'https://www.nike.com/retail/directory/kenya',
      linkText: 'official website',
    },
  ];

  useEffect(() => {
    // Fetch random brand for dynamic link
    const fetchRandomBrand = async () => {
      try {
        const response = await api.get('/products/brands/');
        if (response.data && response.data.length > 0) {
          const random = response.data[Math.floor(Math.random() * response.data.length)];
          setRandomBrand(random);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    fetchRandomBrand();

    // Rotate announcements every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentAnnouncement = announcements[currentIndex];
  const linkUrl = currentAnnouncement.isDynamic && randomBrand
    ? `/products?brand=${randomBrand.id}`
    : currentAnnouncement.link;

  return (
    <div className="announcement-banner">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="announcement-content"
        >
          <span className="announcement-text">
            {currentAnnouncement.text.split(currentAnnouncement.linkText)[0]}
            {linkUrl ? (
              <Link to={linkUrl} className="announcement-link">
                {currentAnnouncement.linkText}
              </Link>
            ) : (
              <span className="announcement-link-text">{currentAnnouncement.linkText}</span>
            )}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;

