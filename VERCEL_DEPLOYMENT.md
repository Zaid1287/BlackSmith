# BlackSmith Traders - Vercel Deployment Guide

## Prerequisites
1. Vercel account
2. Database (PostgreSQL/Neon/Supabase)
3. Your app's source code

## Step 1: Environment Variables Setup
In your Vercel project dashboard, add these environment variables:

### Required Variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to `production`
- `SESSION_SECRET` - A random string for session encryption

### If using Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL
- `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY

### Optional:
- `VITE_GOOGLE_MAPS_API_KEY` - For location features

## Step 2: Database Migration
Before deploying, ensure your database schema is up to date:
```bash
npm run db:push
```

## Step 3: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Import your project
3. Vercel will automatically detect the configuration from `vercel.json`
4. Add all environment variables in the Vercel dashboard
5. Deploy!

## Step 4: Post-Deployment
1. Test the login functionality with credentials: admin/admin123
2. Verify database connectivity
3. Check mobile responsiveness
4. Test camera functionality on mobile devices

## Troubleshooting Common Issues:

### Build Errors:
- Ensure all dependencies are in `package.json`
- Check that build command is correct: `npm run build`

### Database Connection:
- Verify DATABASE_URL is correctly formatted
- Ensure database allows connections from Vercel's IP ranges

### Function Timeout:
- Database queries should complete within 30 seconds
- Check for infinite loops in your code

### Static Files:
- Ensure images and assets are in the `dist` folder after build
- Check that file paths are relative, not absolute

## Need Help?
If you encounter specific errors during deployment, check the Vercel build logs for detailed error messages.