
const db = require('./config/db');

async function testModuleMaster() {
    try {
        const query = `
            SELECT 
                mm.module_id, mm.module_name, mm.is_active, mm.created_at
            FROM module_master mm
            WHERE mm.is_active = 1 
            ORDER BY mm.module_name
        `;
        const [rows] = await db.execute(query);
        console.log('Module Master rows:', rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

testModuleMaster();
