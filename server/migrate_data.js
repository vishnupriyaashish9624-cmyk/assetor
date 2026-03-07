const db = require('./config/db');
async function run() {
    try {
        await db.execute("ALTER TABLE public.office_premises ADD COLUMN region VARCHAR(255)");
        console.log('Column "region" added to office_premises.');
    } catch (e) { console.log(e.message); }
    try {
        await db.execute("ALTER TABLE public.vehicles ADD COLUMN region VARCHAR(255)");
        console.log('Column "region" added to vehicles.');
    } catch (e) { console.log(e.message); }
    process.exit();
}
run();
