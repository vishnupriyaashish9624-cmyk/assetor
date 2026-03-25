
const { Pool } = require('pg');

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

const pool = new Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false }
});

async function checkRemoteColumns() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'company_modules'
        `);
        console.log('--- Remote company_modules Columns ---');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRemoteColumns();
