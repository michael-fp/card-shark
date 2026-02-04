import { readFileSync, readdirSync } from 'fs';
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
        // Get all migration files sorted by name
        const migrationsDir = join(__dirname, 'migrations');
        const migrationFiles = readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`📄 Found ${migrationFiles.length} migration files\n`);

        // Run each migration
        for (const file of migrationFiles) {
            const migrationPath = join(migrationsDir, file);
            const sql = readFileSync(migrationPath, 'utf8');

            console.log(`⏳ Running ${file}...`);

            try {
                await client.query(sql);
                console.log(`✅ ${file} completed`);
            } catch (err) {
                // Ignore "already exists" errors for idempotent migrations
                if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                    console.log(`⏭️  ${file} skipped (already applied)`);
                } else {
                    throw err;
                }
            }
        }

        console.log('\n✅ All migrations completed successfully!\n');

        // List created tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('📊 Tables in database:');
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
