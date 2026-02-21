const required = (key, fallback) => {
    const v = process.env[key] ?? fallback;
    if (v === undefined || v === null || v === '') throw new Error(`Missing env: ${key}`);
    return v;
};

module.exports = {
    PORT: parseInt(process.env.PORT || '5021', 10),
    APP_NAME: process.env.APP_NAME || 'Trakio',
    APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:19006',

    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_SECURE: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    SMTP_USER: process.env.SMTP_USER || 'vishnupriyaashish9624@gmail.com',
    SMTP_PASS: process.env.SMTP_PASS || 'YOUR_SMTP_PASSWORD',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Trakio',
    MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER,

    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_ME'
};
