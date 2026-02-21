const env = require('../../config/env');
const { getTransporter } = require('./transporter');
const templates = require('./templates');

async function sendMail({ to, subject, html, text }) {
    const transporter = await getTransporter();
    const config = transporter._config || {};

    const fromName = config.from_name || env.MAIL_FROM_NAME || 'Trakio';
    const fromEmail = config.from_email || env.MAIL_FROM_EMAIL || 'noreply@trakio.com';

    const from = `${fromName} <${fromEmail}>`;

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
    });

    return info;
}

async function sendWelcomeTempPassword({ name, email, tempPassword, companyName }) {
    const subject = `🚀 Welcome to ${env.APP_NAME} - Your Account is Ready!`;
    const html = templates.welcomeWithTempPassword({ name, email, tempPassword, companyName });
    const text = `Welcome to ${env.APP_NAME}. Your account is ready. Email: ${email}, Temp Password: ${tempPassword}. Login at ${env.APP_BASE_URL}`;

    return sendMail({ to: email, subject, html, text });
}

async function sendResetLink({ name, email, resetLink }) {
    const subject = `${env.APP_NAME} Password Reset`;
    const html = templates.resetLinkEmail({ name, resetLink });
    const text = `Reset your password: ${resetLink}`;

    return sendMail({ to: email, subject, html, text });
}

module.exports = { sendMail, sendWelcomeTempPassword, sendResetLink };
