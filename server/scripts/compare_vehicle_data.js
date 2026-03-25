/**
 * compare_vehicle_data.js
 */
const { Pool } = require('pg');

const localPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'software_db' });
const serverPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ressosis_db_server' });

async function check() {
    const tables = ['vehicle_usage', 'vehicle_module_details', 'vehicles'];

    for (const t of tables) {
        const localRes = await localPool.query(`SELECT COUNT(*) FROM ${t}`);
        const serverRes = await serverPool.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(`Table: ${t}`);
        console.log(`  Local:  ${localRes.rows[0].count}`);
        console.log(`  Server: ${serverRes.rows[0].count}`);
    }

    await localPool.end();
    await serverPool.end();
}

check();
