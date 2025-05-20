import express from 'express';
import fs from 'fs';
import path from 'path';

export function registerIconRoutes(app: express.Express) {
  // Route to serve icon files with correct content-type
  app.get('/app-icons/:iconName', (req, res) => {
    try {
      const iconName = req.params.iconName;
      const iconPath = path.resolve(process.cwd(), 'client/public/icons', iconName);
      
      console.log(`Serving icon: ${iconName} from path: ${iconPath}`);
      
      // Check if the file exists
      if (fs.existsSync(iconPath)) {
        // Set the correct content-type based on file extension
        if (iconPath.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (iconPath.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        }
        
        // Send the file
        res.sendFile(iconPath);
      } else {
        console.log(`Icon not found: ${iconPath}`);
        res.status(404).send('Icon not found');
      }
    } catch (error) {
      console.error('Error serving icon:', error);
      res.status(500).send('Error serving icon');
    }
  });
}