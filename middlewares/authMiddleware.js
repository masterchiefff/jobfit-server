const authMiddleware = (req, res, next) => {
    // Example of checking for a session or token (customize as needed)
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = req.session.userId; // Attach user ID to request object for later use
    next();
};

module.exports = authMiddleware;