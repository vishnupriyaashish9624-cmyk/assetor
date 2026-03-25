
const db = require('./config/db');

async function checkLocalTable() {
    try {
        const [rows] = await db.execute('SELECT * FROM company_modules LIMIT 1');
        console.log('Columns in local company_modules:');
        if (rows.length > 0) {
            console.log(Object.keys(rows[0]));
            console.log('Row count:', rows.length);
        } else {
            console.log('No data found in local company_modules');
        }
    } catch (err) {
        console.error('Error checking local table:', err.message);
    } finally {
        process.exit(0);
    }
}

checkLocalTable();
