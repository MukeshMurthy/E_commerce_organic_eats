import React, { useEffect, useRef, useState } from 'react';
import './ShopPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaClipboardList, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from '../context/cartContext';
import CustomToast from '../components/toast/CustomToast';
import slide1 from '../assets/slides/slide1.jpg';
import slide2 from '../assets/slides/slide2.jpg';
import slide3 from '../assets/slides/slide3.jpg';
import slide4 from '../assets/slides/slide4.jpg';
import milets from '../assets/products/milets.jpg';

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toastRef = useRef();
  const { addToCart } = useCart();
  const slideInterval = useRef();

  // Get stored user data
  const storedUser = JSON.parse(localStorage.getItem('user'));
  
const handleAboutClick = () => {
  navigate('/#about');
};
  const slides = [
    { image: slide1, title: 'Slide 1' },
    { image: slide2, title: 'Slide 2' },
    { image: slide3, title: 'Slide 3' },
    { image: slide4, title: 'Slide 4' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        if (toastRef.current) {
          toastRef.current.showError('Failed to load products. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Separate useEffect for welcome message to ensure it runs after component is fully mounted
  useEffect(() => {
    const checkForWelcomeMessage = () => {
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      console.log('Checking welcome message:', { justLoggedIn, storedUser, toastRef: !!toastRef.current });
      
      if (justLoggedIn && storedUser && toastRef.current) {
        console.log('Showing welcome message for:', storedUser.name);
        toastRef.current.showSuccess(`Welcome back, ${storedUser.name}!`);
        sessionStorage.removeItem('justLoggedIn'); // Clear after showing once
      }
    };

    // Delay to ensure toast component is fully ready
    const timer = setTimeout(checkForWelcomeMessage, 500);
    
    return () => clearTimeout(timer);
  }, [storedUser]); // Run when storedUser changes

  // Slideshow auto-play effect
  useEffect(() => {
    if (slides.length > 1) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 4000);

      return () => {
        if (slideInterval.current) {
          clearInterval(slideInterval.current);
        }
      };
    }
  }, [slides.length]);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    sessionStorage.removeItem('justLoggedIn');
    setShowProfile(false);
    
    if (toastRef.current) {
      toastRef.current.showInfo('You have been logged out successfully.');
    }
    
    // Redirect to home page
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleSlideNavigation = (direction) => {
    // Clear existing interval
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }

    // Update slide
    if (direction === 'next') {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    } else {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    }

    // Restart interval
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
  };

  const goToSlide = (index) => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    
    setCurrentSlide(index);
    
    // Restart interval
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    
    if (!storedUser) {
      if (toastRef.current) {
        toastRef.current.showWarning('Please login to add items to cart.');
      }
      return;
    }

    try {
      addToCart(storedUser.id, product);
      if (toastRef.current) {
        toastRef.current.showSuccess(`${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (toastRef.current) {
        toastRef.current.showError('Failed to add item to cart. Please try again.');
      }
    }
  };

  const handleProfileToggle = () => {
    setShowProfile(prev => !prev);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-icon-container')) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  return (
    <div className="shop-wrapper">
      <CustomToast ref={toastRef} />

      {/* Header */}
      <header className="shop-header">
        <nav className="nav-left">
          <button className="nav-btn" onClick={() => navigate('/')}>HOME</button>
          <button className="nav-btn" onClick={handleAboutClick}>ABOUT</button>
          <span className="nav-btn active">SHOP</span>
        </nav>

        <div className="brand">Organic Eats</div>

        <nav className="nav-right">
          <div className="profile-icon-container" onClick={handleProfileToggle}>
            <FaUser className="nav-icon" />
            {showProfile && storedUser && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <p className="profile-name"><strong>{storedUser.name}</strong></p>
                  <p className="profile-email">{storedUser.email}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>

          <FaClipboardList 
            className="nav-icon" 
            onClick={() => navigate('/orders')} 
            title="Your Orders" 
          />
          
          <div className="cart-badge" onClick={() => navigate('/cart')}>
            <FaShoppingCart />
          </div>
        </nav>
      </header>

      {/* Body */}
      <div className="shop-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <ul className="category-list">
              <li className="category-item" onClick={() => setSearchTerm('Pickle')}>
                Pickle
              </li>
              <li className="category-item" onClick={() => setSearchTerm('brown rice')}>
                Brown Rice
              </li>
              <li className="category-item" onClick={() => setSearchTerm('brown sugar')}>
                Brown Sugar
              </li>
              <li className="category-item" onClick={() => setSearchTerm('')}>
                All Products
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h4>Search</h4>
            <div className="search-container">
              <input
                type="text"
                placeholder="Type to start searching..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Coming Soon</h4>
            <div className="featured-card">
              <div className="featured-image">
                <img src={milets} alt="milets" />
              </div>
              <div className="featured-content">
                <button className="shop-now-btn" disabled>
                  Available on 10/10/2025
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Slideshow */}
          <div className="slideshow-container">
            <div className="slideshow-wrapper">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`slide ${index === currentSlide ? 'active' : ''}`}
                >
                  <img src={slide.image} alt={slide.title} className="slide-image" />
                </div>
              ))}

              <button 
                className="slide-nav prev" 
                onClick={() => handleSlideNavigation('prev')}
                aria-label="Previous slide"
              >
                <FaChevronLeft />
              </button>
              <button 
                className="slide-nav next" 
                onClick={() => handleSlideNavigation('next')}
                aria-label="Next slide"
              >
                <FaChevronRight />
              </button>

              <div className="slide-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="products-section">
            <div className="products-header">
              <h2>Our Products</h2>
              {searchTerm && (
                <p className="search-results">
                  Showing {filteredProducts.length} results for "{searchTerm}"
                </p>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found {searchTerm && `for "${searchTerm}"`}</p>
                {searchTerm && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    Show All Products
                  </button>
                )}
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <div
                    className="product-card"
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="product-image">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg'; // Add fallback image
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-price">₹{Number(product.price).toFixed(2)}</p>
                      {product.original_price && product.original_price > product.price && (
                        <p className="product-original-price">
                          ₹{Number(product.original_price).toFixed(2)}
                        </p>
                      )}
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        Add To Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bottom-features">
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <strong>CO2 Neutral Plastic Free</strong><br /> Shipping
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <strong>Free Delivery On Domestic</strong><br /> Orders Over ₹500
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <strong>100% Premium Locally</strong><br /> Sourced Organic Shop
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <div className="feature-text">
            <strong>Support Small Local</strong><br /> Business & Brands
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ShopPage;