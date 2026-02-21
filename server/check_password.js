require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkPassword() {
    try {
        await client.connect();

        // Fetch the user 'tesi' / 'abin@123Gmail.com'
        const res = await client.query(`SELECT * FROM users WHERE email = 'abin@123Gmail.com'`);

        if (res.rows.length === 0) {
            console.log("User not found.");
            return;
        }

        const user = res.rows[0];
        console.log(`Checking password for user: ${user.name} (${user.email})`);

        const commonPasswords = [
            'password',
            'password123',
            '123456',
            '12345678',
            'admin',
            'admin123',
            'secret',
            'tesi',
            'test',
            'test1234',
            'Abin@123', // Maybe related to email?
            'abin123'
        ];

        let found = false;
        for (const pass of commonPasswords) {
            const isMatch = await bcrypt.compare(pass, user.password);
            if (isMatch) {
                console.log(`\n✅ MATCH FOUND! The password is: "${pass}"`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log("\n❌ Could not guess the password from common list.");
            console.log("Would you like me to reset it to 'password123'?");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkPassword();
