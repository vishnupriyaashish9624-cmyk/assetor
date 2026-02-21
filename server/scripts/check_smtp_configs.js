const db = require('./config/db');

async function checkSmtp() {
    try {
        const [rows] = await db.execute('SELECT * FROM smtp_configs');
        console.log('SMTP Configs:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error fetching SMTP configs:', err);
    } finally {
        process.exit();
    }
}

checkSmtp();
