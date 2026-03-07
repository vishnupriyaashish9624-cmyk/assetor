const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.execute("SELECT field_key, field_type FROM module_section_fields WHERE module_id = 1 AND field_type = 'auto_generated'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
