const db = require('../config/db');

async function run() {
    try {
        console.log('Checking module_master for ID 5...');
        const [rows] = await db.execute('SELECT * FROM module_master WHERE module_id = 5');
        if (rows.length === 0) {
            console.log('Module ID 5 NOT FOUND in module_master!');

            // Fix it
            console.log('Inserting Module ID 5 into module_master...');
            // Need to insert with explicit ID if possible, or key if ID is auto-increment
            // Postgres sequences usually handle ID generation. To force ID 5 we might need to manually set it or just insert if it's missing.
            // However, since it's auto-increment, inserting explicitly might require setting sequence.
            // But let's first check if we can insert by name "Vehicle" and if it gets ID 5.
            // Actually, if the sections point to ID 5, we MUST have ID 5 in master.

            // Let's try to insert explicitly
            await db.execute("INSERT INTO module_master (module_id, module_name, is_active) VALUES (5, 'Vehicle', 1)");
            console.log('Inserted Vehicle with ID 5.');
        } else {
            console.log('Module ID 5 found:', rows[0]);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
