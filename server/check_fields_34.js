const db = require('./config/db');

async function checkFields() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_module_field_selection WHERE company_module_id = 34");
        console.log('Fields for config 34:', rows.length);
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
}

checkFields();
