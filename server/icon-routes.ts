import express from 'express';
import fs from 'fs';
import path from 'path';

export function registerIconRoutes(app: express.Express) {
  // Route to serve icon files with correct content-type
  app.get('/app-icons/:iconName', (req, res) => {
    const iconName = req.params.iconName;
    const iconPath = path.join(__dirname, '../client/public/icons', iconName);
    
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
      res.status(404).send('Icon not found');
    }
  });
}