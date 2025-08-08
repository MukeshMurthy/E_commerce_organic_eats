import React, { useState, useRef } from 'react';
import './Modal.css';
import axios from 'axios';
import CustomToast from '../components/toast/CustomToast';

function SignupModal({ onClose, onSwitch }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [role] = useState('user');
  const toastRef = useRef();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepOneSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      toastRef.current?.showError(firstError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5001/api/auth/request-verification', {
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        role
      });

      setVerificationId(res.data.verificationId);
      toastRef.current?.showSuccess('Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      toastRef.current?.showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toastRef.current?.showError('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/verify-and-signup', {
        verificationId,
        code: verificationCode
      });

      toastRef.current?.showSuccess('Account created successfully!');
      setTimeout(() => {
        onSwitch();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      toastRef.current?.showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CustomToast ref={toastRef} />
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <button className="close-btn" onClick={onClose}>×</button>

          {step === 1 && (
            <>
              <h2 className="modal-title">Create Account</h2>
              <p className="modal-subtitle">Join us today! It only takes a minute</p>

              <form onSubmit={handleStepOneSubmit} className="modal-form">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'input-error' : ''}
                    disabled={isLoading}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'input-error' : ''}
                    disabled={isLoading}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'input-error' : ''}
                    disabled={isLoading}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'input-error' : ''}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  className={`modal-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending code...' : 'Send Verification Code'}
                </button>
              </form>

              <div className="modal-footer">
                <p>
                  Already have an account? 
                  <span className="link-btn" onClick={onSwitch}> Sign in here</span>
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="modal-title">Verify Email</h2>
              <p className="modal-subtitle">Enter the code sent to <strong>{formData.email}</strong></p>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                className={`modal-btn ${isLoading ? 'loading' : ''}`}
                onClick={handleVerifyCode}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <div className="modal-footer">
                <p>
                  Wrong email? 
                  <span className="link-btn" onClick={() => setStep(1)}> Edit details</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SignupModal;
