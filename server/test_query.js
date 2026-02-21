const db = require('./config/db');

async function testQuery() {
    try {
        const id = 30; // Client ID from log
        const [companyRows] = await db.execute(`
            SELECT c.*, 
                   u.name as admin_name, 
                   u.email as admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
            WHERE c.client_id = ?
        `, [id]);

        console.log('--- Result Row Keys ---');
        if (companyRows.length > 0) {
            console.log('Result Keys:', JSON.stringify(Object.keys(companyRows[0])));
            console.log('admin_name:', companyRows[0].admin_name);
            console.log('admin_email:', companyRows[0].admin_email);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testQuery();
