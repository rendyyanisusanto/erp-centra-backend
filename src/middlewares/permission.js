/**
 * Dynamic RBAC permission middleware
 * @param {string} requiredPermission - e.g. 'purchase.create'
 */
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        const permissions = req.permissions || [];
        if (!permissions.includes(requiredPermission)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission: ${requiredPermission}`,
            });
        }
        next();
    };
};

module.exports = requirePermission;
