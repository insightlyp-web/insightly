// migrate-student-fields.js - Add student fields migration
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
    });
  } else {
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'campusai',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
  }

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');

    // Read and execute migration file
    const migrationPath = join(__dirname, 'sql', '002_add_student_fields.sql');
    console.log(`Reading migration from: ${migrationPath}`);
    const migration = readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await client.query(migration);
    console.log('✅ Student fields migration completed successfully!');

    // Verify columns were added
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'campus360_dev'
        AND table_name = 'profiles'
        AND column_name IN ('academic_year', 'student_year', 'section', 'roll_number')
      ORDER BY column_name;
    `);

    console.log('\n📊 Added columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });

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

