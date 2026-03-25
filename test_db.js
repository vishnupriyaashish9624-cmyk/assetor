const db = require('./server/config/db');

async function test() {
    try {
        const [rows] = await db.execute('DESCRIBE assets');
        console.log(rows);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

test();
