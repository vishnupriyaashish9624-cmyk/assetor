const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_module_field_selection WHERE module_id = 6");
        console.table(rows);
    } catch (e) { console.error(e); }
}
run();
