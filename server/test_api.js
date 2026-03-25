const controller = require('./controllers/assetCategoriesController');
const db = require('./config/db');

async function test() {
    const req = { user: { company_id: 1 } };
    const res = {
        json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
        status: function (s) { console.log('Status:', s); return this; }
    };
    await controller.listCategories(req, res);
}
test();
