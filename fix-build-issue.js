#!/usr/bin/env node

/**
 * Fix Build Issues Script for SoundRight
 * This script fixes common build issues with react-scripts and Node.js 22
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing SoundRight build issues...\n');

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
      env: { ...process.env, NODE_OPTIONS: '--openssl-legacy-provider' }
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    return false;
  }
}

function fixAjvIssue() {
  log('Fixing AJV dependency issue...', 'yellow');
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  // Check if we're in the right directory
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  // Clean node_modules and package-lock.json
  log('Cleaning existing installation...', 'blue');
  runCommand('rm -rf node_modules package-lock.json', frontendDir);
  
  // Install with specific flags
  log('Installing dependencies with legacy peer deps...', 'blue');
  const installSuccess = runCommand('npm install --legacy-peer-deps --force', frontendDir);
  
  if (!installSuccess) {
    log('❌ Installation failed. Trying alternative approach...', 'red');
    
    // Try with --no-optional flag
    log('Trying installation without optional dependencies...', 'blue');
    return runCommand('npm install --legacy-peer-deps --force --no-optional', frontendDir);
  }
  
  return installSuccess;
}

function fixNodeOptions() {
  log('Setting up Node.js options for compatibility...', 'yellow');
  
  // Create or update .env file in frontend
  const frontendDir = path.join(process.cwd(), 'frontend');
  const envFile = path.join(frontendDir, '.env');
  
  const envContent = `# Node.js compatibility options
NODE_OPTIONS=--openssl-legacy-provider

# React build options
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false

# Disable ESLint during build (optional)
ESLINT_NO_DEV_ERRORS=true
`;
  
  fs.writeFileSync(envFile, envContent);
  log('✅ Created .env file with Node.js compatibility options', 'green');
}

function testBuild() {
  log('Testing build...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('SoundRight Build Issue Fixer', 'blue');
  log('============================', 'blue');
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, 'blue');
  
  if (!nodeVersion.startsWith('v22')) {
    log('⚠️  Warning: This script is optimized for Node.js 22.x', 'yellow');
  }
  
  // Fix AJV issue
  const ajvFixed = fixAjvIssue();
  if (!ajvFixed) {
    log('❌ Failed to fix AJV issue', 'red');
    process.exit(1);
  }
  
  // Fix Node.js options
  fixNodeOptions();
  
  // Test build
  const buildSuccess = testBuild();
  
  if (buildSuccess) {
    log('\n✅ Build issue fixed successfully!', 'green');
    log('You can now run: npm run build', 'green');
  } else {
    log('\n❌ Build still failing. Try manual steps:', 'red');
    log('1. cd frontend', 'reset');
    log('2. rm -rf node_modules package-lock.json', 'reset');
    log('3. npm install --legacy-peer-deps --force', 'reset');
    log('4. NODE_OPTIONS="--openssl-legacy-provider" npm run build', 'reset');
  }
}

// Run the fix
main();
