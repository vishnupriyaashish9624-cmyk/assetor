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

async function findUserByPassword() {
    try {
        await client.connect();

        console.log("Fetching all users to find who has password 'tesi'...");
        const res = await client.query(`SELECT id, name, email, password FROM users`);

        console.log(`Checking ${res.rows.length} users...`);

        let found = false;
        for (const user of res.rows) {
            if (!user.password) continue;

            // Check if password matches 'tesi'
            const isMatch = await bcrypt.compare('tesi', user.password);
            if (isMatch) {
                console.log(`\n✅ MATCH FOUND!`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Name:  ${user.name}`);
                console.log(`   ID:    ${user.id}`);
                found = true;
            }
        }

        if (!found) {
            console.log("\n❌ No user found with password 'tesi'.");

            // Fallback: Check the specific user we found earlier just in case
            const specificUser = res.rows.find(u => u.email === 'abin@123Gmail.com');
            if (specificUser) {
                console.log("\nNote: The user linked to client 'testttttt' is:");
                console.log(`   Email: ${specificUser.email}`);
                console.log(`   Name:  ${specificUser.name}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

findUserByPassword();
