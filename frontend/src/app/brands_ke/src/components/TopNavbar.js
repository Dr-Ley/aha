import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useCartDrawerStore from '../store/cartDrawerStore';
import './TopNavbar.css';

const TopNavbar = ({ isVisible, activeBrand }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { isAuthenticated, logout } = useAuthStore();
  const { itemCount, fetchCartCount } = useCartStore();
  const { isOpen: isCartOpen, toggleCartDrawer, closeCartDrawer } = useCartDrawerStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentBrandSlug = activeBrand || searchParams.get('brand');

  useEffect(() => {
    fetchCartCount();
  }, [isAuthenticated, fetchCartCount]);

  // Fetch brands to get logo info
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/products/brands/');
        const data = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
          ? response.data
          : [];
        setBrands(data);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  const activeBrandObj = useMemo(() => {
    if (!currentBrandSlug) return null;
    return brands.find(
      (b) =>
        b.slug === currentBrandSlug ||
        b.id === currentBrandSlug ||
        b.name?.toLowerCase().replace(/\s+/g, '-') === currentBrandSlug
    );
  }, [brands, currentBrandSlug]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsExpanded(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsExpanded(false);
  };

  const handleMenuToggle = () => {
    setIsExpanded(!isExpanded);
    setIsSearchOpen(false);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    logout();
    setIsExpanded(false);
    navigate('/login');
  };

  if (!isVisible) return null;

  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      exit={{ y: -60 }}
      transition={{ duration: 0.3 }}
      className={`top-navbar ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="top-navbar-container">

        {/* Hamburger Menu */}
        <motion.button
          className="menu-toggle"
          onClick={handleMenuToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
            {isExpanded ? <FiX /> : <FiMenu />}
          </motion.div>
        </motion.button>

        {/* Active Brand Logo in center */}
        {activeBrandObj && activeBrandObj.logo && (
          <div className="top-navbar-brand-logo">
            <img
              src={activeBrandObj.logo}
              alt={activeBrandObj.name}
              className="brand-logo-circle"
            />
          </div>
        )}

        {/* Right Icons */}
        <div className="top-navbar-actions">
          <button className="nav-icon" onClick={handleSearchIconClick}><FiSearch /></button>
          <Link to={isAuthenticated ? '/profile' : '/login'} className="nav-icon"><FiUser /></Link>
          <button 
            className="nav-icon cart-icon-wrapper"
            onClick={toggleCartDrawer}
            aria-label={isCartOpen ? 'Close cart' : 'Open cart'}
          >
            {isCartOpen ? <FiX /> : <FiShoppingCart />}
            {!isCartOpen && itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="search-overlay"
          >
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-expanded"
                autoFocus
              />
              <button type="submit" className="search-submit"><FiSearch /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {/* EXPANDED MENU */}
{/* EXPANDED MENU */}
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="expanded-menu"
    >
      <div className="expanded-menu-content">

        {/* Expanded Logo */}
        <div className="expanded-logo">
          <img src={activeBrandObj?.logo || 'https://i.pinimg.com/1200x/8e/a6/67/8ea6676fe165e724b9621aa7544b6fd9.jpg'} alt={activeBrandObj?.name || 'Brand'} />
          <span>{activeBrandObj?.name || 'BRANDS KE'}</span>
        </div>

        {/* Dropdown Sections */}
        <div className="dropdown-sections">
          {/* Brands Dropdown */}
          <div className="dropdown-section">
            <button
              className={`topnav-dropdown-toggle ${openDropdown === 'brands' ? 'open' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
            >
              <span>Brands</span>
              <FiChevronDown />
            </button>
            <span className="topnav-dropdown-underline" />
            <AnimatePresence>
              {openDropdown === 'brands' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="topnav-dropdown-list"
                >
                  {brands.slice(0, 5).map((brand) => (
                    <li key={brand.id}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/products?brand=${brand.slug}`);
                          setIsExpanded(false);
                        }}
                      >
                        {brand.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Example: Men Dropdown */}
          <div className="dropdown-section">
            <button
              className={`topnav-dropdown-toggle ${openDropdown === 'men' ? 'open' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'men' ? null : 'men')}
            >
              <span>Men</span>
              <FiChevronDown />
            </button>
            <span className="topnav-dropdown-underline" />
            <AnimatePresence>
              {openDropdown === 'men' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="topnav-dropdown-list"
                >
                  {['Sneakers', 'Apparel', 'Accessories', 'Grooming', 'Athleisure'].map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/products?category=${item.toLowerCase()}`);
                          setIsExpanded(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Example: Women Dropdown */}
          <div className="dropdown-section">
            <button
              className={`topnav-dropdown-toggle ${openDropdown === 'women' ? 'open' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'women' ? null : 'women')}
            >
              <span>Women</span>
              <FiChevronDown />
            </button>
            <span className="topnav-dropdown-underline" />
            <AnimatePresence>
              {openDropdown === 'women' && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="topnav-dropdown-list"
                >
                  {['Sneakers', 'Dresses', 'Accessories', 'Beauty', 'Athleisure'].map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/products?category=${item.toLowerCase()}`);
                          setIsExpanded(false);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Links */}
        <div className="expanded-quick-links">
          <button className="quick-link" onClick={() => { navigate('/favorites'); setIsExpanded(false); }}>Favorites</button>
          <button className="quick-link" onClick={() => { navigate('/contact'); setIsExpanded(false); }}>Contact & Service</button>
          <button className="quick-link" onClick={() => { navigate('/language'); setIsExpanded(false); }}>Language KE (KES)</button>
          <button className="quick-link" onClick={() => { navigate('/stores'); setIsExpanded(false); }}>Store Locator</button>
          {isAuthenticated && (
            <button className="quick-link" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
    </motion.nav>
  );
};

export default TopNavbar;
