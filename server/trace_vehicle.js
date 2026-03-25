const db = require('./config/db');
async function run() {
    try {
        const [sections] = await db.execute("SELECT * FROM module_sections WHERE module_id = 6");
        console.log('Sections for Module 6 (Vehicle):', sections);

        for (const sec of sections) {
            const [fields] = await db.execute("SELECT * FROM module_section_fields WHERE section_id = ?", [sec.id]);
            console.log(`- Section ${sec.name} has ${fields.length} fields`);
        }
    } catch (e) { console.error(e); }
}
run();
