/**
 * get_missing_table_schemas.js
 * Prints the structure of the 5 missing tables from software_db
 */
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'software_db' });

const missing = ['role_permissions', 'roles', 'smtp_configs', 'status_master', 'vehicle_usage'];

async function go() {
    for (const table of missing) {
        const res = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
        `, [table]);
        console.log(`\n=== ${table} ===`);
        res.rows.forEach(r => {
            const type = r.character_maximum_length ? `${r.data_type}(${r.character_maximum_length})` : r.data_type;
            console.log(`  ${r.column_name.padEnd(30)} ${type.padEnd(30)} default: ${r.column_default || 'null'}  nullable: ${r.is_nullable}`);
        });
    }
    await pool.end();
}
go().catch(e => { console.error(e.message); process.exit(1); });
