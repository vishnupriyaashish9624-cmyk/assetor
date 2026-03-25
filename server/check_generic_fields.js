const db = require('./config/db');

async function checkFields() {
    try {
        const [rows] = await db.execute("SELECT * FROM company_module_field_selection WHERE company_module_id = 8");
        console.log('Fields for config 8:', rows.length);
    } catch (e) {
        console.error(e);
    }
}

checkFields();
