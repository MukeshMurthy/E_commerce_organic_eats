const express = require('express');
const router = express.Router();
const adminVerifierController = require('../controllers/adminVerifierController');

router.post('/verify-email', adminVerifierController.checkIfAdminEmail);
router.post('/create-admin', adminVerifierController.createAdminWithVerification);
router.post('/verify-admin-creation', adminVerifierController.verifyAdminCreation);
router.post('/resend-verification', adminVerifierController.resendVerificationCode);

module.exports = router;
