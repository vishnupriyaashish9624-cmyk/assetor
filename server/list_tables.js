const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(JSON.stringify(rows.map(r => r.table_name), null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
