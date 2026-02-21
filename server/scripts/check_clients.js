const db = require('../config/db');

async function checkClients() {
    try {
        console.log('Checking clients in database...');
        const [rows] = await db.execute('SELECT * FROM clients');
        console.log(`Found ${rows.length} clients.`);
        if (rows.length > 0) {
            console.log('First client:', rows[0]);
        }
    } catch (error) {
        console.error('Error checking clients:', error);
    } finally {
        // We can't easily close the pool from here as it's not exported directly as a closeable object in the same way, 
        // but the script will exit.
        process.exit();
    }
}

checkClients();
