# SoundRight Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the SoundRight application.

## Common Installation Issues

### 1. TypeScript/React-Scripts Compatibility Error

**Error Message:**
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: react-scripts@5.0.1
npm error Found: typescript@5.9.3
```

**Cause:** React Scripts 5.0.1 has strict peer dependency requirements and doesn't support TypeScript 5.x.

**Solutions:**

#### Option 1: Use Legacy Peer Deps (Recommended)
```bash
cd frontend
npm install --legacy-peer-deps
```

#### Option 2: Clean Install
```bash
# Clean everything
npm run clean

# Reinstall with legacy peer deps
npm run install-all
```

#### Option 3: Manual Fix
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 1b. AJV Module Not Found Error

**Error Message:**
```
Error: Cannot find module 'ajv/dist/compile/codegen'
```

**Cause:** This is a common issue with Node.js 22 and react-scripts 5.0.1 due to dependency resolution conflicts.

**Solutions:**

#### Option 1: Use the Fix Script (Recommended)
```bash
node fix-build-issue.js
```

#### Option 2: Manual Fix
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
NODE_OPTIONS="--openssl-legacy-provider" npm run build
```

#### Option 3: Set Environment Variables
```bash
cd frontend
echo "NODE_OPTIONS=--openssl-legacy-provider" > .env
echo "GENERATE_SOURCEMAP=false" >> .env
npm run build
```

### 1c. AJV Keywords Format Error

**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'date')
at _formatLimit.js:63
```

**Cause:** This is a compatibility issue between `ajv-keywords` and Node.js 22, where the `formats` object is undefined.

**Solutions:**

#### Option 1: Use the AJV Keywords Fix Script (Recommended)
```bash
node fix-ajv-keywords.js
```

#### Option 2: Manual Patch
```bash
cd frontend
# Find and patch the problematic file
find node_modules -name "_formatLimit.js" -path "*/ajv-keywords/*" -exec sed -i 's/var format = formats\[name\];/var format = formats \&\& formats[name];/g' {} \;
```

#### Option 3: Clean Install with Overrides
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
```

#### Option 4: Use Different AJV Versions
```bash
cd frontend
npm uninstall ajv-keywords
npm install ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps --force
npm install ajv-formats@^2.1.1 --save-dev --legacy-peer-deps --force
```

### 1d. FormatMinimum Keyword Error

**Error Message:**
```
Error: Unknown keyword formatMinimum
at /node_modules/ajv-keywords/dist/index.js:25
```

**Cause:** This error occurs when AJV doesn't recognize the `formatMinimum` keyword, which is a newer keyword not supported by older versions of ajv-keywords.

**Solutions:**

#### Option 1: Use the FormatMinimum Fix Script (Recommended)
```bash
node fix-formatminimum-error.js
```

#### Option 2: Clean Install with Compatible Versions
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
```

#### Option 3: Use Older AJV Versions
```bash
cd frontend
npm uninstall ajv ajv-keywords ajv-formats
npm install ajv@^6.12.6 --save-dev --legacy-peer-deps --force
npm install ajv-keywords@^3.5.2 --save-dev --legacy-peer-deps --force
npm install ajv-formats@^1.6.1 --save-dev --legacy-peer-deps --force
```

#### Option 4: Disable Format Validation
```bash
cd frontend
# Create webpack.config.js to disable format validation
echo 'module.exports = function override(config, env) {
  config.module.rules.push({
    test: /\.js$/,
    include: /node_modules\/ajv-keywords/,
    use: {
      loader: "string-replace-loader",
      options: {
        search: "throw new Error(\"Unknown keyword \" + keyword);",
        replace: "if (keyword === \"formatMinimum\") return; throw new Error(\"Unknown keyword \" + keyword);",
        flags: "g"
      }
    }
  });
  return config;
};' > webpack.config.js
```

### 1e. AJV Context Module Error

**Error Message:**
```
Error: Cannot find module 'ajv/dist/compile/context'
```

**Cause:** This error occurs when there's a mismatch between AJV versions and the module structure they expect.

**Solutions:**

#### Option 1: Use the Complete AJV Fix Script (Recommended)
```bash
node fix-ajv-complete.js
```

#### Option 2: Clean Install with Compatible Versions
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
```

#### Option 3: Install Specific AJV Versions
```bash
cd frontend
npm uninstall ajv ajv-keywords ajv-formats
npm install ajv@^7.2.4 --save-dev --legacy-peer-deps --force
npm install ajv-keywords@^4.1.1 --save-dev --legacy-peer-deps --force
npm install ajv-formats@^1.6.1 --save-dev --legacy-peer-deps --force
```

