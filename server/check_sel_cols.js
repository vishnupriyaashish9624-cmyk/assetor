const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'company_module_field_selection'");
        console.table(rows);
    } catch (e) { console.error(e); }
}
run();
