require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function debugDatabase() {
    try {
        await client.connect();

        console.log("--- CLIENTS (All) ---");
        const clients = await client.query('SELECT * FROM clients');
        clients.rows.forEach(c => {
            console.log(`[Client] ID: ${c.id}, Name: "${c.name}", Email: ${c.email}`);
        });

        console.log("\n--- USERS (First 20) ---");
        // Check if client_id exists in users first
        const userCols = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users';
    `);
        const hasClientId = userCols.rows.some(r => r.column_name === 'client_id');

        let query = 'SELECT * FROM users LIMIT 20';
        if (hasClientId) {
            console.log("(Users have client_id column)");
        } else {
            console.log("(Users DO NOT have client_id column)");
        }

        const users = await client.query(query);
        users.rows.forEach(u => {
            console.log(`[User] ID: ${u.id}, Name: "${u.name}", Email: "${u.email}", Role: ${u.role}`);
            // If name or email looks like 'tesi', print password
            if ((u.name && u.name.toLowerCase().includes('tesi')) || (u.email && u.email.toLowerCase().includes('tesi'))) {
                console.log(`   *** MATCH FOUND *** Password Hash: ${u.password}`);
            }
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

debugDatabase();
