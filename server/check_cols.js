const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'asset_categories'");
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}
run();
