const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
});

async function createSuperAdmin() {
    const email = 'superadmin@trakio.com';
    const passwordHash = '$2b$10$XiQroGmZ9LLODpTpmp2VkORj2VpPuOeVCtdphYCV/fMIVMC1mLDPG'; // superadmin123
    const name = 'Super Admin';
    const role = 'SUPER_ADMIN';

    try {
        // Check if exists
        const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [passwordHash, role, email]);
            console.log('Updated existing superadmin');
        } else {
            await pool.query('INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
                [name, email, passwordHash, role, 'ACTIVE']);
            console.log('Created new superadmin');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
createSuperAdmin();
