const pool = require('../db');

// Get cart items
exports.getCartItems = async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId === 'null') return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const result = await pool.query(`
      SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, user_id, product_id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [user_id, product_id, quantity]
      );
    }

    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
};
exports.updateCartItemQuantity = async (req, res) => {
  const { cartId } = req.params;
  const { quantity } = req.body;

  console.log('🛠 Updating cart ID:', cartId, 'Quantity:', quantity); // ADD THIS

  try {
    const result = await pool.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2',
      [quantity, cartId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Quantity updated' });
  } catch (err) {
    console.error('Error updating quantity:', err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};


// Delete cart item
exports.removeCartItem = async (req, res) => {
  const { cartId } = req.params;

  try {
    await pool.query('DELETE FROM cart WHERE id = $1', [cartId]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('Error deleting cart item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

exports.clearUserCart = async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    res.status(200).json({ message: 'Cart cleared after order placement.' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
};
