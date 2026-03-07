const db = require('./config/db');
async function run() {
    try {
        const [rows] = await db.execute(`
            SELECT
                conname AS constraint_name,
                pg_get_constraintdef(c.oid) AS constraint_definition
            FROM
                pg_constraint c
            JOIN
                pg_namespace n ON n.oid = c.connamespace
            WHERE
                n.nspname = 'public' AND c.conrelid = 'office_premises'::regclass
        `);
        for (const r of rows) {
            console.log('CONSTR:', r.constraint_name, r.constraint_definition);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
