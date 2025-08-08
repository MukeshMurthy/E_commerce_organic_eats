const pool = require('../db');

// POST a review
exports.postReview = async (req, res) => {
  const { user_id, product_id, review_text } = req.body;
  try {
    await pool.query(
      'INSERT INTO reviews (user_id, product_id, review_text) VALUES ($1, $2, $3)',
      [user_id, product_id, review_text]
    );
    res.status(201).json({ message: 'Review posted successfully' });
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
};

// GET reviews by product ID
exports.getReviewsByProduct = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.review_text, r.created_at, u.name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// DELETE review
exports.deleteReview = async (req, res) => {
  const reviewId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
