const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_modules WHERE company_id = 1 AND module_id = 6 AND country_id = 2 AND vehicle_usage_id = 2");
        console.log('India (2) + Personal (2) configs:');
        console.table(rows);
    } catch (e) { console.error(e); }
}
run();
