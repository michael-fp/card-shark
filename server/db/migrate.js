import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
    console.log('🚀 Starting database migration...\n');

    const client = await pool.connect();

    try {
        // Read migration file
        const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
        const sql = readFileSync(migrationPath, 'utf8');

        console.log('📄 Running 001_initial_schema.sql...');

        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // List created tables
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('📊 Tables created:');
        result.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
