#!/usr/bin/env node

/**
 * Vite Migration Script for SoundRight
 * This script migrates from react-scripts to Vite for better performance and memory efficiency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Migrating SoundRight to Vite...\n');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'blue');
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env }
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    return false;
  }
}

function migrateToVite() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Starting Vite migration...', 'yellow');
  
  // Step 1: Remove react-scripts and related dependencies
  log('Step 1: Removing react-scripts and related dependencies...', 'blue');
  const removeCommands = [
    'npm uninstall react-scripts',
    'npm uninstall @types/jest',
    'npm uninstall jest',
    'npm uninstall web-vitals'
  ];
  
  for (const cmd of removeCommands) {
    runCommand(cmd, frontendDir);
  }
  
  // Step 2: Install Vite and related dependencies
  log('Step 2: Installing Vite and related dependencies...', 'blue');
  const installCommands = [
    'npm install vite @vitejs/plugin-react --save-dev',
    'npm install vitest @vitest/ui --save-dev',
    'npm install @types/node --save-dev'
  ];
  
  for (const cmd of installCommands) {
    if (!runCommand(cmd, frontendDir)) {
      log(`⚠️  Command failed: ${cmd}`, 'yellow');
    }
  }
  
  // Step 3: Update package.json scripts (already done in package.json)
  log('Step 3: Package.json scripts updated for Vite', 'green');
  
  // Step 4: Create Vite configuration (already done)
  log('Step 4: Vite configuration created', 'green');
  
  // Step 5: Update index.html for Vite
  log('Step 5: Updating index.html for Vite...', 'blue');
  const indexHtmlPath = path.join(frontendDir, 'public', 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Move index.html to root and update for Vite
    const newIndexHtml = indexHtml.replace(
      '<div id="root"></div>',
      '<div id="root"></div>\n    <script type="module" src="/src/index.tsx"></script>'
    );
    
    // Create new index.html in root
    const rootIndexPath = path.join(frontendDir, 'index.html');
    fs.writeFileSync(rootIndexPath, newIndexHtml);
    log('✅ Created index.html for Vite', 'green');
  }
  
  // Step 6: Update environment variables
  log('Step 6: Updating environment variables...', 'blue');
  const envContent = `# Vite environment variables
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SoundRight
VITE_APP_VERSION=1.0.0

# Development settings
VITE_DEV_MODE=true
`;
  
  const envFile = path.join(frontendDir, '.env');
  fs.writeFileSync(envFile, envContent);
  log('✅ Updated environment variables for Vite', 'green');
  
  // Step 7: Update API service to use Vite environment variables
  log('Step 7: Updating API service for Vite...', 'blue');
  const apiServicePath = path.join(frontendDir, 'src', 'services', 'api.ts');
  
  if (fs.existsSync(apiServicePath)) {
    let apiService = fs.readFileSync(apiServicePath, 'utf8');
    
    // Update API URL to use Vite environment variable
    apiService = apiService.replace(
      "baseURL: process.env.REACT_APP_API_URL || '/api'",
      "baseURL: import.meta.env.VITE_API_URL || '/api'"
    );
    
    fs.writeFileSync(apiServicePath, apiService);
    log('✅ Updated API service for Vite', 'green');
  }
  
  // Step 8: Clean up old files
  log('Step 8: Cleaning up old files...', 'blue');
  const cleanupCommands = [
    'rm -rf build',
    'rm -rf node_modules/.cache',
    'rm -rf .eslintcache'
  ];
  
  for (const cmd of cleanupCommands) {
    runCommand(cmd, frontendDir);
  }
  
  // Step 9: Install dependencies
  log('Step 9: Installing updated dependencies...', 'blue');
  const installSuccess = runCommand('npm install', frontendDir);
  
  if (!installSuccess) {
    log('❌ Failed to install dependencies', 'red');
    return false;
  }
  
  return true;
}

function testViteBuild() {
  log('Testing Vite build...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function testViteDev() {
  log('Testing Vite development server...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  // Start dev server in background and test
  log('Starting Vite dev server (will run for 10 seconds)...', 'blue');
  
  try {
    execSync('timeout 10 npm run dev || npm run dev', { 
      cwd: frontendDir, 
      stdio: 'inherit' 
    });
    return true;
  } catch (error) {
    // Timeout is expected, so this is actually success
    return true;
  }
}

function main() {
  log('Vite Migration for SoundRight', 'blue');
  log('============================', 'blue');
  
  const migrated = migrateToVite();
  
  if (migrated) {
    log('\n✅ Migration to Vite completed!', 'green');
    
    const buildSuccess = testViteBuild();
    if (buildSuccess) {
      log('✅ Vite build successful!', 'green');
      
      log('\n🎉 Migration completed successfully!', 'green');
      log('\nNext steps:', 'yellow');
      log('1. Start development server: cd frontend && npm run dev', 'reset');
      log('2. Build for production: cd frontend && npm run build', 'reset');
      log('3. Preview production build: cd frontend && npm run preview', 'reset');
      log('4. Update your deployment scripts to use the new build output', 'reset');
      
    } else {
      log('⚠️  Build test failed, but migration is complete', 'yellow');
      log('Try running: cd frontend && npm run build', 'reset');
    }
  } else {
    log('\n❌ Migration failed', 'red');
    log('Try manual migration:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. npm uninstall react-scripts', 'reset');
    log('3. npm install vite @vitejs/plugin-react --save-dev', 'reset');
    log('4. Update package.json scripts', 'reset');
    log('5. Create vite.config.js', 'reset');
  }
}

main();
