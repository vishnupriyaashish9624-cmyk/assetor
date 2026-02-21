const db = require('./config/db');
const fs = require('fs');

async function check() {
    try {
        const [rows] = await db.execute('SELECT * FROM vehicles LIMIT 1');
        const [pRows] = await db.execute('SELECT count(*) as count FROM property_types');
        const [pmRows] = await db.execute('SELECT count(*) as count FROM premises_types');

        let out = '';
        if (rows[0]) {
            out += 'VEHICLES columns: ' + JSON.stringify(Object.keys(rows[0])) + '\n';
            out += 'VEHICLES sample: ' + JSON.stringify(rows[0]) + '\n';
        } else { out += 'VEHICLES is empty\n'; }

        out += 'PROPERTY_TYPES count: ' + pRows[0].count + '\n';
        out += 'PREMISES_TYPES count: ' + pmRows[0].count + '\n';

        fs.writeFileSync('check_out.txt', out);
    } catch (e) {
        fs.writeFileSync('check_out.txt', 'ERROR: ' + e.message);
    } finally {
        process.exit();
    }
}
check();
