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
        console.log(`[listCompanyModules] User: ${req.user?.email}, Resolved CompanyId: ${companyId}`);

        if (!companyId) {
            console.error('[listCompanyModules] 403: No companyId resolved');
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
                cm.region,
                c.country_name as country,
                prop.name as property_type,
                pt.type_name as premises_type,
                a.name as section_area,
                vu.id as vehicle_usage_id,
                vu.name as vehicle_usage,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids
            FROM company_modules cm 
            JOIN module_master mm ON mm.module_id = cm.module_id 
            LEFT JOIN countries c ON c.id = cm.country_id
            LEFT JOIN property_types prop ON prop.id = cm.property_type_id
            LEFT JOIN premises_types pt ON pt.id = cm.premises_type_id
            LEFT JOIN area a ON a.id = cm.area_id
            LEFT JOIN vehicle_usage vu ON vu.id = cm.vehicle_usage_id
            WHERE cm.company_id = ? 
            ORDER BY cm.created_at DESC
        `;

        const [rows] = await db.execute(query, [companyId]);
        console.log(`[listCompanyModules] DB Query returned ${rows.length} rows for company ${companyId}`);

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
    const { module_id, is_active, country_id, property_type_id, premises_type_id, area_id, vehicle_usage_id, region, status_id, selected_fields } = req.body;
    const companyId = req.user?.company_id || req.companyId;

    console.log('[DEBUG] addCompanyModule context check:');
    console.log(' - User:', req.user?.email, 'Role:', req.user?.role);
    console.log(' - companyId resolved:', companyId);
    console.log(' - req.companyId (from tenantScope):', req.companyId);
    console.log(' - req.user.company_id (from token):', req.user?.company_id);

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
            'SELECT id FROM company_modules WHERE company_id=? AND module_id=? AND country_id IS NOT DISTINCT FROM ? AND property_type_id IS NOT DISTINCT FROM ? AND premises_type_id IS NOT DISTINCT FROM ? AND area_id IS NOT DISTINCT FROM ? AND vehicle_usage_id IS NOT DISTINCT FROM ? LIMIT 1',
            [companyId, module_id, country_id || null, property_type_id || null, premises_type_id || null, area_id || null, vehicle_usage_id || null]
        );
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'This specific module configuration already exists' });
        }

        const enabledStatus = (is_active === 1 || is_active === true || is_active === undefined) ? 1 : 0;
        const finalStatusId = status_id || (enabledStatus ? 1 : 2);

        const [result] = await connection.execute(
            'INSERT INTO company_modules (company_id, module_id, is_enabled, country_id, property_type_id, premises_type_id, area_id, vehicle_usage_id, region, status_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) RETURNING id',
            [companyId, module_id, enabledStatus, country_id || null, property_type_id || null, premises_type_id || null, area_id || null, vehicle_usage_id || null, region || null, finalStatusId]
        );

        const companyModuleId = result.insertId;

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
    const { is_active, country_id, property_type_id, premises_type_id, area_id, vehicle_usage_id, region, status_id, selected_fields } = req.body;
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
            'UPDATE company_modules SET is_enabled=?, country_id=?, property_type_id=?, premises_type_id=?, area_id=?, vehicle_usage_id=?, region=?, status_id=? WHERE id=? AND company_id=?',
            [enabledStatus, country_id || null, property_type_id || null, premises_type_id || null, area_id || null, vehicle_usage_id || null, region || null, finalStatusId, id, companyId]
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
        console.log('[getModuleMaster] User:', JSON.stringify(req.user));
        console.log('[getModuleMaster] CompanyID:', companyId);
        const userRole = String(req.user?.role || '').toUpperCase();

        const queryParameter = companyId || 0; // Use 0 or -1 to ensure SQL comparison (company_id = NULL is false, which is what we want for no mappings)

        const query = `
            SELECT 
                mm.module_id, mm.module_name, mm.is_active, mm.created_at,
                MAX(cm.id) as mapping_id,
                MAX(cm.country_id) as country_id,
                MAX(cm.property_type_id) as property_type_id,
                MAX(cm.premises_type_id) as premises_type_id,
                MAX(cm.area_id) as area_id,
                MAX(cm.status_id) as status_id,
                MAX(cm.region) as region,
                MAX(c.country_name) as country,
                MAX(prop.name) as property_type,
                MAX(pt.type_name) as premises_type,
                MAX(a.name) as section_area,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = MAX(cm.id)) as selected_field_ids,
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
        const [rows] = await db.execute(query, [queryParameter, queryParameter, queryParameter, queryParameter]);
        const mapped = rows.map(r => ({
            ...r,
            selected_fields: r.selected_field_ids ? r.selected_field_ids.split(',').map(Number) : []
        }));
        res.json({ success: true, data: mapped });
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
 * GET /api/vehicle-usage
 */
