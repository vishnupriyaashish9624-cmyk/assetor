const db = require('../config/db');

// --- READ OPERATIONS ---

exports.getModuleMaster = async (req, res) => {
    try {
        console.log(`[ERP_DEBUG] Request received for /api/module-master. User Role: ${req.user?.role}`);

        const query = 'SELECT module_id, module_name, is_active, created_at FROM module_master WHERE is_active = 1 ORDER BY module_name ASC';
        const [rows] = await db.execute(query);

        console.log(`[ERP_DEBUG] SQL Query: ${query}`);
        console.log(`[ERP_DEBUG] Rows found: ${rows.length}`);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[ERP_ERROR] getModuleMaster error:', error);
        res.status(500).json({ success: false, message: 'Failed to load module master', error: error.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        // Return summary list
        const query = `
            SELECT t.*, m.module_name,
            (SELECT COUNT(*) FROM module_heads h WHERE h.template_id = t.id) as head_count,
            (SELECT COUNT(*) FROM module_subheads s JOIN module_heads h ON s.head_id = h.id WHERE h.template_id = t.id) as subhead_count
            FROM module_templates t
            JOIN module_master m ON t.module_id = m.module_id
            WHERE t.company_id = ? AND t.is_active = 1
            ORDER BY t.created_at DESC
        `;
        const [rows] = await db.execute(query, [req.user?.company_id || 0]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getTemplates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTemplateDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [templates] = await db.execute(
            'SELECT * FROM module_templates WHERE id = ? AND company_id = ?',
            [id, req.user?.company_id || 0]
        );
        if (templates.length === 0) return res.status(404).json({ success: false, message: 'Template not found' });
        const template = templates[0];

        // Fetch Heads
        const [heads] = await db.execute(
            'SELECT * FROM module_heads WHERE template_id = ? ORDER BY head_order ASC',
            [id]
        );

        // Populate Hierarchy
        for (let head of heads) {
            const [subheads] = await db.execute(
                'SELECT * FROM module_subheads WHERE head_id = ? ORDER BY subhead_order ASC',
                [head.id]
            );

            for (let sub of subheads) {
                if (['SELECT', 'RADIO'].includes(sub.field_type)) {
                    const [options] = await db.execute(
                        'SELECT * FROM module_subhead_options WHERE subhead_id = ? ORDER BY option_order ASC',
                        [sub.id]
                    );
                    sub.options = options;
                } else {
                    sub.options = [];
                }
            }
            head.subheads = subheads;
        }

        template.heads = heads;
        res.json({ success: true, data: template });
    } catch (error) {
        console.error('getTemplateDetail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- WRITE OPERATIONS ---

exports.createTemplate = async (req, res) => {
    const { module_id, template_name, heads } = req.body;

    // Validation
    if (!module_id) return res.status(400).json({ success: false, message: 'module_id is required' });
    if (!heads || heads.length === 0) return res.status(400).json({ success: false, message: 'At least 1 head is required' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Template
        const [tRows] = await connection.execute(
            'INSERT INTO module_templates (company_id, module_id, template_name) VALUES (?, ?, ?) RETURNING id',
            [req.user?.company_id || 0, module_id, template_name || '']
        );
        const templateId = tRows[0].id;

        // 2. Process Heads
        let hOrder = 1;
        for (const head of heads) {
            if (!head.subheads || head.subheads.length === 0) {
                throw new Error(`Head "${head.head_title}" must have at least 1 subhead`);
            }

            const [hRows] = await connection.execute(
                'INSERT INTO module_heads (template_id, head_title, head_order) VALUES (?, ?, ?) RETURNING id',
                [templateId, head.head_title, head.head_order || hOrder++]
            );
            const headId = hRows[0].id;

            // 3. Process Subheads
            let sOrder = 1;
            for (const sub of head.subheads) {
                const [sRows] = await connection.execute(
                    'INSERT INTO module_subheads (head_id, subhead_title, field_type, placeholder, is_required, subhead_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
                    [
                        headId,
                        sub.subhead_title,
                        sub.field_type,
                        sub.placeholder || null,
                        sub.is_required ? 1 : 0,
                        sub.subhead_order || sOrder++
                    ]
                );
                const subheadId = sRows[0].id;

                // 4. Process Options
                if (['SELECT', 'RADIO', 'CHECKBOX'].includes(sub.field_type)) {
                    if (!sub.options || sub.options.length === 0) {
                        throw new Error(`Subhead "${sub.subhead_title}" requires options`);
                    }
                    let oOrder = 1;
                    for (const opt of sub.options) {
                        await connection.execute(
                            'INSERT INTO module_subhead_options (subhead_id, option_label, option_value, option_order) VALUES (?, ?, ?, ?)',
                            [subheadId, opt.option_label, opt.option_value, opt.option_order || oOrder++]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Template created successfully', data: { id: templateId } });
    } catch (error) {
        await connection.rollback();
        console.error('createTemplate error:', error);
        res.status(400).json({ success: false, message: error.message || 'Validation failed' });
    } finally {
        connection.release();
    }
};

exports.createConfiguration = async (req, res) => {
    const { module_id, template_name, description, use_template_sections } = req.body;
    const company_id = req.user?.company_id || 0;

    if (!module_id) return res.status(400).json({ success: false, message: 'Module is required' });
    if (!template_name || template_name.trim().length < 3) return res.status(400).json({ success: false, message: 'Template Name must be at least 3 characters' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Template
        const [tRows] = await connection.execute(
            'INSERT INTO module_templates (company_id, module_id, template_name, description) VALUES (?, ?, ?, ?) RETURNING id',
            [company_id, module_id, template_name.trim(), description || '']
        );
        const templateId = tRows[0].id;

        // 2. Add Default Sections if requested
        if (use_template_sections) {
            const [hRows] = await connection.execute(
                'INSERT INTO module_heads (template_id, head_title, head_order) VALUES (?, ?, ?) RETURNING id',
                [templateId, 'Basic Information', 1]
            );
            const headId = hRows[0].id;

            await connection.execute(
                'INSERT INTO module_subheads (head_id, subhead_title, field_type, subhead_order) VALUES (?, ?, ?, ?)',
                [headId, 'Reference Name', 'TEXT', 1]
            );
        }

        await connection.commit();
        res.json({
            success: true,
            message: 'Configuration created successfully',
            data: {
                configuration_id: templateId,
                template_name: template_name.trim(),
                module_id
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('createConfiguration error:', error);
        res.status(500).json({ success: false, message: 'Failed to create configuration' });
    } finally {
        connection.release();
    }
};

exports.updateTemplate = async (req, res) => {
    const { id } = req.params;
    const { module_id, template_name, heads } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check ownership
        const [check] = await connection.execute(
            'SELECT id FROM module_templates WHERE id = ? AND company_id = ?',
            [id, req.user?.company_id || 0]
        );
        if (check.length === 0) throw new Error('Template not found');

        // Update Template Info
        await connection.execute(
            'UPDATE module_templates SET module_id = ?, template_name = ? WHERE id = ?',
            [module_id, template_name, id]
        );

        // Delete Old Hierarchy (Cascading delete handles subheads/options)
        await connection.execute('DELETE FROM module_heads WHERE template_id = ?', [id]);

        // Re-insert Hierarchy
        let hOrder = 1;
        for (const head of heads) {
            const [hRows] = await connection.execute(
                'INSERT INTO module_heads (template_id, head_title, head_order) VALUES (?, ?, ?) RETURNING id',
                [id, head.head_title, head.head_order || hOrder++]
            );
            const headId = hRows[0].id;

            let sOrder = 1;
            for (const sub of head.subheads) {
                const [sRows] = await connection.execute(
                    'INSERT INTO module_subheads (head_id, subhead_title, field_type, placeholder, is_required, subhead_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
                    [
                        headId,
                        sub.subhead_title,
                        sub.field_type,
                        sub.placeholder || null,
                        sub.is_required ? 1 : 0,
                        sub.subhead_order || sOrder++
                    ]
                );
                const subheadId = sRows[0].id;

                if (['SELECT', 'RADIO', 'CHECKBOX'].includes(sub.field_type)) {
                    if (!sub.options || sub.options.length === 0) {
                        throw new Error(`Subhead "${sub.subhead_title}" requires options`);
                    }
                    let oOrder = 1;
                    for (const opt of sub.options) {
                        await connection.execute(
                            'INSERT INTO module_subhead_options (subhead_id, option_label, option_value, option_order) VALUES (?, ?, ?, ?)',
                            [subheadId, opt.option_label, opt.option_value, opt.option_order || oOrder++]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Template updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('updateTemplate error:', error);
        res.status(400).json({ success: false, message: error.message || 'Update failed' });
    } finally {
        connection.release();
    }
};

exports.deleteTemplate = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [check] = await connection.execute(
            'SELECT id FROM module_templates WHERE id = ? AND company_id = ?',
            [id, req.user?.company_id || 0]
        );
        if (check.length === 0) {
            connection.rollback();
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        await connection.execute('DELETE FROM module_templates WHERE id = ?', [id]);

        await connection.commit();
        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        await connection.rollback();
        console.error('deleteTemplate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};
