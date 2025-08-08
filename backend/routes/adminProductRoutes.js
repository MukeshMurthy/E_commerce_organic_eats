// routes/adminProductRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
} = require('../controllers/adminProductController');

router.get('/', getAllProducts);            // GET all products
router.post('/', addProduct);              // ADD new product
router.put('/:id', updateProduct);         // UPDATE product by ID
router.delete('/:id', deleteProduct);      // DELETE product by ID
router.patch('/:id/stock',updateProductStock);

module.exports = router;
