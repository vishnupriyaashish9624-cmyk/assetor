const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
});

async function resetPassword() {
    const email = 'superadmin@trakio.com';
    const newHash = '$2b$10$XiQroGmZ9LLODpTpmp2VkORj2VpPuOeVCtdphYCV/fMIVMC1mLDPG';
    try {
        const res = await pool.query('UPDATE users SET password = $1 WHERE email = $2', [newHash, email]);
        console.log(`Updated ${res.rowCount} rows`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
resetPassword();
