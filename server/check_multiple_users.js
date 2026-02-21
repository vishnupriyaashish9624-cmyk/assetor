const db = require('./config/db');

async function checkUsers() {
    try {
        const email = 'vishnupriyaashish9624@gmail.com';
        const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
        console.log(`--- ALL Users with email: ${email} ---`);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
