import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { isDbConnected } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Mock data for development (when database is not connected)
const mockLivestock: Record<string, unknown>[] = [
  {
    id: 'ls-001',
    tag_id: 'SP-0023',
    qr_code: 'QR-SP-0023',
    type: 'Sapi',
    breed: 'Simmental',
    gender: 'Jantan',
    dob: '2024-03-12',
    estimated_age_months: 29,
    color_traits: 'Coklat keemasan, kepala putih',
    location_id: 'loc-kulim',
    location_name: 'Kulim',
    pen_id: 'pen-k1',
    pen_name: 'Kandang A1 (Penggemukan Jantan)',
    ownership_status: 'Milik Mandiri',
    source: 'Pembelian',
    entry_date: '2025-01-10',
    acquisition_price: 18500000,
    initial_weight_kg: 290,
    current_weight_kg: 334,
    health_status: 'Sehat',
    breeding_status: 'Belum Dikawinkan',
    condition_category: 'Baik',
    status: 'Aktif',
    notes: 'Perkembangan bobot sangat memuaskan',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'ls-002',
    tag_id: 'SP-0024',
    qr_code: 'QR-SP-0024',
    type: 'Sapi',
    breed: 'Limosin',
    gender: 'Jantan',
    dob: '2024-05-18',
    estimated_age_months: 27,
    color_traits: 'Merah gelap mengkilap',
    location_id: 'loc-kulim',
    location_name: 'Kulim',
    pen_id: 'pen-k1',
    pen_name: 'Kandang A1 (Penggemukan Jantan)',
    ownership_status: 'Milik Mandiri',
    source: 'Pembelian',
    entry_date: '2025-01-10',
    acquisition_price: 19000000,
    initial_weight_kg: 310,
    current_weight_kg: 342,
    health_status: 'Sakit',
    breeding_status: 'Belum Dikawinkan',
    condition_category: 'Kurang Baik',
    status: 'Sakit',
    notes: 'Nafsu makan menurun sejak 2 hari lalu',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2026-08-09T10:00:00Z',
  },
];

function mapLivestockRow(row: Record<string, any>) {
  return {
    id: row.id,
    tagId: row.tagId ?? row.tag_id,
    qrCode: row.qrCode ?? row.qr_code,
    type: row.type,
    breed: row.breed,
    gender: row.gender,
    dob: row.dob,
    estimatedAgeMonths: row.estimatedAgeMonths ?? row.estimated_age_months,
    colorTraits: row.colorTraits ?? row.color_traits,
    locationId: row.locationId ?? row.location_id,
    locationName: row.locationName ?? row.location_name,
    penId: row.penId ?? row.pen_id,
    penName: row.penName ?? row.pen_name,
    ownershipStatus: row.ownershipStatus ?? row.ownership_status,
    source: row.source,
    entryDate: row.entryDate ?? row.entry_date,
    acquisitionPrice: Number(row.acquisitionPrice ?? row.acquisition_price ?? 0),
    initialWeightKg: Number(row.initialWeightKg ?? row.initial_weight_kg ?? 0),
    currentWeightKg: Number(row.currentWeightKg ?? row.current_weight_kg ?? 0),
    healthStatus: row.healthStatus ?? row.health_status,
    breedingStatus: row.breedingStatus ?? row.breeding_status,
    conditionCategory: row.conditionCategory ?? row.condition_category,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

const LIVESTOCK_UPDATE_COLUMNS: Record<string, string> = {
  tagId: 'tag_id', qrCode: 'qr_code', type: 'type', breed: 'breed', gender: 'gender',
  dob: 'dob', estimatedAgeMonths: 'estimated_age_months', colorTraits: 'color_traits',
  locationId: 'location_id', locationName: 'location_name', penId: 'pen_id', penName: 'pen_name',
  ownershipStatus: 'ownership_status', source: 'source', entryDate: 'entry_date',
  acquisitionPrice: 'acquisition_price', initialWeightKg: 'initial_weight_kg',
  currentWeightKg: 'current_weight_kg', healthStatus: 'health_status',
  breedingStatus: 'breeding_status', conditionCategory: 'condition_category', status: 'status', notes: 'notes',
};

// GET all livestock
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // If database is not connected, return mock data
    if (!isDbConnected() || !pool) {
      return res.json({
        success: true,
        data: mockLivestock.map(mapLivestockRow),
        _mockData: true,
        _message: 'Using mock data (database not connected)',
      });
    }

    const result = await pool.query(
      'SELECT * FROM livestock ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        tagId: row.tag_id,
        qrCode: row.qr_code,
        type: row.type,
        breed: row.breed,
        gender: row.gender,
        dob: row.dob,
        estimatedAgeMonths: row.estimated_age_months,
        colorTraits: row.color_traits,
        locationId: row.location_id,
        locationName: row.location_name,
        penId: row.pen_id,
        penName: row.pen_name,
        ownershipStatus: row.ownership_status,
        source: row.source,
        entryDate: row.entry_date,
        acquisitionPrice: row.acquisition_price,
        initialWeightKg: row.initial_weight_kg,
        currentWeightKg: row.current_weight_kg,
        healthStatus: row.health_status,
        breedingStatus: row.breeding_status,
        conditionCategory: row.condition_category,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get livestock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get livestock',
    });
  }
});

