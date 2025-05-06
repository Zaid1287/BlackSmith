# Deploying BlackSmith Traders on Vercel

This guide will help you deploy the BlackSmith Traders application on Vercel, making it available as both a web application and a Progressive Web App (PWA) that can be installed on mobile devices.

## Prerequisites

1. A Vercel account (free tier works fine)
2. A Supabase account with the database set up
3. GitHub repository with your code

## Step 1: Set Up Supabase

Before deploying to Vercel, make sure your Supabase database is properly set up:

1. Execute the SQL statements from `scripts/supabase-migration.sql` in the Supabase SQL Editor
2. Create a storage bucket named "journey-photos" for storing journey images
3. Set appropriate access policies for the bucket (usually authenticated users only)

## Step 2: Connect to GitHub

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "Add New" and select "Project"
4. Connect to your GitHub repository
5. Select the repository containing the BlackSmith Traders code

## Step 3: Configure the Deployment

When setting up the project on Vercel, you'll need to configure the following:

1. **Framework Preset**: Select "Other"
2. **Build Command**: `npm run build`
3. **Output Directory**: `client/dist`
4. **Install Command**: `npm install`

## Step 4: Set Up Environment Variables

Add these essential environment variables in the Vercel project settings:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SESSION_SECRET=a_random_secret_string
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Deploy

1. Click "Deploy" and wait for the build to complete
2. Once deployed, Vercel will provide you with a URL for your application

## Step 6: Set Up Custom Domain (Optional)

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to the "Domains" section
3. Add your custom domain and follow the instructions to verify ownership

## Step 7: Update Supabase Settings

After deployment, make sure to:

1. Add your Vercel domain to the allowed origins in Supabase Authentication settings
2. Update any API redirects or authentication callbacks to use your new domain

## Step 8: Test Progressive Web App Features

Test the PWA installation:

1. Visit your deployed app on a mobile device
2. You should see a prompt to "Add to Home Screen" or similar
3. After installation, the app should launch as a standalone app without browser UI

## Troubleshooting

### API Routes Not Working

If you're having issues with API routes:

1. Check that the Vercel functions are working by visiting `yoursite.com/api/user`
2. Verify that your environment variables are correctly set
3. Check the Vercel deployment logs for any errors

### Manifest Not Working

If PWA features aren't working:

1. Visit `yoursite.com/manifest.json` to confirm it's accessible
2. Use browser developer tools to check for any console errors
3. Verify your icons are correctly configured and accessible

### Authentication Issues

If users can't log in:

1. Check that CORS settings in Supabase allow your Vercel domain
2. Verify the SESSION_SECRET is properly set
3. Test with a new incognito browser window

## Mobile App Creation

To create an Android APK from your deployed PWA:

1. Visit [PWA Builder](https://www.pwabuilder.com/)
2. Enter your deployed URL
3. Complete the package building process
4. Download the Android package