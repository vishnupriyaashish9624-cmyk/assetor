const db = require('../config/db');

async function check() {
    try {
        const [rows] = await db.execute("SELECT COUNT(*) FROM company_module_field_selection WHERE company_module_id = 33");
        console.log("Count:", rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
