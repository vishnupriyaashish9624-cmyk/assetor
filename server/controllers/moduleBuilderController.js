const db = require('../config/db');
const { generateAutoID } = require('../utils/idGenerator');

// --- MODULE SECTIONS ---

exports.getModuleSections = async (req, res) => {
    // Supports both /:id/sections and query param ?module_id=
    const moduleId = req.params.id || req.query.module_id;

    if (!moduleId) {
        return res.status(400).json({ success: false, message: 'Module ID is required' });
    }

    try {
        console.log(`[getModuleSections] Fetching sections for Module ID: ${moduleId}, Company: ${req.user?.company_id}`);
        const [sections] = await db.execute(
            'SELECT * FROM public.module_sections WHERE module_id = ? AND (company_id = ? OR company_id = 1) ORDER BY sort_order ASC, id ASC',
            [moduleId, req.companyId || req.user?.company_id || 0]
        );
        console.log(`[getModuleSections] Found ${sections.length} sections`);
        res.json({ success: true, data: sections });
    } catch (error) {
        console.error('getModuleSections error:', error);

        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSectionTemplates = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT name FROM module_sections ORDER BY name ASC'
        );
        const names = rows.map(r => r.name);
        console.log(`[API] Returning ${names.length} section templates:`, names);
        res.json({ success: true, data: names });
    } catch (error) {
        console.error('getSectionTemplates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createSection = async (req, res) => {
    // Supports both /:id/sections and body-based
    const moduleId = req.params.id || req.body.module_id;
    const { name, sort_order } = req.body;

    if (!moduleId || !name) {
        return res.status(400).json({ success: false, message: 'Module ID and Name are required' });
    }

    const activeCompanyId = req.user?.company_id || 1;

    try {
        const [rows] = await db.execute(
            'INSERT INTO module_sections (company_id, module_id, name, sort_order) VALUES (?, ?, ?, ?) RETURNING id',
            [activeCompanyId, moduleId, name, sort_order || 0]
        );
        res.status(201).json({ success: true, data: { id: rows.insertId } });
    } catch (error) {
        console.error('createSection error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- FIELDS ---

exports.getSectionFields = async (req, res) => {
    const sectionId = req.query.section_id || req.params.id;

    try {
        let query = `
            SELECT f.*, s.name as section_name 
            FROM module_section_fields f
            LEFT JOIN module_sections s ON f.section_id = s.id
            WHERE 1=1
        `;
        let params = [];

        if (sectionId) {
            query += ' AND f.section_id = ?';
            params.push(sectionId);
        }

        if (req.user?.role && req.user.role !== 'SUPER_ADMIN') {
            query += ' AND (f.company_id = ? OR f.company_id = 1)';
            params.push(req.user?.company_id || 0);
        }

        query += ' ORDER BY f.sort_order ASC';

        const [fields] = await db.execute(query, params);

        // Fetch options
        const fieldIds = fields.map(f => f.id);
        let optionsMap = {};

        if (fieldIds.length > 0) {
            const placeholders = fieldIds.map(() => '?').join(',');
            const [options] = await db.execute(
                `SELECT * FROM module_section_field_options WHERE field_id IN (${placeholders}) ORDER BY sort_order ASC`,
                fieldIds
            );

            options.forEach(opt => {
                if (!optionsMap[opt.field_id]) optionsMap[opt.field_id] = [];
                optionsMap[opt.field_id].push(opt);
            });
        }

        const data = fields.map(field => ({
            ...field,
            options: optionsMap[field.id] || []
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('getSectionFields error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createField = async (req, res) => {
    // Destructure based on the prompt's requirements
    const {
        module_id,
        section_id,
        field_key,
        label,
        field_type,
        placeholder,
        is_required,
        is_active,
        sort_order,
        options // Array of { label, value }
    } = req.body;

    console.log('[ModuleBuilder] createField called with payload:', {
        module_id,
        section_id,
        field_type,
        company_id: req.user?.company_id,
        options_count: options?.length || 0,
        meta_json: req.body.meta_json
    });

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert Field
        const activeCompanyId = req.user?.company_id || 1;
        console.log('[ModuleBuilder] Inserting field into module_section_fields with:', {
            activeCompanyId,
            module_id,
            section_id,
            field_key,
            label,
            field_type
        });
        const [rows] = await connection.execute(
            `INSERT INTO module_section_fields 
            (company_id, module_id, section_id, field_key, label, field_type, placeholder, is_required, is_active, sort_order, meta_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                activeCompanyId,
                module_id,
                section_id,
                field_key,
                label,
                field_type,
                placeholder || null,
                is_required ? 1 : 0,
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                sort_order || 0,
                req.body.meta_json ? (typeof req.body.meta_json === 'string' ? req.body.meta_json : JSON.stringify(req.body.meta_json)) : null
            ]
        );

        const fieldId = rows.insertId;
        console.log(`[ModuleBuilder] Field created with ID: ${fieldId}`);

        // 2. Insert Options if applicable
        if (['radio', 'select', 'dropdown', 'checkbox', 'multiselect'].includes(field_type) && options && Array.isArray(options)) {
            console.log(`[ModuleBuilder] Inserting ${options.length} options for field ${fieldId}...`);
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                await connection.execute(
                    `INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order) VALUES (?, ?, ?, ?)`,
                    [fieldId, opt.option_label || opt.label, opt.option_value || opt.value, i]
                );
            }
            console.log(`[ModuleBuilder] ${options.length} options inserted successfully`);
        }

        await connection.commit();
        console.log('[ModuleBuilder] Transaction committed successfully');
        res.status(201).json({ success: true, message: 'Field created', data: { id: fieldId } });

    } catch (error) {
        await connection.rollback();
        console.error('[ModuleBuilder] createField error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    } finally {
        connection.release();
    }
};

// ... (Keep generic Module CRUD if needed, but focus on the requested parts)

exports.updateField = async (req, res) => {
    const fieldId = req.params.id;
    const { label, field_key, field_type, placeholder, is_required, is_active, sort_order, options } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let updateQuery = `
            UPDATE module_section_fields 
            SET label = ?, field_key = ?, field_type = ?, placeholder = ?, 
                is_required = ?, is_active = ?, sort_order = ?, meta_json = ?
            WHERE id = ?
        `;
        let updateParams = [
            label, field_key, field_type, placeholder || null,
            is_required ? 1 : 0, is_active ? 1 : 0, sort_order || 0,
            req.body.meta_json ? (typeof req.body.meta_json === 'string' ? req.body.meta_json : JSON.stringify(req.body.meta_json)) : null,
            fieldId
        ];

        if (req.user?.role && req.user.role !== 'SUPER_ADMIN') {
            updateQuery += ' AND company_id = ?';
            updateParams.push(req.user?.company_id || 0);
        }

        await connection.execute(updateQuery, updateParams);

        // 2. Sync Options
        // Delete existing
        await connection.execute('DELETE FROM module_section_field_options WHERE field_id = ?', [fieldId]);

        // Insert new ones if applicable
        if (['radio', 'select', 'dropdown', 'multiselect'].includes(field_type) && options && Array.isArray(options)) {
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                await connection.execute(
                    `INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order) VALUES (?, ?, ?, ?)`,
                    [fieldId, opt.option_label || opt.label, opt.option_value || opt.value, i]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Field updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('updateField error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

exports.deleteField = async (req, res) => {
    const fieldId = req.params.id;
    const companyId = req.user?.company_id;

    console.log(`[ModuleBuilder] Attempting to delete field: ${fieldId} for company: ${companyId} (Role: ${req.user?.role})`);

    if (!fieldId) {
        return res.status(400).json({ success: false, message: 'Field ID is required' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check Ownership
        let query = 'SELECT id, company_id FROM module_section_fields WHERE id = ?';
        let params = [fieldId];

        // If not super admin, must match company
        if (req.user?.role !== 'SUPER_ADMIN') {
            query += ' AND company_id = ?';
            params.push(companyId);
        }

        const [check] = await connection.execute(query, params);
        console.log(`[ModuleBuilder] Ownership check result: ${check.length > 0 ? 'FOUND' : 'NOT FOUND'}`);

        if (check.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Field not found or no permission' });
        }

        // 2. Delete Options
        await connection.execute('DELETE FROM module_section_field_options WHERE field_id = ?', [fieldId]);
        console.log(`[ModuleBuilder] Deleted options for field ${fieldId}`);

        // 3. Delete Field
        await connection.execute('DELETE FROM module_section_fields WHERE id = ?', [fieldId]);
        console.log(`[ModuleBuilder] Deleted field ${fieldId}`);

        await connection.commit();
        console.log('[ModuleBuilder] SUCCESS: Field deleted');
        res.json({ success: true, message: 'Field deleted successfully' });

    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { }
        }
        console.error(`[ModuleBuilder] ERROR: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

exports.getModules = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM modules WHERE company_id = ? ORDER BY created_at DESC',
            [req.user?.company_id || 0]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getModules error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.previewAutoID = async (req, res) => {
    const { module_id, field_key } = req.query;
    const companyId = req.companyId || (req.user && req.user.company_id) || 1;
    console.log(`[previewAutoID] Request: module_id=${module_id}, field_key=${field_key}, companyId=${companyId}`);

    if (!module_id || !field_key) {
        return res.status(400).json({ success: false, message: 'module_id and field_key are required' });
    }

    try {
        const connection = await db.getConnection();
        // 1. Find the field to get its meta_json (id_code)
        const [fields] = await connection.execute(
            `SELECT meta_json FROM module_section_fields 
             WHERE module_id = ? AND field_key = ? 
             AND (company_id = ? OR company_id = 1) 
             LIMIT 1`,
            [module_id, field_key, companyId]
        );
        connection.release();

        let table = 'vehicle_module_details';
        let prefix = 'v';
        let idCode = null;

        const mId = parseInt(module_id);
        if (mId === 1) {
            table = 'premises_module_details';
            prefix = 'p';
        } else if (mId === 2 || mId === 6) {
            table = 'vehicle_module_details';
            prefix = 'v';
        }

        if (fields.length > 0 && fields[0].meta_json) {
            try {
                const meta = typeof fields[0].meta_json === 'string' ? JSON.parse(fields[0].meta_json) : fields[0].meta_json;
                idCode = meta.id_code;
            } catch (e) { }
        }

        const nextID = await generateAutoID(companyId, field_key, table, prefix, idCode);
        res.json({ success: true, data: nextID });
    } catch (error) {
        console.error('previewAutoID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
