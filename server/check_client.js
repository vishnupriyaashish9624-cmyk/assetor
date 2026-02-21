const db = require('./config/db');

async function checkClient() {
    try {
        const [rows] = await db.execute("SELECT id, name, client_id FROM companies WHERE id = 74");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkClient();
