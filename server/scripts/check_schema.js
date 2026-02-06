const db = require('../config/db');

async function checkSchema() {
    try {
        console.log('--- Checking Schema for module_sections ---');

        // Postgres specific query to check columns
        const [rows] = await db.execute(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'module_sections';
        `);

        console.log(rows);

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        process.exit();
    }
}

checkSchema();
