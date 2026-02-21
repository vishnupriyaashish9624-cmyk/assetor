const db = require('./config/db');

async function run() {
    try {
        // Check what enabled_modules Amaya's client has
        const [users] = await db.execute(
            `SELECT u.id, u.name, u.email, u.role, u.company_id, u.client_id
             FROM users u WHERE u.name = 'Amaya'`
        );
        console.log('User Amaya:', JSON.stringify(users[0], null, 2));

        if (users.length > 0) {
            const user = users[0];

            // Check company modules
            if (user.company_id) {
                const [companies] = await db.execute('SELECT id, name, enabled_modules FROM companies WHERE id = ?', [user.company_id]);
                console.log('\nCompany:', JSON.stringify(companies[0], null, 2));
            }

            // Check client modules
            if (user.client_id) {
                const [clients] = await db.execute('SELECT id, name, enabled_modules FROM clients WHERE id = ?', [user.client_id]);
                console.log('\nClient:', JSON.stringify(clients[0], null, 2));
            }
        }
    } catch (e) {
        console.error(e.message);
    }
    process.exit();
}
run();
