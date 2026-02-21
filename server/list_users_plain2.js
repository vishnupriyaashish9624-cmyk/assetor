
const db = require('./config/db');

async function listAllUsersPlain2() {
    try {
        console.log('--- LISTING ALL USERS PLAIN 2 ---');
        const [users] = await db.execute('SELECT id, name, email, role, force_reset, status, client_id FROM users');

        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: "${u.email}" | ClientID: ${u.client_id} | Role: ${u.role} | ForceReset: ${u.force_reset} | Status: ${u.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

listAllUsersPlain2();
