# BlackSmith Traders Mobile Deployment Guide

This guide will help you deploy the BlackSmith Traders application as a mobile app using Progressive Web App (PWA) technology with Supabase as the backend.

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one
2. Create a new project and note down the following details:
   - Project URL (e.g., `https://yourproject.supabase.co`)
   - API Key (from Project Settings > API)
   - Service Role Key (for migration and admin tasks)

### Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

Also add these to your client environment:

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Create Database Structure

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `scripts/supabase-migration.sql` and run it to create all required tables
3. Alternatively, run each statement separately for better control

### Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `journey-photos`
3. Set the bucket privacy to "Not public" for security
4. Create a policy for the bucket to allow authenticated users to upload and view files

## 2. Migrate Existing Data

To migrate your existing data to Supabase:

```bash
# Make sure you have the environment variables set up properly
npm run tsx scripts/migrate-to-supabase.ts
```

This script will:
1. Transfer users and their credentials
2. Migrate vehicles, journeys, expenses, and all other data
3. Upload journey photos to Supabase Storage
4. Preserve relationships between different data entities

## 3. Progressive Web App Setup

Your app is already configured as a PWA with:

- A `manifest.json` file with app details and icons
- A service worker for offline functionality
- Mobile-responsive design

## 4. Android App Generation

### Using PWA Builder

1. Deploy your web application to a hosting service (see deployment options below)
2. Visit [PWA Builder](https://www.pwabuilder.com/)
3. Enter your deployed website URL
4. Follow the prompts to generate an Android APK file
5. Download the APK file

### Manual Installation on Android

Users can install your PWA directly from Chrome:

1. Open your website in Chrome on Android
2. Tap the menu button (three dots)
3. Select "Add to Home screen"
4. Follow the prompts to install the app

## 5. Deployment Options

### Option 1: Supabase Hosting (Edge Functions + Storage)

1. Set up static hosting using Supabase Storage:
   - Create a bucket named `static-hosting`
   - Upload your built files (from `client/dist`)
   - Make the bucket public
   - Set up a custom domain if needed

### Option 2: Netlify/Vercel/Other Static Hosting

1. Create a GitHub repository for your project
2. Connect to Netlify, Vercel, or another hosting service
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `client/dist`
4. Deploy the application

### Option 3: Self-Hosting

1. Build your application: `npm run build`
2. Host the contents of `client/dist` on any web server
3. Ensure your server is configured to serve the `index.html` file for all routes

## 6. Post-Deployment Steps

### Update Google Maps API Settings

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your Maps project
3. Update the allowed origins to include your new deployment URL
4. Update the API key restrictions if necessary

### Google Play Store (Optional)

If you want to publish to the Google Play Store:

1. Create a developer account ($25 one-time fee)
2. Format your app according to Play Store guidelines
3. Submit your app for review
4. Wait for approval (typically 1-7 days)

## 7. Troubleshooting

### Common Issues

1. **API Requests Failing**: Check that your Supabase URL and keys are correctly set up
2. **Authentication Issues**: Ensure that your authentication setup is properly migrated
3. **Missing Images**: Verify that all journey photos were correctly uploaded to Supabase Storage
4. **Deployment Errors**: Check your build logs for any specific errors during deployment

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PWA Builder Documentation](https://www.pwabuilder.com/documentation)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## 8. Next Steps and Future Improvements

- Implement push notifications for journey updates
- Add offline data synchronization
- Enhance the mobile user experience with more touch-friendly controls
- Add app analytics to track user engagement

---

For any further assistance, please contact the development team.