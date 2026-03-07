const db = require('./config/db');
async function run() {
    try {
        console.log('Adding meta_json column to module_section_fields...');
        await db.execute('ALTER TABLE module_section_fields ADD COLUMN IF NOT EXISTS meta_json JSONB');
        console.log('Success!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit();
    }
}
run();
