/**
 * Script to create admin credentials
 * Created by Chakridhar
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// MongoDB connection URI
const uri = 'mongodb+srv://elearn_admin:elearn_admin@elearn.igipctg.mongodb.net/?retryWrites=true&w=majority&appName=elearn';

// User credentials to create
const users = [
  {
    name: 'Chakridhar Student',
    email: 'chakri@gmail.com',
    password: 'password',  // This will be hashed
    role: 'student',
    createdAt: new Date()
  },
  {
    name: 'Chakridhar Instructor',
    email: 'chakri-in@gmail.com',
    password: 'password',  // This will be hashed
    role: 'instructor',
    createdAt: new Date()
  }
];

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Process each user
    for (const user of users) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: user.email });
      
      if (existingUser) {
        console.log(`User with email ${user.email} already exists. Skipping.`);
        continue;
      }
      
      // Hash password
      user.password = await hashPassword(user.password);
      
      // Insert user into the database
      const result = await usersCollection.insertOne(user);
      console.log(`Created user with email ${user.email} and role ${user.role}. ID: ${result.insertedId}`);
    }
    
    console.log('Admin users creation completed');
  } catch (error) {
    console.error('Error creating admin users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main();