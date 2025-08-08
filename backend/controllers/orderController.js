const pool = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ Place Order
// ✅ Place Order
exports.placeOrder = async (req, res) => {
  const {
    user_id,
    items,
    subtotal,
    discount,
    coupon_code,
    total_amount,
    name,
    shipping_address,
    payment_method,
  } = req.body;

  // ✅ Extract city from shipping_address (optional, if city not passed separately)
  // This assumes the format: "House, Street, City, Pincode"
  let shipping_city = '';
  const parts = shipping_address.split(',');
  if (parts.length >= 3) {
    shipping_city = parts[parts.length - 2].trim();
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ✅ Insert order and include shipping_city
    const result = await client.query(
      `INSERT INTO orders 
        (user_id, total_amount, coupon_code, discount, subtotal, name, shipping_address, payment_method, shipping_city) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [user_id, total_amount, coupon_code || null, discount || 0, subtotal, name, shipping_address, payment_method, shipping_city]
    );

    const orderId = result.rows[0].id;

    // ✅ Insert each item and reduce stock
    for (let item of items) {
      const { product_id, quantity, price } = item;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, price]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1`,
        [quantity, product_id]
      );
    }

    // ✅ Track coupon usage
    if (coupon_code) {
      await client.query(
        `INSERT INTO used_coupons (user_id, coupon_code)
         VALUES ($1, $2)`,
        [user_id, coupon_code.toUpperCase()]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Order placed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Order failed' });
  } finally {
    client.release();
  }
};

// ✅ Get User Orders
exports.getUserOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const orderData = await pool.query(`
      SELECT o.id as order_id, o.total_amount, o.order_date, o.status, o.coupon_code, o.discount,
             oi.quantity, oi.price,
             p.name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `, [userId]);

    const grouped = {};

    for (const row of orderData.rows) {
      if (!grouped[row.order_id]) {
        grouped[row.order_id] = {
          order_id: row.order_id,
          total_amount: row.total_amount,
          order_date: row.order_date,
          status: row.status,
          coupon_code: row.coupon_code,
          discount: row.discount,
          items: []
        };
      }

      grouped[row.order_id].items.push({
        name: row.name,
        quantity: row.quantity,
        price: row.price
      });
    }

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// ✅ Cancel Order and Revert Stock + Coupon
exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Mark as cancelled
    await client.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [orderId]);

    // Get user_id and coupon_code
    const orderRes = await client.query(`SELECT user_id, coupon_code FROM orders WHERE id = $1`, [orderId]);
    const { user_id, coupon_code } = orderRes.rows[0];

    // Revert coupon
    if (coupon_code) {
      await client.query(`DELETE FROM used_coupons WHERE user_id = $1 AND coupon_code = $2`, [user_id, coupon_code]);
    }

    // Get all items in the order and restore product stock
    const itemsRes = await client.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [orderId]);
    for (let item of itemsRes.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled and coupon/stock reverted (if applicable).' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel order and revert changes' });
  } finally {
    client.release();
  }
};


exports.downloadInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(`
      SELECT o.id as order_id, o.total_amount, o.order_date, o.status,
             u.name as user_name, u.email,
             oi.quantity, oi.price,
             p.name as product_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];
    if (order.status.toLowerCase() !== 'delivered') {
      return res.status(400).json({ error: 'Invoice is only available for delivered orders' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Pipe PDF to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    doc.pipe(res);

    // ======= Company Logo & Name =======
    const logoPath = path.join(__dirname, '../assets/logo.png'); // adjust as needed
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 60 });
    }

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Organic Eats Pvt. Ltd.', 120, 50)
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Fresh. Organic. Delivered.', 120, 72)
      .moveDown(2);

    doc.moveTo(50, 100).lineTo(550, 100).stroke();

    // ======= Invoice Title =======
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', { align: 'center' })
      .moveDown();

    // ======= Order Info =======
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Order ID: ${order.order_id}`)
      .text(`Date: ${new Date(order.order_date).toLocaleDateString()}`)
      .text(`Status: ${order.status}`)
      .moveDown();

    // ======= Customer Info =======
    doc
      .text(`Customer Name: ${order.user_name}`)
      .text(`Customer Email: ${order.email}`)
      .moveDown();

    // ======= Table Header =======
    doc
      .font('Helvetica-Bold')
      .text('Product', 50, doc.y)
      .text('Price (₹)', 250, doc.y)
      .text('Qty', 350, doc.y)
      .text('Subtotal (₹)', 450, doc.y)
      .moveDown();

    doc.font('Helvetica');

    let total = 0;

    result.rows.forEach(item => {
      const price = parseFloat(item.price);
      const quantity = parseInt(item.quantity);
      const subtotal = price * quantity;
      total += subtotal;

      doc
        .text(item.product_name, 50, doc.y)
        .text(price.toFixed(2), 250, doc.y)
        .text(quantity, 350, doc.y)
        .text(subtotal.toFixed(2), 450, doc.y)
        .moveDown();
    });

    doc.moveDown(2);

    // ======= Total Amount =======
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Total Amount: ₹${total.toFixed(2)}`, { align: 'right' });

    // ======= Footer =======
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Thank you for shopping with Organic Eats!', 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generating invoice:', err);
    // Only send JSON error if response hasn't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
};
