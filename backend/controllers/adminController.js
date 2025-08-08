// controllers/adminController.js
const pool = require('../db');

const getAdminMetrics = async (req, res) => {
  try {
    const revenue = await pool.query(`
 SELECT 
  SUM(subtotal) AS total_subtotal,
  SUM(discount) AS total_discount,
  SUM(total_amount) AS total_revenue
FROM orders
WHERE LOWER(status) = 'delivered'


    `);

    const deliveredOrders = await pool.query(`
      SELECT COUNT(*) AS total_delivered
      FROM orders
      WHERE LOWER(status) = 'delivered'
    `);

    const pendingResult = await pool.query(`SELECT COUNT(*) AS pending_orders FROM orders WHERE LOWER(status) = 'pending'`);
    const productResult = await pool.query(`SELECT COUNT(*) AS total_products FROM products`);
    const userResult = await pool.query(`SELECT COUNT(*) AS total_users FROM users WHERE role != 'admin'`);

    res.json({
      total_subtotal: parseFloat(revenue.rows[0].total_subtotal || 0),
      total_discount: parseFloat(revenue.rows[0].total_discount || 0),
      total_shipping: parseFloat(revenue.rows[0].total_shipping || 0),
      total_revenue: parseFloat(revenue.rows[0].total_revenue || 0),
      total_orders: parseInt(deliveredOrders.rows[0].total_delivered || 0),
      pending_orders: parseInt(pendingResult.rows[0].pending_orders || 0),
      total_products: parseInt(productResult.rows[0].total_products || 0),
      total_users: parseInt(userResult.rows[0].total_users || 0),
    });
  } catch (err) {
    console.error('Error fetching admin KPIs:', err);
    res.status(500).json({ error: 'Failed to load KPIs' });
  }
};






const getDashboardData = async (req, res) => {
 try {
    const result = await pool.query(`
      SELECT o.id, u.name as customer_name, o.total_amount, o.status, o.order_date
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Recent orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTopSellingProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top selling products:', err);
    res.status(500).json({ error: 'Failed to fetch top selling products' });
  }
};

const getStockAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, stock
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Stock alerts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/sales-over-time
const getSalesOverTime = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(order_date) AS date,
        SUM(total_amount) AS total_sales,
        COUNT(*) AS total_orders
      FROM orders
      GROUP BY DATE(order_date)
      ORDER BY DATE(order_date) DESC
      LIMIT 14
    `);
    res.json(result.rows.reverse()); // Latest date at the end
  } catch (err) {
    console.error('Error fetching sales over time:', err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

const getCategorySales = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.category, SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE LOWER(o.status) = 'delivered'
      GROUP BY p.category
    `);

    const formatted = result.rows.map(row => ({
      category: row.category,
      value: parseFloat(row.total_sales)
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching category sales:', err);
    res.status(500).json({ error: 'Failed to fetch category sales' });
  }
};

const getOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.user_id, u.name, o.status, o.order_date, u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.order_date DESC
      limit 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY id DESC'
    );

    const users = result.rows.filter(user => user.role === 'user');
    const admins = result.rows.filter(user => user.role === 'admin');

    res.json({ users, admins });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // 1. Check if user exists
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role } = userRes.rows[0];

    // 2. Prevent deletion of last admin
    if (role === 'admin') {
      const adminCountRes = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      const adminCount = parseInt(adminCountRes.rows[0].count);
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    // 3. Only delete the user
    await pool.query('DELETE FROM shipping_addresses WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    

    res.json({ message: 'User deleted successfully. All related data preserved.' });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};


const getAllReviews = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.review_text, r.created_at,
             u.name as user_name, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
const getGeoDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
SELECT 
  shipping_city AS city,
  COUNT(DISTINCT o.id) AS total_delivered_orders,
  SUM(oi.quantity) AS total_items_delivered
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE LOWER(o.status) = 'delivered'
  AND shipping_city IS NOT NULL
GROUP BY shipping_city
ORDER BY total_items_delivered DESC
LIMIT 10;


    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching geo distribution:', err);
    res.status(500).json({ error: 'Failed to fetch delivery city data' });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    // Assuming admin is the only user with role 'admin'
    const result = await pool.query(
      `SELECT id, name, email, role FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};





module.exports = { getAdminMetrics, getDashboardData,getStockAlerts,getTopSellingProducts,
  getSalesOverTime,getCategorySales,getOrders,getAllUsers,getAllReviews,getGeoDistribution,getAdminProfile,deleteUser };
