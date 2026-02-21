const db = require('../config/db');

async function run() {
    try {
        console.log('--- ALL MODULES IN DB (module_master) ---');
        const [rows] = await db.execute('SELECT * FROM module_master ORDER BY module_name ASC');
        console.table(rows);

        const vehicle = rows.find(r => r.module_name === 'Vehicle');
        if (vehicle) {
            console.log('\n✅ VERIFIED: "Vehicle" exists in the database with ID:', vehicle.module_id);
        } else {
            console.log('\n❌ "Vehicle" is NOT in the database.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
