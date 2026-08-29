import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '5432', 10);
const dbUser = process.env.PGUSER || 'postgres';
const dbPassword = process.env.PGPASSWORD || 'postgres';
const dbName = process.env.PGDATABASE || 'shift_db';

export async function seedAdminUser() {
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    console.log(`[Seed Admin] Connected to ${dbName}`);

    const adminEmail = 'admin@gmail.com';
    const adminPass = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);
    const adminId = 'usr_admin_master_001';

    // Check if admin user already exists
    const existing = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, is_verified, created_date, updated_date)
         VALUES ($1, $2, $3, 'admin', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [adminId, adminEmail, passwordHash]
      );
      console.log(`✓ Admin user created successfully: ${adminEmail} (password: ${adminPass})`);
    } else {
      await client.query(
        `UPDATE users SET password_hash = $1, role = 'admin', is_verified = TRUE, updated_date = CURRENT_TIMESTAMP
         WHERE email = $2`,
        [passwordHash, adminEmail]
      );
      console.log(`✓ Admin user password & role updated: ${adminEmail} (password: ${adminPass})`);
    }
  } catch (err) {
    console.error('[Seed Admin Error]', err.message);
  } finally {
    await client.end();
  }
}

// Run directly if invoked from CLI
seedAdminUser();
