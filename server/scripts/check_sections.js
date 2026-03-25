const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'software_db'
});

async function run() {
    await client.connect();
    try {
        const modRes = await client.query("SELECT module_id, module_name FROM module_master WHERE LOWER(module_name) = 'vehicle'");
        console.log('Vehicle Module:', modRes.rows);

        if (modRes.rows.length > 0) {
            const modId = modRes.rows[0].module_id;
            const secRes = await client.query("SELECT id, name FROM module_sections WHERE module_id = $1", [modId]);
            console.log('Sections for Vehicle:', secRes.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
