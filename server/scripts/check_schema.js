const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users table:');
        console.table(res.rows);

        const resSmtp = await pool.query("SELECT * FROM smtp_configs WHERE is_active = true");
        console.log('\nActive SMTP Config:');
        if (resSmtp.rows.length > 0) {
            const config = resSmtp.rows[0];
            console.log(`Host: ${config.host}`);
            console.log(`Port: ${config.port}`);
            console.log(`User: ${config.username}`);
            console.log(`Pass: ${config.password}`);
            console.log(`Encryption: ${config.encryption}`);
        } else {
            console.log('No active SMTP config');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
