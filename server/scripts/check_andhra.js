const db = require('../config/db');

async function check() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_modules WHERE region ILIKE '%Andhra%'");
        console.log("--- Rows with region Andhra ---");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
