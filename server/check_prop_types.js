const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.execute('SELECT * FROM property_types');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
