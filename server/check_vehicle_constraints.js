const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute(`
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                tc.constraint_type
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'vehicles'
        `);
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}
run();
