const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%module%'");
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}
run();
