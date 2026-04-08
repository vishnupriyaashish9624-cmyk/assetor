const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'software_db',
    port: 5432,
});

async function restoreSuperAdmin() {
    try {
        const passwordHash = await bcrypt.hash('superadmin123', 10);

        const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', ['superadmin@trakio.com']);
        if (rows.length > 0) {
            await pool.query('UPDATE users SET password = $1, role = $2, company_id = 1 WHERE email = $3', [passwordHash, 'SUPER_ADMIN', 'superadmin@trakio.com']);
        } else {
            await pool.query(`
                INSERT INTO users (company_id, name, email, password, role, status)
                VALUES (1, 'Superadmin', 'superadmin@trakio.com', $1, 'SUPER_ADMIN', 'ACTIVE')
            `, [passwordHash]);
        }

        console.log('Superadmin account restored successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}
restoreSuperAdmin();
