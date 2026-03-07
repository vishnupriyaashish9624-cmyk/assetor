const db = require('./config/db');
async function run() {
    try {
        await db.execute("ALTER TABLE public.company_modules ADD COLUMN region VARCHAR(255)");
        console.log('Column "region" added successfully.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('Column "region" already exists.');
        } else {
            console.error(e);
        }
    }
    process.exit();
}
run();
