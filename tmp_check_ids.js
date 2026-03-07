const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const db = require('./server/config/db');

async function checkIds() {
    try {
        const [rows] = await db.execute(`
            SELECT field_value 
            FROM vehicle_module_details 
            WHERE field_key LIKE '%id%' 
               OR field_value LIKE 'VH-%'
            ORDER BY field_value DESC 
            LIMIT 20
        `);
        console.log('Last 20 IDs:', rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkIds();
