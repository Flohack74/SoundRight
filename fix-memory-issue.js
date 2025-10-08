#!/usr/bin/env node

/**
 * Fix Memory Issue Script
 * This script fixes JavaScript heap out of memory errors during build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Memory Issues...\n');

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
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--max-old-space-size=8192 --openssl-legacy-provider',
        GENERATE_SOURCEMAP: 'false',
        INLINE_RUNTIME_CHUNK: 'false'
      }
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    return false;
  }
}

function fixMemoryIssues() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing JavaScript heap out of memory issues...', 'yellow');
  
  // Step 1: Create optimized .env file
  log('Step 1: Creating optimized environment configuration...', 'blue');
  const envContent = `# Node.js memory optimization
NODE_OPTIONS=--max-old-space-size=8192 --openssl-legacy-provider

# React build optimizations
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
ESLINT_NO_DEV_ERRORS=true

# Disable source maps to save memory
GENERATE_SOURCEMAP=false

# Optimize build process
SKIP_PREFLIGHT_CHECK=true
`;
  
  const envFile = path.join(frontendDir, '.env');
  fs.writeFileSync(envFile, envContent);
  log('✅ Created optimized .env file', 'green');
  
  // Step 2: Create webpack config for memory optimization
  log('Step 2: Creating memory-optimized webpack configuration...', 'blue');
  const webpackConfig = `const path = require('path');

module.exports = function override(config, env) {
  // Memory optimization
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };
  
  // Reduce memory usage during build
  config.performance = {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  };
  
  // Optimize module resolution
  config.resolve = {
    ...config.resolve,
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  };
  
  // Handle AJV modules
  config.resolve.alias = {
    ...config.resolve.alias,
    'ajv/dist/compile/context': path.resolve(__dirname, 'node_modules/ajv/dist/compile/context.js'),
    'ajv/dist/compile/codegen': path.resolve(__dirname, 'node_modules/ajv/dist/compile/codegen.js'),
    'date-fns/_lib/format/longFormatters': path.resolve(__dirname, 'node_modules/date-fns/esm/_lib/format/longFormatters.js')
  };
  
  return config;
};
`;
  
  const webpackConfigPath = path.join(frontendDir, 'webpack.config.js');
  fs.writeFileSync(webpackConfigPath, webpackConfig);
  log('✅ Created memory-optimized webpack.config.js', 'green');
  
  // Step 3: Clean build artifacts
  log('Step 3: Cleaning build artifacts...', 'blue');
  runCommand('rm -rf build node_modules/.cache', frontendDir);
  
  // Step 4: Test build with memory optimization
  log('Step 4: Testing build with memory optimization...', 'blue');
  return runCommand('npm run build:dev', frontendDir);
}

function checkSystemResources() {
  log('Checking system resources...', 'blue');
  
  try {
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const totalMemoryGB = Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100;
    const freeMemoryGB = Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100;
    
    log(`Total Memory: ${totalMemoryGB} GB`, 'reset');
    log(`Free Memory: ${freeMemoryGB} GB`, 'reset');
    
    if (totalMemoryGB < 4) {
      log('⚠️  Warning: System has less than 4GB RAM. Build may fail.', 'yellow');
      log('Consider increasing swap space or using a machine with more RAM.', 'yellow');
    }
    
    if (freeMemoryGB < 2) {
      log('⚠️  Warning: Less than 2GB free memory. Build may fail.', 'yellow');
      log('Try closing other applications or restarting the system.', 'yellow');
    }
    
  } catch (error) {
    log('Could not check system resources', 'yellow');
  }
}

function main() {
  log('Memory Issue Fixer for SoundRight', 'blue');
  log('==================================', 'blue');
  
  checkSystemResources();
  
  const fixed = fixMemoryIssues();
  
  if (fixed) {
    log('\n✅ Memory issues fixed!', 'green');
    log('Build completed successfully with memory optimization.', 'green');
  } else {
    log('\n❌ Could not fix memory issues', 'red');
    log('Try these manual approaches:', 'yellow');
    log('1. Increase system swap space', 'reset');
    log('2. Close other applications to free memory', 'reset');
    log('3. Use a machine with more RAM (8GB+ recommended)', 'reset');
    log('4. Try building in smaller chunks', 'reset');
    log('5. Use: NODE_OPTIONS="--max-old-space-size=16384" npm run build', 'reset');
  }
}

main();
