import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '5432', 10);
const dbUser = process.env.PGUSER || 'postgres';
const dbPassword = process.env.PGPASSWORD || 'postgres';
const dbName = process.env.PGDATABASE || 'shift_db';

async function runMigration() {
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    console.log(`Connected to database "${dbName}"`);

    // Alter student_profiles to ensure all columns exist
    const columns = [
      'graduation_date VARCHAR(100)',
      'experience TEXT',
      'employment_type VARCHAR(100)',
      'job_field VARCHAR(100)',
      'location VARCHAR(255)',
      'photo_url TEXT',
      'bio TEXT',
      'student_id VARCHAR(100)',
      'admin_notes TEXT',
      'skills JSONB DEFAULT \'[]\'',
      'verification_docs JSONB DEFAULT \'[]\'',
      'verification_status VARCHAR(32) DEFAULT \'pending\''
    ];

    for (const col of columns) {
      const colName = col.split(' ')[0];
      await client.query(`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS ${col}`);
      console.log(`✓ Ensured column student_profiles.${colName}`);
    }

    // Alter company_profiles to ensure all columns exist
    const companyCols = [
      'industry VARCHAR(255)',
      'org_type VARCHAR(100)',
      'location VARCHAR(255)',
      'website TEXT',
      'logo_url TEXT',
      'contact_person VARCHAR(255)',
      'contact_position VARCHAR(255)',
      'phone VARCHAR(50)',
      'email VARCHAR(255)',
      'legal_info TEXT',
      'description TEXT',
      'verification_status VARCHAR(32) DEFAULT \'pending\'',
      'admin_notes TEXT'
    ];

    for (const col of companyCols) {
      const colName = col.split(' ')[0];
      await client.query(`ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ${col}`);
      console.log(`✓ Ensured column company_profiles.${colName}`);
    }

    console.log('✅ All migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
