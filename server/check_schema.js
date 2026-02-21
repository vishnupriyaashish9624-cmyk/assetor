const db = require('./config/db');

async function checkSchema() {
    try {
        const [companiesCols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'");
        console.log('--- Companies Columns ---');
        companiesCols.forEach(c => console.log(c.column_name));

        const [usersCols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('--- Users Columns ---');
        usersCols.forEach(c => console.log(c.column_name));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
