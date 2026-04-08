const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'software_db',
    port: parseInt(process.env.DB_PORT || 5432, 10),
    ssl: {
        rejectUnauthorized: false
    }
});

async function addVehiclePurchasesSectionAndFields() {
    try {
        const modRes = await pool.query("SELECT module_id FROM module_master WHERE module_name = 'Vehicle'");
        if (modRes.rows.length === 0) {
            console.error('Vehicle module not found');
            return;
        }
        const moduleId = modRes.rows[0].module_id;
        console.log(`Found Vehicle module ID: ${moduleId}`);

        let sectionRes = await pool.query("SELECT id FROM module_sections WHERE module_id = $1 AND name = 'Vehicle Purchases'", [moduleId]);
        let sectionId;

        if (sectionRes.rows.length === 0) {
            console.log('Creating "Vehicle Purchases" section...');
            const insertSecRes = await pool.query(
                "INSERT INTO module_sections (company_id, module_id, name, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
                [1, moduleId, 'Vehicle Purchases', 6]
            );
            sectionId = insertSecRes.rows[0].id;
        } else {
            sectionId = sectionRes.rows[0].id;
        }

        const fields = [
            { key: 'purchase_ref_no', label: 'Purchase Reference No', type: 'text' },
            { key: 'vendor_name', label: 'Vendor', type: 'text' },
            { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
            { key: 'invoice_no', label: 'Invoice No', type: 'text' },
            { key: 'base_amount', label: 'Base Amount', type: 'number' },
            { key: 'vat_amount', label: 'VAT Amount', type: 'number' },
            { key: 'registration_amount', label: 'Registration Amount', type: 'number' },
            { key: 'insurance_amount', label: 'Insurance Amount', type: 'number' },
            { key: 'accessory_amount', label: 'Accessory Amount', type: 'number' },
            { key: 'other_initial_cost', label: 'Other Initial Cost', type: 'number' },
            { key: 'total_acquisition_cost', label: 'Total Acquisition Cost', type: 'number' },
            { key: 'finance_flag', label: 'Under Finance?', type: 'radio', options: ['Yes', 'No'] }
        ];

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            const fieldCheck = await pool.query("SELECT id FROM module_section_fields WHERE section_id = $1 AND field_key = $2", [sectionId, f.key]);
            if (fieldCheck.rows.length === 0) {
                console.log(`Adding field: ${f.label} (${f.key})...`);
                const insertFieldRes = await pool.query(
                    "INSERT INTO module_section_fields (company_id, module_id, section_id, label, field_key, field_type, sort_order, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id",
                    [1, moduleId, sectionId, f.label, f.key, f.type, (i + 1), 1]
                );
                const fieldId = insertFieldRes.rows[0].id;
                if (f.options) {
                    for (let j = 0; j < f.options.length; j++) {
                        await pool.query("INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order, created_at) VALUES ($1, $2, $3, $4, NOW())", [fieldId, f.options[j], f.options[j], j]);
                    }
                }
            }
        }
        console.log('Finished adding Vehicle Purchases section and fields.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

addVehiclePurchasesSectionAndFields();
