
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting EduCrafters client in', process.env.NODE_ENV, 'mode');

// Launch the server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

viteProcess.on('error', (err) => {
  console.error('Failed to start client:', err);
  process.exit(1);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Shutting down...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});