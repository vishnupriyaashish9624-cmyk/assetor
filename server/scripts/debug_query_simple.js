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
        const users = await pool.query("SELECT id, email, company_id FROM users WHERE email IN ('testAsset@gmail.com', 'admin@trakio.com')");
        users.rows.forEach(u => console.log(`User: ${u.email}, CID: ${u.company_id}`));

        const companyId = 1;
        console.log(`Checking for CID: ${companyId}`);

        const query = `
            SELECT p.premise_id, p.premises_name, p.company_id
            FROM office_premises p
            WHERE p.company_id = $1
        `;

        const res = await pool.query(query, [companyId]);
        console.log(`Found: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`PID: ${r.premise_id}, Name: ${r.premises_name}`));

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
})();
