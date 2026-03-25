const db = require('./config/db');

async function run() {
    try {
        console.log('--- asset_categories (Searching for "it") ---');
        const [rows] = await db.execute("SELECT * FROM asset_categories WHERE name ILIKE '%it%'");
        console.table(rows);

        console.log('--- "Asset_category" (Searching for "it") ---');
        const [rows2] = await db.execute("SELECT * FROM \"Asset_category\" WHERE name ILIKE '%it%'");
        console.table(rows2);

        console.log('--- ALL TABLES ---');
        const [tables] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.map(t => t.table_name).sort());

    } catch (e) {
        console.error(e);
    }
}
run();
