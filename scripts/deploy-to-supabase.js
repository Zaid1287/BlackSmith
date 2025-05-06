#!/usr/bin/env node

/**
 * This script guides you through deploying your app to Supabase Hosting
 * and generating an APK file for Android distribution.
 * 
 * Requirements:
 * - Supabase CLI installed: npm install -g supabase
 * - PWA Builder CLI installed: npm install -g @pwabuilder/cli
 * 
 * Usage:
 * node scripts/deploy-to-supabase.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Main deployment steps
const steps = [
  {
    title: '1. Build the application',
    action: buildApp
  },
  {
    title: '2. Setup Supabase CLI',
    action: setupSupabaseCLI
  },
  {
    title: '3. Deploy to Supabase or Alternative',
    action: deployApp
  },
  {
    title: '4. Generate APK file',
    action: generateAPK
  }
];

// Helper function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function buildApp() {
  console.log(`${colors.blue}Building your application...${colors.reset}`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}Build completed successfully!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Build failed:${colors.reset}`, error.message);
    return false;
  }
}

async function setupSupabaseCLI() {
  console.log(`${colors.blue}Setting up Supabase CLI...${colors.reset}`);
  
  const hasSupabase = checkCommand('supabase');
  if (!hasSupabase) {
    console.log(`${colors.yellow}Supabase CLI not found. Installing...${colors.reset}`);
    try {
      execSync('npm install -g supabase', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}Failed to install Supabase CLI:${colors.reset}`, error.message);
      return false;
    }
  }
  
  console.log(`${colors.green}Supabase CLI is ready!${colors.reset}`);
  return true;
}

async function deployApp() {
  console.log(`${colors.blue}Deploying your application...${colors.reset}`);
  
  const deployOptions = [
    'Supabase Hosting',
    'Netlify',
    'Vercel',
    'GitHub Pages',
    'Skip (I will deploy manually)'
  ];
  
  console.log('\nDeployment options:');
  deployOptions.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });
  
  const choice = await ask(`\nSelect deployment option (1-${deployOptions.length}): `);
  const option = parseInt(choice);
  
  if (isNaN(option) || option < 1 || option > deployOptions.length) {
    console.log(`${colors.red}Invalid option selected. Skipping deployment.${colors.reset}`);
    return false;
  }
  
  if (option === 5) {
    console.log(`${colors.yellow}Skipping deployment.${colors.reset}`);
    console.log(`${colors.blue}When you deploy manually, make sure to:${colors.reset}`);
    console.log(`1. Deploy your frontend to a hosting service`);
    console.log(`2. Update your backend to use Supabase services`);
    console.log(`3. Configure CORS settings in Supabase to allow your frontend domain`);
    return true;
  }
  
  console.log(`${colors.yellow}Deployment to ${deployOptions[option - 1]} is not automatically handled by this script.${colors.reset}`);
  console.log(`${colors.blue}Please follow the manual steps for ${deployOptions[option - 1]}:${colors.reset}`);
  
  switch (option) {
    case 1: // Supabase Hosting
      console.log(`1. Create a GitHub repository for your project`);
      console.log(`2. Push your code to GitHub`);
      console.log(`3. Go to Supabase dashboard > Storage > Create a new bucket named 'static-hosting'`);
      console.log(`4. Upload your built files from 'client/dist' to this bucket`);
      console.log(`5. Configure the bucket for hosting in Supabase Settings`);
      break;
    case 2: // Netlify
      console.log(`1. Create a GitHub repository for your project`);
      console.log(`2. Push your code to GitHub`);
      console.log(`3. Go to netlify.com and sign up/in`);
      console.log(`4. Click "New site from Git" and select your repository`);
      console.log(`5. Set build command: npm run build`);
      console.log(`6. Set publish directory: client/dist`);
      break;
    case 3: // Vercel
      console.log(`1. Create a GitHub repository for your project`);
      console.log(`2. Push your code to GitHub`);
      console.log(`3. Go to vercel.com and sign up/in`);
      console.log(`4. Import your repository`);
      console.log(`5. Set build command: npm run build`);
      console.log(`6. Set output directory: client/dist`);
      break;
    case 4: // GitHub Pages
      console.log(`1. Create a GitHub repository for your project`);
      console.log(`2. Push your code to GitHub`);
      console.log(`3. Go to repository settings > Pages`);
      console.log(`4. Set source to GitHub Actions`);
      console.log(`5. Create a workflow file for GitHub Pages deployment`);
      break;
  }
  
  return true;
}

async function generateAPK() {
  console.log(`${colors.blue}Generating APK file...${colors.reset}`);
  
  console.log(`${colors.yellow}To generate an APK file:${colors.reset}`);
  console.log(`1. After deploying your app, visit https://www.pwabuilder.com/`);
  console.log(`2. Enter your deployed website URL`);
  console.log(`3. Click "Build" and select Android`);
  console.log(`4. Download the generated APK file`);
  
  const hasPWABuilder = checkCommand('pwabuilder');
  if (!hasPWABuilder) {
    console.log(`${colors.yellow}PWA Builder CLI not found. You can install it with:${colors.reset}`);
    console.log(`npm install -g @pwabuilder/cli`);
  } else {
    console.log(`\n${colors.green}You can also use PWA Builder CLI to generate APK:${colors.reset}`);
    console.log(`pwabuilder -m https://your-deployed-url.com -p android`);
  }
  
  console.log(`\n${colors.green}After obtaining the APK file, you can:${colors.reset}`);
  console.log(`1. Share it directly with your users`);
  console.log(`2. Upload it to app stores like Google Play (requires developer account)`);
  console.log(`3. Host it on your website for download`);
  
  return true;
}

// Check if a command is available
function checkCommand(command) {
  try {
    execSync(`which ${command} || where ${command} 2>/dev/null`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function to run deployment process
async function main() {
  console.log(`${colors.blue}=== BlackSmith Traders App Deployment ===\n${colors.reset}`);
  
  for (const step of steps) {
    console.log(`\n${colors.yellow}${step.title}${colors.reset}`);
    const success = await step.action();
    if (!success) {
      console.log(`${colors.red}Step failed. Please fix the issues and try again.${colors.reset}`);
      break;
    }
  }
  
  console.log(`\n${colors.green}Deployment guide completed!${colors.reset}`);
  console.log(`${colors.blue}Remember to update your Supabase database with production data before going live.${colors.reset}`);
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}An error occurred:${colors.reset}`, error);
  rl.close();
});