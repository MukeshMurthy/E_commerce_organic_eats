const pool = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const  sendVerificationEmail  = require('../utils/sendVerificationEmail');


// Signup
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hashed, role || 'user']
    );
    res.status(201).json({ message: 'Signup success' });
  } catch {
    res.status(500).json({ message: 'Signup error' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];

  if (!user) return res.status(404).json({ message: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ message: 'Login success', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};



// controllers/authController.js
const userVerifications = {}; // In-memory temporary store

exports.requestVerification = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  userVerifications[verificationId] = {
    name,
    email,
    passwordHash,
    role,
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  await sendVerificationEmail(email, code);
  res.json({ verificationId });
};



exports.verifyAndSignup = async (req, res) => {
  const { verificationId, code } = req.body;
  const session = userVerifications[verificationId];

  if (!session) return res.status(400).json({ message: 'Invalid or expired verification ID' });
  if (Date.now() > session.expiresAt) {
    delete userVerifications[verificationId];
    return res.status(400).json({ message: 'Verification expired' });
  }
  if (session.code !== code) {
    return res.status(400).json({ message: 'Incorrect verification code' });
  }

  try {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [session.name, session.email, session.passwordHash, session.role]
    );
    delete userVerifications[verificationId];
    res.json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
};
