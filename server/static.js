// static.js - Simple static file server replacement for Vite
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility to log messages
 */
function log(message, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

/**
 * Set up static file serving for development
 */
function setupStatic(app) {
  log('Setting up static file serving for development');
  
  // Serve static files from client directory
  const clientPath = path.resolve(__dirname, '../client');
  app.use(express.static(clientPath));
  
  // Serve static files from client/public directory
  const publicPath = path.resolve(__dirname, '../client/public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  
  // Handle SPA routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    log(`Serving path: ${req.path}`);
    
    try {
      // Try to find index.html
      const indexPath = path.resolve(__dirname, '../client/index.html');
      
      if (fs.existsSync(indexPath)) {
        log(`Serving index.html from ${indexPath}`);
        res.sendFile(indexPath);
      } else {
        log(`ERROR: index.html not found at ${indexPath}`, 'error');
        res.status(404).send('index.html not found');
      }
    } catch (err) {
      log(`Error serving index.html: ${err.message}`, 'error');
      res.status(500).send(`Error: ${err.message}`);
    }
  });
  
  log('Static file serving initialized');
}

/**
 * Serve static files in production
 */
function serveStatic(app) {
  const distPath = path.resolve(__dirname, '../dist/public');
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    
    log('Serving production build');
  } else {
    log('Warning: Production build not found in ' + distPath, 'error');
  }
}

export {
  log,
  setupStatic,
  serveStatic
};