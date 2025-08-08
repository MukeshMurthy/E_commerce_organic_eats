import React, { useEffect, useRef, useState } from 'react';
import './CartPage.css';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import CustomToast from '../components/toast/CustomToast';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [couponOptions, setCouponOptions] = useState(['SAVE10', 'SAVE20', 'FREESHIP']);
  const [usedCoupons, setUsedCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const toastRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }

    fetchCartItems();
    fetchUsedCoupons();

    const savedCoupon = localStorage.getItem('appliedCoupon');
    const savedDiscount = localStorage.getItem('couponDiscount');
    if (savedCoupon && savedDiscount) {
      setAppliedCoupon(savedCoupon);
      setDiscount(parseFloat(savedDiscount));
    }
  }, [userId]);

  useEffect(() => {
    if (location.state?.orderPlaced) {
      toastRef.current?.showSuccess('Order placed successfully!');
      fetchCartItems();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const fetchCartItems = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/cart/${userId}`);
      setCartItems(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      toastRef.current?.showError('Failed to load cart items');
    }
  };

  const fetchUsedCoupons = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/coupons/used/${userId}`);
      setUsedCoupons(res.data); // ['SAVE10']
    } catch (err) {
      console.warn('Failed to fetch used coupons');
    }
  };

  const updateQuantity = async (cartId, newQty) => {
    if (newQty < 1) return;
    
    try {
      await axios.patch(`http://localhost:5001/api/cart/${cartId}`, { quantity: newQty });
      setCartItems(prev => prev.map(item => item.id === cartId ? { ...item, quantity: newQty } : item));
      toastRef.current?.showSuccess('Quantity updated!');
    } catch (err) {
      console.error('Error updating quantity:', err);
      toastRef.current?.showError('Failed to update quantity');
    }
  };

  const handleDelete = (item) => {
    // Show confirmation dialog before deleting
    toastRef.current?.showConfirm({
      message: `Remove "${item.name}" from your cart?`,
      onConfirm: () => deleteItem(item.id),
      onCancel: () => {
        toastRef.current?.showInfo('Item kept in cart');
      },
      confirmText: 'Remove',
      cancelText: 'Keep'
    });
  };

  const deleteItem = async (cartId) => {
    try {
      await axios.delete(`http://localhost:5001/api/cart/${cartId}`);
      setCartItems(prev => prev.filter(item => item.id !== cartId));
      toastRef.current?.showSuccess('Item removed from cart!');
    } catch (err) {
      console.error('Error deleting item:', err);
      toastRef.current?.showError('Failed to remove item');
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const getDiscountedTotal = () => getSubtotal() - getSubtotal() * discount;

  const handleApplyCoupon = async () => {
    if (!selectedCoupon) {
      toastRef.current?.showWarning('Please select a coupon'); // Fixed: was showWarn, now showWarning
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5001/api/coupons/apply`, {
        userId,
        couponCode: selectedCoupon
      });

      const { discount, code } = res.data;
      setAppliedCoupon(code);
      setDiscount(discount);

      localStorage.setItem('appliedCoupon', code);
      localStorage.setItem('couponDiscount', discount);

      toastRef.current?.showSuccess(`Coupon ${code} applied! Saved ₹${(getSubtotal() * discount).toFixed(2)}`);
      fetchUsedCoupons();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply coupon';
      toastRef.current?.showWarning(msg); // Fixed: was showWarn, now showWarning
    }
  };

  const handleRemoveCoupon = () => {
    // Show confirmation before removing coupon
    toastRef.current?.showConfirm({
      message: `Remove coupon "${appliedCoupon}"? You'll lose your discount.`,
      onConfirm: () => {
        setAppliedCoupon('');
        setDiscount(0);
        setSelectedCoupon('');
        localStorage.removeItem('appliedCoupon');
        localStorage.removeItem('couponDiscount');
        toastRef.current?.showInfo('Coupon removed');
      },
      onCancel: () => {
        toastRef.current?.showInfo('Coupon kept');
      },
      confirmText: 'Remove Coupon',
      cancelText: 'Keep Coupon'
    });
  };

  const handleCheckout = () => {
    if (!userId) {
      setShowLoginPrompt(true);
      toastRef.current?.showWarning('Please login to checkout.'); // Fixed: was showWarn, now showWarning
      return;
    }
    if (cartItems.length === 0) {
      toastRef.current?.showWarning('Your cart is empty.'); // Fixed: was showWarn, now showWarning
      return;
    }

    // Show checkout confirmation
    toastRef.current?.showConfirm({
      message: `Proceed to checkout with ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}?`,
      onConfirm: () => {
        navigate('/checkout');
      },
      onCancel: () => {
        toastRef.current?.showInfo('Continue shopping!');
      },
      confirmText: 'Proceed to Checkout',
      cancelText: 'Continue Shopping'
    });
  };

  const handleQuantityDecrease = (item) => {
    if (item.quantity <= 1) {
      // If quantity is 1, show confirmation to remove item
      toastRef.current?.showConfirm({
        message: `Remove "${item.name}" from cart? (Quantity cannot go below 1)`,
        onConfirm: () => deleteItem(item.id),
        onCancel: () => {
          toastRef.current?.showInfo('Item quantity kept at 1');
        },
        confirmText: 'Remove Item',
        cancelText: 'Keep Item'
      });
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="cart-wrapper">
      <CustomToast ref={toastRef} />

      <header className="cart-header">
        <nav className="nav-menu">
          <span onClick={() => navigate('/')}>HOME</span>
          <span onClick={() => navigate('/user/home')}>SHOP</span>
          <span>CART</span>
        </nav>
        <div className="brand">Organic Eats</div>
        <div className="user-info">Hi, {user?.name || 'Guest'}</div>
      </header>

      {showLoginPrompt && (
        <div className="login-prompt-box">
          <p>Please login to access this page.</p>
          <button onClick={() => navigate('/')}>Go to Login</button>
        </div>
      )}

      <div className="cart-container">
        <div className="cart-left">
          <h2>Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</h2>
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button onClick={() => navigate('/user/home')} className="shop-now-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <div className="info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</p>
                  <div className="quantity-buttons">
                    <button 
                      onClick={() => handleQuantityDecrease(item)}
                      title={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <FaTrash 
                  className="delete-icon" 
                  onClick={() => handleDelete(item)}
                  title={`Remove ${item.name} from cart`}
                />
              </div>
            ))
          )}
        </div>

        <div className="cart-right">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}):</span>
            <span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="summary-row discount-row">
              <span>Discount ({appliedCoupon}):</span>
              <span>- ₹{(getSubtotal() * discount).toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total-row">
            <strong>Total: ₹{getDiscountedTotal().toFixed(2)}</strong>
          </div>

          <button 
            className="checkout-btn" 
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout
          </button>

          <div className="coupon-section" style={{ marginTop: '20px' }}>
            {!appliedCoupon && (
              <>
                <label htmlFor="coupon-select">Apply Coupon:</label>
                <select
                  id="coupon-select"
                  value={selectedCoupon}
                  onChange={(e) => setSelectedCoupon(e.target.value)}
                  style={{ padding: '10px', width: '100%', borderRadius: '6px', marginBottom: '10px' }}
                >
                  <option value="">Select Coupon</option>
                  {couponOptions.map(code => (
                    <option key={code} value={code} disabled={usedCoupons.includes(code)}>
                      {code} {usedCoupons.includes(code) ? '(Already Used)' : ''}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleApplyCoupon}
                  disabled={!selectedCoupon}
                  className="apply-coupon-btn"
                >
                  Apply Coupon
                </button>
              </>
            )}
            {appliedCoupon && (
              <div className="applied-coupon" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#2e7d32' }}>
                  ✓ Coupon Applied: <strong>{appliedCoupon}</strong>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#d32f2f', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}
                >
                  Remove Coupon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;