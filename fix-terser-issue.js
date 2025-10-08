#!/usr/bin/env node

/**
 * Fix Terser Issue Script
 * This script fixes the terser not found error in Vite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Terser Issue...\n');

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

function fixTerserIssue() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing terser not found error...', 'yellow');
  
  // Option 1: Install terser
  log('Option 1: Installing terser...', 'blue');
  const installSuccess = runCommand('npm install terser --save-dev', frontendDir);
  
  if (installSuccess) {
    log('✅ Terser installed successfully', 'green');
  } else {
    log('⚠️  Failed to install terser, trying alternative...', 'yellow');
  }
  
  // Option 2: Update Vite config to use esbuild instead
  log('Option 2: Updating Vite config to use esbuild...', 'blue');
  const viteConfigPath = path.join(frontendDir, 'vite.config.js');
  
  if (fs.existsSync(viteConfigPath)) {
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Replace terser with esbuild
    viteConfig = viteConfig.replace(
      "minify: 'terser',",
      "minify: 'esbuild',"
    );
    
    fs.writeFileSync(viteConfigPath, viteConfig);
    log('✅ Updated Vite config to use esbuild', 'green');
  }
  
  // Option 3: Install dependencies
  log('Option 3: Installing all dependencies...', 'blue');
  const depsSuccess = runCommand('npm install', frontendDir);
  
  if (depsSuccess) {
    log('✅ Dependencies installed successfully', 'green');
  }
  
  return installSuccess || depsSuccess;
}

function testBuild() {
  log('Testing build after terser fix...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('Terser Issue Fixer', 'blue');
  log('==================', 'blue');
  
  const fixed = fixTerserIssue();
  
  if (fixed) {
    log('\n✅ Terser issue fixed!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ Build successful!', 'green');
      log('\n🎉 Terser issue resolved!', 'green');
    } else {
      log('⚠️  Build still has issues, but terser is fixed.', 'yellow');
      log('Try running: cd frontend && npm run build', 'reset');
    }
  } else {
    log('\n❌ Could not fix terser issue', 'red');
    log('Try manual approach:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. npm install terser --save-dev', 'reset');
    log('3. npm run build', 'reset');
  }
}

main();
