const db = require('../config/db');

async function setup() {
    console.log('⏳ Starting Vehicle Toll Account section registration...');
    const moduleId = 6; // Vehicle module
    const companyId = 1;

    try {
        const sectionName = 'Vehicle Toll Account';
        let [sectionRes] = await db.execute("SELECT id FROM module_sections WHERE module_id = ? AND name = ? AND company_id = ?", [moduleId, sectionName, companyId]);

        let sectionId;
        if (sectionRes.length === 0) {
            console.log('Creating section:', sectionName);
            const [insertSecRes] = await db.execute(
                "INSERT INTO module_sections (company_id, module_id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW()) RETURNING id",
                [companyId, moduleId, sectionName, 9] // after Insurance (8)
            );
            sectionId = insertSecRes.insertId;
            console.log('Section created with ID:', sectionId);
        } else {
            sectionId = sectionRes[0].id;
            console.log('Section already exists with ID:', sectionId);
        }

        const fields = [
            { key: 'provider_name', label: 'Provider Name (Salik/Other)', type: 'text' },
            { key: 'tag_no', label: 'Tag Number', type: 'text' }
        ];

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            const [fieldCheck] = await db.execute(
                "SELECT id FROM module_section_fields WHERE section_id = ? AND (field_key = ? OR label = ?)",
                [sectionId, f.key, f.label]
            );

            if (fieldCheck.length === 0) {
                console.log(`Adding field: ${f.label}`);
                const [insertFieldRes] = await db.execute(
                    "INSERT INTO module_section_fields (company_id, module_id, section_id, label, field_key, field_type, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) RETURNING id",
                    [companyId, moduleId, sectionId, f.label, f.key, f.type, (i + 1), 1]
                );
                console.log(`Field added with ID: ${insertFieldRes.insertId}`);
            } else {
                console.log(`Field already exists: ${f.label}`);
            }
        }

        console.log('✅ Vehicle Toll Account section and fields registered successfully!');
    } catch (e) {
        console.error('❌ Error in registration:', e.message);
    } finally {
        process.exit();
    }
}

setup();
