
const { Pool } = require('pg');
const db = require('../config/db'); // Local DB (MySQL or PG wrapper)

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

const pool = new Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false }
});

async function syncTable(tableName, localRows, idColumn) {
    if (localRows.length === 0) return;

    const columns = Object.keys(localRows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const updateClause = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');

    const query = `
        INSERT INTO public.${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (${idColumn}) DO UPDATE SET ${updateClause}
    `;

    console.log(`📡 Syncing ${localRows.length} rows to ${tableName}...`);

    for (const row of localRows) {
        const values = columns.map(col => row[col]);
        try {
            await pool.query(query, values);
        } catch (err) {
            console.error(`❌ Error syncing row in ${tableName}:`, err.message);
        }
    }
    console.log(`✅ ${tableName} sync complete.`);

    // Reset sequence if applicable
    if (tableName === 'company_modules' || tableName === 'module_master') {
        const seqName = tableName === 'module_master' ? 'module_master_module_id_seq' : 'company_modules_id_seq';
        try {
            await pool.query(`SELECT setval('${seqName}', (SELECT MAX(${idColumn}) FROM ${tableName}))`);
            console.log(`⚙️ Sequence ${seqName} reset.`);
        } catch (seqErr) {
            console.warn(`⚠️ Could not reset sequence ${seqName}: ${seqErr.message}`);
        }
    }
}

async function runSync() {
    try {
        console.log('⏳ Starting Company Module Data Sync...');

        // 1. Sync module_master
        console.log('📦 Fetching local module_master...');
        const [mmRows] = await db.execute('SELECT * FROM module_master');
        await syncTable('module_master', mmRows, 'module_id');

        // 2. Sync company_modules
        console.log('📦 Fetching local company_modules...');
        const [cmRows] = await db.execute('SELECT * FROM company_modules');

        // Check if we need to add missing columns to remote first
        const client = await pool.connect();
        try {
            const addCols = [
                { name: 'region', type: 'VARCHAR(255)' },
                { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
                { name: 'vehicle_usage_id', type: 'INTEGER' }
            ];
            for (const col of addCols) {
                try {
                    await client.query(`ALTER TABLE public.company_modules ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
                    console.log(`➕ Added column ${col.name} to company_modules`);
                } catch (e) { }
            }
        } finally {
            client.release();
        }

        await syncTable('company_modules', cmRows, 'id');

        console.log('\n🚀 DATA SYNC FINISHED!');
    } catch (err) {
        console.error('💥 Sync Failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runSync();
