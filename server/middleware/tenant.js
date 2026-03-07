const db = require('../config/db');

/**
 * TenantScope middleware
 * Ensures every request has a company context (req.companyId)
 */
const tenantScope = async (req, res, next) => {
    try {
        // 1. Basic security check
        if (!req.user) {
            console.warn('[TenantScope] 401: No user on request object');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = req.user;
        const role = String(user?.role || '').toUpperCase();

        console.log(`[TenantScope] Process: ${req.method} ${req.url} | User: ${user?.email} | Role: ${role}`);

        let resolvedCompanyId = null;

        // 2. Super Admin handling
        if (role === 'SUPER_ADMIN') {
            // Check implicit/explicit identifiers
            // We check query, then body, then user-level default
            resolvedCompanyId = (req.query?.company_id) || (req.body?.company_id) || (user?.company_id);

            if (!resolvedCompanyId) {
                // Fallback for Super Admin: Default to Company 1 to allow platform access
                console.log('[TenantScope] SuperAdmin: No explicit company provided, defaulting to 1');
                resolvedCompanyId = 1;
            }
        }
        // 3. Regular User handling
        else {
            resolvedCompanyId = user?.company_id;

            // Recovery: If token is missing company_id, check database
            if (!resolvedCompanyId && user?.id) {
                console.log(`[TenantScope] Token missing company_id for user ${user.id}. Querying DB...`);
                const [rows] = await db.execute('SELECT company_id FROM users WHERE id = ?', [user.id]);
                if (rows && rows.length > 0) {
                    resolvedCompanyId = rows[0].company_id;
                    // Update user object for current request lifecycle
                    if (req.user) req.user.company_id = resolvedCompanyId;
                }
            }
        }

        // 4. Final check
        if (!resolvedCompanyId) {
            console.error('[TenantScope] 403: Failed to resolve company context');
            return res.status(403).json({ success: false, message: 'Forbidden: missing company context' });
        }

        // 5. Success
        req.companyId = parseInt(resolvedCompanyId);
        console.log(`[TenantScope] Success: companyId=${req.companyId}`);
        next();

    } catch (error) {
        try {
            const fs = require('fs');
            fs.appendFileSync('tenant_error.log', `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) { }
        console.error('[TenantScope] Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error in tenant middleware' });
    }
};

module.exports = tenantScope;
