/**
 * Session Persistence Middleware
 * Created by Chakridhar - April 2025
 * 
 * This middleware ensures users stay logged in across page refreshes
 * by persisting session tokens
 */
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';
import User from '../../models/User.js';

export const persistSession = async (req, res, next) => {
  // Skip for API routes that handle their own auth
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  try {
    // Check if token exists in cookies
    const token = req.cookies?.authToken;
    
    if (!token) {
      // No token found, proceed without authentication
      return next();
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    
    // Get user data
    let user;
    
    // First try from MongoDB
    try {
      if (global.dbType === 'mongodb') {
        user = await User.findById(decoded.id);
      }
    } catch (mongoError) {
      console.error('MongoDB user lookup failed:', mongoError.message);
    }
    
    // If not found in MongoDB, try memory storage
    if (!user) {
      user = await storage.getUser(decoded.id);
    }
    
    if (!user) {
      // Invalid user ID in token, clear the cookie
      res.clearCookie('authToken');
      console.log('Invalid user ID in token, clearing cookie');
      return next();
    }
    
    // Set user in request object
    req.user = user;
    console.log(`Session restored for user: ${user.name || user.email}`);
    
    // Renew token if it's about to expire (if token is older than 1 day)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (tokenAge > oneDay) {
      // Create a new token
      const newToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
      });
      
      // Set the new token in cookies
      res.cookie('authToken', newToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      console.log('Token renewed for user:', user.email);
    }
    
    next();
  } catch (error) {
    console.error('Session restoration error:', error);
    // Clear the invalid cookie
    res.clearCookie('authToken');
    next();
  }
};

export default persistSession;