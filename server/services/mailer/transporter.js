const nodemailer = require('nodemailer');
const db = require('../../config/db');

async function getTransporter(clientId = null) {
    try {
        let config = null;

        // 1. Try Client-specific config
        if (clientId) {
            const [clientRows] = await db.execute('SELECT * FROM clients WHERE id = ? LIMIT 1', [clientId]);
            if (clientRows.length > 0 && clientRows[0].smtp_host) {
                const c = clientRows[0];
                config = {
                    host: c.smtp_host,
                    port: c.smtp_port,
                    username: c.smtp_user,
                    password: c.smtp_pass,
                    encryption: c.smtp_encryption,
                    from_email: c.smtp_from_email,
                    from_name: c.smtp_from_name
                };
            }
        }

        // 2. Try Global DB config
        if (!config) {
            const [rows] = await db.execute('SELECT * FROM smtp_configs WHERE is_active = true LIMIT 1');
            if (rows.length > 0) {
                config = rows[0];
            }
        }

        if (config) {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.encryption === 'ssl',
                auth: {
                    user: config.username || config.user,
                    pass: config.password || config.pass
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
        console.warn('[Mailer] Error fetching SMTP config, falling back to ENV:', err.message);
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
