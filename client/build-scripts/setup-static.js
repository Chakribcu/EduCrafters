
// Simple script to help set up static file serving

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const staticHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduCrafters - E-Learning Course Marketplace</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link rel="stylesheet" href="/css/bootstrap.min.css">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- Core JS -->
  <script src="/js/jquery.min.js"></script>
  <script src="/js/bootstrap.bundle.min.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`;

// Create directories
const publicDir = path.resolve(__dirname, '../public');
const cssDir = path.resolve(publicDir, 'css');
const jsDir = path.resolve(publicDir, 'js');

// Create directories if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// Write static HTML
fs.writeFileSync(path.resolve(publicDir, 'index.html'), staticHtml);

// Create a basic CSS file
const basicCSS = `
body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}


`;

fs.writeFileSync(path.resolve(cssDir, 'styles.css'), basicCSS);

// Creating placeholder JS file

const placeholderJS = `
// This is a placeholder for the compiled JavaScript
console.log('EduCrafters application loaded');

// Add your custom JavaScript here
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>EduCrafters</h1><p>The application is being set up...</p></div>';
  }
});
`;

fs.writeFileSync(path.resolve(jsDir, 'app.js'), placeholderJS);

console.log('Static files have been set up successfully!');