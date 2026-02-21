
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdminFinal() {
    try {
        console.log('Finding client "hhughghhg"...');
        const [clients] = await db.execute("SELECT id, name FROM clients WHERE name LIKE '%hhughghhg%'");

        if (clients.length === 0) {
            console.log('Client not found.');
            process.exit(0);
        }

        const client = clients[0];
        console.log(`Found client: ${client.name} (ID: ${client.id})`);

        // Check company
        const [companies] = await db.execute("SELECT id FROM companies WHERE client_id = ?", [client.id]);
        if (companies.length === 0) {
            // Should create one if missing
            await db.execute(
                'INSERT INTO companies (name, client_id, status, max_employees, max_assets) VALUES (?, ?, ?, ?, ?)',
                [client.name + ' (HQ)', client.id, 'ACTIVE', 10, 20]
            );
        }
        const [comps] = await db.execute("SELECT id FROM companies WHERE client_id = ?", [client.id]);
        const companyId = comps[0].id;

        // Create Admin
        const email = 'admin@hhughghhg.com';
        const password = 'TrakioTemp123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Deleting potentially existing user with this email first...');
        await db.execute('DELETE FROM users WHERE email = ?', [email]);

        console.log('Creating user...');

        // Use RETURNING id for Postgres
        const [result] = await db.execute(
            `INSERT INTO users (name, email, password, role, company_id, client_id, status, force_reset) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            ['Admin', email, hashedPassword, 'COMPANY_ADMIN', companyId, client.id, 'ACTIVE', true]
        );

        if (result && result.length > 0) {
            const newId = result[0].id; // Postgres specific result structure from my db helper
            console.log(`SUCCESS: User created with ID: ${newId}`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.log('WARNING: User might have been created but ID return failed or structure differs.');
            // Check if user exists now
            const [check] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            if (check.length > 0) {
                console.log(`verified user exists: ID=${check[0].id}`);
            } else {
                console.log('FAILURE: User logic ran but user not found in DB.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

createAdminFinal();
