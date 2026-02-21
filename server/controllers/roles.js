const db = require('../config/db');

/**
 * Get all roles for the current company
 */
exports.getAllRoles = async (req, res) => {
    try {
        const companyId = req.companyId;
        const [roles] = await db.execute(`
            SELECT DISTINCT r.id, r.role_name, r.description, r.is_active,
    (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count
    FROM roles r
    WHERE r.company_id = ?
    ORDER BY r.role_name ASC
        `, [companyId]);

        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('[RoleController] getAllRoles error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
};

/**
 * Get a single role with its permissions
 */
exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        const [roles] = await db.execute('SELECT * FROM roles WHERE id = ? AND company_id = ?', [id, companyId]);

        if (roles.length === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        const [permissions] = await db.execute('SELECT * FROM role_permissions WHERE role_id = ?', [id]);

        res.json({
            success: true,
            data: {
                ...roles[0],
                permissions
            }
        });
    } catch (error) {
        console.error('[RoleController] getRoleById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch role details' });
    }
};

/**
 * Create a new role with permissions
 */
exports.createRole = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const companyId = req.companyId;
        const { role_name, description, is_active, permissions } = req.body;

        // 1. Check if role name already exists for this company
        const [existing] = await connection.execute('SELECT id FROM roles WHERE company_id = ? AND role_name = ?', [companyId, role_name]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'A role with this name already exists' });
        }

        // 2. Insert role
        const [result] = await connection.execute(`
            INSERT INTO roles (company_id, role_name, description, is_active)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, [companyId, role_name, description, is_active]);

        const roleId = result[0].id;

        // 3. Insert permissions
        if (permissions && Array.isArray(permissions)) {
            for (const perm of permissions) {
                await connection.execute(`
                    INSERT INTO role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_approve)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [roleId, perm.module_name, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete, perm.can_approve || false]);
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Role created successfully', id: roleId });
    } catch (error) {
        await connection.rollback();
        console.error('[RoleController] createRole error:', error);
        res.status(500).json({ success: false, message: 'Failed to create role' });
    } finally {
        connection.release();
    }
};

/**
 * Update a role and its permissions
 */
exports.updateRole = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const companyId = req.companyId;
        const { role_name, description, is_active, permissions } = req.body;

        // 1. Check if role exists and belongs to company
        const [roles] = await connection.execute('SELECT * FROM roles WHERE id = ? AND company_id = ?', [id, companyId]);
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // 2. Update role basic info
        await connection.execute(`
            UPDATE roles 
            SET role_name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [role_name, description, is_active, id]);

        // 3. Update permissions (Delete and re-insert)
        await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        if (permissions && Array.isArray(permissions)) {
            for (const perm of permissions) {
                await connection.execute(`
                    INSERT INTO role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_approve)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [id, perm.module_name, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete, perm.can_approve || false]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('[RoleController] updateRole error:', error);
        res.status(500).json({ success: false, message: 'Failed to update role' });
    } finally {
        connection.release();
    }
};

/**
 * Delete a role
 */
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;

        // Check if users are assigned to this role
        const [users] = await db.execute('SELECT id FROM users WHERE role_id = ?', [id]);
        if (users.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete role because users are assigned to it. Remove users from this role first.'
            });
        }

        const [result] = await db.execute('DELETE FROM roles WHERE id = ? AND company_id = ?', [id, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('[RoleController] deleteRole error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete role' });
    }
};
