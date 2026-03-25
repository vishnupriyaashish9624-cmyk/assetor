
const { Pool } = require('pg');

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

const pool = new Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false }
});

async function findTable() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%company%' OR table_name LIKE '%module%')
        `);
        console.log('--- Relevant Tables on Render ---');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findTable();
