// Run migration to add stipend column
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add stipend column to placement_posts...');
    
    // Read migration file
    const migrationPath = join(__dirname, 'sql', '011_add_stipend_to_placement_posts.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify column exists
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'campus360_dev' 
      AND table_name = 'placement_posts' 
      AND column_name = 'stipend';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Verified: stipend column exists in placement_posts table');
    } else {
      console.log('⚠️  Warning: Could not verify stipend column exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42703') {
      console.log('Note: Column might already exist. This is okay.');
    }
    process.exit(1);
  }
}

runMigration();

