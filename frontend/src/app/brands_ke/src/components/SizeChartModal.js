// ENTIRE FILE CONTENT - NEW CODE
import React, { useMemo } from 'react';
import { FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './SizeChartModal.css';

const SizeChartModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const categoryName = product.category?.name?.toLowerCase() || '';
  const categorySlug = product.category?.slug?.toLowerCase() || '';
  
  const isShoes = categoryName.includes('shoe') || 
                  categoryName.includes('sneaker') || 
                  categoryName.includes('footwear') ||
                  categorySlug.includes('shoe') ||
                  categorySlug.includes('sneaker') ||
                  categorySlug.includes('footwear');

  const isClothing = categoryName.includes('clothing') ||
                     categoryName.includes('shirt') ||
                     categoryName.includes('dress') ||
                     categoryName.includes('pant') ||
                     categorySlug.includes('clothing') ||
                     categorySlug.includes('shirt') ||
                     categorySlug.includes('dress') ||
                     categorySlug.includes('pant');

  const renderShoeSizeChart = () => {
    const baseSizes = [];
    for (let size = 3; size <= 15; size += 0.5) {
      const formatted = Number.isInteger(size) ? `${size}` : size.toFixed(1).replace('.0', '');
      baseSizes.push(formatted);
    }
    const numericSizes = baseSizes.map((size) => parseFloat(size));

    const formatValue = (value, decimals = 1) => {
      const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
      return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(decimals);
    };

    const heelToeInches = numericSizes.map((size, index) => {
      const inches = 8.2 + index * 0.17;
      return formatValue(inches, 2);
    });

    const heelToeCm = heelToeInches.map((inch) => formatValue(parseFloat(inch) * 2.54, 1));

    const sizeChartRows = [
      { label: 'Heel-toe (INCH)', values: heelToeInches },
      { label: 'Heel-toe (CM)', values: heelToeCm },
      { label: 'US-Men', values: baseSizes },
      { label: 'US-Women', values: numericSizes.map((size) => formatValue(size + 1.5)) },
      { label: 'EU', values: numericSizes.map((size) => formatValue(size + 33)) },
      { label: 'UK', values: numericSizes.map((size) => formatValue(size - 0.5)) },
      { label: 'China', values: heelToeCm.map((cm) => `${Math.round(parseFloat(cm) * 10)}`) },
    ];

    return (
      <div className="size-chart-table">
        <table>
          <thead>
            <tr>
              <th className="sticky-column">Measurement</th>
              {baseSizes.map((size) => (
                <th key={size}>{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChartRows.map((row, rowIndex) => (
              <tr key={row.label} className={rowIndex % 2 === 0 ? 'even' : 'odd'}>
                <td className="sticky-column region-cell">{row.label}</td>
                {row.values.map((value, colIndex) => (
                  <td key={`${row.label}-${colIndex}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderClothingSizeChart = () => {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const measurements = {
      'Chest (IN)': ['32-34', '35-37', '38-40', '41-43', '44-46', '47-49', '50-52'],
      'Chest (CM)': ['81-86', '89-94', '97-102', '104-109', '112-117', '119-124', '127-132'],
      'Waist (IN)': ['26-28', '29-31', '32-34', '35-37', '38-40', '41-43', '44-46'],
      'Waist (CM)': ['66-71', '74-79', '81-86', '89-94', '97-102', '104-109', '112-117'],
    };

    return (
      <div className="size-chart-table">
        <table>
          <thead>
            <tr>
              <th className="sticky-column">Measurement</th>
              {sizes.map((size) => (
                <th key={size}>{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(measurements).map(([label, values], rowIndex) => (
              <tr key={label} className={rowIndex % 2 === 0 ? 'even' : 'odd'}>
                <td className="sticky-column region-cell">{label}</td>
                {values.map((value, colIndex) => (
                  <td key={`${label}-${colIndex}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGenericSizeChart = () => {
    return (
      <div className="no-size-chart">
        <p>No size chart available for this product category.</p>
      </div>
    );
  };

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
            className="size-chart-modal"
          >
            <div className="modal-header">
              <h2>
                {(product?.brand?.name || 'BRAND') + ' ' + 
                 (product?.category?.name?.toUpperCase() || 'PRODUCT') + ' SIZE CHART'}
              </h2>
              <button className="close-button" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="modal-content">
              {isShoes && renderShoeSizeChart()}
              {isClothing && renderClothingSizeChart()}
              {!isShoes && !isClothing && renderGenericSizeChart()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeChartModal;