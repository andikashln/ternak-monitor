import { Router, Response } from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all transactions
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financial_transactions ORDER BY date DESC'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        invoiceNo: row.invoice_no,
        date: row.date,
        type: row.type,
        category: row.category,
        description: row.description,
        locationId: row.location_id,
        locationName: row.location_name,
        amount: row.amount,
        paymentMethod: row.payment_method,
        payeePayer: row.payee_payer,
        createdBy: row.created_by,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
    });
  }
});

// GET transactions summary (income vs expense)
router.get('/summary/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        SUM(amount) as total
      FROM financial_transactions
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY type
    `);

    const summary = {
      income: 0,
      expense: 0,
      netProfit: 0,
    };

    result.rows.forEach(row => {
      if (row.type === 'income') {
        summary.income = Number(row.total);
      } else if (row.type === 'expense') {
        summary.expense = Number(row.total);
      }
    });

    summary.netProfit = summary.income - summary.expense;

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get transactions summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions summary',
    });
  }
});

// POST create transaction
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      invoiceNo, date, type, category, description,
      locationId, locationName, amount, paymentMethod, payeePayer
    } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Type and amount are required',
      });
    }

    const id = randomUUID();
    const createdBy = req.user?.email || 'Unknown';

    const result = await pool.query(
      `INSERT INTO financial_transactions (
        id, invoice_no, date, type, category, description, location_id,
        location_name, amount, payment_method, payee_payer, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *`,
      [
        id, invoiceNo, date || new Date().toISOString().split('T')[0],
        type, category, description, locationId, locationName,
        amount, paymentMethod, payeePayer, createdBy
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        invoiceNo: row.invoice_no,
        date: row.date,
        type: row.type,
        category: row.category,
        description: row.description,
        locationId: row.location_id,
        locationName: row.location_name,
        amount: row.amount,
        paymentMethod: row.payment_method,
        payeePayer: row.payee_payer,
        createdBy: row.created_by,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
    });
  }
});

export default router;
