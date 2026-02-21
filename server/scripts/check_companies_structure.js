const db = require('../config/db');

async function checkCompanies() {
    try {
        const [rows] = await db.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies'");
        console.log('Companies table structure:', rows);
    } catch (err) {
        console.error('Error checking companies table:', err);
    } finally {
        process.exit();
    }
}

checkCompanies();
