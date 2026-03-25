
const db = require('./config/db');

async function checkLocalTables() {
    try {
        const tables = ['company_modules', 'module_master'];
        for (const table of tables) {
            const [rows] = await db.execute(`SELECT * FROM ${table} LIMIT 1`);
            console.log(`Columns in local ${table}:`);
            if (rows.length > 0) {
                console.log(Object.keys(rows[0]));
            } else {
                console.log(`No data in ${table}`);
                // Try to get columns anyway
                const [cols] = await db.execute(`SHOW COLUMNS FROM ${table}`);
                console.log(cols.map(c => c.Field));
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

checkLocalTables();
