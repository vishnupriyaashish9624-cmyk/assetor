const db = require('../config/db');

async function debugData() {
    try {
        console.log('--- Debugging Data ---');

        // 1. Check module_master
        const [modules] = await db.execute('SELECT * FROM module_master');
        console.log(`Modules (${modules.length}):`);

        // Find Premises module
        const premisesModule = modules.find(m => m.module_name.includes('Premises'));

        if (premisesModule) {
            console.log(`\nFound Premises Module: ID ${premisesModule.module_id}`);

            // Check ALL sections for this module
            const [sections] = await db.execute('SELECT id, name, company_id, sort_order FROM module_sections WHERE module_id = ?', [premisesModule.module_id]);

            console.log(`Total Sections for Module ${premisesModule.module_id}: ${sections.length}`);

            const byCompany = {};
            sections.forEach(s => {
                const cid = s.company_id === null ? 'NULL' : s.company_id;
                if (!byCompany[cid]) byCompany[cid] = [];
                byCompany[cid].push(s.name);
            });

            console.log('\nSections by Company ID:');
            for (const [cid, names] of Object.entries(byCompany)) {
                console.log(`  Company ${cid}: ${names.length} sections`);
                console.log(`    - ${names.slice(0, 5).join(', ')}${names.length > 5 ? '...' : ''}`);
            }

        } else {
            console.log('\nWarning: Could not find a module named "Premises".');
        }

        // Check users/companies
        const [companies] = await db.execute('SELECT id, name FROM companies LIMIT 5');
        console.log('\nCompanies Sample:', companies);

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        process.exit();
    }
}

debugData();
