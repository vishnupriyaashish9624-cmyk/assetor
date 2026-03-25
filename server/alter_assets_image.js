const db = require('./config/db');

(async () => {
    try {
        await db.execute('ALTER TABLE assets ADD COLUMN image_data TEXT');
        console.log('Added image_data to assets table');
    } catch (e) {
        console.log('Image column may already exist or error:', e.message);
    } finally {
        process.exit();
    }
})();
