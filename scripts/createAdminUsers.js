/**
 * Script to create admin credentials for the EduHive platform
 * Created by Chakridhar
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Admin user details
const ADMIN_USERS = [
  {
    username: 'chakri',
    email: 'chakri@gmail.com',
    password: 'password',
    role: 'student',
    fullName: 'Chakridhar (Student)',
    profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
    isEmailVerified: true
  },
  {
    username: 'chakri-instructor',
    email: 'chakri-in@gmail.com',
    password: 'password',
    role: 'instructor',
    fullName: 'Chakridhar (Instructor)',
    profilePicture: 'https://randomuser.me/api/portraits/men/42.jpg',
    isEmailVerified: true
  }
];

// Connect to MongoDB
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
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

// Create or update admin user
async function createOrUpdateAdminUser(userData) {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      console.log(`User ${userData.email} already exists. Updating role to ${userData.role}`);
      
      // Update user role
      user.role = userData.role;
      await user.save();
      
      return user;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create new user
    const newUser = new User({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newUser.save();
    console.log(`Created ${userData.role} user: ${userData.email}`);
    
    return newUser;
  } catch (error) {
    console.error(`Error creating/updating user ${userData.email}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    
    console.log('Starting to create admin users...');
    
    // Create admin users
    for (const userData of ADMIN_USERS) {
      await createOrUpdateAdminUser(userData);
    }
    
    console.log('Admin users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin users:', error);
    process.exit(1);
  }
}

main();