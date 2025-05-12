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
import { AlertCircle, Check, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

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

/**
 * PWAStatusWidget component to display the connectivity and installation status
 * Enhanced PWA experience with clear status information
 */
export function PWAStatusWidget({ showOffline = true }: { showOffline?: boolean }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstallState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };
    
    // Check if service worker is active
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        setServiceWorkerActive(!!registration && registration.active !== null);
      }
    };
    
    // Online/offline detection
    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);
    
    // Initialize checks
    checkInstallState();
    checkServiceWorker();
    
    // Set up event listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);
  
  // Skip rendering if online and showOffline is true
  if (isOnline && showOffline === true) {
    return null;
  }
  
  return (
    <div className="absolute top-4 right-4 z-50 w-full max-w-xs">
      {!isOnline && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Limited functionality is available while offline. Your changes will sync once you're back online.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className={`${expanded ? 'block' : 'hidden'} mb-4`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">PWA Status</CardTitle>
          <CardDescription>Current app capabilities</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <Accordion type="single" collapsible>
            <AccordionItem value="connection">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center">
                  {isOnline ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
                  <span>Connection: {isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {isOnline ? 
                  "You're connected to the internet. All features are available." : 
                  "You're currently offline. Some features may be limited, but core functionality will still work."}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="install">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  <span>Installation: {isInstalled ? 'Installed' : 'Not installed'}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {isInstalled ? 
                  "BlackSmith Traders is installed as a PWA on your device." : 
                  "Install BlackSmith Traders on your device for offline access and better performance."}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="sync">
              <AccordionTrigger className="text-sm py-2">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  <span>Service Worker: {serviceWorkerActive ? 'Active' : 'Inactive'}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {serviceWorkerActive ? 
                  "Service worker is active. Offline support and background sync are available." : 
                  "Service worker is not active. Some offline features may not work properly."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setExpanded(!expanded)}
        className={`${isOnline ? 'hidden' : 'flex'} ml-auto items-center`}
      >
        {expanded ? "Hide Details" : "App Status"}
      </Button>
    </div>
  );
}