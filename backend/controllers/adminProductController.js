const pool = require('../db');

// GET all products
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// ADD new product
const addProduct = async (req, res) => {
  const {
    name,
    price,
    category,
    description,
    image_url,
    stock,
    calories
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products
       (name, price, category, description, image_url, stock, calories)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, price, category, description, image_url, stock, calories]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

// UPDATE product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    category,
    description,
    image_url,
    stock,
    calories
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, category = $3, description = $4,
           image_url = $5, stock = $6, calories = $7
       WHERE id = $8
       RETURNING *`,
      [name, price, category, description, image_url, stock, calories, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// PATCH stock
const updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { change } = req.body;

  try {
    const result = await pool.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *',
      [change, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
};
