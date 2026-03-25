const db = require('./config/db');
async function run() {
    try {
        const [modules] = await db.execute("SELECT * FROM modules_master WHERE name ILIKE '%vehicle%'");
        console.log('Modules Master (Vehicle):', modules);

        if (modules.length > 0) {
            const mid = modules[0].module_id;
            const [sections] = await db.execute("SELECT * FROM module_sections WHERE module_id = ?", [mid]);
            console.log('Sections:', sections);

            for (const sec of sections) {
                const [fields] = await db.execute("SELECT * FROM module_section_fields WHERE section_id = ?", [sec.id]);
                console.log(`Fields for section ${sec.name}:`, fields.length);
            }
        }

    } catch (e) {
        console.error(e);
    }
}
run();
