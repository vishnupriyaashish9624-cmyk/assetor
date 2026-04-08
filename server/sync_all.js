const { Pool } = require('pg');

const poolSrc = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });
const poolDest = new Pool({ user: 'postgres', host: 'localhost', database: 'postgres', port: 5432 });

async function syncAll() {
    const tables = ['countries', 'area', 'property_types', 'premises_types', 'vehicle_usage', 'departments', 'employees', 'asset_categories', 'assets'];
    try {
        for (const table of tables) {
            console.log(`Syncing ${table}...`);
            // Create table if missing (shallow check)
            try {
                const { rows: rowsSrc } = await poolSrc.query(`SELECT * FROM ${table}`);
                console.log(`Found ${rowsSrc.length} rows in ${table}.`);

                for (const row of rowsSrc) {
                    const cols = Object.keys(row).join(',');
                    const values = Object.values(row);
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

                    // ON CONFLICT DO NOTHING for simple sync
                    await poolDest.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values)
                        .catch(e => {
                            // If table doesn't exist in dest, try to create it or skip
                            if (e.code === '42P01') console.error(`Table ${table} missing in postgres.`);
                            else console.error(`Error in ${table}:`, e.message);
                        });
                }
            } catch (e) {
                console.error(`Skipping ${table}:`, e.message);
            }
        }
        console.log('All core data synced.');
    } finally {
        await poolSrc.end();
        await poolDest.end();
    }
}
syncAll();
