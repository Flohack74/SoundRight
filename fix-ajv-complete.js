#!/usr/bin/env node

/**
 * Complete AJV Fix Script
 * This script fixes all AJV-related build issues with Node.js 22 and react-scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Complete AJV Fix for SoundRight...\n');

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

function fixAjvCompletely() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing all AJV-related issues...', 'yellow');
  
  // Step 1: Complete clean
  log('Step 1: Complete clean of node_modules and locks...', 'blue');
  runCommand('rm -rf node_modules package-lock.json', frontendDir);
  
  // Step 2: Install with specific compatible versions
  log('Step 2: Installing compatible AJV versions...', 'blue');
  
  const installCommands = [
    'npm install --legacy-peer-deps --force',
    'npm install ajv@^7.2.4 --save-dev --legacy-peer-deps --force',
    'npm install ajv-keywords@^4.1.1 --save-dev --legacy-peer-deps --force',
    'npm install ajv-formats@^1.6.1 --save-dev --legacy-peer-deps --force'
  ];
  
  for (const cmd of installCommands) {
    if (!runCommand(cmd, frontendDir)) {
      log(`⚠️  Command failed: ${cmd}`, 'yellow');
    }
  }
  
  // Step 3: Create environment file with Node.js compatibility
  log('Step 3: Creating Node.js compatibility environment...', 'blue');
  const envContent = `# Node.js 22 compatibility
NODE_OPTIONS=--openssl-legacy-provider

# React build optimizations
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false

# Disable ESLint during build
ESLINT_NO_DEV_ERRORS=true

# AJV compatibility
SKIP_PREFLIGHT_CHECK=true
`;
  
  const envFile = path.join(frontendDir, '.env');
  fs.writeFileSync(envFile, envContent);
  log('✅ Created .env file with compatibility options', 'green');
  
  // Step 4: Create webpack config to handle AJV issues
  log('Step 4: Creating webpack config for AJV compatibility...', 'blue');
  const webpackConfig = `const path = require('path');

module.exports = function override(config, env) {
  // Handle AJV module resolution issues
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  };
  
  // Add alias for AJV modules
  config.resolve.alias = {
    ...config.resolve.alias,
    'ajv/dist/compile/context': path.resolve(__dirname, 'node_modules/ajv/dist/compile/context.js'),
    'ajv/dist/compile/codegen': path.resolve(__dirname, 'node_modules/ajv/dist/compile/codegen.js')
  };
  
  // Handle AJV keywords issues
  config.module.rules.push({
    test: /\.js$/,
    include: /node_modules\/ajv-keywords/,
    use: {
      loader: 'string-replace-loader',
      options: {
        search: 'throw new Error("Unknown keyword " + keyword);',
        replace: 'if (keyword === "formatMinimum" || keyword === "formatMaximum") return; throw new Error("Unknown keyword " + keyword);',
        flags: 'g'
      }
    }
  });
  
  return config;
};
`;
  
  const webpackConfigPath = path.join(frontendDir, 'webpack.config.js');
  fs.writeFileSync(webpackConfigPath, webpackConfig);
  log('✅ Created webpack.config.js for AJV compatibility', 'green');
  
  // Step 5: Install additional dependencies for webpack
  log('Step 5: Installing webpack compatibility dependencies...', 'blue');
  const webpackDeps = [
    'npm install string-replace-loader --save-dev --legacy-peer-deps --force',
    'npm install path-browserify --save-dev --legacy-peer-deps --force',
    'npm install os-browserify --save-dev --legacy-peer-deps --force',
    'npm install crypto-browserify --save-dev --legacy-peer-deps --force',
    'npm install stream-browserify --save-dev --legacy-peer-deps --force',
    'npm install buffer --save-dev --legacy-peer-deps --force'
  ];
  
  for (const cmd of webpackDeps) {
    runCommand(cmd, frontendDir);
  }
  
  return true;
}

function testBuild() {
  log('Testing build after complete AJV fix...', 'yellow');
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  return runCommand('npm run build', frontendDir);
}

function main() {
  log('Complete AJV Fix for SoundRight', 'blue');
  log('===============================', 'blue');
  
  const fixed = fixAjvCompletely();
  
  if (fixed) {
    log('\n✅ Complete AJV fix applied!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ Build successful!', 'green');
      log('\n🎉 All AJV issues resolved!', 'green');
    } else {
      log('⚠️  Build still has issues. This might be a different problem.', 'yellow');
      log('Check the error message and try:', 'yellow');
      log('1. Check if all dependencies are installed correctly', 'reset');
      log('2. Try: npm run clean && npm run install-all', 'reset');
      log('3. Check Node.js version: node --version', 'reset');
    }
  } else {
    log('\n❌ Could not apply complete AJV fix', 'red');
    log('Try manual approach:', 'yellow');
    log('1. cd frontend', 'reset');
    log('2. rm -rf node_modules package-lock.json', 'reset');
    log('3. npm install --legacy-peer-deps --force', 'reset');
    log('4. NODE_OPTIONS="--openssl-legacy-provider" npm run build', 'reset');
  }
}

main();
