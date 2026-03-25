
const db = require('./config/db');

async function getCompany1() {
    try {
        const [rows] = await db.execute('SELECT * FROM companies WHERE id = 1');
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

getCompany1();
