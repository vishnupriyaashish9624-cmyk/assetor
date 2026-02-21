const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        rows.forEach(r => console.log(r.table_name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
