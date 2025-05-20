const fs = require('fs');
const manifestPath = './client/public/manifest.json';

// Read the manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Update all icon paths to use the app-icons route
manifest.icons.forEach(icon => {
  if (icon.src.startsWith('/icons/')) {
    icon.src = icon.src.replace('/icons/', '/app-icons/');
  }
});

// Update shortcut icon paths
if (manifest.shortcuts) {
  manifest.shortcuts.forEach(shortcut => {
    if (shortcut.icons) {
      shortcut.icons.forEach(icon => {
        if (icon.src.startsWith('/icons/')) {
          icon.src = icon.src.replace('/icons/', '/app-icons/');
        }
      });
    }
  });
}

// Write the updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest updated successfully');
