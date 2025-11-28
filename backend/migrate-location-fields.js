// migrate-location-fields.js - Add location-based attendance verification fields
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
  // Use DATABASE_URL if available, otherwise construct from individual env vars
  let client;
  
  if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL to get connection details
    const url = new URL(process.env.DATABASE_URL);
    client = new Client({
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1), // Remove leading /
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
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute migration file
    const migrationPath = join(__dirname, 'sql', '008_add_location_fields.sql');
    console.log(`Reading migration from: ${migrationPath}`);
    const migration = readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(migration);
    console.log('✅ Migration completed successfully!');

    // Verify columns were added
    const columnsResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'campus360_dev'
        AND table_name = 'attendance_sessions'
        AND column_name IN ('location_required', 'faculty_lat', 'faculty_lng', 'allowed_radius')
      ORDER BY column_name;
    `);

    console.log('\n📊 Added columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) - Default: ${row.column_default || 'NULL'}`);
    });

    if (columnsResult.rows.length === 4) {
      console.log('\n✅ All location fields added successfully!');
    } else {
      console.log(`\n⚠️  Expected 4 columns, found ${columnsResult.rows.length}`);
    }

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    if (error.code === '42701') {
      console.log('Note: Some columns may already exist. This is okay.');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

migrateDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

