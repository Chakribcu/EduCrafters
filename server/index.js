// server/index.js - Main entry point
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { setupStatic, log, serveStatic } from './static.js';
import { registerRoutes } from './routes.js';
import * as dotenv from 'dotenv';
import connectDB from '../config/db.js';


// Load environment variables
dotenv.config();

// Get current directory (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Log environment and directory information for debugging
  console.log('----------------------------------------');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Current directory: ${process.cwd()}`);
  console.log(`__dirname: ${__dirname}`);
  console.log('----------------------------------------');
  
  // Connect to database (MongoDB or fallback)
  let dbResult = null;
  try {
    dbResult = await connectDB();
    
    if (dbResult.dbType === 'mongodb') {
      console.log('MongoDB connected and ready to use');
      global.dbType = 'mongodb';
    } else if (dbResult.dbType === 'memory') {
      console.log('Using in-memory database for development');
      // Make the in-memory store available globally
      global.inMemoryStore = dbResult.inMemoryStore;
      global.dbType = 'memory';
    }
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    // We'll continue without DB in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running in development mode with limited functionality');
    }
  }
  
  // Check for index.html file
  [
    path.resolve('./client/index.html'),
    path.resolve('./client/public/index.html'),
    path.resolve(__dirname, '../client/index.html'),
    path.resolve(__dirname, '../client/public/index.html')
  ].forEach(htmlPath => {
    if (fs.existsSync(htmlPath)) {
      console.log(`Found index.html at: ${htmlPath}`);
    } else {
      console.log(`Not found: ${htmlPath}`);
    }
  });

  // Create Express app
  const app = express();
  app.use(cookieParser());

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
    credentials: true // Allow cookies to be sent
  }));
  app.use(express.json());
  app.use(cookieParser()); // Add cookie parser middleware
  app.use(morgan('dev'));

  // Register API routes
  const server = await registerRoutes(app);

  // Add a test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });

  // Special debug routes to see if server is responding
  app.get('/debug', (req, res) => {
    res.send(`
      <html>
        <head><title>EduCrafters Debug</title></head>
        <body>
          <h1>EduCrafters Debug Page</h1>
          <p>Server is running in ${process.env.NODE_ENV || 'undefined'} mode</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
          <p><a href="/api/test">Test API endpoint</a></p>
          <p><a href="/debug-index">Test serving index.html directly</a></p>
        </body>
      </html>
    `);
  });
  
  // Special route to test direct index.html serving
  app.get('/debug-index', (req, res) => {
    try {
      // Try to find and serve index.html directly
      const possiblePaths = [
        path.resolve('./client/index.html'),
        path.resolve('./client/public/index.html'),
        path.resolve(__dirname, '../client/index.html'),
        path.resolve(__dirname, '../client/public/index.html')
      ];
      
      let indexPath = null;
      let indexHtml = null;
      
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          indexPath = tryPath;
          indexHtml = fs.readFileSync(tryPath, 'utf-8');
          console.log(`Found index.html at ${indexPath} for direct serving`);
          break;
        }
      }
      
      if (indexHtml) {
        res.status(200).set({ 'Content-Type': 'text/html' }).end(indexHtml);
      } else {
        res.status(404).send('Could not find index.html for direct serving');
      }
    } catch (err) {
      console.error('Error serving index.html directly:', err);
      res.status(500).send(`Error: ${err.message}`);
    }
  });

  // Serve static files in production or development
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    // Set up static file serving for development
    setupStatic(app);
  }

  // Start the server - FORCE port 5000 for Replit
  const PORT = 5000; // Explicitly set to 5000 to match Replit's expected port
  server.listen(PORT, '0.0.0.0', () => {
    log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
    log(`API server listening at http://localhost:${PORT}`);
    log(`Client app should be available at http://localhost:${PORT}`);
    
    // Additional diagnostic info
    log(`Using forced port: ${PORT}`);
    log(`Environment PORT value: ${process.env.PORT || 'not set'}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default main;