/**
 * check_core_counts.js
 */
const { Pool } = require('pg');

const localPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'software_db' });
const serverPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ressosis_db_server' });

async function check() {
    const tables = ['clients', 'companies', 'users', 'vehicles', 'vehicle_usage', 'vehicle_module_details'];

    for (const t of tables) {
        try {
            const localRes = await localPool.query(`SELECT COUNT(*) FROM ${t}`);
            const serverRes = await serverPool.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`${t.padEnd(25)} | Local: ${localRes.rows[0].count.toString().padEnd(5)} | Server: ${serverRes.rows[0].count}`);
        } catch (e) {
            console.log(`${t.padEnd(25)} | Error: ${e.message}`);
        }
    }

    await localPool.end();
    await serverPool.end();
}

check();
