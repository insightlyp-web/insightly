// init-db.js - Initialize database schema
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
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

    // Read and execute schema file
    const schemaPath = join(__dirname, 'sql', '001_schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schema);
    console.log('✅ Database schema initialized successfully!');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'campus360_dev'
      ORDER BY table_name;
    `);

    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if assessments table exists
    const assessmentsCheck = tablesResult.rows.find(r => r.table_name === 'assessments');
    if (assessmentsCheck) {
      console.log('\n✅ Assessments table exists!');
    } else {
      console.log('\n⚠️  Assessments table not found!');
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (error.code === '42P07') {
      console.log('Note: Some tables may already exist. This is okay.');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

initDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

