# Node.js 22 Migration Guide

This guide helps you migrate the SoundRight application to Node.js 22.x compatibility.

## What Changed

### Version Requirements
- **Node.js**: Upgraded from 18.x to 22.x (LTS)
- **npm**: Upgraded to 10.x minimum
- **TypeScript**: Upgraded to 5.6.x
- **ESLint**: Upgraded to 9.x

### Updated Dependencies

#### Backend Dependencies
- `express`: `^4.18.2` → `^4.19.2`
- `dotenv`: `^16.3.1` → `^16.4.5`
- `sqlite3`: `^5.1.6` → `^5.1.7`
- `uuid`: `^9.0.1` → `^10.0.0`
- `joi`: `^17.11.0` → `^17.13.3`
- `express-rate-limit`: `^7.1.5` → `^7.4.0`
- `@types/node`: `^20.10.4` → `^22.7.4`
- `typescript`: `^5.3.3` → `^5.6.2`
- `nodemon`: `^3.0.2` → `^3.1.4`
- `ts-node`: `^10.9.1` → `^10.9.2`
- `eslint`: `^8.55.0` → `^9.10.0`
- `@typescript-eslint/*`: `^6.13.1` → `^8.7.0`

#### Frontend Dependencies
- `@emotion/react`: `^11.11.1` → `^11.11.4`
- `@emotion/styled`: `^11.11.0` → `^11.11.5`
- `@mui/*`: `^5.14.x` → `^5.15.21`
- `@mui/x-data-grid`: `^6.18.2` → `^7.17.1`
- `@mui/x-date-pickers`: `^6.18.2` → `^7.17.1`
- `axios`: `^1.6.2` → `^1.7.7`
- `date-fns`: `^2.30.0` → `^4.1.0`
- `react`: `^18.2.0` → `^18.3.1`
- `react-dom`: `^18.2.0` → `^18.3.1`
- `react-router-dom`: `^6.20.1` → `^6.26.2`
- `recharts`: `^2.8.0` → `^2.12.7`
- `typescript`: `^4.9.5` → `^5.6.2`
- `web-vitals`: `^2.1.4` → `^4.2.4`

### Configuration Updates

#### TypeScript Configuration
- **Target**: `ES2020` → `ES2022`
- **Lib**: Added `ES2023` support
- **ECMAScript**: Updated to 2022 standard

#### ESLint Configuration
- **ECMAScript**: Updated to 2022
- **Parser**: Updated to support latest TypeScript features
- **Rules**: Added stricter async/await handling

## Migration Steps

### 1. Check Current Node.js Version
```bash
node --version
npm --version
```

### 2. Upgrade Node.js to 22.x

#### Using Node Version Manager (nvm) - Recommended
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 22
nvm install 22
nvm use 22
nvm alias default 22
```

#### Using Official Installer
1. Download Node.js 22.x from [nodejs.org](https://nodejs.org/)
2. Install following the platform-specific instructions
3. Verify installation: `node --version`

#### Using Package Manager

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (Homebrew):**
```bash
brew install node@22
brew link node@22
```

**Windows (Chocolatey):**
```bash
choco install nodejs --version=22.0.0
```

### 3. Update npm
```bash
npm install -g npm@latest
```

### 4. Clean Existing Installation
```bash
# Remove existing node_modules and build artifacts
npm run clean

# Or manually:
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf backend/dist frontend/build
```

### 5. Install Updated Dependencies
```bash
npm run install-all
```

### 6. Verify Installation
```bash
# Run the compatibility check
node check-node-version.js

# Test the application
npm run dev
```

## Breaking Changes and Compatibility

### Node.js 22 Features Used
- **ES2022 Support**: Using latest JavaScript features
- **Improved Performance**: Better V8 engine performance
- **Enhanced Security**: Latest security patches
- **Better TypeScript Support**: Improved type checking

### Potential Issues and Solutions

#### 1. ESLint Configuration Errors
If you encounter ESLint errors:
```bash
# Update ESLint configuration
npm run lint:fix
```

#### 2. TypeScript Compilation Errors
If TypeScript compilation fails:
```bash
# Clean and rebuild
npm run clean
npm run install-all
cd backend && npm run build
cd ../frontend && npm run build
```

#### 3. Package Compatibility Issues
Some packages might need updates:
```bash
# Check for outdated packages
npm outdated

# Update specific packages if needed
npm update package-name
```

#### 4. MUI Component Changes
The MUI X components have been updated to v7. Check for any breaking changes in:
- Data Grid components
- Date Picker components

### Performance Improvements

With Node.js 22, you should see:
- **Faster startup times**
- **Better memory usage**
- **Improved async/await performance**
- **Enhanced TypeScript compilation speed**

## Testing Your Migration

### 1. Run All Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### 2. Check Application Functionality
- [ ] User authentication works
- [ ] Equipment CRUD operations
- [ ] Project management
- [ ] Quote generation
- [ ] Invoice creation
- [ ] File uploads
- [ ] API endpoints respond correctly

### 3. Performance Testing
```bash
# Check build times
time npm run build

# Monitor memory usage
npm run dev
# Check memory usage in another terminal
```

## Rollback Plan

If you encounter issues, you can rollback:

### 1. Revert to Previous Node.js Version
```bash
# Using nvm
nvm use 18
nvm alias default 18

# Or reinstall Node.js 18.x
```

### 2. Restore Previous Dependencies
```bash
# If you have a backup of package.json files
git checkout HEAD~1 -- package.json backend/package.json frontend/package.json
npm run install-all
```

### 3. Clean and Reinstall
```bash
npm run clean
npm run install-all
```

## Support and Troubleshooting

### Common Issues

1. **Module not found errors**
   - Solution: Clean install dependencies
   ```bash
   npm run clean
   npm run install-all
   ```

2. **TypeScript compilation errors**
   - Solution: Update TypeScript configuration
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```

3. **ESLint configuration errors**
   - Solution: Update ESLint configuration
   ```bash
   npm run lint:fix
   ```

### Getting Help

If you encounter issues:
1. Check the [Node.js 22 release notes](https://nodejs.org/en/blog/release/v22.0.0/)
2. Review the [TypeScript 5.6 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/)
3. Check the [ESLint 9 migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)

## Benefits of Node.js 22

- **Performance**: Up to 20% faster than Node.js 18
- **Security**: Latest security patches and improvements
- **Features**: Access to latest JavaScript and TypeScript features
- **Stability**: LTS version with long-term support
- **Compatibility**: Better compatibility with modern packages

## Next Steps

After successful migration:
1. Update your CI/CD pipelines to use Node.js 22
2. Update your deployment scripts
3. Consider enabling new Node.js 22 features in your code
4. Update your development team's local environments
5. Monitor performance improvements
