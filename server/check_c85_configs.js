const db = require('./config/db');
async function run() {
    try {
        const companyId = 85;
        const moduleId = 6;
        const [rows] = await db.execute("SELECT * FROM company_modules WHERE company_id = ? AND module_id = ?", [companyId, moduleId]);
        console.log(`Configs for company ${companyId}, module ${moduleId}:`);
        console.table(rows);
    } catch (e) { console.error(e); }
}
run();
