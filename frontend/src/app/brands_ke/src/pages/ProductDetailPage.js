import React from 'react';
import { useParams } from 'react-router-dom';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { slug } = useParams();
  
  return (
    <div className="product-detail-page">
      <h1>Product Detail</h1>
      <p>Product: {slug}</p>
      <p>Product details will appear here</p>
    </div>
  );
};

export default ProductDetailPage;

