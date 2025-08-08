import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLayout.css';
import { FaSignOutAlt, FaUserCircle, FaTimes, FaSpinner } from 'react-icons/fa';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch admin profile data
  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/admin/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if you're using tokens
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Adjust based on your auth method
        },
        credentials: 'include' // Include cookies if using session-based auth
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAdminInfo(data);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError(err.message || 'Failed to fetch profile data');
      
      // If it's a network error or unauthorized, you might want to redirect
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data when profile popup is opened
  useEffect(() => {
    if (showProfile && !adminInfo) {
      fetchAdminProfile();
    }
  }, [showProfile]);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Optional: Call logout API to invalidate session on server
      await fetch('http://localhost:5001/api/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage and redirect regardless of API call result
      localStorage.removeItem('adminToken');
      navigate('/');
    }
  };

  // Handle profile popup open
  const handleProfileClick = () => {
    setShowProfile(true);
    // Reset error when opening profile
    setError(null);
  };

  // Handle profile refresh
  const handleRefreshProfile = () => {
    setAdminInfo(null);
    fetchAdminProfile();
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <ul>
          <li onClick={() => navigate('/admin/home')}>Overview</li>
          <li onClick={() => navigate('/admin/products')}>Manage Products</li>
          <li onClick={() => navigate('/admin/orders')}>Orders</li>
          <li onClick={() => navigate('/admin/users')}>Users</li>
          <li onClick={() => navigate('/admin/reviews')}>Reviews</li>
        </ul>

        <div className="admin-profile-btn" onClick={handleProfileClick}>
          <FaUserCircle /> Profile
        </div>

        <div className="log-out" onClick={handleLogout}>
          Logout <FaSignOutAlt />
        </div>
      </aside>

      <main className="admin-main">{children}</main>

      {showProfile && (
        <div className="profile-popup-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-popup" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowProfile(false)}>
              <FaTimes />
            </button>
            <h3>Admin Profile</h3>
            
            {loading && (
              <div className="profile-loading">
                <FaSpinner className="spinner" />
                <p>Loading profile...</p>
              </div>
            )}

            {error && (
              <div className="profile-error">
                <p>Error: {error}</p>
                <button className="retry-btn" onClick={handleRefreshProfile}>
                  Retry
                </button>
              </div>
            )}

            {adminInfo && !loading && (
              <div className="profile-info">
                <p><strong>Name:</strong> {adminInfo.name || 'N/A'}</p>
                <p><strong>Email:</strong> {adminInfo.email || 'N/A'}</p>
                <p><strong>Role:</strong> {adminInfo.role || 'Administrator'}</p>
                {adminInfo.phone && <p><strong>Phone:</strong> {adminInfo.phone}</p>}
                {adminInfo.department && <p><strong>Department:</strong> {adminInfo.department}</p>}
                {adminInfo.lastLogin && (
                  <p><strong>Last Login:</strong> {new Date(adminInfo.lastLogin).toLocaleString()}</p>
                )}
                
             
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;