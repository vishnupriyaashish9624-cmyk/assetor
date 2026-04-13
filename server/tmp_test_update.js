const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function testUpdate() {
    const userId = 90;
    const newPass = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(newPass, 10);

    console.log('Updating user 90...');
    const [result] = await db.execute('UPDATE users SET password = ?, force_reset = false WHERE id = ?', [hashedPassword, userId]);
    console.log('Result:', result);

    const [rows] = await db.execute('SELECT id, force_reset FROM users WHERE id = ?', [userId]);
    console.log('Updated user state:', rows[0]);

    // Clean up or just leave it
}

testUpdate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
