const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS smtp_configs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                host VARCHAR(255) NOT NULL,
                port INTEGER NOT NULL DEFAULT 587,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                encryption VARCHAR(10) DEFAULT 'tls',
                from_email VARCHAR(255) NOT NULL,
                from_name VARCHAR(255),
                reply_to VARCHAR(255),
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ smtp_configs table created or already exists.');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        pool.end();
    }
};

createTable();
