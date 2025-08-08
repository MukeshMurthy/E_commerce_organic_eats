import React, { useState, useRef } from 'react';
import './Landingpage.css';
import { useNavigate } from 'react-router-dom';

import landingImage from '../assets/landing.png';
import fastDeliveryIcon from '../assets/delivery.png';
import easyReturnIcon from '../assets/return.png';
import trustedQualityIcon from '../assets/trusted.png';
import logoIcon from '../assets/organic.png';

import productIcon from '../assets/products.png';
import yearsIcon from '../assets/years.png';
import customersIcon from '../assets/customers.png';
import ordersIcon from '../assets/orders.png';

import LoginModal from './Login';
import SignupModal from './Signup';
import CustomToast from './toast/CustomToast'; // 🟢 Add this
import {  FaAddressBook, FaBell, FaHome, FaPhone  } from 'react-icons/fa';

function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();
  const aboutRef = useRef(null);
  const footerRef = useRef(null);
  const toastRef = useRef(); // 🟢 Toast reference

  const openLogin = () => {
    setShowLogin(true);
    setShowSignup(false);
  };

  const openSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
  };

  const closeModals = () => {
    setShowLogin(false);
    setShowSignup(false);
  };

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    toastRef.current.showInfo("Please login to continue.");
    openLogin();
  };

  return (
    <div className="landing-wrapper">
      {/* 🟢 Toast Component */}
      <CustomToast ref={toastRef} />

      <div className="landing-container">
        <img src={landingImage} alt="Landing" className="landing-image" />

        <div className="site-name">
          <img src={logoIcon} alt="Logo" className="logo-icon" />
          <span>Organic eats</span>
        </div>

        <div className="image-nav-links">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/user/home')}>Products</button>
          <button onClick={scrollToAbout}>About Us</button>
          <button onClick={scrollToFooter}>Contact Us</button>
        </div>

        <div className="landing-text">
          <h1>Goodness of Organic Food</h1>
          <p>
            Experience the natural taste and health benefits of organic brown rice, sugar,<br />
            and traditional pickles.
          </p>
          {/* 🟢 Updated button */}
          <button className="get-started-btn" onClick={handleGetStarted}>Get Started</button>

          <div className="subtext">
            <p><span className="arrow">→</span> 100% chemical-free & naturally grown ingredients</p>
            <p><span className="arrow">→</span> Traditional taste with modern convenience</p>
            <p><span className="arrow">→</span> Support local farmers and sustainable living</p>
            <p><span className="arrow">→</span> Make a healthy choice for your family</p>
            <p style={{ fontStyle: 'italic', marginTop: '10px' }}>
              "Fresh from nature — delivered to your doorstep"
            </p>
          </div>
        </div>
      </div>

      <div className="organic-quotes">
        <div className="quote-track">
          <div className="quote-slide">
            <blockquote>"Let food be thy medicine and medicine be thy food." – Hippocrates</blockquote>
            <blockquote>Eating organic isn’t a trend — it’s a return to tradition.</blockquote>
            <blockquote>Say goodbye to harmful chemicals and hello to real nutrition.</blockquote>
            <blockquote>Organic food supports sustainable farming and your wellbeing.</blockquote>
          </div>
          <div className="quote-slide">
            <blockquote>"Let food be thy medicine and medicine be thy food." – Hippocrates</blockquote>
            <blockquote>Eating organic isn’t a trend — it’s a return to tradition.</blockquote>
            <blockquote>Say goodbye to harmful chemicals and hello to real nutrition.</blockquote>
            <blockquote>Organic food supports sustainable farming and your wellbeing.</blockquote>
          </div>
        </div>
      </div>

      <div className="feature-section">
        <h2>Why Shop With Us?</h2>
        <div className="features">
          <div className="feature-card">
            <img src={fastDeliveryIcon} alt="Fast Delivery" />
            <p>Fast Delivery</p>
          </div>
          <div className="feature-card">
            <img src={easyReturnIcon} alt="Easy Return" />
            <p>Easy Return</p>
          </div>
          <div className="feature-card">
            <img src={trustedQualityIcon} alt="Trusted Quality" />
            <p>Trusted Quality</p>
          </div>
        </div>
      </div>

      <div ref={aboutRef} id="about"  className="about-section">
        <h2>About Us</h2>
        <div className="about-cards">
          <div className="about-card">
            <img src={productIcon} alt="Products" />
            <p>Authentic Organic Products<br /><strong>Pickles, Rice, Sugar & More</strong></p>
          </div>
          <div className="about-card">
            <img src={yearsIcon} alt="Years" />
            <p><strong>10+ Years</strong><br />Serving Organic Goodness</p>
          </div>
          <div className="about-card">
            <img src={customersIcon} alt="Customers" />
            <p><strong>5000+</strong><br />Happy Customers</p>
          </div>
          <div className="about-card">
            <img src={ordersIcon} alt="Orders" />
            <p><strong>20,000+</strong><br />Orders Delivered</p>
          </div>
        </div>
      </div>

      <footer className="footer" ref={footerRef}>
        <h3>Contact Us</h3>
        <p><FaBell/>Email: support@organiceats.com</p>
        <p><FaPhone/>Phone: +91 98765 43210</p>
        <p><FaHome/>Address: 123 Organic Street, Tamil Nadu, India</p>
      </footer>

      {/* Modals */}
      {showLogin && <LoginModal onClose={closeModals} onSwitch={openSignup} />}
      {showSignup && <SignupModal onClose={closeModals} onSwitch={openLogin} />}
    </div>
  );
}

export default LandingPage;
