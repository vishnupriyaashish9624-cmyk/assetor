const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || 5432, 10),
});

async function checkOptions() {
    try {
        const res = await pool.query("SELECT f.label, opt.* FROM module_section_field_options opt JOIN module_section_fields f ON f.id = opt.field_id");
        console.log(JSON.stringify(res.rows));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkOptions();
