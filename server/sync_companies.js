const { Pool } = require('pg');

const poolSrc = new Pool({ user: 'postgres', host: 'localhost', database: 'software_db', port: 5432 });
const poolDest = new Pool({ user: 'postgres', host: 'localhost', database: 'postgres', port: 5432 });

async function syncCompanies() {
    try {
        console.log('Syncing companies...');
        const { rows } = await poolSrc.query('SELECT * FROM companies');
        for (const c of rows) {
            const { id, ...data } = c;
            await poolDest.query('INSERT INTO companies (id, name, subdomain, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
                [id, c.name, c.subdomain, c.status, c.created_at, c.updated_at]);
        }
        console.log('Companies synced.');
    } catch (err) {
        console.error(err);
    } finally {
        await poolSrc.end();
        await poolDest.end();
    }
}
syncCompanies();
