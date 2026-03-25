const db = require('./config/db');

(async () => {
    try {
        const [cols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'departments'");
        console.log('Department columns:', cols.map(c => c.column_name));
    } catch (e) {
        console.error('Error fetching columns:', e);
    } finally {
        process.exit();
    }
})();
