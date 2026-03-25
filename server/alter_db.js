const db = require('./config/db');

async function test() {
    try {
        console.log("Running Alter table...");
        const [res] = await db.execute('ALTER TABLE assets ADD COLUMN sub_category VARCHAR(100)');
        console.log("Response:", res);
    } catch (err) {
        console.error("Error altering table:", err);
    }
    process.exit();
}

test();
