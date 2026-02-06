const db = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/company-modules
 * Returns modules enabled for the logged-in company
 */
exports.listCompanyModules = async (req, res) => {
    try {
        const companyId = req.user?.company_id || req.companyId;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing for user.' });
        }

        const query = `
            SELECT 
                cm.id, 
                cm.company_id, 
                cm.module_id, 
                mm.module_name as name, 
                cm.is_enabled as is_active, 
                cm.created_at,
                cm.country_id,
                cm.property_type_id,
                cm.premises_type_id,
                cm.area_id,
                cm.status_id,
                c.country_name as country,
                prop.name as property_type,
                pt.type_name as premises_type,
                a.name as section_area,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids
            FROM company_modules cm 
            JOIN module_master mm ON mm.module_id = cm.module_id 
            LEFT JOIN countries c ON c.id = cm.country_id
            LEFT JOIN property_types prop ON prop.id = cm.property_type_id
            LEFT JOIN premises_types pt ON pt.id = cm.premises_type_id
            LEFT JOIN area a ON a.id = cm.area_id
            WHERE cm.company_id = ? 
            ORDER BY cm.created_at DESC
        `;

        const [rows] = await db.execute(query, [companyId]);

        const mapped = rows.map(r => ({
            ...r,
            status: r.is_active ? 'ACTIVE' : 'INACTIVE',
            is_active: r.is_active ? 1 : 0,
            selected_fields: r.selected_field_ids ? r.selected_field_ids.split(',').map(Number) : []
        }));

        res.json({ success: true, data: mapped });
    } catch (error) {
        console.error('[listCompanyModules] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch company modules' });
    }
};

/**
 * POST /api/company-modules
 * Enable a module for current company
 */
exports.addCompanyModule = async (req, res) => {
    const { module_id, is_active, country_id, property_type_id, premises_type_id, area_id, status_id, selected_fields } = req.body;
    const companyId = req.user?.company_id || req.companyId;

    console.log('[addCompanyModule] Received Payload:', { module_id, country_id, property_type_id, area_id, field_count: selected_fields?.length });

    if (!module_id) {
        return res.status(400).json({ success: false, message: 'Module selection is required' });
    }

    if (!companyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: missing company context' });
    }

    // --- DEBUG LOGGING ---
    try {
        const logPath = path.join(__dirname, '..', 'server_log.txt');
        const logEntry = `[${new Date().toISOString()}] ADD Payload: ${JSON.stringify({ module_id, field_count: selected_fields?.length, selected_fields })}\n`;
        fs.appendFileSync(logPath, logEntry);
    } catch (e) { /* ignore */ }
    // ---------------------

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if module exists in module_master
        const [master] = await connection.execute('SELECT module_id FROM module_master WHERE module_id=? AND is_active=1', [module_id]);
        if (master.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Selected module is invalid or inactive' });
        }

        // 2. Prevent exact duplicate configurations
        const [existing] = await connection.execute(
            'SELECT id FROM company_modules WHERE company_id=? AND module_id=? AND country_id IS NOT DISTINCT FROM ? AND property_type_id IS NOT DISTINCT FROM ? AND premises_type_id IS NOT DISTINCT FROM ? AND area_id IS NOT DISTINCT FROM ? LIMIT 1',
            [companyId, module_id, country_id || null, property_type_id || null, premises_type_id || null, area_id || null]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'This specific module configuration already exists' });
        }

        const enabledStatus = (is_active === 1 || is_active === true || is_active === undefined) ? 1 : 0;
        const finalStatusId = status_id || (enabledStatus ? 1 : 2);

        const [rows] = await connection.execute(
            'INSERT INTO company_modules (company_id, module_id, is_enabled, country_id, property_type_id, premises_type_id, area_id, status_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) RETURNING id',
            [companyId, module_id, enabledStatus, country_id || null, property_type_id || null, premises_type_id || null, area_id || null, finalStatusId]
        );

        const companyModuleId = rows[0].id;

        // 4. Insert selected fields
        if (selected_fields && Array.isArray(selected_fields) && selected_fields.length > 0) {
            console.log(`[addCompanyModule] Inserting ${selected_fields.length} field selections for CM ID: ${companyModuleId}`);

            // PostgreSQL multi-row insert: INSERT INTO ... VALUES ($1,$2), ($3,$4)...
            const placeholders = selected_fields.map((_, i) => `($1, $${i + 2})`).join(', ');
            const query = `INSERT INTO company_module_field_selection (company_module_id, field_id) VALUES ${placeholders}`;
            await connection.query(query, [companyModuleId, ...selected_fields]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Module and field selections saved successfully',
            data: { id: companyModuleId, module_id }
        });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
            return res.status(409).json({ success: false, message: 'This configuration already exists.' });
        }
        console.error('[addCompanyModule] Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error while saving module configuration' });
    } finally {
        connection.release();
    }
};

