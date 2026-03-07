const db = require('./config/db');
async function sync() {
    try {
        console.log('Creating vehicle_usage table...');

        // 1. Create the table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_usage (
                id SERIAL PRIMARY KEY,
                name character varying(100) NOT NULL
            )
        `);

        // 2. Insert values if they don't exist
        const [rows] = await db.execute("SELECT id FROM vehicle_usage LIMIT 1");
        if (rows.length === 0) {
            await db.execute("INSERT INTO vehicle_usage (name) VALUES ('Commercial'), ('Personal')");
            console.log('Inserted Commercial and Personal options into vehicle_usage table.');
        } else {
            console.log('vehicle_usage table already has data.');
        }

        // 3. Add foreign key to vehicles if not present
        const [cols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_usage_id'");
        if (cols.length === 0) {
            await db.execute("ALTER TABLE vehicles ADD COLUMN vehicle_usage_id integer REFERENCES vehicle_usage(id)");
            console.log('Added vehicle_usage_id column to vehicles table.');

            // 4. Initial sync from existing area_id
            await db.execute("UPDATE vehicles SET vehicle_usage_id = 1 WHERE area_id = 1");
            await db.execute("UPDATE vehicles SET vehicle_usage_id = 2 WHERE area_id = 2");
            console.log('Synced existing vehicles from area_id to vehicle_usage_id.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
sync();
