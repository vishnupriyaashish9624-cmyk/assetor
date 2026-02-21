const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // console.log('[AuthMiddleware] User:', JSON.stringify(decoded));
        next();
    } catch (ex) {
        console.error('[AuthMiddleware] Invalid Token:', ex.message);
        res.status(401).json({ success: false, message: 'Invalid token, please login again.' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.error('[RequireRole] 401 Unauthorized. No user object.');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        console.log(`[RequireRole] User Role: ${req.user.role}, Required: ${JSON.stringify(roles)}`);
        if (!roles.includes(req.user.role)) {
            console.error(`[RequireRole] 403 Forbidden. User role ${req.user.role} not in ${JSON.stringify(roles)}`);
            return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRole };
