import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * This page handles the Web Share Target API integration
 * It allows other apps to share content directly to BlackSmith Traders
 */
export default function ShareTarget() {
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(true);
  
  // Get search params directly from window.location
  const searchParams = new URLSearchParams(window.location.search);
  const title = searchParams.get('title');
  const text = searchParams.get('text');
  const url = searchParams.get('url');
  
  useEffect(() => {
    // Process the shared content
    const processSharedContent = async () => {
      try {
        if (title || text || url) {
          // Show notification that content was received
          toast({
            title: "Content shared",
            description: title || "Content received successfully",
          });
          
          // Here you would typically save the shared content to your app state
          // For example, if it's a location URL, you might want to parse it
          // and use it in a journey, or if it's text, maybe save it as a note
          
          console.log("Shared content received:", { title, text, url });
          
          // Wait a moment before redirecting
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error("Error processing shared content:", error);
        toast({
          title: "Error",
          description: "There was a problem processing the shared content",
          variant: "destructive"
        });
      } finally {
        // Always redirect to home page after processing
        setProcessing(false);
        setLocation("/");
      }
    };
    
    processSharedContent();
  }, [title, text, url, setLocation]);
  
  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Processing Shared Content</h1>
        <p className="text-muted-foreground">Please wait while we process the shared content</p>
      </div>
    );
  }
  
  return null;
}