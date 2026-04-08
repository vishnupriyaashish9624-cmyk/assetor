const { Pool } = require('pg');

const poolFrom = new Pool({ user: 'postgres', host: 'localhost', database: 'postgres', port: 5432 });
const poolTo = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });

async function syncBack() {
    const tables = ['module_master', 'modules', 'module_sections', 'module_section_fields', 'module_section_field_options', 'company_modules', 'company_module_field_selection'];
    try {
        for (const table of tables) {
            console.log(`Syncing ${table} to software_db...`);
            const { rows } = await poolFrom.query(`SELECT * FROM ${table}`);
            console.log(`Found ${rows.length} rows.`);

            for (const row of rows) {
                const cols = Object.keys(row).join(',');
                const values = Object.values(row);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
                await poolTo.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values)
                    .catch(e => console.error(`Error syncing ${table}:`, e.message));
            }
        }
        console.log('Sync back to software_db complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await poolFrom.end();
        await poolTo.end();
    }
}
syncBack();
