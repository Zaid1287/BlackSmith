import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/**
 * InstallPrompt component to show a custom install button for the PWA
 * Addresses the recommendation "Increase reach with widgets"
 */
export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Save the event for later use
      setInstallPrompt(e);
    };
    
    // Check if the app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };
    
    // Add event listener for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check initial install state
    checkIfInstalled();
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Handle install button click
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    // Reset the install prompt variable
    setInstallPrompt(null);
    
    if (choiceResult.outcome === 'accepted') {
      toast({
        title: "Thank you!",
        description: "BlackSmith Traders has been installed on your device",
      });
      setIsInstalled(true);
    }
  };
  
  // Only show if not already installed and install prompt is available
  if (isInstalled || !installPrompt) {
    return null;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto mb-4 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Install BlackSmith Traders</CardTitle>
        <CardDescription>Use the app offline and get better performance</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Install our app on your device for faster access, offline capability, and a more native experience.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleInstallClick} variant="outline" className="w-full">
          Install App
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * ShareWidget component to enable easy sharing of the app
 * Addresses the recommendation "Be a share_target for your users"
 */
export function ShareWidget() {
  const canShare = Boolean(navigator.share);
  
  const handleShare = async () => {
    if (!canShare) return;
    
    try {
      await navigator.share({
        title: 'BlackSmith Traders',
        text: 'Check out BlackSmith Traders for logistics management and tracking',
        url: window.location.href,
      });
      
      toast({
        title: "Shared!",
        description: "Thank you for sharing BlackSmith Traders",
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  if (!canShare) {
    return null;
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      className="fixed bottom-20 right-4 md:bottom-4 md:right-4 z-50 rounded-full w-10 h-10 p-0 shadow-md"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
      </svg>
    </Button>
  );
}