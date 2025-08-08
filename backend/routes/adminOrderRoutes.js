const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/adminOrderController');

router.get('/', getAllOrders);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
