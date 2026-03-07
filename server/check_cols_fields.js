const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SHOW COLUMNS FROM module_section_fields");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        // Try postgres approach
        try {
            const [rows] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_section_fields'");
            console.log(JSON.stringify(rows, null, 2));
            process.exit(0);
        } catch (e2) {
            console.error(e2);
            process.exit(1);
        }
    }
}
run();
