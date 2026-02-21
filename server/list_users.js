
const db = require('./config/db');

async function listAllUsers() {
    try {
        console.log('--- LISTING ALL USERS ---');
        const [users] = await db.execute('SELECT id, name, email, role, status FROM users');

        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.table(users);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

listAllUsers();
