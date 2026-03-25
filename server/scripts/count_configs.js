const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'software_db'
});

async function run() {
    await client.connect();
    try {
        const res = await client.query("SELECT company_id, module_id, COUNT(*) as count FROM company_modules GROUP BY company_id, module_id ORDER BY count DESC");
        console.log('Configs by Company:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
