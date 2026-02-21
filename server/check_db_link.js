const db = require('./config/db');

async function checkData() {
    try {
        const [users] = await db.execute("SELECT id, name, email, company_id, role FROM users WHERE company_id = 74");
        console.log('--- All Users for Company 74 ---');
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
