const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_modules");
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}
run();
