const db = require('../config/db');

async function seedVehicleStructure() {
    try {
        console.log('Starting Vehicle module seeding...');

        // 1. Get Vehicle Module ID
        const [modules] = await db.execute("SELECT module_id FROM module_master WHERE module_name = 'Vehicle'");
        if (modules.length === 0) {
            console.log('Vehicle module not found in module_master. Please run add_vehicle_module.js first.');
            return;
        }
        const moduleId = modules[0].module_id;
        console.log('Vehicle Module ID:', moduleId);

        // 2. Clear existing sections/fields to avoid duplicates if re-run
        // In a real production app you'd want to be more careful, but for this fix it's better to ensure a clean state
        const [existingSections] = await db.execute("SELECT id FROM module_sections WHERE module_id = ?", [moduleId]);
        if (existingSections.length > 0) {
            console.log(`Found ${existingSections.length} existing sections for Vehicle. Cleaning up...`);
            const sectionIds = existingSections.map(s => s.id);
            const placeholders = sectionIds.map(() => '?').join(',');

            // Delete field options first
            await db.execute(`DELETE FROM module_section_field_options WHERE field_id IN (SELECT id FROM module_section_fields WHERE section_id IN (${placeholders}))`, sectionIds);
            // Delete fields
            await db.execute(`DELETE FROM module_section_fields WHERE section_id IN (${placeholders})`, sectionIds);
            // Delete sections
            await db.execute(`DELETE FROM module_sections WHERE module_id = ?`, [moduleId]);
        }

        // 3. Define Sections and Fields
        const structure = [
            {
                name: 'General Information',
                sort_order: 1,
                fields: [
                    { label: 'Manufacturer', key: 'manufacturer', type: 'text', required: 1, sort: 1 },
                    { label: 'Model', key: 'model', type: 'text', required: 1, sort: 2 },
                    { label: 'Year', key: 'year', type: 'number', required: 1, sort: 3 },
                    { label: 'Vehicle Type', key: 'vehicle_type', type: 'dropdown', required: 1, sort: 4, options: ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Other'] },
                    { label: 'Color', key: 'color', type: 'text', required: 0, sort: 5 },
                    { label: 'VIN Number', key: 'vin_number', type: 'text', required: 1, sort: 6 }
                ]
            },
            {
                name: 'Registration & Insurance',
                sort_order: 2,
                fields: [
                    { label: 'License Plate Number', key: 'license_plate', type: 'text', required: 1, sort: 1 },
                    { label: 'Registration Expiry Date', key: 'reg_expiry_date', type: 'date', required: 1, sort: 2 },
                    { label: 'Insurance Provider', key: 'insurance_provider', type: 'text', required: 0, sort: 3 },
                    { label: 'Insurance Policy Number', key: 'insurance_policy_no', type: 'text', required: 0, sort: 4 },
                    { label: 'Insurance Expiry Date', key: 'ins_expiry_date', type: 'date', required: 0, sort: 5 }
                ]
            },
            {
                name: 'Technical Specifications',
                sort_order: 3,
                fields: [
                    { label: 'Fuel Type', key: 'fuel_type', type: 'dropdown', required: 1, sort: 1, options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'] },
                    { label: 'Transmission', key: 'transmission', type: 'dropdown', required: 1, sort: 2, options: ['Manual', 'Automatic', 'CVT'] },
                    { label: 'Engine Number', key: 'engine_number', type: 'text', required: 0, sort: 3 },
                    { label: 'Mileage (at acquisition)', key: 'acquisition_mileage', type: 'number', required: 0, sort: 4 }
                ]
            }
        ];

        // 4. Insert into database
        for (const sec of structure) {
            console.log(`Creating section: ${sec.name}`);
            const [secResult] = await db.execute(
                "INSERT INTO module_sections (module_id, company_id, name, sort_order) VALUES (?, 1, ?, ?) RETURNING id",
                [moduleId, sec.name, sec.sort_order]
            );
            const sectionId = secResult[0].id;

            for (const f of sec.fields) {
                console.log(`  Adding field: ${f.label}`);
                const [fieldResult] = await db.execute(
                    "INSERT INTO module_section_fields (company_id, module_id, section_id, field_key, label, field_type, is_required, sort_order, is_active) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 1) RETURNING id",
                    [moduleId, sectionId, f.key, f.label, f.type, f.required, f.sort]
                );
                const fieldId = fieldResult[0].id;

                if (f.options) {
                    for (let i = 0; i < f.options.length; i++) {
                        const opt = f.options[i];
                        await db.execute(
                            "INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order) VALUES (?, ?, ?, ?)",
                            [fieldId, opt, opt.toUpperCase().replace(/\s+/g, '_'), i]
                        );
                    }
                }
            }
        }

        console.log('Vehicle module structure seeded successfully!');

    } catch (e) {
        console.error('Seeding error:', e);
    } finally {
        process.exit(0);
    }
}

seedVehicleStructure();
