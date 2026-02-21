const db = require('../config/db');

async function addVehicleModule() {
    try {
        console.log('Checking for Vehicle module...');
        // Check if table exists first just in case, though it should
        const [rows] = await db.execute("SELECT * FROM module_master WHERE module_name = 'Vehicle'");

        if (rows.length > 0) {
            console.log('Vehicle module already exists:', rows[0]);
        } else {
            console.log('Adding Vehicle module...');
            // Assuming 'is_active' is the column for status, based on controller code
            const [result] = await db.execute("INSERT INTO module_master (module_name, is_active) VALUES ('Vehicle', 1)");
            console.log('Vehicle module added successfully. Insert ID:', result.insertId);
        }

    } catch (error) {
        console.error('Error adding Vehicle module:', error);
    } finally {
        // We can't easily close the pool if it's exported as a singleton without a close method, 
        // but for a script we can just exit. 
        // However, if db.end() is available we should use it.
        if (db.end) await db.end();
        process.exit(0);
    }
}

addVehicleModule();
