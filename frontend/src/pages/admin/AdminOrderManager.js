import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminOrderManager.css';
import CustomToast from '../../components/toast/CustomToast'; // Adjust path as needed

function AdminOrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const toastRef = useRef();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/admin/orders');
      setOrders(res.data);
      toastRef.current?.showSuccess(`Loaded ${res.data.length} orders`);
    } catch (err) {
      console.error('Error fetching orders', err);
      toastRef.current?.showError('Failed to load orders. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (order, newStatus) => {
    // Show confirmation dialog for status changes
    const statusMessages = {
      pending: 'mark as pending',
      shipped: 'mark as shipped',
      delivered: 'mark as delivered',
      cancelled: 'cancel this order'
    };

    const actionMessage = statusMessages[newStatus] || 'update status';
    
    toastRef.current?.showConfirm({
      message: `Are you sure you want to ${actionMessage} for order by ${order.user_name}?`,
      onConfirm: () => performStatusUpdate(order.order_id, newStatus),
      onCancel: () => {
        toastRef.current?.showInfo('Status update cancelled');
      },
      confirmText: 'Update Status',
      cancelText: 'Cancel'
    });
  };

  const performStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(`http://localhost:5001/api/admin/orders/${orderId}/status`, {
        status: newStatus,
      });

      const updated = orders.map(order =>
        order.order_id === orderId ? res.data : order
      );
      setOrders(updated);
      
      // Show success message with status
      const statusLabels = {
        pending: 'Pending',
        shipped: 'Shipped', 
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      toastRef.current?.showSuccess(`Order status updated to ${statusLabels[newStatus]}`);
    } catch (err) {
      console.error('Status update failed', err);
      toastRef.current?.showError('Failed to update order status. Please try again.');
    }
  };

  const getFilteredOrders = () => {
    if (filterStatus === 'all') return orders;
    return orders.filter(order => order.status === filterStatus);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      shipped: '#2196f3', 
      delivered: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getOrderTotal = (order) => {
    return parseFloat(order.total_amount || 0).toFixed(2);
  };

  const formatOrderDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <p>Loading orders...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <CustomToast ref={toastRef} />
      
      <div className="admin-order-page">
        <div className="order-header">
          <h2>Manage Orders ({orders.length} total)</h2>
          
          <div className="order-filters">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</option>
              <option value="shipped">Shipped ({orders.filter(o => o.status === 'shipped').length})</option>
              <option value="delivered">Delivered ({orders.filter(o => o.status === 'delivered').length})</option>
              <option value="cancelled">Cancelled ({orders.filter(o => o.status === 'cancelled').length})</option>
            </select>
          </div>
          
          <button 
            onClick={fetchOrders} 
            className="refresh-btn"
            title="Refresh orders"
          >
            🔄 Refresh
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No {filterStatus === 'all' ? '' : filterStatus} orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total (₹)</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.order_id} className={`order-row status-${order.status}`}>
                    <td>
                      <span className="order-id">#{order.order_id}</span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.user_name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="items-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            <span className="item-name">{item.product_name}</span>
                            <span className="item-qty">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="order-total">₹ {getOrderTotal(order)}</span>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className="order-date">{formatOrderDate(order.order_date)}</span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order, e.target.value)}
                        className="status-select"
                        title="Update order status"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Statistics */}
        <div className="order-stats">
          <div className="stat-card">
            <h4>Total Orders</h4>
            <p>{orders.length}</p>
          </div>
          <div className="stat-card">
            <h4>Total Revenue</h4>
            <p>₹ {orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0).toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h4>Pending Orders</h4>
            <p>{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="stat-card">
            <h4>Completed Orders</h4>
            <p>{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderManager;