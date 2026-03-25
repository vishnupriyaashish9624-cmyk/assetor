const db = require('./config/db');
async function run() {
    try {
        const [schemas] = await db.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'asset_categories'");
        console.log('Schemas with asset_categories:', schemas);

        const [catSchemas] = await db.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'Asset_category'");
        console.log('Schemas with Asset_category:', catSchemas);

        const [triggers] = await db.execute("SELECT trigger_name, event_object_table FROM information_schema.triggers");
        console.log('Triggers:', triggers);

    } catch (e) { console.error(e); }
}
run();
