const db = require('../config/db');

(async () => {
    try {
        const [rows] = await db.execute("SELECT * FROM module_master WHERE module_name = 'Vehicle'");
        console.log('Vehicle module:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
