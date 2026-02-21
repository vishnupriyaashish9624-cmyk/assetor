const db = require('../config/db');

async function run() {
    try {
        console.log('Searching for "Veh%" in module_master...');
        const [rows] = await db.execute("SELECT * FROM module_master WHERE module_name ILIKE '%Veh%'");
        if (rows.length > 0) {
            console.log('Found matches:', rows);
            // Optionally update to "Vehicle"
            const match = rows[0];
            if (match.module_name !== 'Vehicle') {
                console.log(`Renaming "${match.module_name}" (ID ${match.module_id}) to "Vehicle"...`);
                await db.execute('UPDATE module_master SET module_name = ? WHERE module_id = ?', ['Vehicle', match.module_id]);
                console.log('Updated.');
            }
        } else {
            console.log('No matches found for "%Veh%".');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
