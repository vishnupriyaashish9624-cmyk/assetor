const db = require('./config/db');
async function updateUsage() {
    try {
        console.log('Updating vehicle_usage data...');
        // Update Commercial
        const [res1] = await db.execute("UPDATE vehicles SET vehicle_usage = 'Commercial' WHERE area_id = 1");
        console.log(`Updated ${res1.rowCount || res1.affectedRows} rows to Commercial`);

        // Update Personal
        const [res2] = await db.execute("UPDATE vehicles SET vehicle_usage = 'Personal' WHERE area_id = 2");
        console.log(`Updated ${res2.rowCount || res2.affectedRows} rows to Personal`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
updateUsage();
