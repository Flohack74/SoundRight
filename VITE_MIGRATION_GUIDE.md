# Vite Migration Guide for SoundRight

This guide explains how to use Vite instead of react-scripts for better performance and memory efficiency.

## Why Switch to Vite?

- **🚀 Faster builds**: 10-100x faster than webpack
- **💾 Lower memory usage**: Much more memory-efficient than react-scripts
- **⚡ Instant HMR**: Hot Module Replacement that updates in milliseconds
- **🔧 Better DX**: Improved developer experience with faster feedback
- **📦 Smaller bundles**: Better tree-shaking and code splitting

## Migration Steps

### 1. Run the Migration Script

```bash
node migrate-to-vite.js
```

This script will:
- Remove react-scripts and related dependencies
- Install Vite and related dependencies
- Update package.json scripts
- Create Vite configuration
- Update environment variables
- Clean up old files

### 2. Manual Migration (if script fails)

```bash
cd frontend

# Remove react-scripts
npm uninstall react-scripts @types/jest jest web-vitals

# Install Vite
npm install vite @vitejs/plugin-react --save-dev
npm install vitest @vitest/ui --save-dev
npm install @types/node --save-dev

# Install dependencies
npm install
```

## Vite Configuration

The `vite.config.js` file includes:

- **React plugin** with Fast Refresh
- **Path aliases** for cleaner imports
- **API proxy** to backend server
- **Optimized builds** with code splitting
- **Development server** configuration

## Environment Variables

Vite uses `VITE_` prefix for environment variables:

```env
# Vite environment variables
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SoundRight
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm start           # Alias for npm run dev
```

### Production
```bash
npm run build       # Build for production
npm run build:dev   # Build in development mode
npm run preview     # Preview production build
```

### Testing
```bash
npm run test        # Run tests with Vitest
```

### Linting
```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

## Key Differences from react-scripts

### 1. Environment Variables
- **react-scripts**: `REACT_APP_*`
- **Vite**: `VITE_*`

### 2. Import Paths
- **react-scripts**: Relative imports
- **Vite**: Path aliases (`@/components`, `@/pages`, etc.)

### 3. Build Output
- **react-scripts**: `build/` directory
- **Vite**: `build/` directory (same)

### 4. Development Server
- **react-scripts**: Port 3000
- **Vite**: Port 3000 (same)

## Development Workflow

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

The server will start at `http://localhost:3000` with:
- ⚡ Instant HMR (Hot Module Replacement)
- 🔄 Fast refresh for React components
- 📡 API proxy to backend at `http://localhost:5000`

### 2. Make Changes
- Edit any file in `src/`
- Changes appear instantly in the browser
- No need to refresh the page

### 3. Build for Production
```bash
npm run build
```

This creates an optimized build in the `build/` directory.

## Performance Improvements

### Build Time
- **react-scripts**: ~2-5 minutes
- **Vite**: ~10-30 seconds

### Memory Usage
- **react-scripts**: 4-8GB RAM
- **Vite**: 1-2GB RAM

### Development Server
- **react-scripts**: ~30-60 seconds to start
- **Vite**: ~1-3 seconds to start

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Working
```bash
# Make sure variables start with VITE_
VITE_API_URL=http://localhost:5000/api
```

#### 2. Import Errors
```bash
# Use path aliases
import { Button } from '@/components/Common/Button';
// Instead of
import { Button } from '../../../components/Common/Button';
```

#### 3. Build Failures
```bash
# Clean and rebuild
rm -rf build node_modules/.vite
npm install
npm run build
```

#### 4. API Proxy Not Working
```bash
# Check vite.config.js proxy configuration
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

### Performance Tips

#### 1. Optimize Imports
```typescript
// Good - tree-shakeable
import { Button } from '@mui/material/Button';

// Avoid - imports entire library
import { Button } from '@mui/material';
```

#### 2. Use Dynamic Imports
```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));
```

#### 3. Optimize Images
```typescript
// Use Vite's asset handling
import logo from '/src/assets/logo.png';
```

## Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Deploy Build Directory
The `build/` directory contains all static assets ready for deployment.

### 3. Update Deployment Scripts
Update your deployment scripts to use the new build process:

```bash
# Old (react-scripts)
npm run build

# New (Vite)
npm run build
```

## Rollback Plan

If you need to rollback to react-scripts:

```bash
cd frontend

# Remove Vite
npm uninstall vite @vitejs/plugin-react vitest @vitest/ui

# Install react-scripts
npm install react-scripts@5.0.1 --save

# Update package.json scripts
# Restore original scripts from git history

# Remove Vite files
rm vite.config.js
rm index.html
mv public/index.html.backup public/index.html
```

## Benefits Summary

✅ **Faster builds** - 10-100x faster than webpack
✅ **Lower memory usage** - Solves your memory issues
✅ **Better DX** - Instant feedback and HMR
✅ **Smaller bundles** - Better tree-shaking
✅ **Modern tooling** - Built on ES modules
✅ **TypeScript support** - First-class TypeScript support
✅ **Plugin ecosystem** - Rich plugin ecosystem

## Next Steps

1. **Run the migration**: `node migrate-to-vite.js`
2. **Test development**: `cd frontend && npm run dev`
3. **Test production build**: `cd frontend && npm run build`
4. **Update deployment**: Use new build process
5. **Enjoy faster development**! 🎉

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the Vite documentation: https://vitejs.dev/
3. Check the migration script output for errors
4. Try the manual migration steps
