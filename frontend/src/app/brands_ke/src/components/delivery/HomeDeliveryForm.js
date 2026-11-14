import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { DELIVERY_PROVIDERS } from '../../constants/deliveryProviders';
import useDeliveryStore from '../../store/deliveryStore';
import './DeliveryForms.css';

const HomeDeliveryForm = ({ isExpanded, onToggle }) => {
  const {
    homeDelivery,
    updateHomeDeliveryForm,
    toggleApartmentField,
    selectHomeDeliveryProvider,
  } = useDeliveryStore();

  const requiredFields = [
    'firstName',
    'lastName',
    'address',
    'postcode',
    'city',
    'county',
    'phone',
    'email',
  ];

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

  const renderProviderOption = (provider, type) => {
    const isSelected = homeDelivery.selectedProvider === provider.id && 
                      homeDelivery.providerType === type;
    
    return (
      <label key={provider.id} className="delivery-provider-option">
        <input
          type="radio"
          name="delivery-provider"
          value={provider.id}
          checked={isSelected}
          onChange={() => selectHomeDeliveryProvider(provider.id, type)}
          className="provider-radio"
        />
        <div className="provider-info">
          <img src={provider.logo} alt={provider.name} className="provider-logo" />
          <span className="provider-name">{provider.name}</span>
        </div>
        <span className="provider-price">
          {provider.price === 0 ? 'Free' : `KES ${provider.price.toLocaleString()}`}
        </span>
      </label>
    );
  };

  return (
    <div className="delivery-option">
      <button
        className="delivery-option-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span>Home Delivery</span>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="delivery-option-content">
          <form className="delivery-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={homeDelivery.formData.firstName}
                  onChange={(e) => updateHomeDeliveryForm('firstName', e.target.value)}
                  className={!isFieldValid('firstName', homeDelivery.formData.firstName) ? 'invalid' : ''}
                />
              </div>
              
              <div className="form-group">
                <label>
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={homeDelivery.formData.lastName}
                  onChange={(e) => updateHomeDeliveryForm('lastName', e.target.value)}
                  className={!isFieldValid('lastName', homeDelivery.formData.lastName) ? 'invalid' : ''}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Delivery Address <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={homeDelivery.formData.address}
                onChange={(e) => updateHomeDeliveryForm('address', e.target.value)}
                className={!isFieldValid('address', homeDelivery.formData.address) ? 'invalid' : ''}
              />
            </div>
            
            {!homeDelivery.showApartment && (
              <button
                type="button"
                className="add-apartment-link"
                onClick={toggleApartmentField}
              >
                + Add apartment, suite, court etc.
              </button>
            )}
            
            {homeDelivery.showApartment && (
              <div className="form-group">
                <label>Apartment, suite, court etc.</label>
                <input
                  type="text"
                  value={homeDelivery.formData.apartment}
                  onChange={(e) => updateHomeDeliveryForm('apartment', e.target.value)}
                />
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  Postcode <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={homeDelivery.formData.postcode}
                  onChange={(e) => updateHomeDeliveryForm('postcode', e.target.value)}
                  className={!isFieldValid('postcode', homeDelivery.formData.postcode) ? 'invalid' : ''}
                />
              </div>
              
              <div className="form-group">
                <label>
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={homeDelivery.formData.city}
                  onChange={(e) => updateHomeDeliveryForm('city', e.target.value)}
                  className={!isFieldValid('city', homeDelivery.formData.city) ? 'invalid' : ''}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>
                County <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={homeDelivery.formData.county}
                onChange={(e) => updateHomeDeliveryForm('county', e.target.value)}
                className={!isFieldValid('county', homeDelivery.formData.county) ? 'invalid' : ''}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={homeDelivery.formData.phone}
                  onChange={(e) => updateHomeDeliveryForm('phone', e.target.value)}
                  className={!isFieldValid('phone', homeDelivery.formData.phone) ? 'invalid' : ''}
                />
              </div>
              
              <div className="form-group">
                <label>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={homeDelivery.formData.email}
                  onChange={(e) => updateHomeDeliveryForm('email', e.target.value)}
                  className={!isFieldValid('email', homeDelivery.formData.email) ? 'invalid' : ''}
                />
              </div>
            </div>
            
            <div className="service-provider-section">
              <h3 className="service-provider-heading">Choose your preferred Delivery Service Provider</h3>
              
              <div className="provider-type-section">
                <h4 className="provider-type-title">Express Delivery</h4>
                <p className="provider-type-subtitle">Same day delivery if ordered before 5pm</p>
                <div className="provider-list">
                  {DELIVERY_PROVIDERS.express.map(provider => 
                    renderProviderOption(provider, 'express')
                  )}
                </div>
              </div>
              
              <div className="provider-type-section">
                <h4 className="provider-type-title">Standard Service</h4>
                <p className="provider-type-subtitle">1-3 business days</p>
                <div className="provider-list">
                  {DELIVERY_PROVIDERS.standard.map(provider => 
                    renderProviderOption(provider, 'standard')
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HomeDeliveryForm;

