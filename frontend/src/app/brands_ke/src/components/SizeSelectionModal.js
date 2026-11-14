import React, { useState, useEffect } from 'react';
import { FiX, FiMaximize2, FiBell } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './SizeSelectionModal.css';

const SizeSelectionModal = ({ product, isOpen, onClose, onAddToCart, onSizeChartOpen }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Reset selected image when modal opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      setSelectedImageIndex(0);
      setSelectedSize(null);
      setQuantity(1);
    }
  }, [isOpen, product?.id]);
  
  if (!isOpen || !product) return null;

  /* -------------------------------
      NORMALIZE ALL IMAGES HERE
     ------------------------------- */
  const normalizeImage = (img) => {
    if (!img) return null;
    // If it's already a string URL, return it
    if (typeof img === 'string' && img.trim()) return img.trim();
    // If it's an object, try to extract the URL
    if (typeof img === 'object') {
      const url = img.image_url || img.url || img.src || img.image || null;
      return url && typeof url === 'string' ? url.trim() : null;
    }
    return null;
  };

  // Collect all possible image sources - use a Set to prevent duplicates
  const imageSet = new Set();
  
  // Debug: Log what we're receiving (remove after debugging)
  // Uncomment to debug image issues:
  // console.log('Product images data:', {
  //   hasImagesArray: Array.isArray(product.images),
  //   imagesLength: Array.isArray(product.images) ? product.images.length : 0,
  //   images: product.images,
  //   primary_image: product.primary_image,
  //   productId: product.id,
  //   productName: product.name
  // });
  
  // First, prioritize the images array (most complete)
  // Check if images array exists and has items
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img, idx) => {
      const normalized = normalizeImage(img);
      if (normalized && normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined') {
        imageSet.add(normalized);
      }
    });
  }
  
  // Add primary_image if it exists (might duplicate, but Set handles it)
  // Handle both object and string formats
  if (product.primary_image) {
    const normalized = normalizeImage(product.primary_image);
    if (normalized && normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined') {
      imageSet.add(normalized);
    }
  }
  
  // Add fallback single image fields
  if (product.image_url) {
    const normalized = normalizeImage(product.image_url);
    if (normalized && normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined') {
      imageSet.add(normalized);
    }
  }
  if (product.image) {
    const normalized = normalizeImage(product.image);
    if (normalized && normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined') {
      imageSet.add(normalized);
    }
  }

  // Convert Set to Array - preserve order by processing images array first
  const productImages = Array.from(imageSet);
  
  // Debug: Log final images (remove after debugging)
  // Uncomment to debug image issues:
  // console.log('Final productImages:', productImages);

  const mainImage =
    productImages[0] ||
    'https://via.placeholder.com/500x600';

  /* -------------------------------
        PRODUCT TYPE DETECTION
     ------------------------------- */
  const getProductType = () => {
    const categoryName = product.category?.name?.toLowerCase() || '';
    const categorySlug = product.category?.slug?.toLowerCase() || '';

    if (
      categoryName.includes('shoe') ||
      categoryName.includes('sneaker') ||
      categoryName.includes('footwear') ||
      categorySlug.includes('shoe') ||
      categorySlug.includes('sneaker') ||
      categorySlug.includes('footwear')
    ) {
      return 'shoes';
    }

    if (
      categoryName.includes('accessor') ||
      categoryName.includes('hat') ||
      categoryName.includes('bag') ||
      categoryName.includes('cap') ||
      categorySlug.includes('accessor') ||
      categorySlug.includes('hat') ||
      categorySlug.includes('bag') ||
      categorySlug.includes('cap')
    ) {
      return 'accessories';
    }

    return 'clothing';
  };

  const productType = getProductType();

  /* -------------------------------
                SIZES
     ------------------------------- */
  const generateSizes = () => {
    if (productType === 'shoes') {
      const sizes = [];
      for (let size = 3; size <= 15; size += 0.5) {
        const formatted = Number.isInteger(size)
          ? `${size}`
          : size.toFixed(1).replace('.0', '');
        sizes.push(formatted);
      }
      return sizes;
    } else if (productType === 'clothing') {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    } else {
      return ['One Size', 'Small', 'Medium', 'Large'];
    }
  };

  const baseSizes = generateSizes();

  const formatSizeKey = (value) => {
    const numeric = parseFloat(value);
    return Number.isNaN(numeric) ? value.toString() : numeric.toString();
  };

  const variantMap = new Map(
    (product.variants || []).map((variant) => {
      const key = formatSizeKey(variant.size);
      return [key, variant];
    })
  );

  const sizes = baseSizes.map((size) => {
    const key = formatSizeKey(size);
    const variant = variantMap.get(key);
    const stock = variant?.stock_quantity || 0;
    return {
      size,
      available: Boolean(variant) && stock > 0,
      stock,
      variantId: variant?.id || null,
    };
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);

  const handleSizeChange = (size, available) => {
    if (!available) return;
    setSelectedSize(size === selectedSize ? null : size);
  };

  const isSizeRequired = productType === 'shoes' || productType === 'clothing';
  const isAddToCartEnabled = productType === 'accessories' || selectedSize !== null;

  const handleAddToCart = () => {
    if (isSizeRequired && !selectedSize) return;

    if (productType === 'accessories') {
      const firstVariant = product.variants?.[0];
      onAddToCart(product, 'One Size', quantity, firstVariant?.id);
    } else {
      const selectedVariant = sizes.find((s) => s.size === selectedSize);
      if (!selectedVariant?.variantId) return;
      onAddToCart(product, selectedSize, quantity, selectedVariant.variantId);
    }
  };

  /* -----------------------------
        RENDER START
     ----------------------------- */
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
            className="size-selection-modal"
          >
            <div className="modal-header">
              <h2>{product.name}</h2>
              <button className="close-button" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="modal-content">
              {/* MAIN IMAGE */}
              <div className="product-image-top">
                <img
                  src={productImages.length > 0 ? (productImages[selectedImageIndex] || productImages[0]) : mainImage}
                  alt={product.name}
                  className="product-main-image"
                />

                {/* SCROLL IMAGES */}
                {productImages.length > 0 && (
                  <div className="product-images-scroll">
                    <div className="product-images-container">
                      {productImages.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${product.name} - ${index + 1}`}
                          className={`product-scroll-image ${selectedImageIndex === index ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.target.src = 'https://via.placeholder.com/120x150?text=Image';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRICE */}
              <div className="price-section">
                <div className="price">{formatPrice(product.price)}</div>
                {product.description ? (
                  <div className="product-description">{product.description}</div>
                ) : (
                  <div className="price-note">Price incl. VAT and duties</div>
                )}
                <button className="view-details-link" onClick={onClose}>
                  View details
                </button>
              </div>

              {/* SIZE INFO */}
              <div className="size-info">
                <p>Sizes shown are standard</p>
              </div>

              {/* SIZE SELECT */}
              <div className="size-selection">
                <p className="size-selection-label">Select size</p>

                <div
                  className={`size-list ${
                    productType === 'shoes' ? 'size-list-grid' : ''
                  }`}
                >
                  {sizes.map((sizeOption, index) => (
                    <label
                      key={index}
                      className={`size-checkbox-item ${
                        !sizeOption.available ? 'unavailable' : ''
                      } ${selectedSize === sizeOption.size ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSize === sizeOption.size}
                        onChange={() =>
                          handleSizeChange(sizeOption.size, sizeOption.available)
                        }
                        disabled={!sizeOption.available}
                        className="size-checkbox"
                      />
                      <span className="size-label">{sizeOption.size}</span>

                      {sizeOption.stock > 0 &&
                        sizeOption.stock < 5 &&
                        sizeOption.available && (
                          <span className="stock-warning">Few items left</span>
                        )}

                      {!sizeOption.available && (
                        <button
                          className="notify-me-button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <FiBell /> Notify me
                        </button>
                      )}
                    </label>
                  ))}
                </div>

                {productType !== 'accessories' && (
                  <button className="size-chart-link" onClick={onSizeChartOpen}>
                    <FiMaximize2 /> Size Chart
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={!isAddToCartEnabled}
              >
                ADD TO CART
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeSelectionModal;
