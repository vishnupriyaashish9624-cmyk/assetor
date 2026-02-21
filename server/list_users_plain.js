
const db = require('./config/db');

async function listAllUsersPlain() {
    try {
        console.log('--- LISTING ALL USERS PLAIN ---');
        const [users] = await db.execute('SELECT id, name, email, role, force_reset, status FROM users');

        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: "${u.email}" | Role: ${u.role} | ForceReset: ${u.force_reset} | Status: ${u.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

listAllUsersPlain();
