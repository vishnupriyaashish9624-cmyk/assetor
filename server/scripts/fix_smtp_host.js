const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSmtpHost() {
    try {
        const res = await pool.query("UPDATE smtp_configs SET host = 'smtp.gmail.com' WHERE username LIKE '%gmail.com' AND host = 'gg'");
        console.log(`Updated ${res.rowCount} SMTP configuration(s).`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

updateSmtpHost();
