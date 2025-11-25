// migrate-attendance-summary.js - Add attendance_summary table
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateDatabase() {
  let client;
  
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    client = new Client({
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: process.env.NODE_ENV === "test" ? false : { rejectUnauthorized: false }
    });
  } else {
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === "test" ? false : { rejectUnauthorized: false }
    });
  }

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = join(__dirname, 'sql', '005_add_attendance_summary.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running migration: 005_add_attendance_summary.sql');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added attendance_summary table');
    console.log('   - Added indexes for faster queries');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P16' || error.code === '42710') {
      console.log('   (Table/column already exists - migration may have already been run)');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateDatabase();

