import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool, Client } = pg;

const dbName = process.env.PGDATABASE || 'shift_db';
const dbUser = process.env.PGUSER || 'postgres';
const dbPassword = process.env.PGPASSWORD || 'postgres';
const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '5432', 10);

// Configure connection options with environment fallback
const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

export const query = (text, params) => pool.query(text, params);

/**
 * Automatically create the database if it doesn't exist,
 * and initialize all tables from schema.sql.
 */
export async function initDatabase() {
  // Step 1: Connect to default 'postgres' database to check/create target database
  try {
    const adminClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: 'postgres',
    });

    await adminClient.connect();
    const checkDb = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created successfully.`);
    }
    await adminClient.end();
  } catch (err) {
    // If connecting to 'postgres' fails, attempt direct connection anyway
    console.warn(`[DB Check] Could not verify database existence via admin connection: ${err.message}`);
  }

  // Step 2: Connect to target database and create tables
  try {
    const client = await pool.connect();
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      
      // Ensure master admin user exists
      const salt = await bcrypt.genSalt(10);
      const adminPassHash = await bcrypt.hash('admin123', salt);
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, is_verified, created_date, updated_date)
        VALUES ('usr_admin_master_001', 'admin@gmail.com', $1, 'admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin', is_verified = TRUE;
      `, [adminPassHash]);
      
      console.log(`✓ PostgreSQL tables initialized and admin@gmail.com verified in "${dbName}"`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('⚠ PostgreSQL connection failed. Ensure PostgreSQL is running on localhost:5432.');
    console.error(`  Error message: ${err.message}`);
    console.error(`  Check your credentials in .env (PGUSER, PGPASSWORD, PGDATABASE)`);
  }
}

export default pool;
