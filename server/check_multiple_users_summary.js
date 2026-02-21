const db = require('./config/db');

async function checkUsers() {
    try {
        const email = 'vishnupriyaashish9624@gmail.com';
        const [rows] = await db.execute('SELECT id, email, role, company_id, client_id, status, created_at FROM users WHERE LOWER(email) = ?', [email]);
        console.log(`--- Users Summary for ${email} ---`);
        rows.forEach(u => {
            console.log(`ID: ${u.id} | Role: ${u.role} | Company: ${u.company_id} | Client: ${u.client_id} | Status: ${u.status} | Created: ${u.created_at}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
