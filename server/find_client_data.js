require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function findClientAndUsers() {
    try {
        await client.connect();

        // 1. Search for the client "tesi"
        console.log("Searching for client 'tesi'...");
        const clientRes = await client.query(`
      SELECT * FROM clients WHERE name ILIKE '%tesi%';
    `);

        if (clientRes.rows.length === 0) {
            console.log("❌ No client found with name matching 'tesi'.");
            return;
        }

        const targetClient = clientRes.rows[0];
        console.log(`✅ Found client: ${targetClient.name} (ID: ${targetClient.id})`);
        console.table(targetClient);

        // 2. Check users table schema to find how to link
        console.log("\nChecking 'users' table columns...");
        const userCols = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users';
    `);
        const linkColumns = userCols.rows.map(r => r.column_name).filter(c => c.includes('id') || c.includes('client') || c.includes('company'));
        console.log("Potential linking columns in users:", linkColumns);

        // 3. Try to find users associated with this client
        // Assuming 'client_id' or 'company_id' might be the link. 
        // Usually client -> max_companies. So maybe users are linked to companies, or directly to clients?
        // Let's try matching 'client_id' if it exists, otherwise check for users with similar email domain?

        let usersQuery = '';
        let queryParams = [];

        // Heuristic: check if client_id exists in users
        const hasClientId = userCols.rows.some(r => r.column_name === 'client_id');
        const hasCompanyId = userCols.rows.some(r => r.column_name === 'company_id');

        if (hasClientId) {
            console.log("Querying users by client_id...");
            usersQuery = `SELECT id, name, email, password, role FROM users WHERE client_id = $1`;
            queryParams = [targetClient.id];
        } else if (hasCompanyId) {
            // Only if we can find a company for this client? 
            // Or maybe the client IS a company in some contexts?
            // Let's just dump users that might look relevant (e.g. email matches or name matches)
            console.log("No client_id in users. Searching users by email similarity or name...");
            usersQuery = `SELECT id, name, email, password, role FROM users WHERE name ILIKE $1 OR email ILIKE $1`;
            queryParams = [`%tesi%`];
        } else {
            console.log("Unsure how to link users. Searching users by name/email...");
            usersQuery = `SELECT id, name, email, password, role FROM users WHERE name ILIKE $1 OR email ILIKE $1`;
            queryParams = [`%tesi%`];
        }

        const usersRes = await client.query(usersQuery, queryParams);

        if (usersRes.rows.length > 0) {
            console.log(`\nFound ${usersRes.rows.length} potential users:`);
            usersRes.rows.forEach(u => {
                console.log(`- User: ${u.name} (${u.email})`);
                console.log(`  Role: ${u.role}`);
                console.log(`  Password Hash: ${u.password}`);
            });
        } else {
            console.log("❌ No associated users found.");
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

findClientAndUsers();
