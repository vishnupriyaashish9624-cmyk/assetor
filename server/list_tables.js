const db = require('./config/db');
async function list() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(rows.map(x => x.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
list();
