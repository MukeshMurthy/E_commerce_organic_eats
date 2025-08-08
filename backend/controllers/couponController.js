const pool = require('../db');

// Static list of valid coupons and their discount percentages
const validCoupons = {
  'SAVE10': 0.10,
  'SAVE20': 0.20,
  'FREESHIP': 0
};

exports.applyCoupon = async (req, res) => {
  const { userId, couponCode } = req.body;
  const code = couponCode.trim().toUpperCase();

  if (!validCoupons[code]) {
    return res.status(400).json({ success: false, message: 'Invalid coupon code' });
  }

  try {
    // Check if the user has already used this coupon
    const used = await pool.query(
      'SELECT * FROM used_coupons WHERE user_id = $1 AND coupon_code = $2',
      [userId, code]
    );

    if (used.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    // Check how many coupons user has already used
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM used_coupons WHERE user_id = $1',
      [userId]
    );

    const usedCount = parseInt(countResult.rows[0].count);
    if (usedCount >= 2) {
      return res.status(400).json({ success: false, message: 'You can use a maximum of 2 coupons' });
    }

    // Only validate and respond with discount, do NOT save here
    return res.status(200).json({
      success: true,
      discount: validCoupons[code],
      code
    });

  } catch (err) {
    console.error('Coupon validation error:', err);
    return res.status(500).json({ success: false, message: 'Server error validating coupon' });
  }
};
