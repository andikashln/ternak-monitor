import { Router, Response } from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all locations
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM locations ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        address: row.address,
        picName: row.pic_name,
        picPhone: row.pic_phone,
        livestockTypes: row.livestock_types,
        penCount: row.pen_count,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get locations',
    });
  }
});

// GET location by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        address: row.address,
        picName: row.pic_name,
        picPhone: row.pic_phone,
        livestockTypes: row.livestock_types,
        penCount: row.pen_count,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location',
    });
  }
});

// POST create location
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, address, picName, picPhone, livestockTypes, penCount, status, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Location name is required',
      });
    }

    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO locations (id, name, address, pic_name, pic_phone, livestock_types, pen_count, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [id, name, address, picName, picPhone, livestockTypes || [], penCount || 0, status || 'Aktif', notes]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        address: row.address,
        picName: row.pic_name,
        picPhone: row.pic_phone,
        livestockTypes: row.livestock_types,
        penCount: row.pen_count,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create location',
    });
  }
});

// PUT update location
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, picName, picPhone, livestockTypes, penCount, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE locations 
       SET name = COALESCE($2, name),
           address = COALESCE($3, address),
           pic_name = COALESCE($4, pic_name),
           pic_phone = COALESCE($5, pic_phone),
           livestock_types = COALESCE($6, livestock_types),
           pen_count = COALESCE($7, pen_count),
           status = COALESCE($8, status),
           notes = COALESCE($9, notes),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, address, picName, picPhone, livestockTypes, penCount, status, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        address: row.address,
        picName: row.pic_name,
        picPhone: row.pic_phone,
        livestockTypes: row.livestock_types,
        penCount: row.pen_count,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
});

// DELETE location
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM locations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete location',
    });
  }
});

export default router;
