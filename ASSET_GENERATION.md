# Asset Generation Guide

## Converting SVG assets to PNG

The SVG files have been created with the Sankat Sathi branding (dark theme, bronze/orange accents). To convert them to PNG format, use one of these methods:

### Option 1: Using ImageMagick (Recommended)
```bash
# Install ImageMagick if needed
brew install imagemagick

# Convert splash icon to PNG (1080x2340)
convert -background none -density 150 assets/splash-icon.svg -resize 1080x2340! assets/splash-icon.png

# Convert adaptive icon to PNG (192x192)
convert -background none -density 150 assets/adaptive-icon.svg -resize 192x192! assets/adaptive-icon.png
```

### Option 2: Using Inkscape
```bash
# Export splash icon
inkscape -w 1080 -h 2340 assets/splash-icon.svg -o assets/splash-icon.png

# Export adaptive icon
inkscape -w 192 -h 192 assets/adaptive-icon.svg -o assets/adaptive-icon.png
```

### Option 3: Using Online Tools
1. Visit https://www.cloudconvert.com/svg-to-png
2. Upload `assets/splash-icon.svg`
3. Set dimensions to 1080x2340
4. Download and save as `assets/splash-icon.png`
5. Repeat for `assets/adaptive-icon.svg` with dimensions 192x192

## Color Palette (Already Applied)
- **Dark Base**: #130D0A
- **Bronze Accent**: #F2AE3D
- **Orange Accent**: #E37A1D
- **Light Text**: #F7E5BE

These colors are already configured in `app.json` and all React components.

## Next Steps After PNG Conversion
Once PNG files are ready:
1. Test locally with `expo start --ios` or `expo start --android`
2. Build with `eas build -p ios --profile preview` (requires setup)
3. Deploy to App Store/Play Store

