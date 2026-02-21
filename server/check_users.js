const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT id, email, company_id, role FROM users");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
