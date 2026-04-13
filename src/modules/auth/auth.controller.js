const authService = require('./auth.service');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const result = await authService.login(email, password);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

const getProfile = async (req, res) => {
    const user = req.user;
    const permissions = req.permissions;
    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role?.name,
            permissions,
        },
    });
};

module.exports = { login, getProfile };
