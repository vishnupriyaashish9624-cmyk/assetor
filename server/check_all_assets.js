const db = require('./config/db');

(async () => {
    try {
        const [rows] = await db.execute('SELECT id, name, status, current_holder_id FROM assets');
        console.log('All Assets Statuses:', rows);
    } catch (e) {
        console.error('Error fetching assets:', e);
    } finally {
        process.exit();
    }
})();
