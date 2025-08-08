const pool = require('../db');

// Get all products (latest first)
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Add new product
exports.addProduct = async (req, res) => {
  const { name, description, price, category, image_url, stock } = req.body;
  try {
    await pool.query(
      'INSERT INTO products (name, description, price, category, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, description, price, category, image_url, stock]
    );
    res.status(201).json({ message: 'Product added' });
  } catch {
    res.status(500).json({ message: 'Failed to add product' });
  }
};

// Update existing product
exports.updateProduct = async (req, res) => {
  const { name, description, price, category, image_url, stock } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name=$1, description=$2, price=$3, category=$4, image_url=$5, stock=$6 WHERE id=$7',
      [name, description, price, category, image_url, stock, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch {
    res.status(500).json({ message: 'Update failed' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
};
