const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const resetPassword = async () => {
    try {
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const email = 'manu@gmail';

        // Update password and ensure force_reset is true so you can test the flow
        const result = await pool.query(
            'UPDATE users SET password = $1, force_reset = true WHERE email = $2 RETURNING *',
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            console.log(`✅ Password reset successfully for ${email}`);
            console.log(`🔑 New Password: ${password}`);
            console.log(`🔄 Force Reset: true (You will be asked to change it on login)`);
        } else {
            console.log(`❌ User ${email} not found.`);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        pool.end();
    }
};

resetPassword();
