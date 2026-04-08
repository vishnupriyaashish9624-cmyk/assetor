const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', database: 'software_db' });

async function restoreMissing() {
    try {
        console.log('Restoring missing Vehicle section...');

        const secRes = await pool.query("INSERT INTO module_sections (module_id, company_id, name, sort_order) VALUES (6, 1, 'Vehicle details', 10) RETURNING id");
        const vehicleSecId = secRes.rows[0].id;

        const vehicleFields = [
            { label: 'Vehicle Usage ID', key: 'vehicle_usage_id', type: 'number' },
            { label: 'Region', key: 'region', type: 'text' },
            { label: 'Country Name', key: 'country_name', type: 'text' },
            { label: 'Premises Type Name', key: 'premises_type_name', type: 'text' },
            { label: 'Vehicle ID', key: 'vehicle__id_', type: 'text' }
        ];

        for (const f of vehicleFields) {
            await pool.query(
                "INSERT INTO module_section_fields (company_id, module_id, section_id, field_key, label, field_type, is_required, sort_order, is_active) VALUES (1, 6, $1, $2, $3, $4, 0, 0, 1)",
                [vehicleSecId, f.key, f.label, f.type]
            );
        }
        console.log('Vehicle details restored.');

        console.log('Restoring missing File fields for Premises...');
        const premSecRes = await pool.query("INSERT INTO module_sections (module_id, company_id, name, sort_order) VALUES (1, 1, 'Legacy Attachments', 20) RETURNING id");
        const premSecId = premSecRes.rows[0].id;

        const premFields = [
            { label: 'Upload', key: 'upload', type: 'file' },
            { label: 'File', key: 'file_', type: 'file' },
            { label: 'Test File', key: 'test_file_', type: 'file' },
            { label: 'File Storing Now', key: 'file_stoing_now_', type: 'file' },
            { label: 'File Issue Date', key: 'file__issue_date', type: 'date' }
        ];

        for (const f of premFields) {
            await pool.query(
                "INSERT INTO module_section_fields (company_id, module_id, section_id, field_key, label, field_type, is_required, sort_order, is_active) VALUES (1, 1, $1, $2, $3, $4, 0, 0, 1)",
                [premSecId, f.key, f.label, f.type]
            );
        }
        console.log('Premises file fields restored.');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
}
restoreMissing();
