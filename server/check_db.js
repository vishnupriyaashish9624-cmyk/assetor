
const db = require('./config/db');

async function checkData() {
    try {
        const tables = ['countries', 'premises_types', 'area', 'property_types', 'module_master'];
        for (const table of tables) {
            const [rows] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`Table ${table} has ${rows[0].count} rows.`);
            if (rows[0].count > 0) {
                const [data] = await db.execute(`SELECT * FROM ${table} LIMIT 5`);
                console.log(`Sample data for ${table}:`, data);
            }
        }
    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
