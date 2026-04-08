
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: 'postgres',
    database: 'software_db'
});

async function reset() {
    try {
        const hash = await bcrypt.hash('Trakio4040', 10);
        console.log('Hashed Trakio4040:', hash);
        const res = await pool.query("UPDATE users SET password = $1, force_reset = false WHERE email = 'vishnupriyaashish9624@gmail.com'", [hash]);
        console.log('Update Complete. Rows affected:', res.rowCount);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

reset();
