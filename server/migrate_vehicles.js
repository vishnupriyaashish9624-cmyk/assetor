const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
});

async function createVehicleTables() {
    try {
        console.log('Creating vehicles table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicles (
                vehicle_id SERIAL PRIMARY KEY,
                company_id INT NOT NULL,
                vehicle_name VARCHAR(255) NOT NULL,
                license_plate VARCHAR(50),
                type VARCHAR(100),
                driver VARCHAR(255),
                vehicle_usage TEXT,
                status VARCHAR(50) DEFAULT 'ACTIVE',
                country_id INT,
                property_type_id INT,
                premises_type_id INT,
                area_id INT,
                image_path VARCHAR(255),
                region VARCHAR(255),
                vehicle_usage_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_veh_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        console.log('Creating vehicle_module_details table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle_module_details (
                id SERIAL PRIMARY KEY,
                vehicle_id INT NOT NULL,
                company_id INT NOT NULL,
                field_key VARCHAR(100) NOT NULL,
                field_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_vmd_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
                CONSTRAINT fk_vmd_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        console.log('Tables created successfully in postgres database.');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
createVehicleTables();
