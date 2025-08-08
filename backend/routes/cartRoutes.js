const express = require('express');
const router = express.Router();
const {
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearUserCart
} = require('../controllers/cartController');

// Get all cart items for a user
router.get('/:userId', getCartItems);

// Add or update item in cart
router.post('/', addToCart);

// Update item quantity
router.patch('/:cartId', updateCartItemQuantity);

// Delete item from cart
router.delete('/:cartId', removeCartItem);

router.delete('/clear/:userId', clearUserCart);

module.exports = router;
