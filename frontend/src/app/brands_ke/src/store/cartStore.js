import { create } from 'zustand';
import api from '../config/api';

// Helper functions for localStorage guest cart
const getGuestCart = () => {
  try {
    const cart = localStorage.getItem('guest_cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

const getGuestCartCount = () => {
  const cart = getGuestCart();
  return cart.reduce((total, item) => total + (item.quantity || 1), 0);
};

const useCartStore = create((set, get) => ({
  itemCount: 0,
  isLoading: false,

  // Fetch cart count from API (authenticated) or localStorage (guest)
  fetchCartCount: async () => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // Authenticated user - fetch from API
      try {
        const response = await api.get('/cart/summary/');
        set({ itemCount: response.data.item_count || 0 });
      } catch (error) {
        console.error('Error fetching cart count:', error);
        // Fallback to guest cart if API fails
        const count = getGuestCartCount();
        set({ itemCount: count });
      }
    } else {
      // Guest user - get from localStorage
      const count = getGuestCartCount();
      set({ itemCount: count });
    }
  },

  // Add item to cart (works for both authenticated and guest users)
  addToCart: async (productId, variantId, quantity = 1, productData = null) => {
    set({ isLoading: true });
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // Authenticated user - use API
      try {
        await api.post('/cart/', {
          product_id: productId,
          variant_id: variantId,
          quantity,
        });
        // Refresh cart count
        await get().fetchCartCount();
        set({ isLoading: false });
        return { success: true };
      } catch (error) {
        set({ isLoading: false });
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message || 
                            error.response?.data?.detail ||
                            'Failed to add item to cart';
        return {
          success: false,
          error: errorMessage,
        };
      }
    } else {
      // Guest user - use localStorage
      try {
        const cart = getGuestCart();
        const existingItemIndex = cart.findIndex(
          item => item.product_id === productId && item.variant_id === variantId
        );
        
        if (existingItemIndex >= 0) {
          // Update quantity if item already exists
          cart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          cart.push({
            product_id: productId,
            variant_id: variantId,
            quantity,
            product: productData, // Store product data for display
            added_at: new Date().toISOString(),
          });
        }
        
        saveGuestCart(cart);
        // Update cart count
        await get().fetchCartCount();
        set({ isLoading: false });
        return { success: true };
      } catch (error) {
        set({ isLoading: false });
        return {
          success: false,
          error: 'Failed to add item to cart',
        };
      }
    }
  },

  // Get guest cart items
  getGuestCart: () => {
    return getGuestCart();
  },

  // Clear guest cart
  clearGuestCart: () => {
    localStorage.removeItem('guest_cart');
    set({ itemCount: 0 });
  },

  // Initialize cart count on mount
  init: async () => {
    await get().fetchCartCount();
  },
}));

export default useCartStore;

