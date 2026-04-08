const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', database: 'software_db' });

async function seed() {
    const rows = [
        { id: 1, name: 'Premises' },
        { id: 2, name: 'Assets' },
        { id: 3, name: 'Employees' },
        { id: 4, name: 'Maintenance' },
        { id: 5, name: 'Asset Categories' },
        { id: 6, name: 'Vehicle' }
    ];
    for (const r of rows) {
        await pool.query('INSERT INTO module_master (module_id, module_name, is_active) VALUES ($1, $2, 1) ON CONFLICT (module_id) DO NOTHING', [r.id, r.name]);
    }
    console.log('Seeded module_master');
    process.exit(0);
}
seed().catch(console.error);
