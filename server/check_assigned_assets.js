const db = require('./config/db');

(async () => {
    try {
        const [rows] = await db.execute(
            'SELECT a.*, ac.name as category_name, e.name as current_holder_name, d.name as department_name FROM assets a ' +
            'LEFT JOIN asset_categories ac ON a.category_id = ac.id ' +
            'LEFT JOIN employees e ON a.current_holder_id = e.id ' +
            'LEFT JOIN departments d ON e.department_id = d.id ' +
            'WHERE a.status = ?',
            ['ASSIGNED']
        );
        console.log('Assigned Assets found:', rows.map(r => ({
            id: r.id,
            name: r.name,
            current_holder_id: r.current_holder_id,
            holder_name: r.current_holder_name,
            dept_name: r.department_name
        })));
    } catch (e) {
        console.error('Error fetching assigned assets:', e);
    } finally {
        process.exit();
    }
})();
