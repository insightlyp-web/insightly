// migrate-ai-fields.js - Add AI-related fields to database
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
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute migration SQL
    const sqlPath = join(__dirname, 'sql', '003_add_ai_fields.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running migration: 003_add_ai_fields.sql');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added resume_json field to profiles table');
    console.log('   - Added GIN index for fast JSON queries');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42710') {
      console.log('   (Field already exists - migration may have already been run)');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateDatabase();

