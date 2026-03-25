const db = require('./config/db');

(async () => {
    try {
        const [tables] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%depart%'");
        console.log('Department Tables found:', tables.map(t => t.table_name));
    } catch (e) {
        console.error('Error fetching tables:', e);
    } finally {
        process.exit();
    }
})();
