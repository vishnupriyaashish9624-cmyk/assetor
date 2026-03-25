const db = require('./config/db');

(async () => {
    try {
        const [rows] = await db.execute('SELECT * FROM asset_categories');
        console.log('Categories Total:', rows.length);
        console.log('First 3 Categories Items:', rows.slice(0, 3));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
