const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../../models');

const login = async (email, password) => {
    const user = await User.findOne({
        where: { email },
        include: [
            {
                model: Role,
                as: 'role',
                include: [{ model: Permission, as: 'permissions' }],
            },
        ],
    });

    if (!user) throw { status: 401, message: 'Invalid email or password.' };
    if (!user.is_active) throw { status: 401, message: 'Account is inactive. Please contact admin.' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw { status: 401, message: 'Invalid email or password.' };

    const permissions = user.role?.permissions?.map(p => p.name) || [];
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role?.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role?.name,
            permissions,
        },
    };
};

module.exports = { login };
