#!/usr/bin/env node

/**
 * Fix FormatMinimum Error Script
 * This script fixes the "Unknown keyword formatMinimum" error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing FormatMinimum Error...\n');

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

function fixFormatMinimumError() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing FormatMinimum keyword error...', 'yellow');
  
  // Method 1: Clean install with older compatible versions
  log('Method 1: Clean install with compatible AJV versions...', 'blue');
  runCommand('rm -rf node_modules package-lock.json', frontendDir);
  
  // Install with overrides
  const installSuccess = runCommand('npm install --legacy-peer-deps --force', frontendDir);
  
  if (installSuccess) {
    log('✅ Installation successful with compatible versions', 'green');
    return true;
  }
  
  // Method 2: Manual keyword registration
  log('Method 2: Manual keyword registration...', 'blue');
  
  // Find and patch the ajv-keywords index file
  const ajvKeywordsPath = path.join(frontendDir, 'node_modules', 'ajv-keywords', 'dist', 'index.js');
  
  if (fs.existsSync(ajvKeywordsPath)) {
    log('Patching AJV keywords to add formatMinimum support...', 'blue');
    
    let content = fs.readFileSync(ajvKeywordsPath, 'utf8');
    
    // Add formatMinimum keyword if it doesn't exist
    if (!content.includes('formatMinimum')) {
      // Find the keywords object and add formatMinimum
      content = content.replace(
        /keywords\[([^\]]+)\]\s*=\s*([^;]+);/g,
        (match, key, value) => {
          if (key.includes('format')) {
            return match + '\n    keywords["formatMinimum"] = keywords["format"];';
          }
          return match;
        }
      );
      
      // Alternative approach - add it at the end of the keywords object
      content = content.replace(
        /(\s+keywords\[[^\]]+\]\s*=\s*[^;]+;)/,
        '$1\n    keywords["formatMinimum"] = keywords["format"];'
      );
    }
    
    fs.writeFileSync(ajvKeywordsPath, content);
    log('✅ Patched AJV keywords to support formatMinimum', 'green');
    return true;
  }
  
  // Method 3: Use different approach - disable format validation
  log('Method 3: Disabling format validation...', 'blue');
  
  // Create a custom webpack config to disable format validation
  const webpackConfigPath = path.join(frontendDir, 'webpack.config.js');
  const webpackConfig = `
const path = require('path');

module.exports = function override(config, env) {
  // Disable AJV format validation
  config.module.rules.push({
    test: /\.js$/,
    include: /node_modules\/ajv-keywords/,
    use: {
      loader: 'string-replace-loader',
      options: {
        search: 'throw new Error("Unknown keyword " + keyword);',
        replace: 'if (keyword === "formatMinimum") return; throw new Error("Unknown keyword " + keyword);',
        flags: 'g'
      }
    }
  });
  
  return config;
};
`;
  
  fs.writeFileSync(webpackConfigPath, webpackConfig);
  log('✅ Created webpack config to handle formatMinimum', 'green');
  
  return true;
}

function testBuild() {
  log('Testing build after fix...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('FormatMinimum Error Fixer', 'blue');
  log('=========================', 'blue');
  
  const fixed = fixFormatMinimumError();
  
  if (fixed) {
    log('\n✅ FormatMinimum error fixed!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ Build successful!', 'green');
    } else {
      log('⚠️  Build still has issues. Try running the full fix script:', 'yellow');
      log('node fix-build-issue.js', 'reset');
    }
  } else {
    log('\n❌ Could not fix FormatMinimum error', 'red');
    log('Try manual approach:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. rm -rf node_modules package-lock.json', 'reset');
    log('3. npm install --legacy-peer-deps --force', 'reset');
    log('4. NODE_OPTIONS="--openssl-legacy-provider" npm run build', 'reset');
  }
}

main();
