import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../config/jwt.js';
import { JWTPayload, UserRole } from '../types/index.js';
import pool, { isDbConnected } from '../config/database.js';
import { findDevelopmentUser, isDevelopmentAuthEnabled } from '../services/userStore.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token',
      });
    }

    if (!isDbConnected()) {
      const user = isDevelopmentAuthEnabled() ? findDevelopmentUser(decoded.uid) : null;
      if (!user || user.status !== 'Aktif') {
        return res.status(401).json({ success: false, error: 'Akun tidak aktif atau tidak ditemukan.' });
      }
      decoded.role = user.role;
    } else {
      const result = await pool.query('SELECT role, status FROM users WHERE id = $1', [decoded.uid]);
      if (result.rows.length === 0 || result.rows[0].status !== 'Aktif') {
        return res.status(401).json({ success: false, error: 'Akun tidak aktif atau tidak ditemukan.' });
      }
      decoded.role = result.rows[0].role;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Akses ditolak untuk role pengguna ini.' });
    }
    next();
  };
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path,
  });
}
