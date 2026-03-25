const db = require('./config/db');

async function run() {
    try {
        const [tables] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        for (const t of tables) {
            const tableName = t.table_name;
            try {
                const [rows] = await db.execute(`SELECT * FROM "${tableName}"`);
                const matches = rows.filter(r =>
                    Object.values(r).some(v =>
                        typeof v === 'string' && (v.toLowerCase() === 'it' || v.toLowerCase() === 'it equipment')
                    )
                );
                if (matches.length > 0) {
                    console.log(`--- Match in table: ${tableName} ---`);
                    console.table(matches);
                }
            } catch (e) { }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
