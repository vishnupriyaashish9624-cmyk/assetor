const db = require('./config/db');

async function run() {
    try {
        console.log('--- ALL RECORDS in asset_categories ---');
        const [rows] = await db.execute('SELECT id, company_id, name, length(name) as len, description FROM asset_categories');
        console.table(rows);

        console.log('--- ALL RECORDS in "Asset_category" ---');
        const [rows2] = await db.execute('SELECT id, company_id, name, length(name) as len FROM "Asset_category"');
        console.table(rows2);

        console.log('--- TABLES named similarly ---');
        const [tables] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%category%'");
        console.log(tables.map(t => t.table_name));

    } catch (e) {
        console.error(e);
    }
}
run();
