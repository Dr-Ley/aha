import React from 'react';
import { FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useCartDrawerStore from '../store/cartDrawerStore';
import './AddToCartSuccessModal.css';

const AddToCartSuccessModal = ({ isOpen, onClose, product, selectedSize, selectedColor }) => {
  const navigate = useNavigate();
  const { openCartDrawer } = useCartDrawerStore();

  if (!isOpen || !product) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleShoppingCart = () => {
    onClose();
    openCartDrawer();
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleExpressCheckout = (method) => {
    onClose();
    if (method === 'mpesa') {
      navigate('/checkout?method=mpesa');
    } else if (method === 'paypal') {
      navigate('/checkout?method=paypal');
    }
  };

  const productImage = product.images?.[0]?.image_url || product.images?.[0] || product.image_url || product.image || '';
  const brandName = product.brand?.name || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="success-modal-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-modal-header">
              <h2>ADDED TO YOUR CART</h2>
              <button className="close-button" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <div className="success-modal-content">
              <div className="success-product-image-container">
                {productImage && (
                  <img
                    src={productImage}
                    alt={product.name}
                    className="success-product-image"
                  />
                )}
                {brandName && (
                  <div className="success-brand-logo">{brandName.toUpperCase()}</div>
                )}
              </div>

              <div className="success-product-details">
                <h3 className="success-product-name">{product.name}</h3>
                
                <div className="success-product-price">
                  {product.discount_percentage > 0 ? (
                    <>
                      <span className="original-price">{formatPrice(product.price)}</span>
                      <span className="discounted-price">
                        {formatPrice(product.discounted_price || product.price * (1 - product.discount_percentage / 100))}
                      </span>
                    </>
                  ) : (
                    <span className="current-price">{formatPrice(product.price)}</span>
                  )}
                </div>

                {selectedSize && (
                  <div className="success-product-info">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{selectedSize}</span>
                  </div>
                )}

                {selectedColor && (
                  <div className="success-product-info">
                    <span className="info-label">Colour:</span>
                    <span className="info-value">{selectedColor}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="success-modal-actions">
              <button className="shopping-cart-button" onClick={handleShoppingCart}>
                SHOPPING CART
              </button>
              <button className="checkout-button" onClick={handleCheckout}>
                CHECKOUT
              </button>
            </div>

            <div className="express-checkout-section">
              <p className="express-checkout-label">Express checkout options</p>
              <div className="express-checkout-buttons">
                <button
                  className="express-checkout-btn mpesa-btn"
                  onClick={() => handleExpressCheckout('mpesa')}
                >
                  M-Pesa
                </button>
                <button
                  className="express-checkout-btn paypal-btn"
                  onClick={() => handleExpressCheckout('paypal')}
                >
                  PayPal
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddToCartSuccessModal;

