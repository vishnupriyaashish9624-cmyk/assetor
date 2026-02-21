const db = require('../config/db');

async function findClientAndUser() {
    try {
        const [clients] = await db.execute("SELECT * FROM clients WHERE name LIKE '%gvggg%'");
        if (clients.length === 0) {
            console.log("No client found with name 'gvggg'");
            return;
        }

        const client = clients[0];
        console.log("Found Client:", client.id, client.name);

        const [users] = await db.execute("SELECT * FROM users WHERE client_id = ? AND role = 'COMPANY_ADMIN'", [client.id]);

        if (users.length === 0) {
            console.log("No ADMIN user found for this client.");
        } else {
            console.log("Found Admin User(s):");
            users.forEach(u => console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        // process.exit(); // db pool might keep it open
    }
}

findClientAndUser();
