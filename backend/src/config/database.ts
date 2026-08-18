import { Pool } from 'pg';
import dotenv from 'dotenv';
import { hashPassword } from '../services/userStore.js';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ternak_monitor',
});
let isConnected = false;

pool.on('error', (err: Error) => {
  console.warn('Database connection error:', err.message);
  isConnected = false;
});

export default pool;

// Test connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    isConnected = true;
    return true;
  } catch (error) {
    console.warn('⚠️  Database connection failed. Running in mock mode.');
    console.error('Details:', error instanceof Error ? error.message : error);
    isConnected = false;
    return false;
  }
}

// Initialize database schema
export async function initializeDatabase() {
  if (!isConnected) {
    console.log('⚠️  Skipping database schema initialization (database not connected)');
    console.log('    Using in-memory mock data for development');
    return true;
  }

  try {
    console.log('Initializing database schema...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        phone VARCHAR(20),
        avatar_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'Aktif',
        location_ids TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER'`);
    await pool.query(`UPDATE users SET role = 'USER' WHERE role NOT IN ('OWNER', 'ADMIN', 'USER')`);

    const bootstrapEmail = process.env.BOOTSTRAP_OWNER_EMAIL;
    const bootstrapPassword = process.env.BOOTSTRAP_OWNER_PASSWORD;
    if (bootstrapEmail && bootstrapPassword) {
      await pool.query(
        `INSERT INTO users (email, password_hash, display_name, role, status)
         VALUES ($1, $2, $3, 'OWNER', 'Aktif')
         ON CONFLICT (email) DO NOTHING`,
        [bootstrapEmail.toLowerCase(), hashPassword(bootstrapPassword), process.env.BOOTSTRAP_OWNER_NAME || 'Owner Sapi Papi Farm']
      );
    }

    // Locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        pic_name VARCHAR(255),
        pic_phone VARCHAR(20),
        livestock_types TEXT[] DEFAULT '{}',
        pen_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Aktif',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Pens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER,
        current_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Livestock table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS livestock (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tag_id VARCHAR(50) UNIQUE NOT NULL,
        qr_code VARCHAR(100),
        type VARCHAR(50) NOT NULL,
        breed VARCHAR(100),
        gender VARCHAR(20),
        dob DATE,
        estimated_age_months INTEGER,
        color_traits VARCHAR(255),
        location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
        location_name VARCHAR(255),
        pen_id UUID REFERENCES pens(id) ON DELETE SET NULL,
        pen_name VARCHAR(255),
        ownership_status VARCHAR(100),
        source VARCHAR(100),
        entry_date DATE,
        acquisition_price BIGINT DEFAULT 0,
        initial_weight_kg DECIMAL(10, 2),
        current_weight_kg DECIMAL(10, 2),
        health_status VARCHAR(50) DEFAULT 'Sehat',
        breeding_status VARCHAR(50) DEFAULT 'Belum Dikawinkan',
        condition_category VARCHAR(50) DEFAULT 'Standar',
        status VARCHAR(50) DEFAULT 'Aktif',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Weight Records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        livestock_id UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
        tag_id VARCHAR(50),
        weigh_date DATE NOT NULL,
        weight_kg DECIMAL(10, 2),
        previous_weight_kg DECIMAL(10, 2),
        gain_kg DECIMAL(10, 2),
        officer_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Health Records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        livestock_id UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
        tag_id VARCHAR(50),
        record_date DATE NOT NULL,
        condition VARCHAR(255),
        symptoms TEXT,
        action_taken TEXT,
        medicine_name VARCHAR(255),
        dosage VARCHAR(100),
        officer_name VARCHAR(255),
        vet_name VARCHAR(255),
        follow_up_date DATE,
        status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Financial Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_no VARCHAR(100) UNIQUE,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
        location_name VARCHAR(255),
        amount BIGINT,
        payment_method VARCHAR(100),
        payee_payer VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Daily Reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        location_name VARCHAR(255),
        pop_initial INTEGER,
        pop_purchase INTEGER DEFAULT 0,
        pop_birth INTEGER DEFAULT 0,
        pop_transfer_in INTEGER DEFAULT 0,
        pop_sales INTEGER DEFAULT 0,
        pop_death INTEGER DEFAULT 0,
        pop_transfer_out INTEGER DEFAULT 0,
        pop_final INTEGER,
        healthy_count INTEGER,
        sick_count INTEGER,
        isolation_count INTEGER,
        in_treatment_count INTEGER,
        activities_text TEXT,
        officer_notes TEXT,
        report_status VARCHAR(50) DEFAULT 'Draft',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database schema initialized successfully!');
    return true;
  } catch (error) {
    console.warn('⚠️  Error initializing database schema:', error);
    return true; // Don't fail, continue with mock mode
  }
}

export function isDbConnected() {
  return isConnected;
}
