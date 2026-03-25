const db = require('../config/db');

async function check() {
    try {
        const companyId = 1;
        const module_id = 6;
        const country_id = 2; // India

        const [usages] = await db.execute("SELECT id, name FROM vehicle_usage WHERE name ILIKE '%Personal%'");
        if (usages.length === 0) process.exit(1);
        const vehicle_usage_id = usages[0].id;
        const region = "Andhra Pradesh";

        let whereConditions = ['cm.company_id = ?', 'cm.module_id = ?'];
        let whereParams = [companyId, module_id];
        let scoreParts = ['100'];
        let selectParams = [];

        const addCondition = (val, field, scoreWeight) => {
            if (val) {
                whereConditions.push(`(cm.${field} = ? OR cm.${field} IS NULL)`);
                whereParams.push(val);
                scoreParts.push(`(CASE WHEN cm.${field} = ? THEN ${scoreWeight} ELSE (CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END) END)`);
                selectParams.push(val);
            } else {
                scoreParts.push(`(CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END)`);
            }
        };

        addCondition(country_id, 'country_id', 50);
        addCondition(null, 'property_type_id', 5);
        addCondition(null, 'premises_type_id', 5);
        addCondition(null, 'area_id', 5);
        addCondition(vehicle_usage_id, 'vehicle_usage_id', 40);

        if (region && region !== 'All') {
            whereConditions.push("(cm.region = ? OR cm.region IS NULL OR cm.region = 'All')");
            whereParams.push(region);
            scoreParts.push("(CASE WHEN cm.region = ? THEN 30 ELSE (CASE WHEN cm.region IS NULL OR cm.region = 'All' THEN 1 ELSE 0 END) END)");
            selectParams.push(region);
        } else {
            whereConditions.push("(cm.region IS NULL OR cm.region = 'All')");
            scoreParts.push('1');
        }

        const query = `
            SELECT * FROM (
                SELECT 
                    cm.id as company_module_id,
                    cm.region,
                    cm.vehicle_usage_id,
                    (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids,
                    (${scoreParts.join(' + ')}) as match_score
                FROM company_modules cm
                WHERE ${whereConditions.join(' AND ')}
            ) t
            WHERE t.selected_field_ids IS NOT NULL AND t.selected_field_ids <> ''
            ORDER BY t.match_score DESC, t.company_module_id DESC
        `;

        const finalParams = [...selectParams, ...whereParams];
        console.log("Params:", finalParams);

        const [rows] = await db.execute(query, finalParams);
        console.log("--- Query Results (Filtered) ---");
        console.log(JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
