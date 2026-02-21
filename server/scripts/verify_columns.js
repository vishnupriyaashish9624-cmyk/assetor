const db = require('../config/db');

async function verifyColumns() {
    try {
        console.log('--- Module Master ---');
        await db.query("SELECT * FROM module_master LIMIT 1").then(([rows]) => console.log(Object.keys(rows[0] || {})));

        console.log('--- Module Sections ---');
        await db.query("SELECT * FROM module_sections LIMIT 1").then(([rows]) => console.log(Object.keys(rows[0] || {})));

        console.log('--- Module Section Fields ---');
        await db.query("SELECT * FROM module_section_fields LIMIT 1").then(([rows]) => console.log(Object.keys(rows[0] || {})));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
verifyColumns();
