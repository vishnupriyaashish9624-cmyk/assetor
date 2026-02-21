
const db = require('./config/db');

async function checkUser35() {
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE id = 35');
        console.log(users[0]);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUser35();
