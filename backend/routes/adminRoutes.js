// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAdminMetrics, 
    getDashboardData,
    getTopSellingProducts,
    getStockAlerts,
    getSalesOverTime,
    getCategorySales,
    getOrders,
    getAllUsers,
    getAllReviews,getGeoDistribution,getAdminProfile,deleteUser} = require('../controllers/adminController');

router.get('/metrics', getAdminMetrics);
router.get('/dashboard',getDashboardData);
router.get('/top-selling', getTopSellingProducts);
router.get('/stock-alerts',getStockAlerts);
router.get('/sales-over-time', getSalesOverTime);
router.get('/category-sales', getCategorySales);
router.get('/users',getAllUsers)
router.get('/review',getAllReviews)
router.get('/od',getOrders)
router.get('/geo-distribution', getGeoDistribution);
router.get('/profile',getAdminProfile);
router.delete('/users/:id', deleteUser);
module.exports = router;
