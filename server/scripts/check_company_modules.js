const db = require('../config/db');

async function check() {
    try {
        const [rows] = await db.execute('SELECT * FROM company_modules WHERE module_id = 6');
        console.log("--- company_modules rows ---");
        console.log(JSON.stringify(rows, null, 2));

        const [master] = await db.execute("SELECT * FROM module_master WHERE module_name ILIKE '%vehicle%'");
        console.log("--- module_master ---");
        console.log(JSON.stringify(master, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
