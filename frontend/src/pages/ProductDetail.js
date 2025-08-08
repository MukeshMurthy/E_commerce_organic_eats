import React, { useEffect, useState,useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ProductDetail.css';
import CustomToast from '../components/toast/CustomToast';
import { FaUser, FaHeart, FaShoppingCart, FaSearch, FaPlus, FaMinus, FaStar, FaTimes, FaChevronLeft, FaChevronRight, FaClipboard } from 'react-icons/fa';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  // ✅ create ref for toast

  const [quantity, setQuantity] = useState(() => {
    const savedQty = localStorage.getItem(`quantity_${id}`);
    return savedQty ? parseInt(savedQty) : 1;
  });

  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem(`option_${id}`) || 'Choose an option';
  });

  const [expandedSections, setExpandedSections] = useState({
    description: true,
    nutrition: false,
    delivery: false
  });
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const customToastRef = useRef(); 
  const Navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:5001/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => console.error('Error:', err));
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/reviews/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const handleQuantityChange = (change) => {
    const newQty = Math.max(1, quantity + change);
    setQuantity(newQty);
    localStorage.setItem(`quantity_${id}`, newQty);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getWeightMultiplier = () => {
    switch (selectedOption) {
      case '100g': return 1;
      case '250g': return 2.5;
      case '500g': return 5;
      case '1kg': return 10;
      default: return 0;
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = Number(product?.price || 0);
    const weightMultiplier = getWeightMultiplier();
    return (basePrice * weightMultiplier * quantity).toFixed(2);
  };

  const handleAddToCart = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
   if (!user) {
  customToastRef.current?.showWarn('Please login to add to cart.');
  return;
}
if (getWeightMultiplier() === 0) {
  customToastRef.current?.showWarn('Please select a valid weight option.');
  return;
}


    try {
      await axios.post('http://localhost:5001/api/cart', {
        user_id: user.id,
        product_id: product.id,
        quantity,
        weight: selectedOption
      });
     customToastRef.current?.showSuccess('Product added to cart!');

    } catch (err) {
      console.error('Failed to add to cart:', err);
    customToastRef.current?.showError('Failed to add to cart. Try again.');

    }
  };

  const handlePostReview = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
  customToastRef.current?.showWarn('Please login to post a review.');
  return;
}
if (!reviewText.trim()) {
  customToastRef.current?.showWarn('Please enter a review.');
  return;
}


    try {
      await axios.post('http://localhost:5001/api/reviews', {
        user_id: user.id,
        product_id: id,
        review_text: reviewText,
        rating: rating
      });
      setShowReviewModal(false);
      setReviewText('');
      setRating(5);
      fetchReviews();
      customToastRef.current?.showSuccess('Review posted successfully!');

    } catch (err) {
      console.error('Failed to post review:', err);
      customToastRef.current?.showSuccess('Failed to post review. Try again.');
    }
  };

  const nextReview = () => {
    if (reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }
  };

  const prevReview = () => {
    if (reviews.length > 0) {
      setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`star ${i < rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
        onClick={interactive ? () => onStarClick(i + 1) : undefined}
      />
    ));
  };

  if (!product) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="product-detail-wrapper">
          <CustomToast ref={customToastRef} />
      <header className="product-header">
        <nav className="nav-left">
          <button className="nav-btn" onClick={() => Navigate('/')}>HOME</button>
          <button className="nav-btn" onClick={() => Navigate('/orders')}>ORDERS</button>
          <button className="nav-btn" onClick={() => Navigate('/user/home')}>SHOP</button>
        </nav>
        <div className="brand">Organic Eats</div>
        <nav className="nav-right">
          <FaUser className="nav-icon" />
          <FaClipboard className="nav-icon"  onClick={()=>Navigate('/orders')}/>
          <div className="cart-badge">
            <FaShoppingCart />
            <button onClick={() => Navigate('/cart')}>₹{calculateTotalPrice()}</button>
          </div>
        </nav>
      </header>

      <div className="product-detail-container">
        <div className="product-info-left">
          <div className="product-title-section">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price-range">
              {getWeightMultiplier() === 0
                ? 'Select a quantity option'
                : `₹ ${calculateTotalPrice()}`}
            </div>
          </div>

          <div className="product-options">
            <div className="option-group">
              <label className="option-label">Amount</label>
              <select
                className="option-select"
                value={selectedOption}
                onChange={(e) => {
                  setSelectedOption(e.target.value);
                  localStorage.setItem(`option_${id}`, e.target.value);
                }}
              >
                <option>Choose an option</option>
                <option>100g</option>
                <option>250g</option>
                <option>500g</option>
                <option>1kg</option>
              </select>
            </div>

            <div className="quantity-section">
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <FaMinus size={12} />
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <button className="add-to-cart-main" onClick={handleAddToCart}>
                Add To Cart
              </button>
            </div>
          </div>

          <div className="breadcrumb">
            <span>Home</span> / <span>Fruit & Vegetables</span> / <span>{product.name}</span>
          </div>

          <div className="environmental-impact">
            <div className="impact-percentage">{product.calories} <small>kcal</small></div>
            <div className="impact-label">per 100g serving</div>
          </div>
        </div>

        <div className="product-image-center">
          <div className="image-container">
           <FaSearch className="zoom-icon" onClick={() => setShowImageModal(true)} />
  <img src={product.image_url} alt={product.name} />
          </div>
        </div>

        <div className="product-info-right">
          {['description', 'nutrition', 'delivery'].map(section => (
            <div className="info-section" key={section}>
              <div
                className="section-header"
                onClick={() => toggleSection(section)}
              >
                <span>{section === 'description' ? 'Description' :
                  section === 'nutrition' ? 'Nutrition Content' : 'Delivery Details'}</span>
                {expandedSections[section] ?
                  <FaMinus className="section-icon" /> :
                  <FaPlus className="section-icon" />}
              </div>
              <div className={`section-content ${expandedSections[section] ? 'expanded' : ''}`}>
                {section === 'description' && (
                  <p>{product.description || 'No description available.'}</p>
                )}
                {section === 'nutrition' && (
                  <>
                    <p>Rich in essential nutrients, vitamins, and minerals. Perfect for a healthy lifestyle.</p>
                    <ul>
                      <li>100% Organic</li>
                      <li>No artificial preservatives</li>
                      <li>Rich in fiber and nutrients</li>
                      <li>Sustainably sourced</li>
                    </ul>
                  </>
                )}
                {section === 'delivery' && (
                  <>
                    <p>It takes around 3-4 days to receive the product from ordered date.</p>
                    <ul>
                      <li>Standard delivery: 3-4 business days</li>
                      <li>Express delivery available</li>
                      <li>Free delivery on orders above ₹500</li>
                      <li>Secure packaging to maintain freshness</li>
                      <li>Track your order in real-time</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <button className="write-review-btn" onClick={() => setShowReviewModal(true)}>
            Write a Review
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="reviews-stack">
            <div className="review-navigation">
              <button 
                className="nav-arrow left" 
                onClick={prevReview}
                disabled={reviews.length <= 1}
              >
                <FaChevronLeft />
              </button>
              <span className="review-counter">
                {currentReviewIndex + 1} of {reviews.length}
              </span>
              <button 
                className="nav-arrow right" 
                onClick={nextReview}
                disabled={reviews.length <= 1}
              >
                <FaChevronRight />
              </button>
            </div>
            {showImageModal && (
  <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
    <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
      <img
        src={product.image_url}
        alt={product.name}
        className="zoomed-product-image"
      />
      <button className="close-zoom-btn" onClick={() => setShowImageModal(false)}>
        ×
      </button>
    </div>
  </div>
)}

            <div className="review-card">
        
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    <FaUser />
                  </div>
                  <div>
                    <div className="reviewer-name">
                      {reviews[currentReviewIndex]?.username || 'Anonymous'}
                    </div>
                    <div className="review-stars">
                      {renderStars(reviews[currentReviewIndex]?.rating || 5)}
                    </div>
                  </div>
                </div>
                <div className="review-date">
                  {new Date(reviews[currentReviewIndex]?.created_at).toLocaleDateString()}
                </div>
              
              <div className="review-text">
                {reviews[currentReviewIndex]?.review_text}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Write a Review</h3>
              <button 
                className="close-modal"
                onClick={() => setShowReviewModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="rating-section">
                <label>Rating:</label>
                <div className="star-rating">
                  {renderStars(rating, true, setRating)}
                </div>
              </div>
              
              <div className="review-input-section">
                <label>Your Review:</label>
                <textarea
                  className="review-textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-review-btn"
                onClick={handlePostReview}
              >
                Post Review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-features">
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
      </div>
    </div>
  );
}

export default ProductDetail;