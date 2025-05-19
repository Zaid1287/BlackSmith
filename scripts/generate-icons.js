import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    const inputPath = path.join(__dirname, '../client/public/icons/original-logo.png');
    const outputDir = path.join(__dirname, '../client/public/icons');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load the source image
    const sourceImage = await loadImage(inputPath);
    
    // Generate standard icons (purpose: any)
    for (const size of sizes) {
      // Create canvas with white background
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Calculate dimensions to maintain aspect ratio with some padding
      const paddingPercent = 0.15; // 15% padding
      const scaleFactor = Math.min(
        size * (1 - paddingPercent * 2) / sourceImage.width,
        size * (1 - paddingPercent * 2) / sourceImage.height
      );
      
      const scaledWidth = sourceImage.width * scaleFactor;
      const scaledHeight = sourceImage.height * scaleFactor;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;
      
      // Draw the image centered with padding
      ctx.drawImage(sourceImage, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Save the icon
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Created standard icon: ${outputPath}`);
    }
    
    // Generate maskable icons (purpose: maskable)
    for (const size of sizes) {
      // Create canvas with white background
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // For maskable icons, use a safe zone of 60% (40% may be cut by device masks)
      const safeAreaPercent = 0.25; // 25% buffer around the edges
      const scaleFactor = Math.min(
        size * (1 - safeAreaPercent * 2) / sourceImage.width,
        size * (1 - safeAreaPercent * 2) / sourceImage.height
      );
      
      const scaledWidth = sourceImage.width * scaleFactor;
      const scaledHeight = sourceImage.height * scaleFactor;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;
      
      // Draw the image centered within the safe area
      ctx.drawImage(sourceImage, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Save the maskable icon
      const outputPath = path.join(outputDir, `maskable-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Created maskable icon: ${outputPath}`);
    }
    
    console.log('Icon generation completed successfully!');
    console.log(`Icons saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the function
generateIcons();