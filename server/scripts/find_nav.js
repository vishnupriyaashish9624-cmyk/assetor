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
        const res = await client.query("SELECT id, name, email, role, company_id FROM users WHERE name ILIKE '%navaneetha%' OR name ILIKE '%krishna%'");
        console.log('User found:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
