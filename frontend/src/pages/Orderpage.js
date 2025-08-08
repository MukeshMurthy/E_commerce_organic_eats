import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Orderpage.css';
import { useNavigate } from 'react-router-dom';
import CustomToast from '../components/toast/CustomToast';

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const navigate = useNavigate();
  const customToastRef = useRef();

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/orders/user/${userId}`);
      setOrders(res.data);
    } catch (err) {
      customToastRef.current?.showError('Failed to fetch orders.');
      console.error('Failed to fetch orders', err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchOrders();
  }, [userId]);

  const cancelOrder = (orderId) => {
    customToastRef.current.showConfirm({
      message: 'Are you sure you want to cancel this order?',
      onConfirm: async () => {
        try {
          const res = await axios.patch(`http://localhost:5001/api/orders/cancel/${orderId}`);
          customToastRef.current?.showSuccess(res.data.message || 'Order cancelled successfully!');
          fetchOrders();
          setSelectedOrder(null);
        } catch (err) {
          const msg = err?.response?.data?.error || 'Failed to cancel order.';
          customToastRef.current?.showError(msg);
          console.error(err);
        }
      },
      onCancel: () => {
        customToastRef.current?.showInfo('Order cancellation aborted.');
      }
    });
  };

  const handleDownloadInvoice = (orderId) => {
    if (!orderId) return;
    window.open(`http://localhost:5001/api/orders/invoice/${orderId}`, '_blank');
  };

  return (
    <div className="order-page">
      <CustomToast ref={customToastRef} />

      <div className="top-navbar">
        <div className="nav-menu">
          <span onClick={() => navigate('/')}>HOME</span>
          <span onClick={() => navigate('/user/home')}>SHOP</span>
          <span>ORDERS</span>
        </div>
        <div className="logo">Organic Eats</div>
        <div className="user-greet">Hi, {user?.name}</div>
      </div>

   <div className="order-content">
  <h2>Your Orders</h2>

  {orders.length === 0 ? (
    <p className="no-orders">No orders found.</p>
  ) : (
    orders.map((order) => (
      <div
        className="order-card"
        key={order.order_id}
        onClick={() => setSelectedOrder(order)}
      >
        <h4>Order #{order.order_id}</h4>
        <p><strong>Date:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
        <p><strong>Total:</strong> ₹{parseFloat(order.total_amount).toFixed(2)}</p>
        <p><strong>Status:</strong> {order.status}</p>
      </div>
    ))
  )}
</div>

      {/* ✅ Modal Popup */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Order #{selectedOrder.order_id}</h3>
            <p><strong>User Name:</strong> {user.name}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Order Date:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</p>

            <div className="order-items">
              <h4>Products:</h4>
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span>{item.name}</span>
                  <span>{item.quantity} × ₹{item.price}</span>
                </div>
              ))}
            </div>

            {selectedOrder.shipping_details && (
              <>
                <h4>Shipping Address:</h4>
                <p>{selectedOrder.shipping_details}</p>
              </>
            )}

            {selectedOrder.status?.toLowerCase() === 'pending' && (
              <button
                className="cancel-btn"
                onClick={() => cancelOrder(selectedOrder.order_id)}
              >
                Cancel Order
              </button>
            )}

            <button
              className="invoice-btn"
              disabled={selectedOrder.status?.toLowerCase() !== 'delivered'}
              onClick={() => handleDownloadInvoice(selectedOrder.order_id)}
            >
              {selectedOrder.status?.toLowerCase() === 'delivered'
                ? 'Download Invoice'
                : 'Invoice not available'}
            </button>

            <button className="close-btn" onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
