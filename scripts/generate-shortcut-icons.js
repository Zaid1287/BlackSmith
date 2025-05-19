import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateShortcutIcons() {
  try {
    // Source image path
    const inputPath = path.join(__dirname, '../client/public/icons/original-logo.png');
    const outputDir = path.join(__dirname, '../client/public/icons');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load the source image
    const sourceImage = await loadImage(inputPath);
    
    // Generate the start-journey icon (green background)
    const startCanvas = createCanvas(192, 192);
    const startCtx = startCanvas.getContext('2d');
    
    // Fill with green background
    startCtx.fillStyle = '#4CAF50'; // Green color
    startCtx.fillRect(0, 0, 192, 192);
    
    // Calculate dimensions to maintain aspect ratio with some padding
    const paddingPercent = 0.20; // 20% padding
    const scaleFactor = Math.min(
      192 * (1 - paddingPercent * 2) / sourceImage.width,
      192 * (1 - paddingPercent * 2) / sourceImage.height
    );
    
    const scaledWidth = sourceImage.width * scaleFactor;
    const scaledHeight = sourceImage.height * scaleFactor;
    const offsetX = (192 - scaledWidth) / 2;
    const offsetY = (192 - scaledHeight) / 2;
    
    // Draw the image centered with padding
    startCtx.drawImage(sourceImage, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Save the start-journey icon
    const startOutputPath = path.join(outputDir, 'start-journey.png');
    const startBuffer = startCanvas.toBuffer('image/png');
    fs.writeFileSync(startOutputPath, startBuffer);
    console.log(`Created start-journey icon: ${startOutputPath}`);
    
    // Generate the active-journey icon (blue background)
    const activeCanvas = createCanvas(192, 192);
    const activeCtx = activeCanvas.getContext('2d');
    
    // Fill with blue background
    activeCtx.fillStyle = '#2196F3'; // Blue color
    activeCtx.fillRect(0, 0, 192, 192);
    
    // Draw the image centered with padding
    activeCtx.drawImage(sourceImage, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Save the active-journey icon
    const activeOutputPath = path.join(outputDir, 'active-journey.png');
    const activeBuffer = activeCanvas.toBuffer('image/png');
    fs.writeFileSync(activeOutputPath, activeBuffer);
    console.log(`Created active-journey icon: ${activeOutputPath}`);
    
    console.log('Shortcut icon generation completed successfully!');
    
  } catch (error) {
    console.error('Error generating shortcut icons:', error);
  }
}

// Run the function
generateShortcutIcons();