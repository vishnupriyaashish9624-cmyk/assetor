const db = require('./config/db');

(async () => {
    try {
        await db.execute('ALTER TABLE assets ADD COLUMN quantity INT DEFAULT 1');
        console.log('Successfully added quantity to assets table');
    } catch (e) {
        console.log('Quantity may already exist or error:', e.message);
    } finally {
        process.exit();
    }
})();
