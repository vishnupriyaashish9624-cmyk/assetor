const nodemailer = require('nodemailer');
const db = require('../../config/db');

async function getTransporter() {
    try {
        const [rows] = await db.execute('SELECT * FROM smtp_configs WHERE is_active = true LIMIT 1');

        if (rows.length > 0) {
            const config = rows[0];
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
                },
                connectionTimeout: 5000, // 5 seconds
                greetingTimeout: 5000,
            });
            // Attach config for use in mailer.js
            transporter._config = config;
            return transporter;
        }
    } catch (err) {
        console.warn('[Mailer] Could not fetch DB config, falling back to ENV:', err.message);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
    });
    return transporter;
}

module.exports = { getTransporter };
