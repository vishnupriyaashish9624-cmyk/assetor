const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute('SELECT id, name FROM companies LIMIT 10');
        console.log('Companies:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
