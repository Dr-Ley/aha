// FloatingNavPanel.jsx
import React, { useState, useEffect } from "react";
import { FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "./FloatingNavPanel.css";

const FloatingNavPanel = ({
  brandName,
  itemCount,
  brands,
  onBrandSelect,
  onFilterOpen,
  sortOptions,
  selectedSort,
  onSortChange,
}) => {
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const showAt = 100; // scroll position before showing panel

    const handleScroll = () => {
      if (window.scrollY > showAt) {
        setShowPanel(true);
      } else {
        setShowPanel(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="floating-nav-panel"
        >
          <div className="floating-nav-inner">
            {/* LEFT SECTION — brand selector + item count */}
            <div className="left-section">
              <div className="brand-selector-wrapper">
                <button
                  className="brand-selector-btn"
                  onClick={() => {
                    setBrandDropdownOpen(!brandDropdownOpen);
                    setSortDropdownOpen(false);
                  }}
                >
                  {brandName || "All Brands"}
                  {brandDropdownOpen ? (
                    <FiChevronUp size={18} />
                  ) : (
                    <FiChevronDown size={18} />
                  )}
                </button>

                <AnimatePresence>
                  {brandDropdownOpen && (
                    <motion.div
                      className="brand-dropdown"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          onBrandSelect({
                            id: "all",
                            name: "All Brands",
                            slug: "all",
                          });
                          setBrandDropdownOpen(false);
                        }}
                      >
                        All Brands
                      </button>

                      {brands.map((brand) => (
                        <button
                          key={brand.id}
                          className="dropdown-item"
                          onClick={() => {
                            onBrandSelect(brand);
                            setBrandDropdownOpen(false);
                          }}
                        >
                          {brand.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="item-count">{itemCount} items</div>
            </div>

            {/* RIGHT SECTION — Filter + Sort */}
            <div className="right-section">
              <button className="filter-btn" onClick={onFilterOpen}>
                <FiFilter size={18} />
                Filter
              </button>

              <div className="sort-wrapper">
                <button
                  className="sort-btn"
                  onClick={() => {
                    setSortDropdownOpen(!sortDropdownOpen);
                    setBrandDropdownOpen(false);
                  }}
                >
                  Sort
                  {sortDropdownOpen ? (
                    <FiChevronUp size={18} />
                  ) : (
                    <FiChevronDown size={18} />
                  )}
                </button>

                <AnimatePresence>
                  {sortDropdownOpen && (
                    <motion.div
                      className="sort-dropdown"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`dropdown-item ${
                            selectedSort === option.value ? "active" : ""
                          }`}
                          onClick={() => {
                            onSortChange(option.value);
                            setSortDropdownOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingNavPanel;
