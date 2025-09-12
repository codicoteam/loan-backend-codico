const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

const auth = {
  authenticateToken: async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      console.log(`🔐 Auth middleware - Token received: ${token ? 'YES' : 'NO'}`);
      
      if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({
          success: false,
          message: 'Authorization token is required'
        });
      }

      // Debug: Log the JWT secret being used
      const jwtSecret = process.env.JWT_SECRET || 'Pocket_2025';
      console.log(`🔐 JWT Secret being used: ${jwtSecret}`);
      
      const decoded = jwt.verify(token, jwtSecret);
      console.log(`✅ Token decoded successfully for user: ${decoded.id}`);
      
      const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
      
      if (!currentUser) {
        console.log('❌ User account not found');
        return res.status(401).json({
          success: false,
          message: 'User account not found'
        });
      }

      if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
        console.log('❌ Password was changed recently');
        return res.status(401).json({
          success: false,
          message: 'Password was changed recently. Please log in again.'
        });
      }

      req.user = currentUser;
      console.log(`✅ Authentication successful for user: ${currentUser.email}`);
      next();
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      
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

      console.error('Authentication error details:', error);
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
    const jwtSecret = process.env.JWT_SECRET || 'Pocket_2025';
    console.log(`🔐 Signing token with secret: ${jwtSecret}`);
    return jwt.sign(
      { id: userId, role: userRole },
      jwtSecret,
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