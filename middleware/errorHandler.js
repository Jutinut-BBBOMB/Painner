// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
        const msg = Object.values(err.errors).map(e => e.message).join(', ');
        return res.status(400).json({ success: false, message: msg });
    }
    if (err.name === 'CastError')
        return res.status(400).json({ success: false, message: 'Invalid ID format' });
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;