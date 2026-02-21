
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixClientAdmin() {
    try {
        console.log('Finding client "hhughghhg"...');
        const [clients] = await db.execute("SELECT id, name FROM clients WHERE name LIKE '%hhughghhg%'");

        if (clients.length === 0) {
            console.log('Client not found.');
            process.exit(0);
        }

        const client = clients[0];
        console.log(`Found client: ${client.name} (ID: ${client.id})`);

        // Check if company exists
        const [companies] = await db.execute("SELECT id FROM companies WHERE client_id = ?", [client.id]);
        if (companies.length === 0) {
            console.log('No company found for client. Creating one...');
            // Create HQ company
            await db.execute(
                'INSERT INTO companies (name, client_id, status, max_employees, max_assets) VALUES (?, ?, ?, ?, ?)',
                [client.name + ' (HQ)', client.id, 'ACTIVE', 10, 20]
            );
            console.log('HQ Company created.');
        }

        const [comps] = await db.execute("SELECT id FROM companies WHERE client_id = ?", [client.id]);
        const companyId = comps[0].id;

        // Check if admin user exists
        const [users] = await db.execute("SELECT id, email FROM users WHERE client_id = ? AND role = 'COMPANY_ADMIN'", [client.id]);

        let userId;
        let finalEmail;
        const password = 'TrakioTemp123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        if (users.length > 0) {
            console.log('Admin user exists. Updating password...');
            userId = users[0].id;
            finalEmail = users[0].email;
            await db.execute('UPDATE users SET password = ?, force_reset = true WHERE id = ?', [hashedPassword, userId]);
            console.log(`Password updated for user ID: ${userId}`);
        } else {
            console.log('Creating missing admin user...');
            const email = 'admin@hhughghhg.com'; // Guessing an email or using a placeholder

            const [result] = await db.execute(
                'INSERT INTO users (name, email, password, role, company_id, client_id, status, force_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['Admin', email, hashedPassword, 'COMPANY_ADMIN', companyId, client.id, 'ACTIVE', 1] // force_reset = 1 (true)
            );
            userId = result.insertId;
            finalEmail = email;
            console.log('Admin user created.');
        }

        console.log('\n--- SUCCESS ---');
        console.log(`Admin user for ${client.name}`);
        console.log(`Email: ${finalEmail}`);
        console.log(`Password: ${password}`);
        console.log('You can now login with these credentials.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixClientAdmin();
