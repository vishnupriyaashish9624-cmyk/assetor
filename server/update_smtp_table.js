const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const addDebugColumn = async () => {
    try {
        await pool.query(`
            ALTER TABLE smtp_configs 
            ADD COLUMN IF NOT EXISTS debug_mode BOOLEAN DEFAULT false;
        `);
        console.log('✅ Added debug_mode to smtp_configs.');
    } catch (err) {
        console.error('❌ Error altering table:', err);
    } finally {
        pool.end();
    }
};

addDebugColumn();
