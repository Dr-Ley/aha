import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import api from '../config/api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import AnnouncementBanner from '../components/AnnouncementBanner';
import FlashSaleCountdown from '../components/FlashSaleCountdown';
import TopNavbar from '../components/TopNavbar';
import ContentTile from '../components/ContentTile';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import YouMayAlsoLike from '../components/YouMayAlsoLike';
import './CartPage.css';

const CartPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchCartCount } = useCartStore();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ subtotal: 0, delivery_fee: 200, total: 0 });

  useEffect(() => {
    fetchCartItems();
  }, []);

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
    const deliveryFee = 200;
    setSummary({
      subtotal,
      delivery_fee: deliveryFee,
      total: subtotal + deliveryFee
    });
  };

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
    navigate('/checkout');
  };

  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const itemCount = getItemCount();
  const needsMoreItems = itemCount > 0 && itemCount < 3;

  return (
    <div className="cart-page">
      <AnnouncementBanner />
      <FlashSaleCountdown />
      <TopNavbar isVisible={true} />

      <main className="cart-page-content">
        <div className="cart-container">
          <div className="cart-header">
            <h1>CART</h1>
          </div>

          {/* Info Banners */}
          {itemCount > 0 && (
            <div className="cart-info-banners">
            <div className="cart-info-banner stock-banner">
              <svg className="banner-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <span>Order before your items are out of stock!</span>
            </div>
            {needsMoreItems && (
              <div className="cart-info-banner discount-banner">
                <svg className="banner-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                </svg>
                <span>Buy {3 - itemCount} more to get 5% OFF</span>
              </div>
            )}
          </div>
          )}

          {loading ? (
            <div className="cart-loading">Loading cart...</div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <h2>Your cart is empty</h2>
              <p>Add items to your cart to continue shopping</p>
              <Link to="/products" className="cart-empty-button">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-content-wrapper">
              <div className="cart-items-section">
                {cartItems.map((item) => {
                  const product = item.product || item;
                  const variant = item.variant;
                  const imageUrl = getProductImage(product);
                  const price = product.price || product.final_price || product.discounted_price || 0;
                  const itemId = item.id || `${product.id}-${variant?.id || 'no-variant'}`;
                  const stock = variant?.stock_quantity || product.variants?.[0]?.stock_quantity || 0;

                  return (
                    <div key={itemId} className="cart-page-item">
                      <div className="cart-page-item-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} />
                        ) : (
                          <div className="cart-page-item-placeholder">No Image</div>
                        )}
                      </div>
                      
                      <div className="cart-page-item-details">
                        <div className="cart-page-item-brand">{product.brand?.name || ''}</div>
                        <h3 className="cart-page-item-name">{product.name}</h3>
                        {variant && (
                          <div className="cart-page-item-variant">
                            {variant.size && <span>Size: {variant.size}</span>}
                            {variant.color && <span>Color: {variant.color}</span>}
                          </div>
                        )}
                        
                        {stock > 0 && stock < 5 && (
                          <div className="cart-page-item-stock-warning">
                            Only {stock} left in stock now
                          </div>
                        )}

                        <div className="cart-page-item-price">
                          {product.discount_percentage > 0 ? (
                            <>
                              <span className="original-price">{formatPrice(product.original_price || product.price)}</span>
                              <span className="discounted-price">{formatPrice(price)}</span>
                            </>
                          ) : (
                            <span className="current-price">{formatPrice(price)}</span>
                          )}
                        </div>
                      </div>

                      <div className="cart-page-item-actions">
                        <div className="cart-page-item-quantity">
                          <select
                            value={item.quantity || 1}
                            onChange={(e) => updateQuantity(itemId, parseInt(e.target.value))}
                            className="quantity-select"
                          >
                            {[...Array(Math.min(10, stock || 10))].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={() => removeItem(itemId)}
                          className="cart-page-item-remove"
                          aria-label="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary-section">
                <div className="cart-summary-card">
                  <h2>Summary</h2>
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Delivery</span>
                    <span>{formatPrice(summary.delivery_fee)}</span>
                  </div>
                  <div className="cart-summary-total">
                    <span>Total</span>
                    <span>{formatPrice(summary.total)}</span>
                  </div>
                  <button className="cart-checkout-button" onClick={handleCheckout}>
                    CHECKOUT
                  </button>
                  <div className="express-checkout-section">
                    <p>Express checkout options</p>
                    <div className="express-checkout-buttons">
                      <button className="express-checkout-btn mpesa-btn">M-Pesa</button>
                      <button className="express-checkout-btn paypal-btn">PayPal</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* You May Also Like Section */}
        {cartItems.length > 0 && <YouMayAlsoLike cartItems={cartItems} />}
      </main>

      <ContentTile />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default CartPage;
