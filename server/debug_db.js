const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute('SELECT cm.id, cm.module_id, mm.module_name, cm.country_id, cm.property_type_id, cm.premises_type_id, cm.area_id FROM company_modules cm JOIN module_master mm ON cm.module_id = mm.module_id WHERE mm.module_name ILIKE $1', ['%vehicle%']);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
