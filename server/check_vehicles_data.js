const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.execute("SELECT vehicle_name, vehicle_usage, area_id FROM vehicles LIMIT 10");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
