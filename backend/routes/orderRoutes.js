const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.placeOrder);
router.get('/user/:userId', orderController.getUserOrders);
// In routes/orderRoutes.js
router.patch('/cancel/:orderId', orderController.cancelOrder);
router.get('/invoice/:orderId', orderController.downloadInvoice);

module.exports = router;