/**
 * PUT /api/company-modules/:id
 */
exports.updateCompanyModule = async (req, res) => {
    const { id } = req.params;
    const { is_active, country_id, property_type_id, premises_type_id, area_id, status_id, selected_fields } = req.body;
    const companyId = req.user?.company_id || req.companyId;

    // --- DEBUG LOGGING ---
    try {
        const logPath = path.join(__dirname, '..', 'server_log.txt');
        const logEntry = `[${new Date().toISOString()}] UPDATE Payload: ${JSON.stringify({ id, field_count: selected_fields?.length, selected_fields })}\n`;
        fs.appendFileSync(logPath, logEntry);
    } catch (e) { /* ignore */ }
    // ---------------------

    console.log('[updateCompanyModule] Incoming Update Payload:', { id, field_count: selected_fields?.length });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const enabledStatus = (is_active === 1 || is_active === true || is_active === undefined) ? 1 : 0;
        const finalStatusId = status_id || (enabledStatus ? 1 : 2);

        // 1. Update company_modules
        const [updateResult] = await connection.execute(
            'UPDATE company_modules SET is_enabled=?, country_id=?, property_type_id=?, premises_type_id=?, area_id=?, status_id=? WHERE id=? AND company_id=?',
            [enabledStatus, country_id || null, property_type_id || null, premises_type_id || null, area_id || null, finalStatusId, id, companyId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Module configuration not found' });
        }

        // 2. Update field selections (Delete and Re-insert)
        await connection.execute('DELETE FROM company_module_field_selection WHERE company_module_id = ?', [id]);

        if (selected_fields && Array.isArray(selected_fields) && selected_fields.length > 0) {
            const placeholders = selected_fields.map((_, i) => `($1, $${i + 2})`).join(', ');
            const query = `INSERT INTO company_module_field_selection (company_module_id, field_id) VALUES ${placeholders}`;
            await connection.query(query, [id, ...selected_fields]);
        } else {
            try { fs.appendFileSync(path.join(__dirname, '..', 'server_log.txt'), `[DEBUG_INS] SKIPPING INSERT. Data: ${JSON.stringify(selected_fields)}\n`); } catch (e) { }
        }

        await connection.commit();
        res.json({ success: true, message: 'Module and field selections updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('[updateCompanyModule] Error:', error.message);
        try { fs.appendFileSync(path.join(__dirname, '..', 'server_log.txt'), `[ERROR] Update Failed: ${error.message}\nStack: ${error.stack}\n`); } catch (e) { }
        res.status(500).json({ success: false, message: 'Failed to update module configuration' });
    } finally {
        connection.release();
    }
};

/**
 * GET /api/module-master
 */
exports.getModuleMaster = async (req, res) => {
    try {
        const companyId = req.user?.company_id || req.companyId;
        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Forbidden: missing company context' });
        }

        const query = `
            SELECT 
                mm.module_id, mm.module_name, mm.is_active, mm.created_at,
                MAX(cm.id) as mapping_id,
                MAX(cm.country_id) as country_id,
                MAX(cm.property_type_id) as property_type_id,
                MAX(cm.premises_type_id) as premises_type_id,
                MAX(cm.area_id) as area_id,
                MAX(cm.status_id) as status_id,
                MAX(c.country_name) as country,
                MAX(prop.name) as property_type,
                MAX(pt.type_name) as premises_type,
                MAX(a.name) as section_area,
                MAX(cm.is_enabled::int) as is_enabled,
                (SELECT COUNT(*) FROM module_sections ms WHERE ms.module_id = mm.module_id AND ms.company_id = ?) as section_count,
                (SELECT COUNT(*) FROM module_section_fields mf WHERE mf.module_id = mm.module_id AND mf.company_id = ?) as field_count,
                (SELECT string_agg(name, ', ') FROM module_sections ms WHERE ms.module_id = mm.module_id AND ms.company_id = ?) as section_names
            FROM module_master mm
            LEFT JOIN company_modules cm ON mm.module_id = cm.module_id AND cm.company_id = ?
            LEFT JOIN countries c ON c.id = cm.country_id
            LEFT JOIN property_types prop ON prop.id = cm.property_type_id
            LEFT JOIN premises_types pt ON pt.id = cm.premises_type_id
            LEFT JOIN area a ON a.id = cm.area_id
            WHERE mm.is_active = 1 
            GROUP BY mm.module_id, mm.module_name, mm.is_active, mm.created_at
            ORDER BY mm.module_name
        `;
        const [rows] = await db.execute(query, [companyId, companyId, companyId, companyId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getModuleMaster Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load catalog' });
    }
};

/**
 * GET /api/countries
 */
exports.getCountries = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, country_name FROM countries ORDER BY country_name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getCountries Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load countries' });
    }
};

/**
 * GET /api/premises-types
 */
exports.getPremisesTypes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, type_name FROM premises_types ORDER BY type_name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getPremisesTypes Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load premises types' });
    }
};

