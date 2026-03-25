
const db = require('./config/db');

async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS "Asset_category" (
                id SERIAL PRIMARY KEY,
                company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                parent_id INTEGER REFERENCES "Asset_category"(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.execute(sql);
        console.log('Successfully created "Asset_category" table');

        // Migrate data from asset_categories if it exists
        try {
            await db.execute('INSERT INTO "Asset_category" (id, company_id, name, description, parent_id) SELECT id, company_id, name, description, parent_id FROM asset_categories ON CONFLICT (id) DO NOTHING');
            console.log('Migrated data from asset_categories to "Asset_category"');

            // Sync sequence
            await db.execute("SELECT setval('\"Asset_category\"_id_seq', (SELECT MAX(id) FROM \"Asset_category\"))");
        } catch (e) {
            console.log('Skipped data migration (asset_categories might be empty or missing columns)');
        }

    } catch (err) {
        console.error('Error creating table:', err.message);
    } finally {
        process.exit(0);
    }
}

createTable();
