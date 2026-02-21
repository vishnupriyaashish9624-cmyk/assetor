const db = require('../config/db');

async function run() {
    try {
        console.log('\n--- CHECK MODULE MASTER (ID 5) ---');
        const [master] = await db.execute('SELECT * FROM module_master WHERE module_id = 5');
        if (master.length > 0) {
            console.log('✅ Vehicle Module Found:', JSON.stringify(master[0]));
        } else {
            console.log('❌ Vehicle Module NOT FOUND in module_master');
        }

        console.log('\n--- CHECK MODULE SECTIONS (Module ID 5) ---');
        const [sections] = await db.execute('SELECT * FROM module_sections WHERE module_id = 5');
        if (sections.length > 0) {
            console.log(`✅ Found ${sections.length} sections for Vehicle:`);
            sections.forEach(s => console.log(`   - ID ${s.id}: ${s.name} (Company ${s.company_id})`));
        } else {
            console.log('❌ No sections found for Module ID 5');
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

run();
