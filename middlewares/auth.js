const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

const auth = {
  authenticateToken: async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token is required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Pocket_2025');
      const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
      
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: 'User account not found'
        });
      }

      if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password was changed recently. Please log in again.'
        });
      }

      req.user = currentUser;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }

      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  },

  restrictTo: (...allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to perform this action'
        });
      }
      next();
    };
  },

  signToken: (userId, userRole, expiresIn = '30d') => {
    return jwt.sign(
      { id: userId, role: userRole },
      process.env.JWT_SECRET || 'Pocket_2025',
      { expiresIn }
    );
  },

  createSendToken: (user, statusCode, res) => {
    const token = auth.signToken(user._id, user.role);
    user.password = undefined;
    user.passwordChangedAt = undefined;
    res.status(statusCode).json({
      success: true,
      token,
      data: { user }
    });
  }
};

module.exports = auth;