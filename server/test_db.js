const db = require('./config/db');
async function test() {
    try {
        const [rows] = await db.execute('SELECT * FROM vehicle_usage');
        console.log('Rows:', JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}
test();
