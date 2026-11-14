import React, { useState } from 'react';
import { DELIVERY_TYPES } from '../../constants/deliveryProviders';
import useDeliveryStore from '../../store/deliveryStore';
import HomeDeliveryForm from './HomeDeliveryForm';
import CollectionPointForm from './CollectionPointForm';
import ClickCollectForm from './ClickCollectForm';
import './DeliveryForms.css';

const DeliveryOptions = ({ cartItems = [] }) => {
  const { selectedType, setSelectedType } = useDeliveryStore();
  const [expandedOption, setExpandedOption] = useState(null);

  const handleOptionToggle = (type) => {
    if (expandedOption === type) {
      setExpandedOption(null);
      setSelectedType(null);
    } else {
      setExpandedOption(type);
      setSelectedType(type);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="delivery-options-section">
      <h3 className="delivery-options-heading">Choose your preferred Delivery option</h3>
      <div className="delivery-options-list">
        <HomeDeliveryForm
          isExpanded={expandedOption === DELIVERY_TYPES.HOME}
          onToggle={() => handleOptionToggle(DELIVERY_TYPES.HOME)}
        />
        <CollectionPointForm
          isExpanded={expandedOption === DELIVERY_TYPES.COLLECTION}
          onToggle={() => handleOptionToggle(DELIVERY_TYPES.COLLECTION)}
        />
      </div>
    </div>
  );
};

export default DeliveryOptions;

