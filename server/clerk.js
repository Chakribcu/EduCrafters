/**
 * JWT Authentication Helper File
 * Created by: Chakridhar
 * This file provides utility functions for JWT authentication
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// No Clerk SDK - we're using our own JWT implementation

/**
 * Verify a JWT token
 * @param {string} token - JWT token from client
 * @returns {Promise<Object>} - User data if token is valid
 */
export const verifyToken = async (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set in environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Error verifying JWT token:", error);
    throw new Error("Invalid token");
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User data
 */
export const getUserById = async (userId) => {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw new Error("User not found");
  }
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// No need for Clerk sync functions as we're not using Clerk

// This is a stub function to maintain compatibility with any code that might
// still reference this function. It just uses our standard authentication now.
export const getOrCreateUserByClerkId = async (userId) => {
  console.warn("getOrCreateUserByClerkId called, but Clerk is not being used");
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error("Error in getOrCreateUserByClerkId stub:", error);
    throw new Error("User not found");
  }
};
