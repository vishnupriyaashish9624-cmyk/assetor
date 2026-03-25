const db = require('./config/db');

(async () => {
    try {
        const [rows] = await db.execute(
            'INSERT INTO assets (company_id, category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, status, location, notes, quantity, current_holder_id, image_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [1, 1, 'TESTCODE', 'Test Name', '', '', '', '', null, null, 'AVAILABLE', '', '', 1, null, 'base64_test_string']
        );
        console.log('Success!', rows);
    } catch (e) {
        console.error('SQL Error details:', e);
    } finally {
        process.exit();
    }
})();
