const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'module_sections'");
        console.log('Columns:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
