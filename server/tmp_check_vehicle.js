const { Client } = require('pg');

async function checkModule() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'software_db',
        password: '',
        port: 5432
    });

    try {
        await client.connect();

        const modRes = await client.query("SELECT * FROM module_master WHERE module_name = 'Vehicle'");
        const mid = modRes.rows[0].module_id;
        console.log(`Module ID: ${mid}`);

        const secRes = await client.query("SELECT * FROM module_sections WHERE module_id = $1", [mid]);
        console.log('Sections:');
        console.table(secRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkModule();
