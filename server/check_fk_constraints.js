const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute(`
            SELECT 
                conname as constraint_name, 
                pg_get_constraintdef(c.oid) as constraint_definition
            FROM pg_constraint c 
            WHERE conrelid = 'module_section_fields'::regclass
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
