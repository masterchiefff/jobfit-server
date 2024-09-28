const authMiddleware = (req, res, next) => {
    // Example of checking for a session or token (customize as needed)
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = req.session.userId; 
    next();
};

module.exports = authMiddleware;