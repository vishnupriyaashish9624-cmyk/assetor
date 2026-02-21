const db = require('../config/db');

async function run() {
    try {
        console.log('--- Module Master ---');
        const [modules] = await db.execute('SELECT * FROM module_master');
        console.table(modules);

        console.log('\n--- Module Sections ---');
        const [sections] = await db.execute('SELECT * FROM module_sections');
        console.table(sections);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
