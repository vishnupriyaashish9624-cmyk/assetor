const db = require('../config/db');

async function debugModuleMaster() {
    try {
        const companyId = 1; // Simulation of logged in user
        console.log(`Testing getModuleMaster query for companyId: ${companyId}`);

        const query = `
            SELECT 
                mm.module_id, mm.module_name, mm.is_active, mm.created_at,
                MAX(cm.id) as mapping_id,
                MAX(cm.country_id) as country_id,
                MAX(cm.property_type_id) as property_type_id,
                MAX(cm.premises_type_id) as premises_type_id,
                MAX(cm.area_id) as area_id,
                MAX(cm.status_id) as status_id,
                MAX(c.country_name) as country,
                MAX(prop.name) as property_type,
                MAX(pt.type_name) as premises_type,
                MAX(a.name) as section_area,
                MAX(cm.is_enabled::int) as is_enabled,
                (SELECT COUNT(*) FROM module_sections ms WHERE ms.module_id = mm.module_id AND ms.company_id = ?) as section_count,
                (SELECT COUNT(*) FROM module_section_fields mf WHERE mf.module_id = mm.module_id AND mf.company_id = ?) as field_count,
                (SELECT string_agg(name, ', ') FROM module_sections ms WHERE ms.module_id = mm.module_id AND ms.company_id = ?) as section_names
            FROM module_master mm
            LEFT JOIN company_modules cm ON mm.module_id = cm.module_id AND cm.company_id = ?
            LEFT JOIN countries c ON c.id = cm.country_id
            LEFT JOIN property_types prop ON prop.id = cm.property_type_id
            LEFT JOIN premises_types pt ON pt.id = cm.premises_type_id
            LEFT JOIN area a ON a.id = cm.area_id
            WHERE mm.is_active = 1 
            GROUP BY mm.module_id, mm.module_name, mm.is_active, mm.created_at
            ORDER BY mm.module_name
        `;

        const [rows] = await db.execute(query, [companyId, companyId, companyId, companyId]);
        console.log(`Query returned ${rows.length} rows.`);
        console.log(JSON.stringify(rows, null, 2));

    } catch (error) {
        console.error('Query Failed:', error);
    } finally {
        process.exit(0);
    }
}

debugModuleMaster();
