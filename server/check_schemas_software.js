const { Pool } = require('pg');
const p = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });
async function checkSchemas() {
    try {
        const { rows } = await p.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'office_premises'");
        console.log(JSON.stringify(rows, null, 2));
    } finally {
        await p.end();
        process.exit();
    }
}
checkSchemas();
