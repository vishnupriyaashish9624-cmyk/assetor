const db = require('./config/db');
async function run() {
    try {
        await db.execute('DROP TABLE IF EXISTS \"Asset_category\"');
        console.log('Successfully dropped \"Asset_category\"');

        // Also check if id 5 has parent_id pointing to itself or something
        const [row] = await db.execute('SELECT * FROM asset_categories WHERE name = \'IT Equipment\'');
        console.log('Current IT Equipment row:', row);

    } catch (e) { console.error(e); }
}
run();
