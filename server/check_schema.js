const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'office_premises'
        `);
        for (const r of rows) {
            console.log('COL:', r.column_name);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
