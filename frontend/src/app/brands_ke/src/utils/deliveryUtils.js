import { DELIVERY_TYPES } from '../constants/deliveryProviders';

/**
 * Check if checkout should be enabled based on delivery selection
 * @param {Object} deliveryState - Current delivery store state
 * @param {Array} cartItems - Current cart items
 * @returns {boolean}
 */
export function isCheckoutEnabled(deliveryState, cartItems = []) {
  if (!deliveryState.selectedType) {
    return false;
  }

  if (deliveryState.selectedType === DELIVERY_TYPES.HOME) {
    // Home delivery: require service provider selection
    return !!deliveryState.homeDelivery.selectedProvider;
  }

  if (deliveryState.selectedType === DELIVERY_TYPES.COLLECTION) {
    // Collection point: require location selection
    return !!deliveryState.collectionPoint.selectedLocation;
  }

  if (deliveryState.selectedType === DELIVERY_TYPES.CLICK_COLLECT) {
    // Click & Collect: require store selection for each brand
    const uniqueBrands = getUniqueBrandsFromCart(cartItems);
    return uniqueBrands.every(brand => 
      deliveryState.clickCollect.selectedStores[brand.id]
    );
  }

  return false;
}

/**
 * Get unique brands from cart items
 * @param {Array} cartItems - Cart items
 * @returns {Array} Array of unique brand objects
 */
export function getUniqueBrandsFromCart(cartItems) {
  const brandsMap = new Map();
  cartItems.forEach((item) => {
    const product = item.product || item;
    const brand = product.brand;
    if (brand && !brandsMap.has(brand.id)) {
      brandsMap.set(brand.id, brand);
    }
  });
  return Array.from(brandsMap.values());
}