#### Option 4: Use Webpack Override
```bash
cd frontend
# Create webpack.config.js with AJV module resolution
echo 'const path = require("path");
module.exports = function override(config, env) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "ajv/dist/compile/context": path.resolve(__dirname, "node_modules/ajv/dist/compile/context.js"),
    "ajv/dist/compile/codegen": path.resolve(__dirname, "node_modules/ajv/dist/compile/codegen.js")
  };
  return config;
};' > webpack.config.js
```

### 1f. Date-fns Export Path Error

**Error Message:**
```
Module not found: Error: Package path ./_lib/format/longFormatters is not exported from package date-fns
```

**Cause:** This error occurs when using date-fns v4.x with MUI date pickers, as v4.x has a different export structure than what MUI expects.

**Solutions:**

#### Option 1: Use the Date-fns Fix Script (Recommended)
```bash
node fix-date-fns-error.js
```

#### Option 2: Install Compatible Date-fns Version
```bash
cd frontend
npm uninstall date-fns
npm install date-fns@^2.30.0 --save --legacy-peer-deps --force
```

#### Option 3: Clean Install with Override
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
```

#### Option 4: Use Webpack Alias
```bash
cd frontend
# Create or update webpack.config.js with date-fns alias
echo 'const path = require("path");
module.exports = function override(config, env) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "date-fns/_lib/format/longFormatters": path.resolve(__dirname, "node_modules/date-fns/esm/_lib/format/longFormatters.js")
  };
  return config;
};' > webpack.config.js
```

### 1g. ESLint Configuration Error

**Error Message:**
```
[eslint] Error while loading rule '@typescript-eslint/no-floating-promises': You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.
```

**Cause:** This error occurs when ESLint TypeScript rules require project information but the parser options are not properly configured.

**Solutions:**

#### Option 1: Use the ESLint Config Fix Script (Recommended)
```bash
node fix-eslint-config.js
```

#### Option 2: Update ESLint Configuration Manually
```bash
# Frontend
cd frontend
echo 'module.exports = {
  extends: ["react-app", "react-app/jest"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  rules: {
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/await-thenable": "off",
  },
};' > .eslintrc.js

# Backend
cd backend
echo 'module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  extends: ["@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/await-thenable": "warn",
  },
};' > .eslintrc.js
```

#### Option 3: Disable Problematic Rules
```bash
cd frontend
# Add to package.json scripts
npm pkg set scripts.lint="eslint src --ext .ts,.tsx --max-warnings 0"
```

#### Option 4: Skip ESLint During Build
```bash
cd frontend
echo "ESLINT_NO_DEV_ERRORS=true" >> .env
echo "DISABLE_ESLINT_PLUGIN=true" >> .env
```

### 1h. JavaScript Heap Out of Memory Error

**Error Message:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause:** This error occurs when the Node.js process runs out of memory during the build process, typically due to large bundles or memory leaks.

**Solutions:**

#### Option 1: Use the Memory Fix Script (Recommended)
```bash
node fix-memory-issue.js
```

#### Option 2: Increase Node.js Memory Limit
```bash
cd frontend
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

#### Option 3: Use Optimized Build Script
```bash
cd frontend
npm run build:dev
```

#### Option 4: Disable Source Maps
```bash
cd frontend
echo "GENERATE_SOURCEMAP=false" >> .env
echo "INLINE_RUNTIME_CHUNK=false" >> .env
npm run build
```

#### Option 5: Clean Build
```bash
cd frontend
rm -rf build node_modules/.cache
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

#### Option 6: System-Level Solutions
```bash
# Increase swap space (Linux/macOS)
sudo swapoff -a
sudo dd if=/dev/zero of=/swapfile bs=1M count=8192
sudo mkswap /swapfile
sudo swapon /swapfile

# Or use a machine with more RAM (8GB+ recommended)
```

### 1i. Memory Issues on High-RAM Systems (16GB+)

**Symptoms:** Memory errors even on systems with 16GB+ RAM

**Cause:** Memory leaks in build process, inefficient webpack configuration, or circular dependencies

**Solutions:**

#### Option 1: Use the Memory Leak Fix Script (Recommended)
```bash
node fix-memory-leak.js
```

#### Option 2: Use Minimal Build Configuration
```bash
cd frontend
npm run build:minimal
```

#### Option 3: Aggressive Memory Optimization
```bash
cd frontend
NODE_OPTIONS="--max-old-space-size=12288 --optimize-for-size --gc-interval=100" npm run build
```

#### Option 4: Switch to Vite (Alternative Build Tool)
```bash
cd frontend
npm install vite @vitejs/plugin-react --save-dev
# Update package.json scripts to use Vite instead of react-scripts
npm run build
```

#### Option 5: Check for Circular Dependencies
```bash
cd frontend
npm install madge --save-dev
npx madge --circular --extensions ts,tsx src/
```

#### Option 6: Disable All Optimizations
```bash
cd frontend
echo "GENERATE_SOURCEMAP=false" > .env
echo "INLINE_RUNTIME_CHUNK=false" >> .env
echo "ESLINT_NO_DEV_ERRORS=true" >> .env
echo "SKIP_PREFLIGHT_CHECK=true" >> .env
echo "TSC_COMPILE_ON_ERROR=true" >> .env
npm run build
```

### 2. Node.js Version Compatibility

**Error Message:**
```
This package requires Node.js version >= 22.0.0
```

**Solution:**
```bash
# Check your Node.js version
node --version

