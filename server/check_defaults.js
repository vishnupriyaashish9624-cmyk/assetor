const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute(`
            SELECT column_name, column_default
            FROM information_schema.columns 
            WHERE table_name = 'office_premises' AND column_name = 'premise_id'
        `);
        console.log('Default for premise_id:', rows[0]?.column_default);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
