/**
 * JWT Authentication Middleware
 * Created by: Chakridhar
 * This middleware handles JWT token validation and user authentication
 */
import { verifyToken, getUserById } from '../clerk.js';
import User from '../../models/User.js';

/**
 * Middleware to authenticate requests using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Verify the token
    const decoded = await verifyToken(token);
    
    // Get user from database using the ID from token
    const dbUser = await User.findById(decoded.id);
    
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found in database' });
    }
    
    // Attach user to the request
    req.user = dbUser;
    req.userId = dbUser._id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware to check if user is an instructor
 */
export const requireInstructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    return res.status(403).json({ message: 'Not authorized as an instructor' });
  }
};

/**
 * Optional authentication - doesn't return error if no token
 * Just attaches user to request if token is valid
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    // Verify the token
    const decoded = await verifyToken(token);
    
    // Get user from database
    const dbUser = await User.findById(decoded.id);
    
    if (dbUser) {
      req.user = dbUser;
      req.userId = dbUser._id;
    }
    
    next();
  } catch (error) {
    // Just proceed without authentication on error
    console.error('Optional auth error:', error);
    next();
  }
};