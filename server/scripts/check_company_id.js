const db = require('../config/db');

async function checkCompanyId() {
    try {
        const [rows] = await db.execute(`
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'module_sections' AND column_name = 'company_id';
        `);

        console.log('Result:', rows);

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        process.exit();
    }
}

checkCompanyId();
