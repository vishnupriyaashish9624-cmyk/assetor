const { Pool } = require('pg');
const p = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });
async function list() {
    try {
        const { rows } = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(rows.map(x => x.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await p.end();
        process.exit();
    }
}
list();
