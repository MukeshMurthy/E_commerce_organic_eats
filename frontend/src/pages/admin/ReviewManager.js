import React, { useEffect, useState, useRef } from 'react';
import './ReviewManager.css';
import AdminLayout from './AdminLayout';
import CustomToast from '../../components/toast/CustomToast'; // Adjust path as needed

function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  
  // Create ref for toast component
  const toastRef = useRef();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/admin/review');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(data);
      setError(null);
      
      // Show success toast only if there was a previous error
      if (error) {
        toastRef.current?.showSuccess('Reviews loaded successfully!');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
      toastRef.current?.showError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (review) => {
    // Use CustomToast confirmation dialog
    toastRef.current?.showConfirm({
      message: `Are you sure you want to delete the review by "${review.user_name}" for "${review.product_name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/reviews/${review.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete review');
          }

          setReviews(reviews.filter(r => r.id !== review.id));
          toastRef.current?.showSuccess('Review deleted successfully!');
        } catch (err) {
          console.error('Error deleting review:', err);
          toastRef.current?.showError('Failed to delete review. Please try again.');
        }
      },
      onCancel: () => {
        toastRef.current?.showInfo('Review deletion cancelled.');
      },
      confirmText: 'Delete Review',
      cancelText: 'Cancel'
    });
  };

  const handleToggleExpand = (reviewId) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    
    // Show subtle feedback for sorting
    const columnNames = {
      'user_name': 'User Name',
      'product_name': 'Product Name',
      'created_at': 'Date'
    };
    
    const orderText = sortOrder === 'asc' ? 'ascending' : 'descending';
    toastRef.current?.showInfo(`Sorted by ${columnNames[column]} in ${orderText} order`);
  };

  const handleRefreshClick = () => {
    toastRef.current?.showInfo('Refreshing reviews...');
    fetchReviews();
  };

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review =>
    review.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.review_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];

    if (sortBy === 'created_at') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    } else {
      valueA = valueA?.toString().toLowerCase() || '';
      valueB = valueB?.toString().toLowerCase() || '';
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const currentReviews = sortedReviews.slice(startIndex, startIndex + reviewsPerPage);

  const renderReviewText = (review) => {
    const isExpanded = expandedReviews.has(review.id);
    const maxLength = 100;
    
    if (review.review_text.length <= maxLength) {
      return review.review_text;
    }

    return (
      <div className="review-text-container">
        <span>
          {isExpanded ? review.review_text : `${review.review_text.substring(0, maxLength)}...`}
        </span>
        <button 
          className="expand-btn"
          onClick={() => handleToggleExpand(review.id)}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
    );
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const reviewContent = (
    <div className="review-manager">
      {/* Add CustomToast component */}
      <CustomToast ref={toastRef} />
      
      <div className="review-header">
        <h2>User Reviews ({filteredReviews.length})</h2>
        <button 
          className="refresh-btn" 
          onClick={handleRefreshClick} 
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="review-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search reviews by user, product, or content..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
              
              // Show search feedback
              if (e.target.value.length > 0) {
                setTimeout(() => {
                  const filtered = reviews.filter(review =>
                    review.user_name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    review.product_name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    review.review_text.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  if (filtered.length === 0 && e.target.value.length > 2) {
                    toastRef.current?.showInfo('No reviews match your search criteria');
                  }
                }, 500);
              }
            }}
            className="search-input"
          />
        </div>
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => {
            setError(null);
            fetchReviews();
          }}>
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : currentReviews.length === 0 ? (
        <div className="no-reviews">
          {searchTerm ? (
            <>
              <p>No reviews found matching your search: "<strong>{searchTerm}</strong>"</p>
              <button 
                className="clear-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  toastRef.current?.showInfo('Search cleared');
                }}
              >
                Clear Search
              </button>
            </>
          ) : (
            'No reviews found.'
          )}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="review-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('user_name')} className="sortable">
                    User {renderSortIcon('user_name')}
                  </th>
                  <th onClick={() => handleSort('product_name')} className="sortable">
                    Product {renderSortIcon('product_name')}
                  </th>
                  <th>Review</th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Date {renderSortIcon('created_at')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="user-cell">{review.user_name}</td>
                    <td className="product-cell">{review.product_name}</td>
                    <td className="review-cell">
                      {renderReviewText(review)}
                    </td>
                    <td className="date-cell">
                      {new Date(review.created_at).toLocaleDateString()} <br />
                      <small>{new Date(review.created_at).toLocaleTimeString()}</small>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteReview(review)}
                        title="Delete Review"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  if (currentPage > 1) {
                    toastRef.current?.showInfo(`Moved to page ${currentPage - 1}`);
                  }
                }}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({filteredReviews.length} total reviews)
              </span>
              
              <button
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  if (currentPage < totalPages) {
                    toastRef.current?.showInfo(`Moved to page ${currentPage + 1}`);
                  }
                }}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return <AdminLayout>{reviewContent}</AdminLayout>;
}

export default ReviewManager;