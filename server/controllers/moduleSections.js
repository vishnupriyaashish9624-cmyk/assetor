const db = require('../config/db');

/**
 * GET /api/module-sections
 * Returns list of module sections
 */
exports.listModuleSections = async (req, res) => {
    try {
        const companyId = req.user?.company_id || req.companyId;
        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Forbidden: missing company context' });
        }

        const query = `
            SELECT ms.*, mm.module_name 
            FROM module_sections ms
            JOIN module_master mm ON ms.module_id = mm.module_id
            WHERE ms.company_id = ?
            ORDER BY mm.module_name ASC, ms.sort_order ASC
        `;

        const [rows] = await db.execute(query, [companyId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[ListModuleSections] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch module sections' });
    }
};

/**
 * POST /api/module-sections
 * Create a new module section
 */
exports.createModuleSection = async (req, res) => {
    const { module_id, name, sort_order } = req.body;
    const companyId = req.user?.company_id || req.companyId;

    if (!module_id || !name) {
        return res.status(400).json({ success: false, message: 'Module ID and name are required' });
    }

    // Default to company 1 if context is missing (common for Super Admins)
    const activeCompanyId = companyId || 1;

    try {
        const [rows] = await db.execute(
            'INSERT INTO module_sections (company_id, module_id, name, sort_order) VALUES (?, ?, ?, ?) RETURNING id',
            [activeCompanyId, module_id, name, sort_order || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Module section created successfully',
            data: { id: rows[0].id }
        });
    } catch (error) {
        console.error('[CreateModuleSection] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create module section' });
    }
};

/**
 * PUT /api/module-sections/:id
 * Update a module section
 */
exports.updateModuleSection = async (req, res) => {
    const { id } = req.params;
    const { module_id, name, sort_order } = req.body;
    const companyId = req.user?.company_id || req.companyId;

    try {
        const [rows] = await db.execute(
            'UPDATE module_sections SET module_id = ?, name = ?, sort_order = ? WHERE id = ? AND company_id = ? RETURNING id',
            [module_id, name, sort_order || 0, id, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Module section not found' });
        }

        res.json({ success: true, message: 'Module section updated successfully' });
    } catch (error) {
        console.error('[UpdateModuleSection] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update module section' });
    }
};

/**
 * DELETE /api/module-sections/:id
 * Delete a module section
 */
exports.deleteModuleSection = async (req, res) => {
    const { id } = req.params;
    const companyId = req.user?.company_id || req.companyId;

    console.log(`[DeleteModuleSection] Target ID: ${id}, Company: ${companyId}`);


    try {
        const [rows] = await db.execute(
            'DELETE FROM module_sections WHERE id = ? AND company_id = ? RETURNING id',
            [id, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Module section not found' });
        }

        res.json({ success: true, message: 'Module section deleted successfully' });
    } catch (error) {
        console.error('[DeleteModuleSection] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete module section' });
    }
};
