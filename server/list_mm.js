const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute('SELECT * FROM module_master');
        rows.forEach(r => console.log(JSON.stringify(r)));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
