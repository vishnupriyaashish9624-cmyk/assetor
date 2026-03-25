const db = require('./config/db');
async function run() {
    try {
        console.log('--- module_master ---');
        const [rows1] = await db.execute("SELECT * FROM module_master");
        console.table(rows1);

        console.log('--- modules_master ---');
        const [rows2] = await db.execute("SELECT * FROM modules_master");
        console.table(rows2);
    } catch (e) {
        console.error(e);
    }
}
run();
