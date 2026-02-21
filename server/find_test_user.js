require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function findTestUser() {
    try {
        await client.connect();

        const searchTerm = 'testtttt';
        console.log(`Searching for "${searchTerm}"...`);

        // 1. Search CLIENTS
        const clients = await client.query(`SELECT * FROM clients WHERE name ILIKE $1`, [`%${searchTerm}%`]);
        if (clients.rows.length > 0) {
            console.log(`\n✅ Found in CLIENTS table:`);
            clients.rows.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`));
        } else {
            console.log(`\n❌ Not found in CLIENTS table.`);
        }

        // 2. Search COMPANIES
        const companies = await client.query(`SELECT * FROM companies WHERE name ILIKE $1`, [`%${searchTerm}%`]);
        if (companies.rows.length > 0) {
            console.log(`\n✅ Found in COMPANIES table:`);
            companies.rows.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`));
        } else {
            console.log(`\n❌ Not found in COMPANIES table.`);
        }

        // 3. Search USERS
        // We want to find the login credential.
        const users = await client.query(`
        SELECT id, name, email, password, role, client_id, company_id 
        FROM users 
        WHERE name ILIKE $1 OR email ILIKE $1
    `, [`%${searchTerm}%`]);

        if (users.rows.length > 0) {
            console.log(`\n✅ Found in USERS table:`);
            users.rows.forEach(u => {
                console.log(`- User ID: ${u.id}`);
                console.log(`  Name: ${u.name}`);
                console.log(`  Email: ${u.email}  <-- LOGIN USERNAME`);
                console.log(`  Role: ${u.role}`);
                console.log(`  Password Hash: ${u.password}`);
                console.log(`  Client ID: ${u.client_id}, Company ID: ${u.company_id}`);
            });
        } else {
            console.log(`\n❌ Not found in USERS table matching that name.`);

            // If we found a client but not a user, let's try to find users linked to that client ID
            if (clients.rows.length > 0) {
                const clientId = clients.rows[0].id;
                console.log(`\nChecking users linked to Client ID ${clientId}...`);
                // check if client_id column exists first to avoid error
                const userCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'client_id'`);
                if (userCols.rows.length > 0) {
                    const linkedUsers = await client.query(`SELECT * FROM users WHERE client_id = $1`, [clientId]);
                    linkedUsers.rows.forEach(u => {
                        console.log(`- User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
                    });
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

findTestUser();
