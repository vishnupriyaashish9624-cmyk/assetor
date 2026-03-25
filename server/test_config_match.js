const db = require('./config/db');

async function checkDB() {
    try {
        const companyId = 1;
        const moduleId = 6;
        const countryId = 1; // India
        const vehicleUsageId = 999; // Non-existent

        // The real controller uses a more complex query with scoreParts.
        // Let's just check if there's any generic config for this company/module.
        const [rows] = await db.execute("SELECT * FROM company_modules WHERE company_id = ? AND module_id = ?", [companyId, moduleId]);
        console.log(`Total configs for module ${moduleId} in company ${companyId}:`, rows.length);
        console.log('Configs:', rows);
    } catch (e) {
        console.error(e);
    }
}

checkDB();
