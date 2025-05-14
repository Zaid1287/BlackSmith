import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if the current viewport is mobile-sized
 * @param breakpoint The pixel width below which we consider the viewport to be mobile (default: 768)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768): boolean {
  // Start with an initial guess based on screen width
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to update state based on window size
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler immediately to get the initial size
    handleResize();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);
  
  return isMobile;
}