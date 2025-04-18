import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

// Protect routes - only allow authenticated users
export const protect = async (req, res, next) => {
  // Allow access to courses and lessons endpoints without authentication
  if (req.path.startsWith('/api/courses') && req.method === 'GET') {
    return next();
  }
  
  // Check if user is already authenticated via session (cookie)
  if (req.session && req.session.userId) {
    try {
      req.user = await User.findById(req.session.userId);
      if (req.user) {
        return next();
      }
    } catch (error) {
      console.error('Session authentication error:', error);
      // Continue to token authentication if session auth fails
    }
  }

  let token;
  
  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }
  
  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from token
    try {
      if (typeof decoded.id === 'string' && decoded.id.match(/^[0-9a-fA-F]{24}$/)) {
        req.user = await User.findById(decoded.id);
      } else {
        // Try to find by numeric ID if not a valid ObjectId
        req.user = await User.findOne({ id: parseInt(decoded.id) });
      }
    } catch (userErr) {
      console.error('Error finding user:', userErr.message);
      // Continue and let the next check handle it
    }
    
    if (!req.user) {
      console.error(`User with ID ${decoded.id} not found`);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Allow access to courses and lessons routes without role check
    if (req.path.startsWith('/api/courses') && req.method === 'GET') {
      return next();
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};