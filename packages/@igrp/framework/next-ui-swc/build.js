#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Build with SWC
console.log('Building with SWC...');
execSync('swc src --out-dir dist', { stdio: 'inherit' });

// Copy CSS files
console.log('Copying CSS files...');
if (existsSync('src/index.css')) {
    copyFileSync('src/index.css', 'dist/index.css');
}

// Generate TypeScript declarations
console.log('Generating TypeScript declarations...');
execSync('tsc --emitDeclarationOnly --outDir dist', { stdio: 'inherit' });

// Copy type files
console.log('Copying type files...');
if (existsSync('types')) {
    execSync('cp -r types dist/', { stdio: 'inherit' });
}

console.log('Build completed successfully!');
