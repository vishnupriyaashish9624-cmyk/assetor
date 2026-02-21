
const db = require('./config/db');

async function migrate() {
    try {
        console.log('Checking for force_reset column...');
        const [rows] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'force_reset'");

        if (rows.length === 0) {
            console.log('Adding force_reset column to users table...');
            await db.execute("ALTER TABLE users ADD COLUMN force_reset BOOLEAN DEFAULT FALSE"); // Or INTEGER/SMALLINT depending on dialect, BOOLEAN works in PG
            console.log('Column added successfully.');
        } else {
            console.log('force_reset column already exists.');
        }
    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
