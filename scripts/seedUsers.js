/**
 * Script to seed users for EduCrafters platform
 * Created by Chakridhar - April 2025
 *
 * This script creates test users for the platform
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Test users to create
const USERS = [
  {
    username: 'chakri',
    email: 'chakri@gmail.com',
    password: 'password',
    role: 'student',
    fullName: 'Chakridhar (Student)',
    profilePicture: null,
    isEmailVerified: true
  },
  {
    username: 'chakri-in',
    email: 'chakri-in@gmail.com',
    password: 'password',
    role: 'instructor',
    fullName: 'Chakridhar (Instructor)',
    profilePicture: null,
    isEmailVerified: true
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB with URI:', uri.replace(/\/\/([^:]+):([^@]+)/, '//[username]:[password]'));
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Create or update user
async function createOrUpdateUser(userData) {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      console.log(`User ${userData.email} already exists. Updating...`);
      
      // Update user role and other fields
      user.role = userData.role;
      user.fullName = userData.fullName;
      user.username = userData.username;
      user.isEmailVerified = userData.isEmailVerified;
      
      if (userData.profilePicture) {
        user.profilePicture = userData.profilePicture;
      }
      
      await user.save();
      
      return user;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create new user
    const newUser = new User({
      ...userData,
      password: hashedPassword
    });
    
    await newUser.save();
    console.log(`Created ${userData.role} user: ${userData.email}`);
    
    return newUser;
  } catch (error) {
    console.error(`Error creating/updating user ${userData.email}:`, error);
    throw error;
  }
}

// Create memory storage users
async function createMemoryUsers() {
  console.log('Creating users in memory storage...');
  
  // Access the global inMemoryUsers variable if it exists
  if (global.inMemoryUsers) {
    for (const userData of USERS) {
      const existingUser = global.inMemoryUsers.find(user => user.email === userData.email);
      
      if (existingUser) {
        console.log(`Memory user ${userData.email} already exists.`);
        continue;
      }
      
      const hashedPassword = await hashPassword(userData.password);
      
      // Create a simple user object for in-memory storage
      const newUser = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...userData,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      global.inMemoryUsers.push(newUser);
      console.log(`Created memory user: ${userData.email}`);
    }
  } else {
    console.log('Memory storage not available in this context');
  }
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('Starting to create users...');
    
    // Create users in MongoDB
    for (const userData of USERS) {
      await createOrUpdateUser(userData);
    }
    
    // Also try to create in-memory users if possible
    await createMemoryUsers();
    
    console.log('Users created successfully!');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

// Run the main function
main();