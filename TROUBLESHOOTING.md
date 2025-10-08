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
