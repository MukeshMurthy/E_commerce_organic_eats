const express = require('express');
const router = express.Router();
const {
  addAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressContollers');

router.post('/', addAddress);             // Add address
router.get('/:userId', getUserAddresses); // Get all addresses of a user
router.put('/:id', updateAddress);        // Update address
router.delete('/:id', deleteAddress);     // Delete address

module.exports = router;
