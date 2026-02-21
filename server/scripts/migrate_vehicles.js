const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting Vehicles Migration...');

        // 1. Create vehicles table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vehicles (
                vehicle_id SERIAL PRIMARY KEY,
                company_id INTEGER NOT NULL,
                vehicle_name VARCHAR(255) NOT NULL,
                license_plate VARCHAR(50),
                type VARCHAR(50),
                driver VARCHAR(255),
                vehicle_usage VARCHAR(255),
                status VARCHAR(50) DEFAULT 'ACTIVE',
                country_id INTEGER,
                property_type_id INTEGER,
                premises_type_id INTEGER,
                area_id INTEGER,
                image_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "vehicles" checked/created.');

        // 2. Create vehicle_module_details table (for dynamic fields)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_module_details (
                id SERIAL PRIMARY KEY,
                vehicle_id INTEGER NOT NULL,
                company_id INTEGER NOT NULL,
                field_key VARCHAR(255) NOT NULL,
                field_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(vehicle_id, field_key),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
            )
        `);
        console.log('Table "vehicle_module_details" checked/created.');

        // 3. (Optional) Insert some initial data if empty
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM vehicles');
        if (parseInt(rows[0].count) === 0) {
            console.log('Inserting seed data...');
            // Need a valid company_id. I'll use 1 for now as a common default for testing.
            const seedQuery = `
                INSERT INTO vehicles (company_id, vehicle_name, license_plate, type, driver, status, vehicle_usage)
                VALUES (1, 'Toyota Camry', 'DXB-12345', 'SEDAN', 'John Doe', 'ACTIVE', 'Business'),
                       (1, 'Ford Transit', 'DXB-54321', 'VAN', 'Jane Smith', 'MAINTENANCE', 'Logistics'),
                       (1, 'Nissan Patrol', 'AD-99887', 'SUV', 'Mike Ross', 'ACTIVE', 'Personal')
            `;
            await db.execute(seedQuery);
            console.log('Seed data inserted.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
