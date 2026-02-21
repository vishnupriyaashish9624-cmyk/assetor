require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function broadSearch() {
    try {
        await client.connect();

        console.log("--- SEARCHING 'CLIENTS' ---");
        const clientsRes = await client.query(`SELECT id, name, email FROM clients LIMIT 50`);
        if (clientsRes.rows.length === 0) {
            console.log("No clients found at all.");
        } else {
            console.log(`Found ${clientsRes.rows.length} total clients. Listing first 10:`);
            clientsRes.rows.slice(0, 10).forEach(c => console.log(`- ${c.id}: ${c.name} (${c.email})`));
        }

        console.log("\n--- SEARCHING 'USERS' For 'tesi' ---");
        const usersRes = await client.query(`
        SELECT id, name, email, password, role 
        FROM users 
        WHERE name ILIKE '%tesi%' 
           OR email ILIKE '%tesi%'
    `);

        if (usersRes.rows.length > 0) {
            console.log(`Found ${usersRes.rows.length} users containing 'tesi':`);
            usersRes.rows.forEach(u => {
                console.log(`- ID: ${u.id}`);
                console.log(`  Name: ${u.name}`);
                console.log(`  Email: ${u.email}`);
                console.log(`  Role: ${u.role}`);
                console.log(`  Password (hash): ${u.password}`);
            });
        } else {
            console.log("No users found matching 'tesi'.");
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

broadSearch();
