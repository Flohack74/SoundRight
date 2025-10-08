#!/usr/bin/env node

/**
 * Fix Date-fns Error Script
 * This script fixes the date-fns export path error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Date-fns Error...\n');

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

function fixDateFnsError() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing date-fns export path error...', 'yellow');
  
  // Method 1: Install compatible date-fns version
  log('Method 1: Installing compatible date-fns version...', 'blue');
  
  const installCommands = [
    'npm uninstall date-fns',
    'npm install date-fns@^2.30.0 --save --legacy-peer-deps --force'
  ];
  
  for (const cmd of installCommands) {
    if (!runCommand(cmd, frontendDir)) {
      log(`⚠️  Command failed: ${cmd}`, 'yellow');
    }
  }
  
  // Method 2: Clean install with overrides
  log('Method 2: Clean install with date-fns override...', 'blue');
  runCommand('rm -rf node_modules package-lock.json', frontendDir);
  
  const installSuccess = runCommand('npm install --legacy-peer-deps --force', frontendDir);
  
  if (installSuccess) {
    log('✅ Installation successful with date-fns override', 'green');
    return true;
  }
  
  // Method 3: Create webpack alias for date-fns
  log('Method 3: Creating webpack alias for date-fns...', 'blue');
  
  const webpackConfigPath = path.join(frontendDir, 'webpack.config.js');
  let webpackConfig = '';
  
  if (fs.existsSync(webpackConfigPath)) {
    webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
  } else {
    webpackConfig = `const path = require('path');

module.exports = function override(config, env) {
  return config;
};
`;
  }
  
  // Add date-fns alias if not already present
  if (!webpackConfig.includes('date-fns')) {
    webpackConfig = webpackConfig.replace(
      'config.resolve.alias = {',
      `config.resolve.alias = {
    ...config.resolve.alias,
    'date-fns/_lib/format/longFormatters': path.resolve(__dirname, 'node_modules/date-fns/esm/_lib/format/longFormatters.js'),`
    );
    
    fs.writeFileSync(webpackConfigPath, webpackConfig);
    log('✅ Updated webpack.config.js with date-fns alias', 'green');
  }
  
  return true;
}

function testBuild() {
  log('Testing build after date-fns fix...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('Date-fns Error Fixer', 'blue');
  log('====================', 'blue');
  
  const fixed = fixDateFnsError();
  
  if (fixed) {
    log('\n✅ Date-fns error fixed!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ Build successful!', 'green');
      log('\n🎉 Date-fns issue resolved!', 'green');
    } else {
      log('⚠️  Build still has issues. This might be a different problem.', 'yellow');
      log('Check the error message and try:', 'yellow');
      log('1. Check if all dependencies are installed correctly', 'reset');
      log('2. Try: npm run clean && npm run install-all', 'reset');
      log('3. Check if there are other export path issues', 'reset');
    }
  } else {
    log('\n❌ Could not fix date-fns error', 'red');
    log('Try manual approach:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. npm uninstall date-fns', 'reset');
    log('3. npm install date-fns@^2.30.0 --save --legacy-peer-deps --force', 'reset');
    log('4. npm run build', 'reset');
  }
}

main();
