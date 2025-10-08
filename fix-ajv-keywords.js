#!/usr/bin/env node

/**
 * Fix AJV Keywords Error Script
 * This script specifically fixes the ajv-keywords format error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing AJV Keywords Error...\n');

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

function fixAjvKeywordsError() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing AJV Keywords format error...', 'yellow');
  
  // Method 1: Clean install with specific versions
  log('Method 1: Clean install with overrides...', 'blue');
  runCommand('rm -rf node_modules package-lock.json', frontendDir);
  
  // Install with overrides
  const installSuccess = runCommand('npm install --legacy-peer-deps --force', frontendDir);
  
  if (installSuccess) {
    log('✅ Installation successful with overrides', 'green');
    return true;
  }
  
  // Method 2: Manual patch
  log('Method 2: Manual patch approach...', 'blue');
  
  // Create a patch for the problematic file
  const ajvKeywordsPath = path.join(frontendDir, 'node_modules', 'ajv-keywords', 'keywords', '_formatLimit.js');
  
  if (fs.existsSync(ajvKeywordsPath)) {
    log('Patching AJV keywords file...', 'blue');
    
    let content = fs.readFileSync(ajvKeywordsPath, 'utf8');
    
    // Replace the problematic line
    content = content.replace(
      'var format = formats[name];',
      'var format = formats && formats[name];'
    );
    
    // Also add a null check
    content = content.replace(
      'if (typeof format != "function") {',
      'if (!formats || typeof format != "function") {'
    );
    
    fs.writeFileSync(ajvKeywordsPath, content);
    log('✅ Patched AJV keywords file', 'green');
    return true;
  }
  
  // Method 3: Alternative approach - use different versions
  log('Method 3: Installing compatible versions...', 'blue');
  
  const commands = [
    'npm uninstall ajv-keywords',
    'npm install ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps --force',
    'npm install ajv-formats@^2.1.1 --save-dev --legacy-peer-deps --force'
  ];
  
  for (const cmd of commands) {
    if (!runCommand(cmd, frontendDir)) {
      log(`⚠️  Command failed: ${cmd}`, 'yellow');
    }
  }
  
  return true;
}

function testBuild() {
  log('Testing build after fix...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('AJV Keywords Error Fixer', 'blue');
  log('=======================', 'blue');
  
  const fixed = fixAjvKeywordsError();
  
  if (fixed) {
    log('\n✅ AJV keywords error fixed!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ Build successful!', 'green');
    } else {
      log('⚠️  Build still has issues. Try running the full fix script:', 'yellow');
      log('node fix-build-issue.js', 'reset');
    }
  } else {
    log('\n❌ Could not fix AJV keywords error', 'red');
    log('Try manual approach:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. rm -rf node_modules package-lock.json', 'reset');
    log('3. npm install --legacy-peer-deps --force', 'reset');
    log('4. NODE_OPTIONS="--openssl-legacy-provider" npm run build', 'reset');
  }
}

main();
