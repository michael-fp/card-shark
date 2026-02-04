import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initStorage() {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        // Check if row exists
        const result = await client.query('SELECT * FROM storage_usage');
        console.log('Current storage_usage rows:', result.rows.length);
        console.log(result.rows);

        if (result.rows.length === 0) {
            console.log('Inserting initial row...');
            await client.query('INSERT INTO storage_usage (current_bytes) VALUES (0)');
            console.log('✅ Storage initialized!');
        } else {
            // Reset to 0
            console.log('Resetting current_bytes to 0...');
            await client.query('UPDATE storage_usage SET current_bytes = 0');
            console.log('✅ Storage reset!');
        }

        // Verify
        const verify = await client.query('SELECT * FROM storage_usage');
        console.log('Final state:', verify.rows);

    } finally {
        client.release();
        await pool.end();
    }
}

initStorage().catch(console.error);
