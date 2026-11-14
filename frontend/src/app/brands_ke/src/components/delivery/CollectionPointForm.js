import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { debounce } from '../../utils/debounce';
import api from '../../config/api';
import useDeliveryStore from '../../store/deliveryStore';
import './DeliveryForms.css';

const CollectionPointForm = ({ isExpanded, onToggle }) => {
  const {
    collectionPoint,
    updateCollectionForm,
    setCollectionSearchQuery,
    setCollectionSearchResults,
    selectCollectionLocation,
  } = useDeliveryStore();

  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setCollectionSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search collection points/locations
        const response = await api.get(`/products/store-locations/?search=${encodeURIComponent(query)}`);
        const locations = Array.isArray(response.data?.results) 
          ? response.data.results 
          : Array.isArray(response.data) 
          ? response.data 
          : [];
        setCollectionSearchResults(locations.slice(0, 5)); // Top 5 results
      } catch (error) {
        console.error('Error searching collection points:', error);
        setCollectionSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(collectionPoint.searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [collectionPoint.searchQuery, debouncedSearch]);

  const handleSearch = () => {
    debouncedSearch(collectionPoint.searchQuery);
  };

  const handleLocationSelect = (location) => {
    selectCollectionLocation(location);
  };

  const requiredFields = ['firstName', 'lastName', 'phone', 'email'];

  const isFieldValid = (field, value) => {
    if (!requiredFields.includes(field)) return true;
    if (!value || value.trim() === '') return false;
    
    if (field === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    
    if (field === 'phone') {
      return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value);
    }
    
    return true;
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
          <div className="invoice-address-section">
          <div className="click-collect-info">
              <p>
                With Click & Collect you can easily ship your order to your preferred store. 
                Our Store teams are available to support Collections with reduced working hours. 
                The Store team will contact you when the parcel is ready for collection to discuss 
                a day and time which suits you.
              </p>
            </div>
            <h3 className="section-heading">Invoice Address</h3>
              <form className="delivery-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      First Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={collectionPoint.formData.firstName}
                      onChange={(e) => updateCollectionForm('firstName', e.target.value)}
                      className={!isFieldValid('firstName', collectionPoint.formData.firstName) ? 'invalid' : ''}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      Last Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={collectionPoint.formData.lastName}
                      onChange={(e) => updateCollectionForm('lastName', e.target.value)}
                      className={!isFieldValid('lastName', collectionPoint.formData.lastName) ? 'invalid' : ''}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={collectionPoint.formData.phone}
                      onChange={(e) => updateCollectionForm('phone', e.target.value)}
                      className={!isFieldValid('phone', collectionPoint.formData.phone) ? 'invalid' : ''}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={collectionPoint.formData.email}
                      onChange={(e) => updateCollectionForm('email', e.target.value)}
                      className={!isFieldValid('email', collectionPoint.formData.email) ? 'invalid' : ''}
                    />
                  </div>
                </div>
              </form>
          </div>
          
          <div className="collection-service-section">
            <h3 className="section-heading">Collection Points</h3>
            <div className="location-search-container">
              <input
                type="text"
                placeholder="Enter location..."
                value={collectionPoint.searchQuery}
                onChange={(e) => setCollectionSearchQuery(e.target.value)}
                className="location-search-input"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="location-search-button"
                disabled={isSearching}
              >
                <FiSearch />
              </button>
            </div>
            
            {collectionPoint.searchResults.length > 0 && (
              <div className="location-results">
                {collectionPoint.searchResults.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className={`location-result-item ${
                      collectionPoint.selectedLocation?.id === location.id ? 'selected' : ''
                    }`}
                  >
                    <div className="location-name">{location.name}</div>
                    <div className="location-address">
                      {location.address}, {location.city}, {location.county}
                    </div>
                    {location.phone && (
                      <div className="location-phone">{location.phone}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {collectionPoint.selectedLocation && (
              <div className="selected-location">
                <h4>Selected Location:</h4>
                <div className="location-details">
                  <strong>{collectionPoint.selectedLocation.name}</strong>
                  <p>{collectionPoint.selectedLocation.address}</p>
                  <p>{collectionPoint.selectedLocation.city}, {collectionPoint.selectedLocation.county}</p>
                  {collectionPoint.selectedLocation.phone && (
                    <p>Phone: {collectionPoint.selectedLocation.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPointForm;

