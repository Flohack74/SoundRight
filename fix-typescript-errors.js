#!/usr/bin/env node

/**
 * Fix TypeScript Errors Script
 * This script fixes TypeScript errors in route handlers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing TypeScript Errors...\n');

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

function fixTypeScriptErrors() {
  const backendDir = path.join(process.cwd(), 'backend');
  
  if (!fs.existsSync(backendDir)) {
    log('❌ Backend directory not found. Please run this script from the project root.', 'red');
    return false;
  }
  
  log('Fixing TypeScript errors in route handlers...', 'yellow');
  
  // List of route files to fix
  const routeFiles = [
    'src/routes/equipment.ts',
    'src/routes/projects.ts',
    'src/routes/quotes.ts',
    'src/routes/delivery.ts',
    'src/routes/invoices.ts',
    'src/routes/users.ts'
  ];
  
  routeFiles.forEach(file => {
    const filePath = path.join(backendDir, file);
    
    if (fs.existsSync(filePath)) {
      log(`Fixing ${file}...`, 'blue');
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add proper imports if not present
      if (!content.includes('import express, { Request, Response, NextFunction }')) {
        content = content.replace(
          'import express from \'express\';',
          'import express, { Request, Response, NextFunction } from \'express\';'
        );
      }
      
      if (!content.includes('import { AuthRequest }')) {
        content = content.replace(
          'import { protect, authorize } from \'../middleware/auth\';',
          'import { protect, authorize, AuthRequest } from \'../middleware/auth\';'
        );
      }
      
      // Fix route handler type annotations
      // Pattern 1: asyncHandler(async (req, res) => {
      content = content.replace(
        /asyncHandler\(async \(req, res\) => \{/g,
        'asyncHandler(async (req: Request, res: Response) => {'
      );
      
      // Pattern 2: asyncHandler(async (req, res, next) => {
      content = content.replace(
        /asyncHandler\(async \(req, res, next\) => \{/g,
        'asyncHandler(async (req: Request, res: Response, next: NextFunction) => {'
      );
      
      // Pattern 3: asyncHandler(async (req: any, res) => {
      content = content.replace(
        /asyncHandler\(async \(req: any, res\) => \{/g,
        'asyncHandler(async (req: AuthRequest, res: Response) => {'
      );
      
      // Pattern 4: asyncHandler(async (req: any, res, next) => {
      content = content.replace(
        /asyncHandler\(async \(req: any, res, next\) => \{/g,
        'asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {'
      );
      
      // Pattern 5: asyncHandler(async (req, res, next) => { (with protect middleware)
      content = content.replace(
        /protect, asyncHandler\(async \(req, res, next\) => \{/g,
        'protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {'
      );
      
      // Pattern 6: asyncHandler(async (req, res) => { (with protect middleware)
      content = content.replace(
        /protect, asyncHandler\(async \(req, res\) => \{/g,
        'protect, asyncHandler(async (req: AuthRequest, res: Response) => {'
      );
      
      // Pattern 7: asyncHandler(async (req, res, next) => { (with authorize middleware)
      content = content.replace(
        /authorize\([^)]+\), asyncHandler\(async \(req, res, next\) => \{/g,
        (match) => match.replace('asyncHandler(async (req, res, next) => {', 'asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {')
      );
      
      // Pattern 8: asyncHandler(async (req, res) => { (with authorize middleware)
      content = content.replace(
        /authorize\([^)]+\), asyncHandler\(async \(req, res\) => \{/g,
        (match) => match.replace('asyncHandler(async (req, res) => {', 'asyncHandler(async (req: AuthRequest, res: Response) => {')
      );
      
      fs.writeFileSync(filePath, content);
      log(`✅ Fixed ${file}`, 'green');
    }
  });
  
  return true;
}

function testBuild() {
  log('Testing TypeScript build...', 'yellow');
  const backendDir = path.join(process.cwd(), 'backend');
  
  try {
    execSync('npm run build', { 
      cwd: backendDir, 
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    log('Build failed', 'red');
    return false;
  }
}

function main() {
  log('TypeScript Error Fixer', 'blue');
  log('======================', 'blue');
  
  const fixed = fixTypeScriptErrors();
  
  if (fixed) {
    log('\n✅ TypeScript errors fixed!', 'green');
    
    const buildSuccess = testBuild();
    if (buildSuccess) {
      log('✅ TypeScript build successful!', 'green');
      log('\n🎉 All TypeScript errors resolved!', 'green');
    } else {
      log('⚠️  Build still has issues. Check the output above.', 'yellow');
    }
  } else {
    log('\n❌ Could not fix TypeScript errors', 'red');
  }
}

main();
