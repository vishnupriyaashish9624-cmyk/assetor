const db = require('./config/db');
const fs = require('fs');
async function run() {
    try {
        const [rows] = await db.execute("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'company_module_field_selection'");
        fs.writeFileSync('schema_defaults.json', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
