import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { debounce } from '../../utils/debounce';
import api from '../../config/api';
import useDeliveryStore from '../../store/deliveryStore';
import './DeliveryForms.css';

const ClickCollectForm = ({ isExpanded, onToggle, cartItems = [] }) => {
  const {
    clickCollect,
    setClickCollectSearchQuery,
    setClickCollectSearchResults,
    selectStoreForBrand,
  } = useDeliveryStore();

  const [isSearching, setIsSearching] = useState(false);
  const [activeBrandSearch, setActiveBrandSearch] = useState(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Get unique brands from cart items
  const getUniqueBrands = () => {
    const brandsMap = new Map();
    cartItems.forEach((item) => {
      const product = item.product || item;
      const brand = product.brand;
      if (brand && !brandsMap.has(brand.id)) {
        brandsMap.set(brand.id, brand);
      }
    });
    return Array.from(brandsMap.values());
  };

  const uniqueBrands = getUniqueBrands();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, brandId) => {
      if (!query || query.trim().length < 2) {
        setClickCollectSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(
          `/products/store-locations/?search=${encodeURIComponent(query)}${brandId ? `&brand=${brandId}` : ''}`
        );
        const locations = Array.isArray(response.data?.results) 
          ? response.data.results 
          : Array.isArray(response.data) 
          ? response.data 
          : [];
        setClickCollectSearchResults(locations.slice(0, 5)); // Top 5 results
      } catch (error) {
        console.error('Error searching stores:', error);
        setClickCollectSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (activeBrandSearch) {
      debouncedSearch(clickCollect.searchQuery, activeBrandSearch);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [clickCollect.searchQuery, activeBrandSearch, debouncedSearch]);

  const handleStoreSelectClick = () => {
    setShowStoreSelector(true);
  };

  const handleBrandSearch = (brandId) => {
    setActiveBrandSearch(brandId);
    setClickCollectSearchQuery('');
    setClickCollectSearchResults([]);
  };

  const handleStoreSelect = (store) => {
    if (activeBrandSearch) {
      selectStoreForBrand(activeBrandSearch, store);
      setActiveBrandSearch(null);
      setClickCollectSearchQuery('');
      setClickCollectSearchResults([]);
    }
  };

  const getStoreForBrand = (brandId) => {
    return clickCollect.selectedStores[brandId] || null;
  };

  const allBrandsHaveStores = () => {
    return uniqueBrands.every(brand => clickCollect.selectedStores[brand.id]);
  };

  return (
    <div className="delivery-option">
      <button
        className="delivery-option-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span>Click & Collect</span>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="delivery-option-content">
          <div className="click-collect-info">
            <p>
              With Click & Collect you can easily ship your order to your preferred store. 
              Our Store teams are available to support Collections with reduced working hours. 
              The Store team will contact you when the parcel is ready for collection to discuss 
              a day and time which suits you.
            </p>
          </div>
          
          <button
            type="button"
            className="select-store-button"
            onClick={handleStoreSelectClick}
          >
            SELECT A STORE
          </button>
          
          {showStoreSelector && (
            <div className="store-selector">
              <div className="form-group">
                <label>Enter city, county or zipcode</label>
                <input
                  type="text"
                  value={clickCollect.searchQuery}
                  onChange={(e) => setClickCollectSearchQuery(e.target.value)}
                  placeholder="Search for a store..."
                  className="store-search-input"
                />
              </div>
              
              <div className="brand-stores-section">
                {uniqueBrands.map((brand) => {
                  const selectedStore = getStoreForBrand(brand.id);
                  
                  return (
                    <div key={brand.id} className="brand-store-item">
                      <button
                        type="button"
                        className="find-store-button"
                        onClick={() => handleBrandSearch(brand.id)}
                      >
                        Find {brand.name} Store
                      </button>
                      
                      {activeBrandSearch === brand.id && clickCollect.searchResults.length > 0 && (
                        <div className="store-suggestions">
                          {clickCollect.searchResults.map((store) => (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => handleStoreSelect(store)}
                              className="store-suggestion-item"
                            >
                              <div className="store-name">{store.name}</div>
                              <div className="store-address">
                                {store.address}, {store.city}, {store.county}
                              </div>
                              {store.phone && (
                                <div className="store-phone">{store.phone}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedStore && (
                        <div className="selected-store-details">
                          <h4>Selected {brand.name} Store:</h4>
                          <div className="store-location-details">
                            <strong>{selectedStore.name}</strong>
                            <p>{selectedStore.address}</p>
                            <p>{selectedStore.city}, {selectedStore.county}</p>
                            {selectedStore.phone && (
                              <p>Phone: {selectedStore.phone}</p>
                            )}
                            {selectedStore.email && (
                              <p>Email: {selectedStore.email}</p>
                            )}
                            <p className="collection-info">
                              You can collect your Click & Collect parcel quickly and easily from 
                              the store of your choice.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClickCollectForm;

