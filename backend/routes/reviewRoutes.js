const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewContollers');

// DELETE review by ID
router.delete('/:id', reviewController.deleteReview);

// POST a review
router.post('/', reviewController.postReview);

// GET reviews by product ID
router.get('/:productId', reviewController.getReviewsByProduct);

module.exports = router;
