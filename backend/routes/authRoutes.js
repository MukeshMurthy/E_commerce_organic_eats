const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');


// Traditional login/signup
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// 🔐 Two-step signup with email verification
router.post('/request-verification', authController.requestVerification);
router.post('/verify-and-signup', authController.verifyAndSignup);

module.exports = router;
