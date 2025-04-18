import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run the seed script
console.log('Running seed script...');
exec('node scripts/seedDemoData.js', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});