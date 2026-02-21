const { pool } = require('../config/db');

(async () => {
    try {
        console.log('Connecting to DB...');
        const res = await pool.query('SELECT * FROM clients');
        console.log(`Found ${res.rows.length} clients.`);
        if (res.rows.length > 0) {
            console.log('First client:', res.rows[0]);
        }
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await pool.end();
    }
})();
