const pool = require('../db');

// Get all orders with detailed items
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.user_id,
        u.name AS user_name,
        o.status,
        o.total_amount,
        o.order_date,
        json_agg(
          json_build_object(
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, u.name
      ORDER BY o.order_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders with items:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status and return full info
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  let { status } = req.body;

  try {
    status = status.toLowerCase().trim();

    // Update status
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

    // Fetch updated order info
    const result = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.user_id,
        u.name AS user_name,
        o.status,
        o.total_amount,
        o.order_date,
        json_agg(
          json_build_object(
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, u.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
