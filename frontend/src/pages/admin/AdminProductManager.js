// src/pages/AdminProductManager.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './AdminProductManager.css';
import AdminLayout from './AdminLayout';
import AddProduct from './Addproduct';
import CustomToast from '../../components/toast/CustomToast'; // Adjust path as needed

function AdminProductManager() {
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // all, in-stock, low-stock, out-of-stock
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Create ref for toast component
  const toastRef = useRef();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/admin/products');
      setProducts(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      toastRef.current?.showError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id, change) => {
    try {
      const res = await axios.patch(`http://localhost:5001/api/admin/products/${id}/stock`, { change });
      const updated = products.map(p => (p.id === id ? res.data : p));
      setProducts(updated);
      toastRef.current?.showSuccess('Stock updated successfully!');
    } catch (err) {
      console.error('Failed to update stock', err);
      toastRef.current?.showError('Error updating stock. Please try again.');
    }
  };

  const handleDeleteProduct = (product) => {
    // Use CustomToast confirmation dialog instead of native confirm
    toastRef.current?.showConfirm({
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5001/api/admin/products/${product.id}`);
          setProducts(products.filter(p => p.id !== product.id));
          toastRef.current?.showSuccess('Product deleted successfully!');
        } catch (err) {
          console.error('Delete failed', err);
          toastRef.current?.showError('Failed to delete product. Please try again.');
        }
      },
      onCancel: () => {
        toastRef.current?.showInfo('Product deletion cancelled.');
      },
      confirmText: 'Delete Product',
      cancelText: 'Cancel'
    });
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editProduct.name?.trim()) {
      toastRef.current?.showError('Product name is required.');
      return;
    }
    
    if (!editProduct.price || editProduct.price <= 0) {
      toastRef.current?.showError('Please enter a valid price.');
      return;
    }

    if (!editProduct.category?.trim()) {
      toastRef.current?.showError('Product category is required.');
      return;
    }

    try {
      const { id, ...updatedData } = editProduct;
      const res = await axios.put(`http://localhost:5001/api/admin/products/${id}`, updatedData);
      setProducts(products.map(p => (p.id === id ? res.data : p)));
      setEditProduct(null);
      toastRef.current?.showSuccess('Product updated successfully!');
    } catch (err) {
      console.error('Edit failed', err);
      toastRef.current?.showError('Failed to update product. Please try again.');
    }
  };

  const handleEditCancel = () => {
    toastRef.current?.showConfirm({
      message: 'Are you sure you want to cancel editing? All changes will be lost.',
      onConfirm: () => {
        setEditProduct(null);
        toastRef.current?.showInfo('Edit cancelled.');
      },
      onCancel: () => {
        // Continue editing - do nothing
      },
      confirmText: 'Yes, Cancel',
      cancelText: 'Continue Editing'
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get unique categories for filter dropdown
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !filterCategory || product.category === filterCategory;

    const matchesStock = (() => {
      switch (filterStock) {
        case 'in-stock': return product.stock > 10;
        case 'low-stock': return product.stock > 0 && product.stock <= 10;
        case 'out-of-stock': return product.stock === 0;
        default: return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];

    if (sortBy === 'price' || sortBy === 'stock') {
      valueA = Number(valueA) || 0;
      valueB = Number(valueB) || 0;
    } else {
      valueA = valueA?.toString().toLowerCase() || '';
      valueB = valueB?.toString().toLowerCase() || '';
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (stock <= 10) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <AdminLayout>
      {/* Add CustomToast component */}
      <CustomToast ref={toastRef} />
      
      <div className="product-manager">
        <div className="product-header">
          <h2>Manage Products ({filteredProducts.length})</h2>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={fetchProducts}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              className="add-product-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Hide Form' : 'Add Product'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={fetchProducts}>Try Again</button>
          </div>
        )}

        {/* Add Product Section */}
        {showAddForm && (
          <div className="add-product-section">
            <AddProduct 
              onProductAdded={() => {
                fetchProducts();
                setShowAddForm(false);
              }} 
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="product-controls">
          <div className="search-filter-row">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search products by name, category, or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filterStock}
                onChange={(e) => {
                  setFilterStock(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="sort-row">
            <span>Sort by:</span>
            <button 
              className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => handleSort('name')}
            >
              Name {renderSortIcon('name')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
              onClick={() => handleSort('price')}
            >
              Price {renderSortIcon('price')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'stock' ? 'active' : ''}`}
              onClick={() => handleSort('stock')}
            >
              Stock {renderSortIcon('stock')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'category' ? 'active' : ''}`}
              onClick={() => handleSort('category')}
            >
              Category {renderSortIcon('category')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : currentProducts.length === 0 ? (
          <div className="no-products">
            {searchTerm || filterCategory || filterStock !== 'all' ? (
              <p>No products found matching your filters. Try adjusting your search or filters.</p>
            ) : (
              <p>No products found. Add some products to get started!</p>
            )}
          </div>
        ) : (
          <>
            {/* Product Cards Section */}
            <div className="product-grid">
              {currentProducts.map(prod => {
                const stockStatus = getStockStatus(prod.stock);
                return (
                  <div className="product-card" key={prod.id}>
                    <div className="product-image-container">
                      <img 
                        src={prod.image_url} 
                        alt={prod.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                      <div className={`stock-badge ${stockStatus.class}`}>
                        {stockStatus.text}
                      </div>
                    </div>
                    
                    <div className="product-info">
                      <h4 title={prod.name}>{prod.name}</h4>
                      <p className="product-category">{prod.category}</p>
                      <div className="product-price-stock">
                        <span className="product-price">₹{Number(prod.price).toLocaleString()}</span>
                        <span className="product-stock">Stock: {prod.stock}</span>
                      </div>
                      
                      {prod.description && (
                        <p className="product-description" title={prod.description}>
                          {prod.description.length > 50 
                            ? `${prod.description.substring(0, 50)}...` 
                            : prod.description
                          }
                        </p>
                      )}
                    </div>

                    <div className="product-actions">
                      <div className="stock-buttons">
                        <button 
                          onClick={() => updateStock(prod.id, -1)} 
                          disabled={prod.stock <= 0}
                          title="Decrease stock"
                        >
                          -
                        </button>
                        <span className="stock-display">{prod.stock}</span>
                        <button 
                          onClick={() => updateStock(prod.id, 1)}
                          title="Increase stock"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="crud-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => setEditProduct(prod)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(prod)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} of {totalPages} ({filteredProducts.length} total products)
                </span>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {editProduct && (
          <div className="modal-overlay" onClick={() => setEditProduct(null)}>
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
              <h3>Edit Product</h3>
              <div className="modal-form">
                <input 
                  placeholder="Product Name *"
                  value={editProduct.name || ''} 
                  onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} 
                  className={!editProduct.name?.trim() ? 'error' : ''}
                />
                <input 
                  placeholder="Price *"
                  value={editProduct.price || ''} 
                  type="number" 
                  min="0"
                  step="0.01"
                  onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} 
                  className={!editProduct.price || editProduct.price <= 0 ? 'error' : ''}
                />
                <input 
                  placeholder="Image URL"
                  value={editProduct.image_url || ''} 
                  onChange={e => setEditProduct({ ...editProduct, image_url: e.target.value })} 
                />
                <input 
                  placeholder="Category *"
                  value={editProduct.category || ''} 
                  onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} 
                  className={!editProduct.category?.trim() ? 'error' : ''}
                />
                <textarea 
                  placeholder="Description"
                  value={editProduct.description || ''} 
                  onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                  rows="3"
                />
                <input 
                  placeholder="Stock"
                  value={editProduct.stock || 0} 
                  type="number" 
                  min="0"
                  onChange={e => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} 
                />
                
                {/* Preview image if URL provided */}
                {editProduct.image_url && (
                  <div className="image-preview">
                    <img 
                      src={editProduct.image_url} 
                      alt="Preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="modal-buttons">
                <button className="save-btn" onClick={handleSaveEdit}>
                  Save Changes
                </button>
                <button className="cancel-btn" onClick={handleEditCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProductManager;