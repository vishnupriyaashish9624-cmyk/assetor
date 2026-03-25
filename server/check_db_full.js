const db = require('./config/db');
async function run() {
    try {
        console.log('--- asset_categories ---');
        const [rows1] = await db.execute('SELECT * FROM asset_categories');
        console.table(rows1);

        console.log('--- "Asset_category" ---');
        const [rows2] = await db.execute('SELECT * FROM "Asset_category"');
        console.table(rows2);
    } catch (e) {
        console.error(e);
    }
}
run();
