const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', rows.map(r => r.table_name));

        const [allCats] = await db.execute('SELECT * FROM asset_categories');
        console.log('asset_categories count:', allCats.length);

        // Check if "Asset_category" exists (case sensitive)
        try {
            const [otherCats] = await db.execute('SELECT * FROM "Asset_category"');
            console.log('"Asset_category" count:', otherCats.length);
            console.log('"Asset_category" data:', JSON.stringify(otherCats, null, 2));
        } catch (e) {
            console.log('"Asset_category" table does not exist or error:', e.message);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
