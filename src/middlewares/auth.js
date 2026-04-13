const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({
            where: { id: decoded.id, is_active: true },
            include: [
                {
                    model: Role,
                    as: 'role',
                    include: [{ model: Permission, as: 'permissions' }],
                },
            ],
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or inactive.' });
        }

        req.user = user;
        req.permissions = user.role?.permissions?.map(p => p.name) || [];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

module.exports = authenticate;
