import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../config/api';
import './FlashSaleCountdown.css';

const FlashSaleCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [flashSale, setFlashSale] = useState(null);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await api.get('/flash-sales/');
        if (response.data && response.data.length > 0) {
          const activeSale = response.data[0];
          setFlashSale(activeSale);
          
          if (activeSale.end_time) {
            // Calculate time remaining from end_time
            const endTime = new Date(activeSale.end_time);
            const now = new Date();
            const diff = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeRemaining(diff);
          } else if (activeSale.time_remaining) {
            // Parse the time remaining string (format: "X days, HH:MM:SS")
            const timeStr = activeSale.time_remaining;
            const daysMatch = timeStr.match(/(\d+)\s+day/);
            const timeMatch = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
            
            let totalSeconds = 0;
            if (daysMatch) totalSeconds += parseInt(daysMatch[1]) * 86400;
            if (timeMatch) {
              totalSeconds += parseInt(timeMatch[1]) * 3600;
              totalSeconds += parseInt(timeMatch[2]) * 60;
              totalSeconds += parseInt(timeMatch[3]);
            }
            
            setTimeRemaining(totalSeconds);
          }
        }
      } catch (error) {
        console.error('Error fetching flash sale:', error);
      }
    };

    fetchFlashSale();
    const interval = setInterval(fetchFlashSale, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return { days: 0, hours: 0, minutes: 0, secs: 0 };
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { days, hours, minutes, secs };
  };

  if (!flashSale || timeRemaining === null || timeRemaining === undefined) {
    return null;
  }

  const { days, hours, minutes, secs } = formatTime(timeRemaining);

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flash-sale-countdown"
    >
      <div className="countdown-content">
        <span className="countdown-label">FLASH SALE ENDS IN:</span>
        <div className="countdown-timer">
          {days > 0 && (
            <div className="countdown-unit">
              <span className="countdown-value">{String(days).padStart(2, '0')}</span>
              <span className="countdown-label-small">DAYS</span>
            </div>
          )}
          <div className="countdown-unit">
            <span className="countdown-value">{String(hours).padStart(2, '0')}</span>
            <span className="countdown-label-small">HRS</span>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-unit">
            <span className="countdown-value">{String(minutes).padStart(2, '0')}</span>
            <span className="countdown-label-small">MINS</span>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-unit">
            <span className="countdown-value">{String(secs).padStart(2, '0')}</span>
            <span className="countdown-label-small">SECS</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlashSaleCountdown;

