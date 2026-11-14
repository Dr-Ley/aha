import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './Newsletter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // TODO: Implement newsletter subscription API call
    toast.success('Thank you for subscribing! Check your email for exclusive discounts.');
    setEmail('');
  };

  return (
    <section className="newsletter">
      <div className="newsletter-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="newsletter-content"
        >
          <h2 className="newsletter-title">BRANDS KE Newsletter</h2>
          <p className="newsletter-description">
            <strong>Limited time sale!</strong> Sign up now to get an{' '}
            <strong>extra discount</strong> on your first purchase. Don't miss out on exclusive
            deals and flash sales from your favorite brands.
          </p>
          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-button">
              SUBSCRIBE NOW
            </button>
          </form>
          <p className="newsletter-note">
            By subscribing, you agree to receive marketing emails from BRANDS KE.
            You can unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;

