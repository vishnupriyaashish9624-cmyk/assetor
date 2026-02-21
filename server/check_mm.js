const db = require('./config/db');
const fs = require('fs');
async function run() {
    try {
        const [rows] = await db.execute("SELECT * FROM module_master WHERE is_active = 1");
        fs.writeFileSync('mm_list.json', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
