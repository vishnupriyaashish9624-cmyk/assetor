const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findMeenu() {
    try {
        const res = await pool.query("SELECT id, name, email, role, force_reset, status FROM users WHERE LOWER(name) LIKE '%meenu%' OR LOWER(email) LIKE '%meenu%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findMeenu();
