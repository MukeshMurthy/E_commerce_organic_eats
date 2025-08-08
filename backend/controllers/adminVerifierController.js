const pool = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendVerificationEmail = require('../utils/sendVerificationEmail');


// Store in-memory verification sessions
const verificationSessions = {};

// ✅ Helper: Check if an email belongs to an existing admin
const isAdminEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND role = $2',
    [email, 'admin']
  );
  return result.rows.length > 0;
};

// ✅ Endpoint: Verify if email belongs to an admin
exports.checkIfAdminEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const isAdmin = await isAdminEmail(email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Email is not associated with any admin' });
    }
    res.json({ success: true, message: 'Admin email verified' });
  } catch (err) {
    console.error('checkIfAdminEmail error:', err);
    res.status(500).json({ error: 'Server error while verifying email' });
  }
};

// ✅ Endpoint: Create new admin (step 1 — send verification)
exports.createAdminWithVerification = async (req, res) => {
  const { name, email, password, adminEmail } = req.body;

  if (!name || !email || !password || !adminEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const isAdmin = await isAdminEmail(adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Verification email must belong to an admin' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = uuidv4();

    verificationSessions[verificationId] = {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      verificationCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      targetAdminEmail: adminEmail
    };

    await sendVerificationEmail(adminEmail, verificationCode);
    res.json({ verificationId });

  } catch (err) {
    console.error('createAdminWithVerification error:', err);
    res.status(500).json({ error: 'Error initiating admin creation' });
  }
};

// ✅ Endpoint: Verify code and create admin
exports.verifyAdminCreation = async (req, res) => {
  const { verificationId, verificationCode } = req.body;

  const session = verificationSessions[verificationId];
  if (!session) return res.status(400).json({ error: 'Invalid or expired verification ID' });

  if (Date.now() > session.expiresAt) {
    delete verificationSessions[verificationId];
    return res.status(400).json({ error: 'Verification session expired' });
  }

  if (session.verificationCode !== verificationCode) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  try {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [session.name, session.email, session.passwordHash, 'admin']
    );

    delete verificationSessions[verificationId];
    res.json({ message: 'Admin created successfully' });

  } catch (err) {
    console.error('verifyAdminCreation error:', err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

// ✅ Endpoint: Resend verification code
exports.resendVerificationCode = async (req, res) => {
  const { verificationId } = req.body;

  const session = verificationSessions[verificationId];
  if (!session) return res.status(400).json({ error: 'Invalid verification ID' });

  try {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    session.verificationCode = newCode;
    session.expiresAt = Date.now() + 5 * 60 * 1000;

    await sendVerificationEmail(session.targetAdminEmail, newCode);
    res.json({ message: 'Verification code resent' });
  } catch (err) {
    console.error('resendVerificationCode error:', err);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};
