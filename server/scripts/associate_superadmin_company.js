const db = require('../config/db');
async function run() {
    try {
        // Try to find the first company
        const [companies] = await db.execute('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
        if (companies.length === 0) {
            console.log('No companies found to associate with superadmin.');
            process.exit(0);
        }
        const companyId = companies[0].id;
        console.log(`Setting superadmin company_id to ${companyId}...`);

        await db.execute(
            "UPDATE users SET company_id = ? WHERE role = 'SUPER_ADMIN'",
            [companyId]
        );
        console.log('✅ Superadmin updated successfully!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
