const db = require('./config/db');

async function checkSmtp() {
    try {
        const [rows] = await db.execute('SELECT * FROM smtp_configs WHERE is_active = true');
        console.log('--- Active SMTP Config ---');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSmtp();