/**
 * GET /api/areas
 */
exports.getAreas = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name FROM area ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getAreas Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load areas' });
    }
};

/**
 * GET /api/property-types
 */
exports.getPropertyTypes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name FROM property_types ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getPropertyTypes Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load property types' });
    }
};

/**
 * GET /api/company-modules/selected-fields
 * Get selected fields for a module based on conditions (country, premises_type, area)
 * Query params: module_id, country_id, premises_type_id, area_id
 */
exports.getSelectedFieldsByConditions = async (req, res) => {
    try {
        const companyId = req.user?.company_id || req.companyId;
        const { module_id, country_id, property_type_id, premises_type_id, area_id } = req.query;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }

        if (!module_id) {
            return res.status(400).json({ success: false, message: 'module_id is required' });
        }

        // Build dynamic WHERE clause based on provided conditions
        let whereConditions = ['cm.company_id = ?', 'cm.module_id = ?'];
        let params = [companyId, module_id];

        if (country_id) {
            whereConditions.push('(cm.country_id = ? OR cm.country_id IS NULL)');
            params.push(country_id);
        }

        if (property_type_id) {
            whereConditions.push('(cm.property_type_id = ? OR cm.property_type_id IS NULL)');
            params.push(property_type_id);
        }

        if (premises_type_id) {
            whereConditions.push('(cm.premises_type_id = ? OR cm.premises_type_id IS NULL)');
            params.push(premises_type_id);
        }

        if (area_id) {
            whereConditions.push('(cm.area_id = ? OR cm.area_id IS NULL)');
            params.push(area_id);
        }

        const query = `
            SELECT 
                cm.id as company_module_id,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids,
                (
                    (CASE WHEN cm.country_id IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN cm.property_type_id IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN cm.premises_type_id IS NOT NULL THEN 1 ELSE 0 END) +
                    (CASE WHEN cm.area_id IS NOT NULL THEN 1 ELSE 0 END)
                ) as specificity_score
            FROM company_modules cm
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY 
                specificity_score DESC,
                CASE WHEN cm.area_id IS NOT NULL THEN 1 ELSE 0 END DESC,
                CASE WHEN cm.premises_type_id IS NOT NULL THEN 1 ELSE 0 END DESC,
                CASE WHEN cm.property_type_id IS NOT NULL THEN 1 ELSE 0 END DESC,
                CASE WHEN cm.country_id IS NOT NULL THEN 1 ELSE 0 END DESC,
                cm.id DESC
            LIMIT 1
        `;

        console.log('[getSelectedFieldsByConditions] Query:', query);
        console.log('[getSelectedFieldsByConditions] Params:', params);

        const [rows] = await db.execute(query, params);

        if (rows.length === 0) {
            return res.json({ success: true, data: { selected_field_ids: [] } });
        }

        const selectedFieldIds = rows[0].selected_field_ids
            ? rows[0].selected_field_ids.split(',').map(Number)
            : [];

        res.json({
            success: true,
            data: {
                company_module_id: rows[0].company_module_id,
                selected_field_ids: selectedFieldIds
            }
        });
    } catch (error) {
        console.error('[getSelectedFieldsByConditions] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch selected fields' });
    }
};

