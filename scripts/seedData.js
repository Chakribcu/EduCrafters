/**
 * Seed data script
 * Created by Chakridhar - April 2025
 * 
 * This script combines admin user creation and demo lessons to quickly setup the platform
 */

import dotenv from 'dotenv';
import { fork } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory path of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Scripts to run in sequence
const scripts = [
  'createAdminUsers.js',
  'addDemoLessons.js'
];

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    
    const child = fork(scriptPath);
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptPath} completed successfully`);
        resolve();
      } else {
        console.error(`Script ${scriptPath} failed with code ${code}`);
        reject(new Error(`Script ${scriptPath} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    for (const script of scripts) {
      const scriptPath = join(__dirname, script);
      await runScript(scriptPath);
    }
    
    console.log('All seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main();