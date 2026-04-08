const db = require('./config/db');
require('dotenv').config();

async function checkTables() {
    try {
        const [rows] = await db.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log('Tables found:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkTables();
