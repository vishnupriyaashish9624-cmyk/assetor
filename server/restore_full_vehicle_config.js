const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', database: 'software_db' });

async function restoreFullVehicleConfig() {
    try {
        console.log('Restoring FULL Vehicle details configuration...');

        const keys = [
            'premises_type_name', 'model_year', 'has_chiler_', 'vehicle_body_type',
            'engine_no_', 'variant', 'seating_capacity', 'asset_code', 'owner_id',
            'plate_emirate', 'chassis_no_', 'vehicle_uses_', 'current_odometer',
            '_vehicle_category', 'country_name', 'tansmission_type', 'payload_kg',
            'id', 'chiller_brand', 'manufacturer', 'vehicle__id_', 'plate_no_',
            'chiller_serial_no', 'region', 'branch_id', 'fuel_type', 'vehicle_usage_id', 'model'
        ];

        // 1. Get or create "Vehicle details" section (Module 6, Company 1)
        const qSection = await pool.query("SELECT id FROM module_sections WHERE name = 'Vehicle details' AND module_id = 6 AND company_id = 1");
        let sectionId;
        if (qSection.rows.length > 0) {
            sectionId = qSection.rows[0].id;
        } else {
            const res = await pool.query("INSERT INTO module_sections (module_id, company_id, name, sort_order) VALUES (6, 1, 'Vehicle details', 10) RETURNING id");
            sectionId = res.rows[0].id;
        }

        // 2. Add fields
        for (const key of keys) {
            // Convert key to label: replace _ with space, title case
            const label = key.replace(/_+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

            await pool.query(
                `INSERT INTO module_section_fields (company_id, module_id, section_id, field_key, label, field_type, is_required, sort_order, is_active) 
                 VALUES (1, 6, $1, $2, $3, 'text', 0, 0, 1)
                 ON CONFLICT (company_id, section_id, field_key) DO NOTHING`,
                [sectionId, key, label]
            );
        }
        console.log(`Successfully registered ${keys.length} fields for Vehicle details.`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
}
restoreFullVehicleConfig();
