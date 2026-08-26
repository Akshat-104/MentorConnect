const jwt = require('jsonwebtoken');

// Verify JWT Token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'fail', message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, role, and email
    next();
  } catch (error) {
    return res.status(403).json({ status: 'fail', message: 'Invalid or expired token.' });
  }
};

// Role-Based Authorization Guard
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'fail', 
        message: 'Forbidden. You do not have permission to perform this action.' 
      });
    }
    next();
  };
};

module.exports = { authenticateJWT, authorizeRoles };