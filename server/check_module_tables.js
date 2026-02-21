const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%module%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
