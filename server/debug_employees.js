const db = require('./config/db');

async function check() {
    try {
        const [cols] = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND table_schema = 'public'
      ORDER BY ordinal_position
    `, []);
        console.log('Employees table columns:');
        cols.forEach(c => console.log(' -', c.column_name, ':', c.data_type));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

check();
