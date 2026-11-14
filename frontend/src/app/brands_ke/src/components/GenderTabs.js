import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './GenderTabs.css';

const GenderTabs = ({ activeGender, onGenderChange }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleGenderClick = (gender) => {
    const params = new URLSearchParams(searchParams);
    
    if (gender === 'him') {
      // HIM → Adidas products (men + unisex)
      params.set('brand', 'adidas');
      params.set('gender', 'men');
    } else if (gender === 'her') {
      // HER → Nike products (women + unisex)
      params.set('brand', 'nike');
      params.set('gender', 'women');
    }
    
    navigate(`/products?${params.toString()}`);
    if (onGenderChange) {
      onGenderChange(gender);
    }
  };

  return (
    <div className="gender-tabs">
      <button
        className={`gender-tab ${activeGender === 'him' ? 'active' : ''}`}
        onClick={() => handleGenderClick('him')}
      >
        HIM
      </button>
      <button
        className={`gender-tab ${activeGender === 'her' ? 'active' : ''}`}
        onClick={() => handleGenderClick('her')}
      >
        HER
      </button>
    </div>
  );
};

export default GenderTabs;

