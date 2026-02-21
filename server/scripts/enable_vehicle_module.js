const db = require('../config/db');

async function enableVehicle() {
    try {
        // 1. Get Vehicle Module ID
        const [modules] = await db.execute("SELECT module_id FROM module_master WHERE module_name = 'Vehicle'");
        if (modules.length === 0) {
            console.log('Vehicle module not found in master.');
            return;
        }
        const moduleId = modules[0].module_id;
        console.log('Vehicle Module ID:', moduleId);

        // 2. Check if enabled for company 1
        const companyId = 1; // Assuming company 1
        const [existing] = await db.execute("SELECT id FROM company_modules WHERE company_id = ? AND module_id = ?", [companyId, moduleId]);

        if (existing.length > 0) {
            console.log('Vehicle module already enabled for company 1, ID:', existing[0].id);
        } else {
            console.log('Enabling Vehicle module for company 1...');
            /* 
               We need to insert into company_modules. 
               Columns: company_id, module_id, is_enabled, status_id, created_at, etc.
               Based on controller: 
               INSERT INTO company_modules (company_id, module_id, is_enabled, country_id, property_type_id, premises_type_id, area_id, status_id, created_at) ...
            */
            const [result] = await db.execute(
                "INSERT INTO company_modules (company_id, module_id, is_enabled, status_id, created_at) VALUES (?, ?, 1, 1, NOW())",
                [companyId, moduleId]
            );
            console.log('Enabled Vehicle module for company 1.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

enableVehicle();
