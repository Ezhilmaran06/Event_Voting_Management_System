const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'event_voting_super_secret_jwt_key_2026';

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Optional auth: attaches user if token is valid, but doesn't block if absent
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // ignore expired optional token
    }
  }
  next();
};

// Middleware to require Admin role
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
  }
  next();
};

// Middleware to require Organizer or Admin role
exports.requireOrganizer = (req, res, next) => {
  if (!req.user || (req.user.role !== 'Organizer' && req.user.role !== 'Admin')) {
    return res.status(403).json({ error: 'Access forbidden: Organizer or Admin privileges required.' });
  }
  next();
};

exports.JWT_SECRET = JWT_SECRET;
