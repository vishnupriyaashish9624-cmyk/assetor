const { Pool } = require('pg');

const poolSrc = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });
const poolDest = new Pool({ user: 'postgres', host: 'localhost', database: 'postgres', port: 5432 });

async function syncVehicles() {
    try {
        console.log('Fetching from software_db...');
        const { rows } = await poolSrc.query('SELECT * FROM vehicles');
        console.log(`Found ${rows.length} vehicles.`);

        for (const v of rows) {
            const { vehicle_id, ...data } = v;
            const cols = Object.keys(data).join(',');
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

            await poolDest.query(`INSERT INTO vehicles (${cols}) VALUES (${placeholders})`, values);
        }
        console.log('Sync complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await poolSrc.end();
        await poolDest.end();
    }
}
syncVehicles();
