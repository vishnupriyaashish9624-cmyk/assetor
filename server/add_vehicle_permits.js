const { Client } = require('pg');

async function addVehiclePermitSectionAndFields() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'software_db',
        password: '',
        port: 5432
    });

    try {
        await client.connect();

        // 1. Find the module ID for "Vehicle"
        const modRes = await client.query("SELECT module_id FROM module_master WHERE module_name = 'Vehicle'");
        const moduleId = modRes.rows[0].module_id; // Usually 6
        console.log(`Found Vehicle module ID: ${moduleId}`);

        // 2. Check if "Vehicle Permit" section already exists
        let sectionRes = await client.query("SELECT id FROM module_sections WHERE module_id = $1 AND name = 'Vehicle Permit'", [moduleId]);
        let sectionId;

        if (sectionRes.rows.length === 0) {
            console.log('Creating "Vehicle Permit" section...');
            const insertSecRes = await client.query(
                "INSERT INTO module_sections (company_id, module_id, name, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
                [1, moduleId, 'Vehicle Permit', 4] // I'll set sort_order 4 to follow 1, 2, 3
            );
            sectionId = insertSecRes.rows[0].id;
        } else {
            sectionId = sectionRes.rows[0].id;
            console.log(`"Vehicle Permit" section already exists (ID: ${sectionId}). Adding fields...`);
        }

        // 3. Define fields to add
        const fields = [
            { key: 'permit_type', label: 'Permit Type', type: 'dropdown', options: [] }, // Initially empty or text
            { key: 'permit_no', label: 'Permit Number', type: 'text' },
            { key: 'issue_date', label: 'Issue Date', type: 'date' },
            { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
            { key: 'issuing_authority', label: 'Issuing Authority', type: 'text' },
            { key: 'renewal_cost', label: 'Renewal Cost', type: 'number' },
            { key: 'status', label: 'Status', type: 'dropdown', options: ['Active', 'Expired', 'Renewed'] }
        ];

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];

            // Check if field already exists
            const fieldCheck = await client.query("SELECT id FROM module_section_fields WHERE section_id = $1 AND field_key = $2", [sectionId, f.key]);
            if (fieldCheck.rows.length === 0) {
                console.log(`Adding field: ${f.label} (${f.key})...`);
                const insertFieldRes = await client.query(
                    "INSERT INTO module_section_fields (company_id, module_id, section_id, label, field_key, field_type, sort_order, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id",
                    [1, moduleId, sectionId, f.label, f.key, f.type, (i + 1), 1]
                );
                const fieldId = insertFieldRes.rows[0].id;

                if (f.options && f.options.length > 0) {
                    console.log(`Adding options for field ${fieldId}...`);
                    for (let j = 0; j < f.options.length; j++) {
                        await client.query(
                            "INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order, created_at) VALUES ($1, $2, $3, $4, NOW())",
                            [fieldId, f.options[j], f.options[j], j]
                        );
                    }
                }
            } else {
                console.log(`Field ${f.label} (${f.key}) already exists. Skipping.`);
            }
        }

        console.log('Finished adding Vehicle Permit section and fields.');

    } catch (err) {
        console.error('Error during database operation:', err);
    } finally {
        await client.end();
    }
}

addVehiclePermitSectionAndFields();
