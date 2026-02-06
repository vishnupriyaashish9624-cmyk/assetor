const db = require('../config/db');

async function fixSections() {
    try {
        console.log('--- Setting Company ID to NULL for Module 1 Sections ---');

        // Update query
        // We assume Module 1 (Premises) sections should be global.
        // We will set company_id = NULL for all sections belonging to module_id = 1

        const [result] = await db.execute(
            'UPDATE module_sections SET company_id = NULL WHERE module_id = 1'
        );

        console.log(`Updated ${result.affectedRows} rows.`);

        // Verify
        const [sections] = await db.execute('SELECT id, name, company_id FROM module_sections WHERE module_id = 1');
        console.log('Sections now:', sections);

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        process.exit();
    }
}

fixSections();
