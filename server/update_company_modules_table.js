const db = require('./config/db');
async function update() {
    try {
        console.log('Adding vehicle_usage_id to company_modules...');
        // 1. Add column
        const [cols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'company_modules' AND column_name = 'vehicle_usage_id'");
        if (cols.length === 0) {
            await db.execute("ALTER TABLE company_modules ADD COLUMN vehicle_usage_id integer REFERENCES vehicle_usage(id)");
            console.log('Added vehicle_usage_id column.');
        } else {
            console.log('Column already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
update();
