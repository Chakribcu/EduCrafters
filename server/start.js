#!/usr/bin/env node

/**
 * Cross-platform startup script for EduCrafters
 * Works on both Windows and Unix-based systems
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting EduCrafters server in', process.env.NODE_ENV, 'mode');

// Launch the server
const server = spawn('node', [resolve(__dirname, 'index.js')], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});