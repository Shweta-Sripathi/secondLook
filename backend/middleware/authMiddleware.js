const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../controllers/authController');

/**
 * Protect Middleware: Verifies JWT token from Authorization header and attaches user to req.user.
 * Includes fault-tolerant fallback if MongoDB Atlas is offline.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string from "Bearer <token>" header
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature against JWT_SECRET
      const decoded = jwt.verify(token, getJwtSecret());

      // Attempt DB lookup with safe fallback
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        console.log('[secondLook] Auth middleware DB fallback:', dbErr.message);
      }

      if (!req.user) {
        req.user = {
          _id: decoded.id,
          role: decoded.role,
          name: decoded.role === 'recruiter' ? 'Recruiter' : 'Candidate',
          email: 'user@fallback.local'
        };
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token failed or expired'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no bearer token provided'));
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware: Restricts route access to authorized roles.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role '${req.user?.role || 'unknown'}' is not authorized to access this resource`)
      );
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
