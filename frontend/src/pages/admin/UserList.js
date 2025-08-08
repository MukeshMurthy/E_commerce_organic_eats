import React, { useEffect, useState, useRef } from 'react';
import './UserList.css';
import AdminLayout from './AdminLayout';
import { FaPlus, FaTimes, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import CustomToast from '../../components/toast/CustomToast';

function UserList() {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminEmail: ''
  });
  
  // Verification states
  const [verificationStep, setVerificationStep] = useState('form'); // 'form', 'verification', 'success'
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  const toastRef = useRef();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
     const data = await response.json();
const combinedUsers = [...data.users, ...data.admins];
setUsers(combinedUsers);

    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (toastRef.current) {
        toastRef.current.showError('Failed to fetch users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Timer for resend code
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { name, email, password, adminEmail } = formData;
    
    if (!name.trim()) {
      toastRef.current?.showError('Name is required');
      return false;
    }
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastRef.current?.showError('Valid email is required');
      return false;
    }
    
    if (!password.trim() || password.length < 6) {
      toastRef.current?.showError('Password must be at least 6 characters');
      return false;
    }
    
    if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      toastRef.current?.showError('Valid admin email is required for verification');
      return false;
    }
    
    return true;
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/verify/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate admin creation');
      }
      
      // Store verification ID and move to verification step
      setVerificationId(data.verificationId);
      setVerificationStep('verification');
      setResendTimer(60); // 60 seconds before allowing resend
      
      toastRef.current?.showSuccess(`Verification code sent to ${formData.adminEmail}`);
      
    } catch (error) {
      console.error('Create admin error:', error);
      toastRef.current?.showError(error.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      toastRef.current?.showError('Verification code is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/verify/verify-admin-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          verificationId,
          verificationCode: verificationCode.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      setVerificationStep('success');
      toastRef.current?.showSuccess('Admin created successfully!');
      
      // Refresh users list
      fetchUsers();
      
      // Auto close modal after success
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
      
    } catch (error) {
      console.error('Verification error:', error);
      toastRef.current?.showError(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/verify/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ verificationId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      
      setResendTimer(60);
      toastRef.current?.showSuccess('Verification code resent!');
      
    } catch (error) {
      console.error('Resend error:', error);
      toastRef.current?.showError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setVerificationStep('form');
    setFormData({ name: '', email: '', password: '', adminEmail: '' });
    setVerificationCode('');
    setVerificationId('');
    setResendTimer(0);
    setShowPassword(false);
  };

  const deleteUser = async (id) => {
    const user = users.find(u => u.id === id);
    
    if (toastRef.current) {
      toastRef.current.showConfirm({
        message: `Are you sure you want to delete user "${user?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            const response = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              }
            });
            
            const data = await response.json();
            
            if (response.ok) {
              toastRef.current.showSuccess(data.message || 'User deleted successfully');
              fetchUsers();
            } else {
              throw new Error(data.error || 'Failed to delete user');
            }
          } catch (error) {
            console.error('Delete error:', error);
            toastRef.current.showError(error.message || 'Failed to delete user');
          }
        },
        confirmText: 'Delete',
        cancelText: 'Cancel'
      });
    }
  };

  return (
    <AdminLayout>
      <CustomToast ref={toastRef} />
      
      <div className="user-list-wrapper">
        <div className="user-list-header">
          <h2>Registered Users</h2>
          <button 
            className="add-admin-btn"
            onClick={() => setShowCreateModal(true)}
            title="Create New Admin"
          >
            <FaPlus /> Create Admin
          </button>
        </div>
        
        {loading && users.length === 0 ? (
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {user.role}
                      </span>
                    </td>
                  
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteUser(user.id)}
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                        title={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 ? 'Cannot delete the last admin' : 'Delete user'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="no-users">
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {verificationStep === 'form' && 'Create New Admin'}
                {verificationStep === 'verification' && 'Email Verification'}
                {verificationStep === 'success' && 'Success!'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Step 1: Form */}
              {verificationStep === 'form' && (
                <form onSubmit={handleCreateAdmin} className="create-admin-form">
                  <div className="form-group">
                    <label htmlFor="name">Admin Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter admin name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Admin Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter admin email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <div className="password-input">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password (min 6 characters)"
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="adminEmail">Verification Email *</label>
                    <input
                      type="email"
                      id="adminEmail"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      placeholder="Enter admin email for verification code"
                      required
                    />
                    <small className="form-help">
                      Verification code will be sent to this email address
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? <FaSpinner className="spinner" /> : 'Send Verification Code'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Verification */}
              {verificationStep === 'verification' && (
                <form onSubmit={handleVerifyCode} className="verification-form">
                  <div className="verification-info">
                    <p>We've sent a verification code to:</p>
                    <strong>{formData.adminEmail}</strong>
                    <p className="verification-note">Please check your email and enter the code below.</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="verificationCode">Verification Code *</label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      className="verification-input"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="resend-btn" 
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || loading}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? <FaSpinner className="spinner" /> : 'Verify & Create Admin'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Success */}
              {verificationStep === 'success' && (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <h4>Admin Created Successfully!</h4>
                  <p>The new admin account has been created and activated.</p>
                  <div className="admin-details">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default UserList;