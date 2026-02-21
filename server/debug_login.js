
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function debugLogin() {
    const email = 'admin@hhughghhg.com';
    const password = 'TrakioTemp123!';

    console.log(`--- DEBUG LOGIN FOR: ${email} ---`);

    try {
        // 1. Fetch user
        const [users] = await db.execute('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);

        if (users.length === 0) {
            console.log('❌ User not found in database.');
            process.exit(0);
        }

        const user = users[0];
        console.log(`✅ User found: ID=${user.id}, Role=${user.role}, Status=${user.status}`);
        console.log(`Stored Hash: ${user.password}`);

        // 2. Test Password Matching
        console.log(`Testing password: "${password}"`);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`✅ bcrypt.compare result: ${isMatch}`);

        if (isMatch) {
            console.log('SUCCESS: Password matches stored hash.');
        } else {
            console.log('FAILURE: Password DOES NOT match stored hash.');

            // 3. Try generating a new hash and updating it to be sure
            console.log('\n--- ATTEMPTING FIX ---');
            const newHash = await bcrypt.hash(password, 10);
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            console.log('Updated user with new hash.');

            // Verify again
            const verifyMatch = await bcrypt.compare(password, newHash);
            console.log(`Verification of new hash: ${verifyMatch}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

debugLogin();
