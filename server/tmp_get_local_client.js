
const db = require('./config/db');

async function getClient3() {
    try {
        const [rows] = await db.execute('SELECT * FROM clients WHERE id = 3');
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

getClient3();