exports.getVehicleUsage = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name FROM vehicle_usage ORDER BY id ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getVehicleUsage Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load vehicle usage options' });
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
 * GET /api/status-master
 */
exports.getStatusMaster = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name FROM status_master ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[API] getStatusMaster Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load statuses' });
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
        const { module_id, country_id, property_type_id, premises_type_id, area_id, vehicle_usage_id, region } = req.query;

        if (!companyId) return res.status(403).json({ success: false, message: 'Company context missing' });
        if (!module_id) return res.status(400).json({ success: false, message: 'module_id is required' });

        let whereConditions = ['cm.company_id = ?', 'cm.module_id = ?'];
        let whereParams = [companyId, module_id];
        let scoreParts = ['100']; // Base score
        let selectParams = []; // Parameters injected in the SELECT clause

        // Hierarchy of parameters
        const addCondition = (val, field, scoreWeight) => {
            if (val) {
                whereConditions.push(`(cm.${field} = ? OR cm.${field} IS NULL)`);
                whereParams.push(val);
                scoreParts.push(`(CASE WHEN cm.${field} = ? THEN ${scoreWeight} ELSE (CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END) END)`);
                selectParams.push(val);
            } else {
                whereConditions.push(`cm.${field} IS NULL`);
                scoreParts.push(`(CASE WHEN cm.${field} IS NULL THEN 1 ELSE 0 END)`);
            }
        };

        addCondition(country_id, 'country_id', 10);
        addCondition(property_type_id, 'property_type_id', 5);
        addCondition(premises_type_id, 'premises_type_id', 5);
        addCondition(area_id, 'area_id', 5);
        addCondition(vehicle_usage_id, 'vehicle_usage_id', 20); // High weight for vehicle usage

        // Region special case
        if (region && region !== 'All') {
            whereConditions.push("(cm.region = ? OR cm.region IS NULL OR cm.region = 'All')");
            whereParams.push(region);
            scoreParts.push("(CASE WHEN cm.region = ? THEN 15 ELSE (CASE WHEN cm.region IS NULL OR cm.region = 'All' THEN 1 ELSE 0 END) END)");
            selectParams.push(region);
        } else {
            whereConditions.push("(cm.region IS NULL OR cm.region = 'All')");
            scoreParts.push('1');
        }

        const query = `
            SELECT 
                cm.id as company_module_id,
                (SELECT string_agg(field_id::text, ',') FROM company_module_field_selection WHERE company_module_id = cm.id) as selected_field_ids,
                (${scoreParts.join(' + ')}) as match_score
            FROM company_modules cm
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY match_score DESC, cm.id DESC
            LIMIT 1
        `;

        // IMPORTANT: selectParams appear in the SELECT clause, so they must come BEFORE whereParams
        const finalParams = [...selectParams, ...whereParams];

        console.log('[getSelectedFieldsByConditions] Params Check:', { selectLen: selectParams.length, whereLen: whereParams.length, total: finalParams.length });

        const [rows] = await db.execute(query, finalParams);

        if (rows.length === 0) {
            console.log('[getSelectedFieldsByConditions] No exact configuration found for these criteria.');
            return res.json({ success: true, data: { selected_field_ids: null } });
        }

        const selectedFieldIds = rows[0].selected_field_ids ? rows[0].selected_field_ids.split(',').map(Number) : [];
        console.log(`[getSelectedFieldsByConditions] Found best match (ID: ${rows[0].company_module_id}, Score: ${rows[0].match_score}) with ${selectedFieldIds.length} fields.`);

        res.json({
            success: true,
            data: {
                company_module_id: rows[0].company_module_id,
                selected_field_ids: selectedFieldIds
            }
        });
    } catch (error) {
        console.error('[getSelectedFieldsByConditions] Server Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching module configuration' });
    }
};

/**
 * DELETE /api/company-modules/:id
 */
exports.deleteCompanyModule = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.company_id || req.companyId;

        if (!companyId) {
            return res.status(403).json({ success: false, message: 'Company context missing' });
        }

        // Delete field selections first
        await db.execute('DELETE FROM company_module_field_selection WHERE company_module_id = ?', [id]);

        // Delete the main record
        const [result] = await db.execute('DELETE FROM company_modules WHERE id = ? AND company_id = ?', [id, companyId]);

        res.json({ success: true, message: 'Module configuration deleted successfully' });
    } catch (error) {
        console.error('[deleteCompanyModule] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete module configuration' });
    }
};

