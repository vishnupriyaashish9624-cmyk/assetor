/**
 * migrate_vehicle_data.js
 * 
 * Migrates vehicle-related data from software_db to ressosis_db_server.
 * Includes dependencies: clients, companies.
 */
const { Pool } = require('pg');

const localPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'software_db' });
const serverPool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'ressosis_db_server' });

async function migrateTable(tableName, idColumn = 'id') {
    console.log(`⏳ Migrating ${tableName}...`);
    const { rows } = await localPool.query(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) {
        console.log(`  - No data in ${tableName}.`);
        return;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');

    // Using ON CONFLICT (if applicable) or just inserting. 
    // Since it's a new DB, simple insert is fine, but ON CONFLICT DOES NOTHING is safer for reruns.
    const query = `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders}) ON CONFLICT (${idColumn}) DO NOTHING`;

    let count = 0;
    for (const row of rows) {
        const values = columns.map(col => row[col]);
        await serverPool.query(query, values);
        count++;
    }
    console.log(`  ✅ Done. Migrated ${count} rows to ${tableName}.`);
}

async function run() {
    try {
        console.log('🚀 Starting Data Migration...');

        // Order matters for FKs
        await migrateTable('clients', 'id');
        await migrateTable('companies', 'id');
        await migrateTable('vehicle_usage', 'id');
        await migrateTable('vehicles', 'vehicle_id');
        await migrateTable('vehicle_module_details', 'id');

        console.log('\n✨ Vehicle data migration complete!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
    } finally {
        await localPool.end();
        await serverPool.end();
    }
}

run();
