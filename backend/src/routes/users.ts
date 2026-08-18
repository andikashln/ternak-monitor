import { randomUUID } from 'node:crypto';
import { Router, Response } from 'express';
import pool, { isDbConnected } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserProfile, UserRole } from '../types/index.js';
import {
  allowedRoles,
  createDevelopmentUser,
  findDevelopmentUser,
  hashPassword,
  listDevelopmentUsers,
  resetDevelopmentPassword,
  updateDevelopmentUser,
} from '../services/userStore.js';

const router = Router();

interface CreateUserBody {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  status?: UserProfile['status'];
  locationIds?: string[];
}

function mapUser(row: Record<string, any>) {
  return {
    uid: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    phone: row.phone || undefined,
    status: row.status,
    locationIds: row.location_ids || [],
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateAccount(body: CreateUserBody) {
  if (!body.displayName?.trim() || !body.email?.trim() || !body.password) return 'Nama, email, dan password wajib diisi.';
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return 'Format email tidak valid.';
  if (body.password.length < 8) return 'Password minimal 8 karakter.';
  if (!allowedRoles.includes(body.role)) return 'Role pengguna tidak valid.';
  return null;
}

async function getTargetRole(id: string): Promise<UserRole | null> {
  if (!isDbConnected()) return findDevelopmentUser(id)?.role || null;
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
  return result.rows[0]?.role || null;
}

router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isDbConnected()) return res.json({ success: true, data: listDevelopmentUsers(), mockData: true });
    const result = await pool.query(`
      SELECT id, display_name, email, role, phone, status, location_ids, avatar_url, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `);
    return res.json({ success: true, data: result.rows.map(mapUser) });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, error: 'Gagal memuat daftar pengguna.' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as CreateUserBody;
  const validationError = validateAccount(body);
  if (validationError) return res.status(400).json({ success: false, error: validationError });
  if (req.user?.role === 'ADMIN' && body.role === 'OWNER') {
    return res.status(403).json({ success: false, error: 'ADMIN tidak dapat membuat akun OWNER.' });
  }

  try {
    if (!isDbConnected()) {
      const user = createDevelopmentUser({
        displayName: body.displayName.trim(), email: body.email.trim().toLowerCase(), password: body.password,
        role: body.role, phone: body.phone?.trim(), status: body.status || 'Aktif', locationIds: body.locationIds || [],
      });
      return res.status(201).json({ success: true, data: user, mockData: true });
    }

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, phone, status, location_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [randomUUID(), body.email.trim().toLowerCase(), hashPassword(body.password), body.displayName.trim(),
        body.role, body.phone?.trim() || null, body.status || 'Aktif', body.locationIds || []]
    );
    return res.status(201).json({ success: true, data: mapUser(result.rows[0]) });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS' || error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email sudah digunakan oleh akun lain.' });
    }
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, error: 'Gagal membuat akun pengguna.' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Partial<Pick<UserProfile, 'displayName' | 'role' | 'phone' | 'status' | 'locationIds'>>;
  if (updates.role && !allowedRoles.includes(updates.role)) {
    return res.status(400).json({ success: false, error: 'Role pengguna tidak valid.' });
  }
  if (req.user?.uid === id && (updates.status === 'Nonaktif' || (updates.role && updates.role !== req.user.role))) {
    return res.status(400).json({ success: false, error: 'Anda tidak dapat menonaktifkan atau mengganti role akun sendiri.' });
  }

  try {
    if (req.user?.role === 'ADMIN' && (await getTargetRole(id)) === 'OWNER') {
      return res.status(403).json({ success: false, error: 'ADMIN tidak dapat mengubah akun OWNER.' });
    }
    if (!isDbConnected()) {
      const user = updateDevelopmentUser(id, updates);
      return user
        ? res.json({ success: true, data: user, mockData: true })
        : res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
    }
    const result = await pool.query(
      `UPDATE users SET display_name = COALESCE($2, display_name), role = COALESCE($3, role),
       phone = COALESCE($4, phone), status = COALESCE($5, status), location_ids = COALESCE($6, location_ids),
       updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, updates.displayName, updates.role, updates.phone, updates.status, updates.locationIds]
    );
    return result.rows.length
      ? res.json({ success: true, data: mapUser(result.rows[0]) })
      : res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, error: 'Gagal memperbarui pengguna.' });
  }
});

router.post('/:id/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ success: false, error: 'Password minimal 8 karakter.' });
  try {
    if (req.user?.role === 'ADMIN' && (await getTargetRole(req.params.id)) === 'OWNER') {
      return res.status(403).json({ success: false, error: 'ADMIN tidak dapat mereset password OWNER.' });
    }
    if (!isDbConnected()) {
      return resetDevelopmentPassword(req.params.id, password)
        ? res.json({ success: true, message: 'Password berhasil direset.' })
        : res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
    }
    const result = await pool.query(
      'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id, hashPassword(password)]
    );
    return result.rows.length
      ? res.json({ success: true, message: 'Password berhasil direset.' })
      : res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, error: 'Gagal mereset password.' });
  }
});

export default router;
