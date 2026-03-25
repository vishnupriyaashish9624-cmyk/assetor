const db = require('./config/db');

async function testMatch85() {
    try {
        const companyId = 85;
        const moduleId = 6;
        const countryId = 2; // India
        const vehicleUsageId = 2; // Personal
        const region = 'Andhra Pradesh';

        // Same logic as controller
        let whereConditions = ['cm.company_id = ?', 'cm.module_id = ?'];
        let whereParams = [companyId, moduleId];
        let scoreParts = ['100'];
        let selectParams = [];

        const addCondition = (val, field, scoreWeight) => {
            if (val) {
                whereConditions.push(`(cm.${field} = ? OR cm.${field} IS NULL)`);
                whereParams.push(val);
                scoreParts.push(`(CASE WHEN cm.${field} = ? THEN ${scoreWeight} ELSE (CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END) END)`);
                selectParams.push(val);
            } else {
                whereConditions.push(`cm.${field} IS NULL`);
                scoreParts.push(`(CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END)`);
            }
        };

        addCondition(countryId, 'country_id', 50);
        addCondition(null, 'property_type_id', 5);
        addCondition(null, 'premises_type_id', 5);
        addCondition(null, 'area_id', 5);
        addCondition(vehicleUsageId, 'vehicle_usage_id', 40);

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
            SELECT 
                cm.id as company_module_id,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids,
                (${scoreParts.join(' + ')}) as match_score
            FROM company_modules cm
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY match_score DESC, cm.id DESC
            LIMIT 1
        `;

        const [rows] = await db.execute(query, [...selectParams, ...whereParams]);
        console.log('Match Result for Company 85:', rows);
    } catch (e) { console.error(e); }
}

testMatch85();
