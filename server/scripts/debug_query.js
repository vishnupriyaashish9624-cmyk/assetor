require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'software_db'
});

(async () => {
    try {
        console.log('--- USER CHECK ---');
        // Check valid users to use for testing
        const users = await pool.query("SELECT id, email, company_id, role FROM users WHERE email IN ('testAsset@gmail.com', 'admin@trakio.com', 'superadmin@trakio.com')");
        console.table(users.rows);

        const companyId = 1; // Assuming we test with Company 1
        console.log(`\n--- EXECUTING QUERY FOR COMPANY ID ${companyId} ---`);

        const query = `
            SELECT p.premise_id, p.premises_name, p.company_id, a.name as area
            FROM office_premises p
            LEFT JOIN area a ON p.area_id = a.id
            LEFT JOIN office_owned_details o ON p.premise_id = o.premise_id
            LEFT JOIN office_rental_details r ON p.premise_id = r.premise_id
            WHERE p.company_id = $1
            ORDER BY p.created_at DESC
        `;

        const res = await pool.query(query, [companyId]);
        console.log(`Found ${res.rows.length} rows.`);
        console.table(res.rows);

        if (res.rows.length === 0) {
            console.log('\n--- DIAGNOSTIC: CHECKING RAW TABLE ---');
            const raw = await pool.query('SELECT premise_id, company_id FROM office_premises LIMIT 10');
            console.table(raw.rows);
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
})();
