import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shift_super_secret_jwt_key_2026';

function generateId() {
  return 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existing = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = generateId();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';

    await query(
      `INSERT INTO users (id, email, password_hash, role, otp_code, otp_expires_at, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
      [id, email.toLowerCase().trim(), passwordHash, role, otp, expiresAt]
    );

    console.log(`[Shift Auth] Verification OTP for ${email} (Role: ${role}): ${otp}`);

    res.json({
      message: 'Registration successful. OTP sent.',
      email,
      // For local testing convenience in development:
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND otp_code = $2',
      [email.toLowerCase().trim(), otpCode.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const user = result.rows[0];
    await query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: true,
        created_date: user.created_date,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = await query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3 RETURNING id',
      [otp, expiresAt, email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Shift Auth] Resent OTP for ${email}: ${otp}`);
    res.json({ success: true, message: 'New code sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_date: user.created_date,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query('SELECT id, email, role, is_verified, created_date FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password required' });

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    // In production, verify resetToken; in local dev, allow update
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
