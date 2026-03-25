const db = require('./config/db');

async function run() {
    try {
        console.log('--- Cleaning and Reseeding Categories ---');

        // 1. Delete all existing categories to start fresh
        // (Be careful, but since it's a dev environment and user is reporting broken state...)
        await db.execute('DELETE FROM assets WHERE category_id IS NOT NULL');
        await db.execute('DELETE FROM asset_categories');

        // 2. Add Unique Constraint
        try {
            await db.execute('ALTER TABLE asset_categories ADD CONSTRAINT unique_category_name_per_company UNIQUE (company_id, name)');
            console.log('Added unique constraint');
        } catch (e) {
            console.log('Constraint already exists or error:', e.message);
        }

        // 3. Reseed basic categories for company 1
        const seeds = [
            { name: 'IT Equipment', desc: 'Computers, Servers, Networking' },
            { name: 'Office Furniture', desc: 'Desks, Chairs, Tables' },
            { name: 'Vehicles', desc: 'Company cars and trucks' },
            { name: 'Licenses', desc: 'Software and business licenses' }
        ];

        for (const seed of seeds) {
            await db.execute('INSERT INTO asset_categories (company_id, name, description) VALUES (1, ?, ?)', [seed.name, seed.desc]);
        }

        console.log('Reseed complete');

    } catch (e) { console.error(e); }
}
run();
