import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = path.join(__dirname, '../attached_assets/Screenshot 2025-04-02 at 14.42.43.png');
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../client/public/icons');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateIcons() {
  try {
    const image = await loadImage(SOURCE_IMAGE);
    const aspectRatio = image.width / image.height;
    
    console.log(`Loaded source image (${image.width}x${image.height})`);
    
    // Generate standard icons (purpose: any)
    for (const size of ICON_SIZES) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill with transparent background
      ctx.clearRect(0, 0, size, size);
      
      // Draw the image centered and scaled to fit
      const scale = Math.min(size / image.width, size / image.height);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;
      
      ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
      
      // Save as PNG
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Created: ${outputPath}`);
    }
    
    // Generate maskable icons (with padding for safe area)
    for (const size of ICON_SIZES) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill with white or transparent background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      
      // Safe area is 80% of the icon size for maskable icons
      const safeAreaSize = size * 0.8;
      const scale = Math.min(safeAreaSize / image.width, safeAreaSize / image.height);
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;
      
      ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
      
      // Save as PNG
      const outputPath = path.join(OUTPUT_DIR, `maskable-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Created: ${outputPath}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();