// GET livestock by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check mock data first
    const mockItem = mockLivestock.find(item => item.id === id);
    if (mockItem) {
      return res.json({
        success: true,
        data: mapLivestockRow(mockItem),
        _mockData: true,
      });
    }

    if (!isDbConnected() || !pool) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found (using mock data)',
      });
    }

    const result = await pool.query(
      'SELECT * FROM livestock WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found',
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: mapLivestockRow(row),
    });
  } catch (error) {
    console.error('Get livestock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get livestock',
    });
  }
});

// POST create livestock
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      tagId, qrCode, type, breed, gender, dob, estimatedAgeMonths,
      colorTraits, locationId, locationName, penId, penName,
      ownershipStatus, source, entryDate, acquisitionPrice,
      initialWeightKg, currentWeightKg, healthStatus, breedingStatus,
      conditionCategory, status, notes
    } = req.body;

    const id = uuidv4();

    // If database is not connected, return mock response
    if (!isDbConnected() || !pool) {
      const newItem = {
        id,
        tagId, qrCode, type, breed, gender, dob, estimatedAgeMonths,
        colorTraits, locationId, locationName, penId, penName,
        ownershipStatus, source, entryDate, acquisitionPrice,
        initialWeightKg, currentWeightKg, healthStatus, breedingStatus,
        conditionCategory, status, notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockLivestock.push(newItem);
      return res.status(201).json({
        success: true,
        data: newItem,
        _mockData: true,
        _message: 'Created (stored in mock data only)',
      });
    }

    const result = await pool.query(
      `INSERT INTO livestock (
        id, tag_id, qr_code, type, breed, gender, dob, estimated_age_months,
        color_traits, location_id, location_name, pen_id, pen_name,
        ownership_status, source, entry_date, acquisition_price,
        initial_weight_kg, current_weight_kg, health_status, breeding_status,
        condition_category, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
      RETURNING *`,
      [
        id, tagId, qrCode, type, breed, gender, dob, estimatedAgeMonths,
        colorTraits, locationId, locationName, penId, penName,
        ownershipStatus, source, entryDate, acquisitionPrice,
        initialWeightKg, currentWeightKg, healthStatus, breedingStatus,
        conditionCategory, status, notes
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        tagId: row.tag_id,
        qrCode: row.qr_code,
        type: row.type,
        breed: row.breed,
        gender: row.gender,
        dob: row.dob,
        estimatedAgeMonths: row.estimated_age_months,
        colorTraits: row.color_traits,
        locationId: row.location_id,
        locationName: row.location_name,
        penId: row.pen_id,
        penName: row.pen_name,
        ownershipStatus: row.ownership_status,
        source: row.source,
        entryDate: row.entry_date,
        acquisitionPrice: row.acquisition_price,
        initialWeightKg: row.initial_weight_kg,
        currentWeightKg: row.current_weight_kg,
        healthStatus: row.health_status,
        breedingStatus: row.breeding_status,
        conditionCategory: row.condition_category,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error('Create livestock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create livestock',
    });
  }
});

// PUT update livestock (mock support)
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Update mock data if in mock mode
    if (!isDbConnected() || !pool) {
      const mockIndex = mockLivestock.findIndex(item => item.id === id);
      if (mockIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Livestock not found',
        });
      }
      const updated = { ...mockLivestock[mockIndex], ...updates, updatedAt: new Date().toISOString() };
      mockLivestock[mockIndex] = updated;
      return res.json({
        success: true,
        data: updated,
        _mockData: true,
      });
    }

    const validUpdates = Object.entries(updates).filter(([key]) => LIVESTOCK_UPDATE_COLUMNS[key]);
    const setClause = validUpdates
      .map(([key], index) => `${LIVESTOCK_UPDATE_COLUMNS[key]} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    const result = await pool.query(
      `UPDATE livestock SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...validUpdates.map(([, value]) => value)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found',
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        tagId: row.tag_id,
        qrCode: row.qr_code,
        type: row.type,
        breed: row.breed,
        gender: row.gender,
        dob: row.dob,
        estimatedAgeMonths: row.estimated_age_months,
        colorTraits: row.color_traits,
        locationId: row.location_id,
        locationName: row.location_name,
        penId: row.pen_id,
        penName: row.pen_name,
        ownershipStatus: row.ownership_status,
        source: row.source,
        entryDate: row.entry_date,
        acquisitionPrice: row.acquisition_price,
        initialWeightKg: row.initial_weight_kg,
        currentWeightKg: row.current_weight_kg,
        healthStatus: row.health_status,
        breedingStatus: row.breeding_status,
        conditionCategory: row.condition_category,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error('Update livestock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update livestock',
    });
  }
});

// DELETE livestock
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Handle mock data
    if (!isDbConnected() || !pool) {
      const mockIndex = mockLivestock.findIndex(item => item.id === id);
      if (mockIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Livestock not found',
        });
      }
      mockLivestock.splice(mockIndex, 1);
      return res.json({
        success: true,
        message: 'Livestock deleted successfully',
        _mockData: true,
      });
    }

    const result = await pool.query(
      'DELETE FROM livestock WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found',
      });
    }

    res.json({
      success: true,
      message: 'Livestock deleted successfully',
    });
  } catch (error) {
    console.error('Delete livestock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete livestock',
    });
  }
});

export default router;
