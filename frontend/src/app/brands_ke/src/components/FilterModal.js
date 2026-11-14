import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './FilterModal.css';

const defaultFilters = {
  sizes: [],
  colors: [],
  priceRange: { min: 0, max: 100000 },
  features: [],
  season: [],
};

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }) => {
  // Merge passed filters with defaults to ensure all properties exist
  const [localFilters, setLocalFilters] = useState(() => ({
    ...defaultFilters,
    ...(filters || {}),
    priceRange: {
      ...defaultFilters.priceRange,
      ...(filters?.priceRange || {}),
    },
  }));

  // Update localFilters when filters prop changes
  useEffect(() => {
    if (filters) {
      setLocalFilters({
        ...defaultFilters,
        ...filters,
        priceRange: {
          ...defaultFilters.priceRange,
          ...(filters.priceRange || {}),
        },
      });
    }
  }, [filters]);

  if (!isOpen) return null;

  const handleSizeToggle = (size) => {
    setLocalFilters(prev => ({
      ...prev,
      sizes: (prev.sizes || []).includes(size)
        ? (prev.sizes || []).filter(s => s !== size)
        : [...(prev.sizes || []), size],
    }));
  };

  const handleColorToggle = (color) => {
    setLocalFilters(prev => ({
      ...prev,
      colors: (prev.colors || []).includes(color)
        ? (prev.colors || []).filter(c => c !== color)
        : [...(prev.colors || []), color],
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({ ...defaultFilters });
  };

  const sizeOptions = ['2', '2.5', '3', '4', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14', '15', '16'];
  const colorOptions = ['Black', 'White', 'Brown', 'Beige', 'Grey', 'Navy', 'Red', 'Blue'];
  const featureOptions = ['Waterproof', 'Breathable', 'Lightweight', 'Cushioned'];
  const seasonOptions = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="filter-modal"
          >
            <div className="filter-header">
              <h2>SELECT FILTER</h2>
              <button className="close-button" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="filter-content">
              <FilterSection
                title="SIZE"
                isOpen={true}
                onToggle={() => {}}
              >
                <div className="size-grid">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      className={`filter-option ${(localFilters.sizes || []).includes(size) ? 'selected' : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="COLOR">
                <div className="color-grid">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`filter-option ${(localFilters.colors || []).includes(color) ? 'selected' : ''}`}
                      onClick={() => handleColorToggle(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="PRICE">
                <div className="price-range">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={localFilters.priceRange?.max || 100000}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      priceRange: { 
                        ...(prev.priceRange || defaultFilters.priceRange), 
                        max: parseInt(e.target.value) 
                      },
                    }))}
                  />
                  <div className="price-display">
                    KES 0 - KES {(localFilters.priceRange?.max || 100000).toLocaleString()}
                  </div>
                </div>
              </FilterSection>

              <FilterSection title="FEATURES">
                <div className="feature-list">
                  {featureOptions.map((feature) => (
                    <label key={feature} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={(localFilters.features || []).includes(feature)}
                        onChange={() => {
                          setLocalFilters(prev => ({
                            ...prev,
                            features: (prev.features || []).includes(feature)
                              ? (prev.features || []).filter(f => f !== feature)
                              : [...(prev.features || []), feature],
                          }));
                        }}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="SEASON">
                <div className="season-list">
                  {seasonOptions.map((season) => (
                    <label key={season} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={(localFilters.season || []).includes(season)}
                        onChange={() => {
                          setLocalFilters(prev => ({
                            ...prev,
                            season: (prev.season || []).includes(season)
                              ? (prev.season || []).filter(s => s !== season)
                              : [...(prev.season || []), season],
                          }));
                        }}
                      />
                      <span>{season}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            </div>

            <div className="filter-footer">
              <button className="reset-button" onClick={handleReset}>
                RESET
              </button>
              <button className="apply-button" onClick={handleApply}>
                SHOW RESULTS
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const FilterSection = ({ title, children, isOpen: defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="filter-section">
      <button className="filter-section-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <span className="chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="filter-section-content">{children}</div>}
    </div>
  );
};

export default FilterModal;

