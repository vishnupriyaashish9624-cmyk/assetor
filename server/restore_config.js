const { Pool } = require('pg');

const poolSrc = new Pool({ user: 'postgres', database: 'postgres' });
const poolDest = new Pool({ user: 'postgres', database: 'software_db' });

async function syncTable(tableName, idCol) {
    console.log(`Syncing ${tableName}...`);
    const { rows } = await poolSrc.query(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) return;

    const cols = Object.keys(rows[0]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
    const conflictUpdate = cols.filter(c => c !== idCol).map(c => `${c} = EXCLUDED.${c}`).join(',');

    const query = `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT (${idCol}) DO UPDATE SET ${conflictUpdate}`;

    for (const row of rows) {
        await poolDest.query(query, cols.map(c => row[c]));
    }
    console.log(`Synced ${rows.length} rows to ${tableName}`);
}

async function run() {
    try {
        await syncTable('module_master', 'module_id');
        await syncTable('modules', 'id');
        await syncTable('module_sections', 'id');
        await syncTable('module_section_fields', 'id');
        await syncTable('module_section_field_options', 'id');
        await syncTable('company_modules', 'id');
        await syncTable('company_module_field_selection', 'id');
        console.log('Sync complete');
    } catch (e) {
        console.error(e);
    } finally {
        await poolSrc.end();
        await poolDest.end();
        process.exit();
    }
}
run();
