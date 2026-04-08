const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
});

async function runMigrate() {
    try {
        await pool.query('ALTER TABLE office_premises ADD COLUMN IF NOT EXISTS region VARCHAR(255)');
        console.log('Migration done.');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
runMigrate();
