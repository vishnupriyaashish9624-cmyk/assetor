
const db = require('./config/db');

async function findClientAdmin() {
    try {
        console.log('Searching for client...');
        const [clients] = await db.execute("SELECT id, name FROM clients WHERE name LIKE '%hhughghhg%'");

        if (clients.length === 0) {
            console.log('Client "hhughghhg" not found.');
            process.exit(0);
        }

        const client = clients[0];
        console.log(`Found client: ${client.name} (ID: ${client.id})`);

        const [users] = await db.execute("SELECT id, name, email, role, force_reset FROM users WHERE client_id = ? AND role = 'COMPANY_ADMIN'", [client.id]);

        if (users.length === 0) {
            console.log('No admin user found for this client.');
        } else {
            const admin = users[0];
            console.log('\n--- ADMIN DETAILS ---');
            console.log(`Name: ${admin.name}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`Force Reset Status: ${admin.force_reset ? 'Active (Needs Reset)' : 'Inactive'}`);
            console.log('To login, use this email. Examples for password would have been in your server log.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

findClientAdmin();