# If using nvm, install Node.js 22
nvm install 22
nvm use 22

# Or download from nodejs.org
```

### 3. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

#### Option 1: Kill Process Using Port
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

#### Option 2: Use Different Port
```bash
# Set environment variable
export PORT=3001
npm start
```

#### Option 3: Windows
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### 4. Database Connection Issues

**Error Message:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
```bash
# Create data directory
mkdir -p backend/data

# Set proper permissions (Linux/macOS)
chmod 755 backend/data

# On Windows, ensure the directory exists and is writable
```

### 5. CORS Issues

**Error Message:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Check that the backend is running on port 5000
2. Verify CORS_ORIGIN in backend/.env matches your frontend URL
3. Restart both frontend and backend servers

### 6. Build Failures

**Error Message:**
```
Failed to compile
```

**Solutions:**

#### Option 1: Clear Cache
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

#### Option 2: Check TypeScript Errors
```bash
cd frontend
npx tsc --noEmit
```

#### Option 3: Update Dependencies
```bash
cd frontend
npm update --legacy-peer-deps
```

## Development Issues

### 1. Hot Reload Not Working

**Symptoms:** Changes to React components don't reflect in browser

**Solutions:**
```bash
# Restart development server
npm run dev

# Clear browser cache
# Or use incognito/private browsing mode
```

### 2. API Calls Failing

**Symptoms:** Frontend can't connect to backend API

**Solutions:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Verify API URL in frontend services
3. Check network tab in browser dev tools
4. Ensure CORS is properly configured

### 3. Authentication Issues

**Symptoms:** Login not working, tokens not persisting

**Solutions:**
1. Check localStorage in browser dev tools
2. Verify JWT_SECRET is set in backend/.env
3. Check backend logs for authentication errors
4. Clear browser localStorage and try again

## Production Issues

### 1. Build Size Too Large

**Symptoms:** Frontend build is very large (>10MB)

**Solutions:**
```bash
# Analyze bundle size
cd frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Consider code splitting and lazy loading
```

### 2. Performance Issues

**Symptoms:** Slow loading, high memory usage

**Solutions:**
1. Enable gzip compression in web server
2. Use CDN for static assets
3. Implement lazy loading for routes
4. Optimize images and assets

### 3. Database Performance

**Symptoms:** Slow database queries

**Solutions:**
1. Add database indexes
2. Use connection pooling
3. Consider upgrading to PostgreSQL for production
4. Monitor query performance

## Environment-Specific Issues

### Windows Issues

#### Path Length Limitations
```bash
# Enable long paths in Windows
git config --system core.longpaths true
```

#### PowerShell Execution Policy
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### macOS Issues

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### Homebrew Issues
```bash
# Update Homebrew
brew update
brew upgrade node
```

### Linux Issues

#### Missing Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential python3

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3
```

## Debugging Tools

### 1. Enable Debug Logging
```bash
# Backend
DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

### 2. Check System Resources
```bash
# Memory usage
free -h

# Disk usage
df -h

# Process list
ps aux | grep node
```

### 3. Network Debugging
```bash
# Check ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :5000

# Test API connectivity
curl -v http://localhost:5000/api/health
```

## Getting Help

### 1. Check Logs
```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm start

# PM2 logs (production)
pm2 logs soundright-backend
```

### 2. Common Commands
```bash
# Clean install
npm run clean && npm run install-all

# Check versions
node --version && npm --version

# Test API
curl http://localhost:5000/api/health

# Check processes
ps aux | grep node
```

### 3. Useful Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [Express.js Documentation](https://expressjs.com/)

## Still Having Issues?

If you're still experiencing problems:

1. **Check the logs** - Look for specific error messages
2. **Verify system requirements** - Ensure Node.js 22+ and npm 10+
3. **Try clean install** - Remove node_modules and reinstall
4. **Check environment variables** - Ensure all required env vars are set
5. **Test individual components** - Try running backend and frontend separately

For persistent issues, please provide:
- Operating system and version
- Node.js and npm versions
- Complete error messages
- Steps to reproduce the issue
