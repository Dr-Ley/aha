import React from 'react';
import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const navSections = [
    {
      heading: 'Customer Care',
      links: ['Contact & Service', 'Shipping & Delivery', 'Returns & Exchanges', 'FAQs'],
    },
    {
      heading: 'Shop',
      links: ['Men', 'Women', 'Kids', 'New Arrivals'],
    },
    {
      heading: 'About',
      links: ['Our Story', 'Careers', 'Store Locator', 'Sustainability'],
    },
  ];

  const socialLinks = [
    { icon: <FiInstagram />, label: 'Instagram', href: 'https://instagram.com' },
    { icon: <FiFacebook />, label: 'Facebook', href: 'https://facebook.com' },
    { icon: <FiTwitter />, label: 'Twitter', href: 'https://twitter.com' },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>Brands KE</h3>
          <p>
            Discover the best of global style curated for Kenya. Premium brands, unrivaled
            service, and weekly drops you can&apos;t miss.
          </p>
        </div>

        <div className="footer-links-grid">
          {navSections.map((section) => (
            <div key={section.heading} className="footer-links-section">
              <h4>{section.heading}</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={link}>
                    <button type="button">{link}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-social">
          <span>Follow us</span>
          <div className="footer-social-icons">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Brands KE. All rights reserved.</p>
        <div className="footer-bottom-links">
          <button type="button">Privacy Policy</button>
          <button type="button">Terms & Conditions</button>
          <button type="button">Language: KE (KES)</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

