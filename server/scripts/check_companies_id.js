const db = require('../config/db');

async function checkId() {
    try {
        const [rows] = await db.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'id'");
        console.log('ID column:', rows);
    } catch (err) {
        console.error('Error checking ID column:', err);
    } finally {
        process.exit();
    }
}

checkId();
