const db = require('./config/db');

async function testPost() {
    try {
        const companyId = 1;
        const name = 'Test ' + Date.now();
        const description = 'Test Desc';
        const parent_id = null;

        const query = 'INSERT INTO asset_categories (company_id, name, description, parent_id) VALUES (?, ?, ?, ?) RETURNING id';
        console.log('Running query:', query);
        const [result] = await db.execute(query, [companyId, name, description || null, parent_id || null]);
        console.log('Result:', result);
    } catch (e) {
        console.error('FAILED TO INSERT:');
        console.error(e);
    }
}

testPost();
