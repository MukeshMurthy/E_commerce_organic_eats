const pool = require('../db');

// Add new address
exports.addAddress = async (req, res) => {
  const { user_id, name, phone, house, street, city, pincode } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO shipping_addresses (user_id, name, phone, house, street, city, pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, name, phone, house, street, city, pincode]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save address' });
  }
};

exports.getUserAddresses = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );
    res.json(result.rows); // if empty, this returns []
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};


// Update address
exports.updateAddress = async (req, res) => {
  const id = req.params.id;
  const { name, phone, house, street, city, pincode } = req.body;
  try {
    const result = await pool.query(
      `UPDATE shipping_addresses
       SET name = $1, phone = $2, house = $3, street = $4, city = $5, pincode = $6
       WHERE id = $7 RETURNING *`,
      [name, phone, house, street, city, pincode, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update address' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM shipping_addresses WHERE id = $1', [id]);
    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
};
