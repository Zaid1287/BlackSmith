// Vercel deployment configuration helper
// This file helps with environment variable handling across different environments

export const getApiUrl = () => {
  // Check if we're in a Vercel production environment
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Use the current origin for API calls
    return window.location.origin;
  }
  
  // Development environment (localhost)
  return '';
};

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string
  };
};

// Function to check if we're running in Vercel environment
export const isVercelEnvironment = () => {
  return import.meta.env.PROD && 
    (typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('.vercel.app') || 
     window.location.hostname.endsWith('.replit.app')));
};