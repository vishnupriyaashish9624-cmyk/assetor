const db = require('../config/db');
const { checkClientLimit, checkCompanyLimit } = require('../utils/limitChecker');

exports.getAssets = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT a.*, ac.name as category_name, e.name as current_holder_name, d.name as department_name FROM assets a ' +
            'LEFT JOIN asset_categories ac ON a.category_id = ac.id ' +
            'LEFT JOIN employees e ON a.current_holder_id = e.id ' +
            'LEFT JOIN departments d ON e.department_id = d.id ' +
            'WHERE a.company_id = ?',
            [req.companyId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAssetById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT a.*, ac.name as category_name, e.name as current_holder_name, d.name as department_name FROM assets a ' +
            'LEFT JOIN asset_categories ac ON a.category_id = ac.id ' +
            'LEFT JOIN employees e ON a.current_holder_id = e.id ' +
            'LEFT JOIN departments d ON e.department_id = d.id ' +
            'WHERE a.id = ? AND a.company_id = ?',
            [req.params.id, req.companyId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Asset not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAsset = async (req, res) => {
    const { category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, status, location, notes } = req.body;
    try {
        // Enforce limits
        const [company] = await db.execute('SELECT client_id FROM companies WHERE id = ?', [req.companyId]);
        if (company.length > 0) {
            // 1. Check Client Limit
            if (company[0].client_id) {
                const clientLimitStatus = await checkClientLimit(company[0].client_id, 'assets');
                if (clientLimitStatus.exceeded) {
                    return res.status(400).json({
                        success: false,
                        message: 'LIMIT_EXCEEDED',
                        detail: `Total asset limit for this client reached (${clientLimitStatus.limit})`
                    });
                }
            }

            // 2. Check Company Limit
            const companyLimitStatus = await checkCompanyLimit(req.companyId, 'assets');
            if (companyLimitStatus.exceeded) {
                return res.status(400).json({
                    success: false,
                    message: 'LIMIT_EXCEEDED',
                    detail: `Asset limit for this company reached (${companyLimitStatus.limit})`
                });
            }
        }
        const { category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, status, location, notes, quantity, current_holder_id, image_data } = req.body;

        const [rows] = await db.execute(
            'INSERT INTO assets (company_id, category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, status, location, notes, quantity, current_holder_id, image_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.companyId, category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, current_holder_id ? 'ASSIGNED' : (status || 'AVAILABLE'), location, notes, quantity || 1, current_holder_id || null, image_data || null]
        );
        res.status(201).json({ success: true, data: { id: rows.insertId, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    const { category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, status, location, notes, quantity, current_holder_id, image_data } = req.body;
    try {
        await db.execute(
            'UPDATE assets SET category_id=?, asset_code=?, name=?, sub_category=?, brand=?, model=?, serial_number=?, purchase_date=?, purchase_cost=?, status=?, location=?, notes=?, quantity=?, current_holder_id=?, image_data=? WHERE id=? AND company_id=?',
            [category_id, asset_code, name, sub_category, brand, model, serial_number, purchase_date, purchase_cost, current_holder_id ? 'ASSIGNED' : status, location, notes, quantity || 1, current_holder_id || null, image_data || null, req.params.id, req.companyId]
        );
        res.json({ success: true, message: 'Asset updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        await db.execute('DELETE FROM assets WHERE id = ? AND company_id = ?', [req.params.id, req.companyId]);
        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.assignAsset = async (req, res) => {
    const { employee_id, notes } = req.body;
    const asset_id = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if asset is available
        const [assets] = await connection.execute('SELECT status FROM assets WHERE id = ? AND company_id = ?', [asset_id, req.companyId]);
        if (assets.length === 0 || assets[0].status !== 'AVAILABLE') {
            throw new Error('Asset is not available for assignment');
        }

        // Update asset
        await connection.execute(
            "UPDATE assets SET status = 'ASSIGNED', current_holder_id = ? WHERE id = ?",
            [employee_id, asset_id]
        );

        // Record assignment
        await connection.execute(
            'INSERT INTO asset_assignments (company_id, asset_id, employee_id, notes) VALUES (?, ?, ?, ?)',
            [req.companyId, asset_id, employee_id, notes]
        );

        await connection.commit();
        res.json({ success: true, message: 'Asset assigned successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.returnAsset = async (req, res) => {
    const asset_id = req.params.id;
    const { notes } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update asset
        await connection.execute(
            'UPDATE assets SET status = "AVAILABLE", current_holder_id = NULL WHERE id = ? AND company_id = ?',
            [asset_id, req.companyId]
        );

        // Update assignment record
        await connection.execute(
            'UPDATE asset_assignments SET returned_date = CURRENT_TIMESTAMP, notes = ? WHERE asset_id = ? AND returned_date IS NULL',
            [notes || 'Returned', asset_id]
        );

        await connection.commit();
        res.json({ success: true, message: 'Asset returned successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
