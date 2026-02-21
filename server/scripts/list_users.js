const db = require('../config/db');

async function listUsers() {
    try {
        const [rows] = await db.execute('SELECT * FROM users');
        rows.forEach(u => {
            console.log(`ID: ${u.id}`);
            console.log(`Name: ${u.name}`);
            console.log(`Email: [${u.email}] (Length: ${u.email.length})`);
            console.log(`Role: ${u.role}`);
            console.log(`Status: ${u.status}`);
            console.log('---');
        });
    } catch (err) {
        console.error(err);
    } finally {
        await db.pool.end();
    }
}

listUsers();
