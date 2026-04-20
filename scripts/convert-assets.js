#!/usr/bin/env node

/**
 * Simple SVG to PNG converter using Node.js
 * Uses svg-to-png or similar approaches
 * 
 * Installation: npm install svg-to-png
 * Usage: node scripts/convert-assets.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');

async function convertAssets() {
  try {
    // Try using svg-to-png if available
    const svgToPng = require('svg-to-png');
    
    console.log('Converting splash-icon.svg...');
    await svgToPng.convertFile(
      path.join(assetsDir, 'splash-icon.svg'),
      path.join(assetsDir, 'splash-icon.png'),
      { width: 1080, height: 2340 }
    );
    console.log('✓ splash-icon.png created');
    
    console.log('Converting adaptive-icon.svg...');
    await svgToPng.convertFile(
      path.join(assetsDir, 'adaptive-icon.svg'),
      path.join(assetsDir, 'adaptive-icon.png'),
      { width: 192, height: 192 }
    );
    console.log('✓ adaptive-icon.png created');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: svg-to-png package not found.');
      console.error('\nTo convert SVG to PNG, install: npm install svg-to-png');
      console.error('\nAlternatively, use one of these methods:');
      console.error('1. ImageMagick: convert -density 150 splash-icon.svg splash-icon.png');
      console.error('2. Online: https://www.cloudconvert.com/svg-to-png');
      console.error('3. Inkscape: inkscape -w 1080 -h 2340 splash-icon.svg -o splash-icon.png');
      process.exit(1);
    } else {
      throw error;
    }
  }
}

convertAssets().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
