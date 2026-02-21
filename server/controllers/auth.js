const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE LOWER(email) = ? ORDER BY id DESC', [cleanEmail]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        let user = null;
        let isMatch = false;

        // Try password against all matching accounts (workaround for duplicates)
        for (const u of users) {
            const match = await bcrypt.compare(cleanPassword, u.password);
            if (match) {
                user = u;
                isMatch = true;
                break;
            }
        }

        if (!isMatch) {
            console.log(`[Auth] Password mismatch for ${cleanEmail} (${users.length} accounts found)`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: 'User account is inactive' });
        }

        // Fetch enabled modules: Prioritize Company settings, fallback to Client settings
        let enabledModules = [];
        try {
            if (user.company_id) {
                const [companies] = await db.execute('SELECT enabled_modules FROM companies WHERE id = ?', [user.company_id]);
                if (companies.length > 0 && companies[0].enabled_modules) {
                    enabledModules = typeof companies[0].enabled_modules === 'string'
                        ? JSON.parse(companies[0].enabled_modules)
                        : companies[0].enabled_modules;
                }
            }

            // Fallback to client modules if company modules are empty/null
            if ((!enabledModules || enabledModules.length === 0) && user.client_id) {
                const [clients] = await db.execute('SELECT enabled_modules FROM clients WHERE id = ?', [user.client_id]);
                if (clients.length > 0 && clients[0].enabled_modules) {
                    const clientModules = typeof clients[0].enabled_modules === 'string'
                        ? JSON.parse(clients[0].enabled_modules)
                        : clients[0].enabled_modules;
                    enabledModules = clientModules;
                }
            }
        } catch (moduleError) {
            console.error('[Auth] Error fetching enabled_modules:', moduleError);
        }

        // Fetch RBAC Permissions if role_id is present
        let permissions = [];
        if (user.role_id) {
            try {
                const [permRows] = await db.execute('SELECT module_name, can_view, can_create, can_edit, can_delete FROM role_permissions WHERE role_id = ?', [user.role_id]);
                permissions = permRows;
            } catch (permError) {
                console.error('[Auth] Error fetching role permissions:', permError);
            }
        }

        const token = jwt.sign(
            {
                id: user.id,
                company_id: user.company_id,
                client_id: user.client_id,
                role: user.role,
                role_id: user.role_id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                role_id: user.role_id,
                company_id: user.company_id,
                client_id: user.client_id,
                enabled_modules: enabledModules,
                permissions: permissions,
                force_reset: user.force_reset
            }
        });
    } catch (error) {
        const fs = require('fs');
        const errMsg = `[LOGIN ERROR] ${new Date().toISOString()}\nMessage: ${error.message}\nStack: ${error.stack}\n\n`;
        console.error('Login error:', error);
        try { fs.appendFileSync(require('path').join(__dirname, '..', 'login_error.log'), errMsg); } catch (e) { }
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, role, role_id, company_id, client_id, status, force_reset FROM users WHERE id = ?', [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        let enabledModules = [];
        let permissions = [];

        // Fetch enabled modules: Prioritize Company, fallback to Client
        if (user.company_id) {
            try {
                const [companies] = await db.execute('SELECT enabled_modules FROM companies WHERE id = ?', [user.company_id]);
                if (companies.length > 0 && companies[0].enabled_modules) {
                    enabledModules = typeof companies[0].enabled_modules === 'string'
                        ? JSON.parse(companies[0].enabled_modules)
                        : companies[0].enabled_modules;
                }
            } catch (err) {
                console.error('[GetMe] Error fetching company enabled_modules:', err);
            }
        }

        if ((!enabledModules || enabledModules.length === 0) && user.client_id) {
            try {
                const [clients] = await db.execute('SELECT enabled_modules FROM clients WHERE id = ?', [user.client_id]);
                if (clients.length > 0 && clients[0].enabled_modules) {
                    enabledModules = typeof clients[0].enabled_modules === 'string'
                        ? JSON.parse(clients[0].enabled_modules)
                        : clients[0].enabled_modules;
                }
            } catch (err) {
                console.error('[GetMe] Error fetching client enabled_modules:', err);
            }
        }

        // Fetch RBAC Permissions if role_id is present
        if (user.role_id) {
            try {
                const [permRows] = await db.execute('SELECT module_name, can_view, can_create, can_edit, can_delete FROM role_permissions WHERE role_id = ?', [user.role_id]);
                permissions = permRows;
            } catch (permError) {
                console.error('[GetMe] Error fetching role permissions:', permError);
            }
        }

        res.json({
            success: true,
            user: {
                ...user,
                enabled_modules: enabledModules,
                permissions: permissions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id; // Corrected to use req.user.id from middleware

    if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Force reset is cleared on successful password update
        await db.execute('UPDATE users SET password = ?, force_reset = false WHERE id = ?', [hashedPassword, userId]);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
