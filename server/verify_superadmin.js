const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT id, name, email, role, company_id FROM users WHERE email = 'superadmin@trakio.com'");
        console.log('Superadmin:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
