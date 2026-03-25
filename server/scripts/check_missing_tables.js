/**
 * check_missing_tables.js
 * Lists all tables in software_db (local) vs ressosis_db_server
 * to find which 4 are missing.
 */
const { Pool } = require('pg');

const localPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'software_db' });
const serverPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ressosis_db_server' });

const getTables = async (pool) => {
    const res = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    return res.rows.map(r => r.table_name);
};

async function check() {
    const [localTables, serverTables] = await Promise.all([getTables(localPool), getTables(serverPool)]);

    console.log(`\n📦 Local DB (software_db): ${localTables.length} tables`);
    localTables.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    console.log(`\n🌐 Server DB (ressosis_db_server): ${serverTables.length} tables`);
    serverTables.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    const missing = localTables.filter(t => !serverTables.includes(t));
    const extra = serverTables.filter(t => !localTables.includes(t));

    console.log(`\n❌ Missing in ressosis_db_server (${missing.length}):`);
    missing.forEach(t => console.log(`  - ${t}`));

    if (extra.length) {
        console.log(`\n➕ Extra in ressosis_db_server not in local (${extra.length}):`);
        extra.forEach(t => console.log(`  + ${t}`));
    }

    await localPool.end();
    await serverPool.end();
}

check().catch(err => { console.error('❌', err.message); process.exit(1); });
