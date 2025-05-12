# Icon Generation Instructions for Google Play Store Submission

## Icon Requirements

For your app's Play Store submission, you need two types of icons:

1. **Standard Icons** (purpose: "any")
2. **Maskable Icons** (purpose: "maskable") - These support adaptive icon shapes on Android

## How to Generate Icons From Your Logo

### Option 1: Using PWA Image Generator (Recommended)

1. Visit [PWA Image Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your logo image (Screenshot 2025-04-02 at 14.42.43.png)
3. Set padding appropriately:
   - For standard icons: Use minimal padding
   - For maskable icons: Use ~15% padding for the safe zone
4. Generate and download the icon sets
5. Rename and organize them according to the manifest.json structure

### Option 2: Using App Icon Makers

1. Visit [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
2. Upload your logo
3. Customize the background as needed
4. Download the generated icon set
5. Create both standard and maskable versions

### Option 3: Using Image Editing Software

If you prefer manual creation with Photoshop, GIMP, or similar:

1. Create canvases at these sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 px
2. Place your logo on each canvas
3. For standard icons:
   - Center the logo, taking up most of the space
4. For maskable icons:
   - Center the logo within the inner 80% of the image (leaving padding around the edges)
   - Use a solid background color if desired
5. Save each as PNG in the appropriate location

## File Organization

Place all icon files in the `client/public/icons/` directory with these naming patterns:

- `icon-{size}x{size}.png` for standard icons
- `maskable-{size}x{size}.png` for maskable icons

Where `{size}` is one of: 72, 96, 128, 144, 152, 192, 384, 512

## Checking Your Icons

After generating and placing your icons:

1. Test your PWA using Chrome's Lighthouse tool to verify icons are correctly configured
2. Check the PWA installation experience on different devices
3. Use [Maskable.app](https://maskable.app/) to preview how your maskable icons will appear on different Android shapes

## Google Play Store Requirements

For Play Store submission, you'll also need:

1. High-resolution app icon (512x512 px)
2. Feature graphic (1024x500 px)
3. Screenshots in various sizes