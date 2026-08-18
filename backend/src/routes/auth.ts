import { Router, Response } from 'express';
import pool from '../config/database.js';
import { isDbConnected } from '../config/database.js';
import { generateToken } from '../config/jwt.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { authenticateDevelopmentUser, findDevelopmentUser, verifyPassword } from '../services/userStore.js';

const router = Router();

interface LoginBody {
  email: string;
  password: string;
}

router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    if (!isDbConnected()) {
      const developmentUser = authenticateDevelopmentUser(email, password);
      if (!developmentUser) {
        return res.status(401).json({ success: false, error: 'Email atau password tidak valid.' });
      }

      const token = generateToken({
        uid: developmentUser.uid,
        email: developmentUser.email,
        role: developmentUser.role,
      });
      return res.json({ success: true, data: { token, user: developmentUser } });
    }

    const result = await pool.query(
      `SELECT id, email, display_name, role, password_hash, phone, avatar_url, status, location_ids
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'Aktif' || !verifyPassword(password, result.rows[0].password_hash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    const token = generateToken({
      uid: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          uid: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          status: user.status,
          locationIds: user.location_ids || [],
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!isDbConnected()) {
      const developmentUser = findDevelopmentUser(req.user.uid);
      if (!developmentUser || req.user.uid !== developmentUser.uid) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, data: developmentUser });
    }

    const result = await pool.query(
      'SELECT id, email, display_name, role, phone, avatar_url, status, location_ids FROM users WHERE id = $1',
      [req.user.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        uid: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        status: user.status,
        locationIds: user.location_ids || [],
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

// Logout (stateless, just for frontend to clear token)
router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
