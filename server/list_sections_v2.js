const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT id, name, module_id, company_id FROM module_sections ORDER BY id DESC LIMIT 10");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
