import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyExactLogo() {
  try {
    // Define paths
    const originalLogoPath = path.join(__dirname, '../client/public/icons/original-logo.png');
    const iconsDir = path.join(__dirname, '../client/public/icons');
    
    // Make sure the original logo exists
    if (!fs.existsSync(originalLogoPath)) {
      console.error('Original logo file not found at:', originalLogoPath);
      return;
    }
    
    // Read the original logo file
    const logoData = fs.readFileSync(originalLogoPath);
    
    // Define all the required icon paths from manifest.json
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    // Copy the exact logo file to all the required icon paths
    for (const size of iconSizes) {
      // Standard icons
      const standardPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(standardPath, logoData);
      console.log(`Copied exact logo to: ${standardPath}`);
      
      // Maskable icons
      const maskablePath = path.join(iconsDir, `maskable-${size}x${size}.png`);
      fs.writeFileSync(maskablePath, logoData);
      console.log(`Copied exact logo to: ${maskablePath}`);
    }
    
    // Shortcut icons
    const startJourneyPath = path.join(iconsDir, 'start-journey.png');
    const activeJourneyPath = path.join(iconsDir, 'active-journey.png');
    
    fs.writeFileSync(startJourneyPath, logoData);
    console.log(`Copied exact logo to: ${startJourneyPath}`);
    
    fs.writeFileSync(activeJourneyPath, logoData);
    console.log(`Copied exact logo to: ${activeJourneyPath}`);
    
    console.log('Successfully copied the exact logo to all required icon paths.');
    
  } catch (error) {
    console.error('Error copying logo:', error);
  }
}

// Run the function
copyExactLogo();