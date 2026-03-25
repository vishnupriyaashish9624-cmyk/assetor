const db = require('./config/db');

(async () => {
    try {
        const [rows] = await db.execute('SELECT * FROM employees LIMIT 1');
        if (rows.length > 0) {
            console.log('Employee columns:', Object.keys(rows[0]));
        } else {
            console.log('No employees found, using information_schema');
            const [cols] = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'");
            console.log('Employee columns (schema):', cols.map(c => c.column_name));
        }
    } catch (e) {
        console.error('Error fetching employees:', e);
    } finally {
        process.exit();
    }
})();
