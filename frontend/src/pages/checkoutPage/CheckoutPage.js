import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import './CheckoutPage.css';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';

function CheckoutPage() {
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    house: '',
    street: '',
    city: '',
    pincode: '',
    paymentMethod: ''
  });

  const [loading, setLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const [width, height] = useWindowSize();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5001/api/cart/${userId}`)
      .then(res => setCheckoutItems(res.data))
      .catch(err => console.error('Cart load failed', err));

    fetchAddresses();

    // Load coupon from localStorage
    const savedCode = localStorage.getItem('appliedCoupon');
    const savedDiscount = localStorage.getItem('couponDiscount');
    if (savedCode && savedDiscount) {
      setCouponCode(savedCode);
      setCouponDiscount(parseFloat(savedDiscount));
    }
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/address/${userId}`);
      setAddresses(res.data);
      if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
    } catch (err) {
      console.warn('No address found yet or server error');
    }
  };

  const getSubtotal = () => {
    return checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getTotalAfterDiscount = () => {
    return getSubtotal() - getSubtotal() * couponDiscount;
  };

const handlePlaceOrder = async () => {
  const selected = addresses.find(addr => addr.id === selectedAddressId);
  if (!selected) return alert('Please select a delivery address.');

  const subtotal = getSubtotal();
  const discountAmount = subtotal * couponDiscount;
  const totalAmount = subtotal - discountAmount;

  const payload = {
    user_id: userId,
    items: checkoutItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(couponDiscount.toFixed(2)),
    total_amount: parseFloat(totalAmount.toFixed(2)),
    coupon_code: couponCode || null,
    payment_method: selected.payment_method,
    name: selected.name,
    shipping_address: `${selected.house}, ${selected.street}, ${selected.city}, ${selected.pincode}`
  };

  setLoading(true);
  try {
    await axios.post('http://localhost:5001/api/orders', payload);
    await axios.delete(`http://localhost:5001/api/cart/clear/${userId}`);
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('couponDiscount');

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate('/cart', { state: { orderPlaced: true } });
    }, 3000);
  } catch (err) {
    alert('Order failed');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5001/api/address/${id}`);
    fetchAddresses();
  };

  const handleEdit = (addr) => {
    setFormData(addr);
    setEditAddressId(addr.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = { ...formData, user_id: userId };
    if (editAddressId) {
      await axios.put(`http://localhost:5001/api/address/${editAddressId}`, payload);
    } else {
      await axios.post('http://localhost:5001/api/address', payload);
    }
    setShowModal(false);
    setFormData({ name: '', phone: '', house: '', street: '', city: '', pincode: '', paymentMethod: '' });
    setEditAddressId(null);
    fetchAddresses();
  };

  return (
    <div className="checkout-container">
      <header className="top-navbar">
        <nav className="nav-links">
          <button onClick={() => navigate('/')}>HOME</button>
          <button onClick={() => navigate('/user/home')}>SHOP</button>
          <button onClick={() => navigate('/cart')}>CART</button>
        </nav>
        <div className="logo">Organic Eats</div>
        <div className="user-greet">Hi, {user?.name}</div>
      </header>

      <div className="checkout-content">
        <div className="checkout-left">
          <h2>Shipping Address</h2>
          {addresses.length > 2 && (
            <p className="multi-address-tip">You have multiple addresses. Please select one for delivery.</p>
          )}
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
              onClick={() => setSelectedAddressId(addr.id)}
            >
              <div>
                <strong>{addr.name}</strong><br />
                {addr.phone}<br />
                {addr.house}, {addr.street}, {addr.city} - {addr.pincode}<br />
                Payment: {addr.payment_method}
              </div>
              <div className="address-actions">
                <FaEdit onClick={(e) => { e.stopPropagation(); handleEdit(addr); }} />
                <FaTrashAlt onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }} />
              </div>
            </div>
          ))}
          <button onClick={() => { setShowModal(true); setEditAddressId(null); }}>+ Add New Address</button>

          <h3>Products in Cart</h3>
          <div className="product-cards">
            {checkoutItems.map(item => (
              <div className="product-card" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <div className="product-info">
                  <div className="product-title">{item.name}</div>
                  <div className="product-price">₹{item.price} × {item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-right">
          <h3>Order Summary</h3>
          {checkoutItems.map(item => (
            <div className="order-item" key={item.id}>
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-quantity">Qty: {item.quantity}</div>
              </div>
              <div className="item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <p>Subtotal: ₹{getSubtotal().toFixed(2)}</p>
          {couponDiscount > 0 && (
            <p>Coupon ({couponCode}): - ₹{(getSubtotal() * couponDiscount).toFixed(2)}</p>
          )}
          <h4>Total: ₹{getTotalAfterDiscount().toFixed(2)}</h4>

          <button onClick={handlePlaceOrder} disabled={loading || checkoutItems.length === 0}>
            {loading ? 'Processing...' : `Place Order - ₹${getTotalAfterDiscount().toFixed(2)}`}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editAddressId ? 'Edit Address' : 'Add New Address'}</h3>
            <input placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <input placeholder="House/Flat No." value={formData.house} onChange={e => setFormData({ ...formData, house: e.target.value })} />
            <input placeholder="Street Name" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
            <input placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            <input placeholder="Pincode" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
            <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
              <option value="">Select Payment Method</option>
              <option value="UPI">UPI</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-popup">
            <Confetti width={width} height={height} />
            <h2>Order Placed Successfully!</h2>
            <p>Your order has been placed. Thank you for shopping with us!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
