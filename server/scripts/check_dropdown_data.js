const db = require('../config/db');

async function checkData() {
    try {
        const tables = ['countries', 'premises_types', 'area', 'property_types', 'module_master'];

        for (const table of tables) {
            try {
                const [rows] = await db.execute(`SELECT count(*) as count FROM ${table}`);
                console.log(`${table}: ${rows[0].count} rows`);

                if (rows[0].count > 0) {
                    const [sample] = await db.execute(`SELECT * FROM ${table} LIMIT 1`);
                    console.log(`  Sample:`, sample[0]);
                }
            } catch (err) {
                console.error(`Error checking ${table}:`, err.message);
            }
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        process.exit();
    }
}

checkData();
