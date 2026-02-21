const db = require('./config/db');

async function run() {
    try {
        await db.execute(
            `UPDATE clients SET enabled_modules = $1 WHERE id = $2`,
            [JSON.stringify(['dashboard', 'premises_display', 'employees', 'module_sections', 'vehicles']), 15]
        );
        console.log('Updated client 15 (ACME Global) with vehicles module');
    } catch (e) {
        console.error(e.message);
    }
    process.exit();
}
run();
