const nodemailer = require('nodemailer');
const db = require('../config/db');

const sendEmail = async (to, subject, text, html) => {
    let transporter;
    let fromEmail = process.env.SMTP_FROM || '"Trakio System" <noreply@trakio.com>';

    try {
        // 1. Try to fetch active SMTP config from DB
        const [configs] = await db.execute('SELECT * FROM smtp_configs WHERE is_active = true LIMIT 1');

        if (configs.length > 0) {
            const config = configs[0];
            console.log(`[Email] Using DB Config: ${config.name}`);

            transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.encryption === 'ssl', // true for 465, false for other ports usually
                auth: {
                    user: config.username,
                    pass: config.password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            fromEmail = config.from_email;
            if (config.from_name) {
                fromEmail = `"${config.from_name}" <${config.from_email}>`;
            }
        } else {
            // 2. Fallback to Environment Variables
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                console.log('[Email] Using Env Variables Config');
                transporter = nodemailer.createTransport({
                    service: 'gmail', // Default fallback
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
            }
        }

        // 3. Mock if no config found
        if (!transporter) {
            console.log('[Email Mock] Service not configured. Email would be sent to:', to);
            console.log('[Email Mock] Subject:', subject);
            console.log('[Email Mock] Content:', text);
            return;
        }

        const info = await transporter.sendMail({
            from: fromEmail,
            to,
            subject: subject,
            text,
            html,
            replyTo: configs.length > 0 && configs[0].reply_to ? configs[0].reply_to : undefined
        });

        console.log('Email sent: %s', info.messageId);
        return info;

    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback to mock logic just to see what would have been sent? 
        // No, better to throw or log error clearly.
    }
};

module.exports = { sendEmail };
