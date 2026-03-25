const db = require('../config/db');

/**
 * GET /api/categories
 * Returns all asset categories for the logged-in company
 */
exports.listCategories = async (req, res) => {
    try {
        const companyId = req.user?.company_id || req.companyId;
        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }

        const query = `
            SELECT c.*, p.name as parent_name 
            FROM asset_categories c
            LEFT JOIN asset_categories p ON c.parent_id = p.id
            WHERE c.company_id = ? 
            ORDER BY c.name ASC
        `;
        const [rows] = await db.execute(query, [companyId]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[listCategories] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

/**
 * POST /api/categories
 * Create a new asset category
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        const companyId = req.user?.company_id || req.companyId;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const query = 'INSERT INTO asset_categories (company_id, name, description, parent_id) VALUES (?, ?, ?, ?) RETURNING id';
        const [result] = await db.execute(query, [companyId, name, description || null, parent_id || null]);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { id: result.insertId, name, description }
        });
    } catch (error) {
        console.error('[createCategory] Full Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists for your company.'
            });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    }
};

/**
 * PUT /api/categories/:id
 * Update an existing category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent_id } = req.body;
        const companyId = req.user?.company_id || req.companyId;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }

        const query = 'UPDATE asset_categories SET name = ?, description = ?, parent_id = ? WHERE id = ? AND company_id = ?';
        const [result] = await db.execute(query, [name, description || null, parent_id || null, id, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('[updateCategory] Full Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists for your company.'
            });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + error.message });
    }
};

/**
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.company_id || req.companyId;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }

        // Check if category is in use by assets
        const [assets] = await db.execute('SELECT id FROM assets WHERE category_id = ? LIMIT 1', [id]);
        if (assets.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category as it is currently assigned to one or more assets.'
            });
        }

        const query = 'DELETE FROM asset_categories WHERE id = ? AND company_id = ?';
        const [result] = await db.execute(query, [id, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('[deleteCategory] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};
