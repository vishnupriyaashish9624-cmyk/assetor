const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute("SELECT email, company_id, role FROM users WHERE email = 'superadmin@trakio.com'");
        console.log('User:', rows[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
