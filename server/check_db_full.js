const db = require('./config/db');
const fs = require('fs');

async function check() {
    try {
        const [pRows] = await db.execute('SELECT * FROM property_types');
        const [pmRows] = await db.execute('SELECT * FROM premises_types');
        const [vRows] = await db.execute('SELECT vehicle_id, vehicle_name, property_type_id, premises_type_id FROM vehicles LIMIT 5');

        let out = 'PROPERTY_TYPES:\n' + JSON.stringify(pRows, null, 2) + '\n\n';
        out += 'PREMISES_TYPES:\n' + JSON.stringify(pmRows, null, 2) + '\n\n';
        out += 'VEHICLES:\n' + JSON.stringify(vRows, null, 2) + '\n\n';

        fs.writeFileSync('check_full.txt', out);
    } catch (e) {
        fs.writeFileSync('check_full.txt', 'ERROR: ' + e.message);
    } finally {
        process.exit();
    }
}
check();
