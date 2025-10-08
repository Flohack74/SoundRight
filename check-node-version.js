#!/usr/bin/env node

/**
 * Node.js Version Compatibility Checker for SoundRight
 * This script checks if the current Node.js version meets the requirements
 */

const fs = require('fs');
const path = require('path');

// Required Node.js version
const REQUIRED_NODE_VERSION = '22.0.0';
const REQUIRED_NPM_VERSION = '10.0.0';

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

function parseVersion(version) {
  return version.replace(/^v/, '').split('.').map(Number);
}

function compareVersions(current, required) {
  const currentParts = parseVersion(current);
  const requiredParts = parseVersion(required);
  
  for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;
    
    if (currentPart > requiredPart) return 1;
    if (currentPart < requiredPart) return -1;
  }
  
  return 0;
}

function checkNodeVersion() {
  const currentNodeVersion = process.version;
  const nodeComparison = compareVersions(currentNodeVersion, REQUIRED_NODE_VERSION);
  
  log(`Node.js Version Check:`, 'blue');
  log(`  Current: ${currentNodeVersion}`, 'reset');
  log(`  Required: v${REQUIRED_NODE_VERSION}+`, 'reset');
  
  if (nodeComparison >= 0) {
    log(`  ✅ Node.js version is compatible`, 'green');
    return true;
  } else {
    log(`  ❌ Node.js version is too old`, 'red');
    log(`  Please upgrade to Node.js v${REQUIRED_NODE_VERSION} or higher`, 'yellow');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const npmVersion = require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim();
    const npmComparison = compareVersions(npmVersion, REQUIRED_NPM_VERSION);
    
    log(`\nnpm Version Check:`, 'blue');
    log(`  Current: v${npmVersion}`, 'reset');
    log(`  Required: v${REQUIRED_NPM_VERSION}+`, 'reset');
    
    if (npmComparison >= 0) {
      log(`  ✅ npm version is compatible`, 'green');
      return true;
    } else {
      log(`  ❌ npm version is too old`, 'red');
      log(`  Please upgrade npm to v${REQUIRED_NPM_VERSION} or higher`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`  ❌ Could not check npm version: ${error.message}`, 'red');
    return false;
  }
}

function checkPackageJsonEngines() {
  const packageFiles = [
    'package.json',
    'backend/package.json',
    'frontend/package.json'
  ];
  
  log(`\nPackage.json Engine Requirements:`, 'blue');
  
  packageFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (packageJson.engines) {
          log(`  ${file}:`, 'reset');
          if (packageJson.engines.node) {
            log(`    Node.js: ${packageJson.engines.node}`, 'reset');
          }
          if (packageJson.engines.npm) {
            log(`    npm: ${packageJson.engines.npm}`, 'reset');
          }
        }
      } catch (error) {
        log(`  ❌ Could not read ${file}: ${error.message}`, 'red');
      }
    }
  });
}

function checkSystemRequirements() {
  log(`\nSystem Requirements Check:`, 'blue');
  
  // Check available memory
  const totalMemory = require('os').totalmem();
  const totalMemoryGB = Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100;
  
  log(`  Total Memory: ${totalMemoryGB} GB`, 'reset');
  if (totalMemoryGB >= 2) {
    log(`  ✅ Sufficient memory available`, 'green');
  } else {
    log(`  ⚠️  Low memory detected. Consider upgrading to at least 2GB`, 'yellow');
  }
  
  // Check available disk space
  try {
    const stats = fs.statSync('.');
    log(`  ✅ Disk space check passed`, 'green');
  } catch (error) {
    log(`  ❌ Disk space check failed: ${error.message}`, 'red');
  }
  
  // Check if we're on a supported platform
  const platform = process.platform;
  const supportedPlatforms = ['linux', 'darwin', 'win32'];
  
  log(`  Platform: ${platform}`, 'reset');
  if (supportedPlatforms.includes(platform)) {
    log(`  ✅ Platform is supported`, 'green');
  } else {
    log(`  ⚠️  Platform may not be fully supported`, 'yellow');
  }
}

function main() {
  log(`SoundRight Node.js Compatibility Check`, 'blue');
  log(`=====================================`, 'blue');
  
  const nodeOk = checkNodeVersion();
  const npmOk = checkNpmVersion();
  checkPackageJsonEngines();
  checkSystemRequirements();
  
  log(`\nSummary:`, 'blue');
  if (nodeOk && npmOk) {
    log(`✅ All version requirements met! You can proceed with installation.`, 'green');
    process.exit(0);
  } else {
    log(`❌ Version requirements not met. Please upgrade before proceeding.`, 'red');
    log(`\nInstallation Instructions:`, 'yellow');
    log(`1. Install Node.js 22.x: https://nodejs.org/`, 'reset');
    log(`2. Update npm: npm install -g npm@latest`, 'reset');
    log(`3. Run this check again: node check-node-version.js`, 'reset');
    process.exit(1);
  }
}

// Run the check
main();
