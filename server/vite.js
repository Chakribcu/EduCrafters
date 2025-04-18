import path from 'path';
import fs from 'fs';
import express from 'express';

/**
 * Utility to log messages
 */
function log(message, source = "express") {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} [${source}] ${message}`);
}

/**
 * Set up Vite development server middleware
 */
async function setupVite(app, server) {
  // In development, we use Vite as middleware
  const { createServer: createViteServer } = await import('vite');
  
  log('Creating Vite server...');
  
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
    },
    appType: 'spa',
  });
  
  app.use(vite.middlewares);
  
  // Add catch-all route for SPA routing in development
  app.get('*', async (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    log(`Serving path: ${req.path}`);
    log(`URL: ${req.url}, originalUrl: ${req.originalUrl}`);
    
    try {
      // Read the index.html file
      // Try multiple possible paths for index.html
      const possiblePaths = [
        path.resolve('./client/index.html'),
        path.resolve('./client/public/index.html'),
        path.resolve('./index.html'),
        path.resolve(__dirname, '../client/index.html'),
        path.resolve(__dirname, '../client/public/index.html')
      ];
      
      let indexPath = null;
      let indexHtml = null;
      
      // Find the first path that exists
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          indexPath = tryPath;
          indexHtml = fs.readFileSync(tryPath, 'utf-8');
          log(`Found and loaded index.html from ${indexPath}`);
          break;
        } else {
          log(`Index.html not found at ${tryPath}`);
        }
      }
      
      if (!indexHtml) {
        log(`WARNING: index.html not found in any of these paths: ${possiblePaths.join(', ')}`, 'error');
        return res.status(404).send('index.html not found. Please check server logs for more details.');
      }
      
      try {
        // Apply Vite HTML transforms
        log(`Attempting to transform HTML for URL: ${req.originalUrl}`);
        indexHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
        log(`HTML transform successful`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(indexHtml);
      } catch (transformError) {
        log(`Error during HTML transform: ${transformError.message}`, 'error');
        console.error('Full transform error:', transformError);
        
        // Fallback: try to serve the original HTML without transform
        res.status(200).set({ 'Content-Type': 'text/html' }).end(indexHtml);
      }
    } catch (e) {
      console.error('Error serving index.html:', e);
      vite.ssrFixStacktrace(e);
      res.status(500).send(`Error: ${e.message}`);
    }
  });
  
  log('Vite middleware initialized');
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
  setupVite,
  serveStatic
};