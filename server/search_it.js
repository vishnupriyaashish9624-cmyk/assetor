const db = require('./config/db');
async function run() {
    try {
        const [rows1] = await db.execute("SELECT * FROM asset_categories WHERE name ILIKE 'it%'");
        console.log('asset_categories:', rows1);

        const [rows2] = await db.execute("SELECT * FROM \"Asset_category\" WHERE name ILIKE 'it%'");
        console.log('"Asset_category":', rows2);

        const [rows3] = await db.execute("SELECT * FROM asset_categories WHERE name ILIKE 'it equipment'");
        console.log('asset_categories (full):', rows3);
    } catch (e) {
        console.error(e);
    }
}
run();
