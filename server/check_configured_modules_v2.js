const db = require('./config/db');
const fs = require('fs');
async function run() {
    try {
        const [rows] = await db.execute("SELECT cm.*, mm.module_name FROM company_modules cm JOIN module_master mm ON cm.module_id = mm.module_id");
        fs.writeFileSync('cm_list.json', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
