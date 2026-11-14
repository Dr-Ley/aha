import React from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './ProgressTracker.css';

const ProgressTracker = ({ viewed, total, onLoadMore, isLoading = false, showLoadMore = false }) => {
  const percentage = total > 0 ? (viewed / total) * 100 : 0;

  return (
    <div className="progress-tracker-section">
      <div className="progress-tracker-container">
        <div className="progress-text">
          You've viewed {viewed} of {total} products
        </div>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {showLoadMore && viewed < total && (
          <div className="load-more-container">
            <button 
              className="more-products-button" 
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'LOADING...' : 'LOAD MORE PRODUCTS'}
              {!isLoading && <FiChevronRight />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;

