const { Pool } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testConnection() {
    try {
        const res = await pool.query("SELECT * FROM smtp_configs WHERE is_active = true LIMIT 1");
        if (res.rows.length === 0) {
            console.error("No active SMTP config found");
            return;
        }
        const config = res.rows[0];
        console.log(`Testing with user: ${config.username}`);

        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.encryption === 'ssl',
            auth: {
                user: config.username,
                pass: config.password
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.verify();
        console.log("SUCCESS: Connection verified!");

        await transporter.sendMail({
            from: config.from_email,
            to: config.username, // Send to self for test
            subject: 'Trakio SMTP Connection Test',
            text: 'Your SMTP settings are now correctly configured and working!'
        });
        console.log("SUCCESS: Test email sent!");

    } catch (err) {
        console.error("FAILED:");
        console.error(err);
    } finally {
        await pool.end();
    }
}

testConnection();
