import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useCartDrawerStore from '../store/cartDrawerStore';
import useDeliveryStore from '../store/deliveryStore';
import { isCheckoutEnabled } from '../utils/deliveryUtils';
import DeliveryOptions from './delivery/DeliveryOptions';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isOpen, closeCartDrawer } = useCartDrawerStore();
  const { isAuthenticated } = useAuthStore();
  const { fetchCartCount } = useCartStore();
  const deliveryState = useDeliveryStore();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ subtotal: 0, delivery_fee: 0, total: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen]);

  // Update summary when delivery fee changes
  useEffect(() => {
    if (cartItems.length > 0) {
      calculateSummary(cartItems);
    }
  }, [deliveryState.homeDelivery.selectedProvider, deliveryState.homeDelivery.providerType, cartItems.length]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        // Authenticated user - fetch from API
        const [itemsResponse, summaryResponse] = await Promise.all([
          api.get('/cart/'),
          api.get('/cart/summary/').catch(() => null)
        ]);
        
        setCartItems(itemsResponse.data || []);
        if (summaryResponse) {
          setSummary({
            subtotal: parseFloat(summaryResponse.data.subtotal || 0),
            delivery_fee: parseFloat(summaryResponse.data.delivery_fee || 200),
            total: parseFloat(summaryResponse.data.total || 0)
          });
        } else {
          calculateSummary(itemsResponse.data || []);
        }
      } else {
        // Guest user - get from localStorage
        const guestCart = useCartStore.getState().getGuestCart();
        // Transform guest cart items to match API structure
        const formattedCart = guestCart.map(item => ({
          id: `${item.product_id}-${item.variant_id}`,
          quantity: item.quantity || 1,
          product: item.product || {},
          variant: item.variant || {}
        }));
        setCartItems(formattedCart);
        calculateSummary(formattedCart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items) => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.product?.price || item.product?.final_price || item.product?.discounted_price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
    
    // Get delivery fee from delivery store
    const deliveryFee = deliveryState.getDeliveryFee();
    
    setSummary({
      subtotal,
      delivery_fee: deliveryFee,
      total: subtotal + deliveryFee
    });
  };

  // Update summary when delivery fee changes
  useEffect(() => {
    if (cartItems.length > 0) {
      calculateSummary(cartItems);
    }
  }, [deliveryState.homeDelivery.selectedProvider, deliveryState.homeDelivery.providerType, cartItems]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await api.patch(`/cart/${itemId}/`, { quantity: newQuantity });
      } else {
        // Update guest cart
        const cart = useCartStore.getState().getGuestCart();
        const itemIndex = cart.findIndex(item => {
          const currentId = `${item.product_id}-${item.variant_id}`;
          return currentId === itemId || item.id === itemId;
        });
        if (itemIndex >= 0) {
          cart[itemIndex].quantity = newQuantity;
          localStorage.setItem('guest_cart', JSON.stringify(cart));
        }
      }
      
      await fetchCartItems();
      await fetchCartCount();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await api.delete(`/cart/${itemId}/`);
      } else {
        // Remove from guest cart
        const cart = useCartStore.getState().getGuestCart();
        const filtered = cart.filter(item => {
          const currentId = `${item.product_id}-${item.variant_id}`;
          return currentId !== itemId && item.id !== itemId;
        });
        localStorage.setItem('guest_cart', JSON.stringify(filtered));
      }
      
      await fetchCartItems();
      await fetchCartCount();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductImage = (product) => {
    if (!product) return '';
    return product.primary_image?.image_url || 
           product.images?.[0]?.image_url || 
           product.image_url || 
           product.image || 
           '';
  };

  const handleCheckout = () => {
    closeCartDrawer();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeCartDrawer();
    navigate('/cart');
  };

  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const itemCount = getItemCount();
  const needsMoreItems = itemCount > 0 && itemCount < 3;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cart-drawer-overlay"
            onClick={closeCartDrawer}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="cart-drawer"
          >
            <div className="cart-drawer-header">
              <h2>MY SHOPPING CART</h2>
              <button className="cart-drawer-close" onClick={closeCartDrawer}>
                <FiX />
              </button>
            </div>

            {/* Info Banners */}
            {itemCount > 0 && (
            <div className="cart-info-banners">
              <div className="cart-info-banner stock-banner">
                <svg className="banner-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                <span>Limited time deal. Order before your items are out of stock!</span>
              </div>
              {needsMoreItems && (
                <div className="cart-info-banner discount-banner">
                  <svg className="banner-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                  </svg>
                  <span>Buy {3 - itemCount} more to get Free Shipping</span>
                </div>
              )}
            </div>
            )}
            <div className="cart-drawer-content">
              {loading ? (
                <div className="cart-loading">Loading cart...</div>
              ) : cartItems.length === 0 ? (
                <div className="cart-empty">
                  <p>Your cart is empty</p>
                  <Link to="/products" onClick={closeCartDrawer} className="cart-empty-link">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cartItems.map((item) => {
                    const product = item.product || item;
                    const variant = item.variant;
                    const imageUrl = getProductImage(product);
                    const price = product.price || product.final_price || product.discounted_price || 0;
                    const itemId = item.id || `${product.id}-${variant?.id || 'no-variant'}`;

                    return (
                      <div key={itemId} className="cart-item">
                        <div className="cart-item-image">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.name} />
                          ) : (
                            <div className="cart-item-placeholder">No Image</div>
                          )}
                        </div>
                        
                        <div className="cart-item-details">
                          <div className="cart-item-brand">{product.brand?.name || ''}</div>
                          <div className="cart-item-name">{product.name}</div>
                          {variant && (
                            <div className="cart-item-variant">
                              {variant.size && <span>Size: {variant.size}</span>}
                              {variant.color && <span>Color: {variant.color}</span>}
                            </div>
                          )}
                          <div className="cart-item-price">{formatPrice(price)}</div>
                        </div>

                        <div className="cart-item-actions">
                          <div className="cart-item-quantity">
                            <button 
                              onClick={() => updateQuantity(itemId, (item.quantity || 1) - 1)}
                              className="quantity-btn"
                            >
                              <FiMinus />
                            </button>
                            <span className="quantity-value">{item.quantity || 1}</span>
                            <button 
                              onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}
                              className="quantity-btn"
                            >
                              <FiPlus />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeItem(itemId)}
                            className="cart-item-remove"
                            aria-label="Remove item"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Delivery Options Section */}
              {cartItems.length > 0 && <DeliveryOptions cartItems={cartItems} />}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                {deliveryState.selectedType === 'home' && deliveryState.homeDelivery.selectedProvider && (
                  <div className="cart-delivery-fee">
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryState.getDeliveryFee() === 0 
                        ? 'Free' 
                        : formatPrice(deliveryState.getDeliveryFee())}
                    </span>
                  </div>
                )}
                <div className="cart-total">
                  <span>Total</span>
                  <span>{formatPrice(summary.total)}</span>
                </div>
                <button 
                  className="cart-checkout-btn" 
                  onClick={handleCheckout}
                  disabled={!isCheckoutEnabled(deliveryState, cartItems)}
                >
                  CHECKOUT
                </button>
                {/* <button className="cart-view-cart-btn" onClick={handleViewCart}>
                  VIEW FULL CART
                </button> */}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

