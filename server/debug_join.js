const db = require('./config/db');
const fs = require('fs');

async function check() {
    try {
        const [v] = await db.execute('SELECT vehicle_id, property_type_id FROM vehicles WHERE vehicle_id = 10');
        const [p] = await db.execute('SELECT * FROM property_types WHERE id = 1');
        const [join] = await db.execute('SELECT pt.name FROM vehicles v JOIN property_types pt ON v.property_type_id = pt.id WHERE v.vehicle_id = 10');

        fs.writeFileSync('check_debug.txt', JSON.stringify({ v, p, join }, null, 2));
    } catch (e) {
        fs.writeFileSync('check_debug.txt', 'ERROR: ' + e.message);
    } finally {
        process.exit();
    }
}
check();
