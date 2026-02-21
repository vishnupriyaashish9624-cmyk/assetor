const db = require('../config/db');

async function run() {
    try {
        console.log('--- Current Module Master ---');
        const [rows] = await db.execute('SELECT * FROM module_master ORDER BY module_id');
        console.table(rows);

        // Check for 'Vehicl' and fix it if found
        const typo = rows.find(r => r.module_name === 'Vehicl');
        if (typo) {
            console.log(`Found typo "Vehicl" at ID ${typo.module_id}. Fixing to "Vehicle"...`);
            await db.execute('UPDATE module_master SET module_name = ? WHERE module_id = ?', ['Vehicle', typo.module_id]);
            console.log('Fixed.');
        } else {
            console.log('No "Vehicl" typo found.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
