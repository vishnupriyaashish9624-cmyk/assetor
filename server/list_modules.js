const db = require('./config/db');
async function run() {
    try {
        const [modules] = await db.execute("SELECT * FROM modules_master");
        console.table(modules);
    } catch (e) {
        console.error(e);
    }
}
run();
