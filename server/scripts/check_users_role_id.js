const db = require('../config/db');

async function checkUsers() {
    try {
        const [rows] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Users columns:', rows.map(r => r.column_name));
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
