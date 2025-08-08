import React, { useState, useRef } from 'react';
import './Modal.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomToast from '../components/toast/CustomToast';

function LoginModal({ onClose, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toastRef = useRef();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      toastRef.current?.showError(firstError);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { 
        email, 
        password 
      });
      
      const { user } = res.data;

      if (!user || !user.id) {
        toastRef.current?.showError('Invalid response from server.');
        return;
      }

      // Save user info to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      toastRef.current?.showSuccess('Login successful!');

      // Navigate to dashboard based on role
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/home');
        } else {
          navigate('/user/home');
        }
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Invalid credentials. Please try again.';
      toastRef.current?.showError(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <>
      <CustomToast ref={toastRef} />
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
          
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Please sign in to your account</p>
          
          <form onSubmit={handleLogin} className="modal-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}
            
            <div className="input-group">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                className={errors.email ? 'input-error' : ''}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                className={errors.password ? 'input-error' : ''}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className={`modal-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="modal-footer">
            <p>
              Don't have an account? 
              <span className="link-btn" onClick={onSwitch}>
                Sign up here
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginModal;