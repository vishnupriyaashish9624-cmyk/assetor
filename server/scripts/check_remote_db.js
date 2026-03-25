/**
 * check_remote_db.js
 * Lists all tables in the remote ressosis_db on Render.
 */
const { Pool } = require('pg');

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

const pool = new Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false } // Required for Render
});

async function check() {
    console.log('⏳ Connecting to remote database...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected to remote database.');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`\n📦 Remote DB (ressoxis_db): ${res.rows.length} tables`);
        res.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.table_name}`));

        client.release();
    } catch (err) {
        console.error('❌ Error connecting to remote DB:', err.message);
    } finally {
        await pool.end();
    }
}

check();
