const db = require('./config/db');
async function run() {
    try {
        console.log('Searching users...');
        const [u] = await db.execute("SELECT u.id, u.name, u.email, u.company_id, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.name ILIKE '%navaneeth%' OR u.name ILIKE '%krishna%'");
        console.table(u);

        console.log('Searching employees...');
        const [e] = await db.execute("SELECT e.id, e.name, e.email, e.company_id, c.name as company_name FROM employees e JOIN companies c ON e.company_id = c.id WHERE e.name ILIKE '%navaneeth%' OR e.name ILIKE '%krishna%'");
        console.table(e);
    } catch (e) { console.error(e); }
}
run();
