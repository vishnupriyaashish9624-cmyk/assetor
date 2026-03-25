const db = require('./config/db');

async function listAll() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_modules WHERE company_id = 1 AND module_id = 6");
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}

listAll();
