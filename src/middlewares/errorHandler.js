const errorHandler = (err, req, res, next) => {
    console.error('ERROR:', err.message, err.stack);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors.map(e => e.message);
        return res.status(422).json({ success: false, message: messages.join(', ') });
    }

    // Sequelize FK errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        if (err.index === 'fk_sales_salesman_id' || err.message?.includes('fk_sales_salesman_id')) {
            return res.status(400).json({ success: false, message: 'Invalid salesman_id. Please choose a valid salesman or leave it empty.' });
        }
        return res.status(400).json({ success: false, message: 'Invalid reference data for this transaction.' });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
