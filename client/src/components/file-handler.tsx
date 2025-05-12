import React, { useEffect, useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

/**
 * FileHandler component that registers with the browser to handle files
 * This addresses the PWA builder recommendation "Be a default handler for certain filetypes"
 */
const FileHandler: React.FC = () => {
  const [, setLocation] = useLocation();
  const [filePreview, setFilePreview] = useState<{
    type: string;
    name: string;
    size: number;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check if LaunchQueue API is available (part of File Handling API)
    if ('launchQueue' in window) {
      // Use any type since TypeScript doesn't have type definitions for these new Web APIs
      const launchQueue = (window as any).launchQueue;
      
      if (launchQueue && typeof launchQueue.setConsumer === 'function') {
        launchQueue.setConsumer((launchParams: any) => {
          if (!launchParams.files || !launchParams.files.length) {
            return;
          }
          
          // Handle the files that were used to launch the app
          handleFiles(launchParams.files);
        });
      }
    }

    // Register protocol handler
    if ('registerProtocolHandler' in navigator) {
      try {
        // Modern browsers only accept two parameters
        navigator.registerProtocolHandler(
          'web+blacksmith',
          `${window.location.origin}/%s`
        );
      } catch (err) {
        console.error('Failed to register protocol handler:', err);
      }
    }
    
    // Check for files shared through Web Share Target API
    const checkForSharedFiles = async () => {
      // The share target data is passed as URL parameters
      const url = new URL(window.location.href);
      
      if (url.pathname === '/open-file' || url.pathname === '/share-target') {
        setLoading(true);
        
        // If title or text parameters contain file URLs
        const title = url.searchParams.get('title');
        const text = url.searchParams.get('text');
        const urlParam = url.searchParams.get('url');
        
        if (urlParam && (urlParam.startsWith('http') || urlParam.startsWith('blob:'))) {
          try {
            // Try to fetch the file from the URL
            const response = await fetch(urlParam);
            const blob = await response.blob();
            const file = new File([blob], 'shared-file', { type: blob.type });
            
            await handleSingleFile(file);
          } catch (error) {
            console.error('Error fetching shared URL:', error);
          }
        }
        
        setLoading(false);
      }
    };
    
    checkForSharedFiles();
  }, [setLocation]);

  const handleFiles = async (fileHandles: any[]) => {
    setLoading(true);
    try {
      for (const fileHandle of fileHandles) {
        let file: File;
        
        // Get permission to read the file using the File System Access API
        // This is a modern API, so we need to check if the methods exist
        if (fileHandle && typeof fileHandle.requestPermission === 'function') {
          try {
            const permission = await fileHandle.requestPermission({ mode: 'read' });
            
            if (permission !== 'granted') {
              toast({
                title: "Permission denied",
                description: "We need permission to open this file.",
                variant: "destructive"
              });
              continue;
            }
          } catch (e) {
            console.warn('Error requesting permission:', e);
            // Continue trying to open the file anyway
          }
        }
        
        // Get the file
        try {
          if (typeof fileHandle.getFile === 'function') {
            file = await fileHandle.getFile();
          } else if (fileHandle instanceof File) {
            // Some browsers might pass File objects directly
            file = fileHandle;
          } else {
            console.warn('Unsupported file handle format');
            continue;
          }
        } catch (e) {
          console.error('Error getting file:', e);
          continue;
        }
        
        await handleSingleFile(file);
      }
    } catch (error) {
      console.error('Error handling files:', error);
      toast({
        title: "Error",
        description: "There was a problem opening the file.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSingleFile = async (file: File) => {
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    // Determine file type
    if (file.type.startsWith('image/')) {
      // Handle image files
      toast({
        title: "Image opened",
        description: `Opening ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });
      
      setFilePreview({
        type: 'image',
        name: file.name,
        size: file.size,
        url: objectUrl
      });
      
    } else if (file.type === 'application/pdf') {
      // Handle PDF files
      toast({
        title: "PDF opened",
        description: `Opening ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });
      
      setFilePreview({
        type: 'pdf',
        name: file.name,
        size: file.size,
        url: objectUrl
      });
    } else {
      // Unsupported file type - still show basic info
      toast({
        title: "File opened",
        description: `Opened ${file.name} (${file.type})`,
      });
      
      setFilePreview({
        type: 'other',
        name: file.name,
        size: file.size,
        url: objectUrl
      });
    }
  };
  
  const closePreview = () => {
    if (filePreview?.url) {
      // Clean up the object URL to avoid memory leaks
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
  };
  
  const handleFileAction = () => {
    if (!filePreview) return;
    
    // Different actions based on file type
    if (filePreview.type === 'image') {
      // For images, we might want to add it to a journey
      setLocation('/');
      toast({
        title: "Image ready",
        description: "The image is ready to be attached to a journey."
      });
    } else if (filePreview.type === 'pdf') {
      // For PDFs, we might want to view the content
      window.open(filePreview.url, '_blank');
    } else {
      // Default action
      setLocation('/');
    }
    
    closePreview();
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </div>
        </div>
      )}
      
      <Dialog open={!!filePreview} onOpenChange={() => filePreview && closePreview()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              {filePreview?.name} ({(filePreview?.size || 0) / 1024 < 1024 
                ? `${((filePreview?.size || 0) / 1024).toFixed(2)} KB` 
                : `${((filePreview?.size || 0) / 1024 / 1024).toFixed(2)} MB`})
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4">
            {filePreview?.type === 'image' && (
              <img 
                src={filePreview.url} 
                alt={filePreview.name} 
                className="max-w-full max-h-[300px] object-contain rounded" 
              />
            )}
            
            {filePreview?.type === 'pdf' && (
              <div className="flex flex-col items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p className="text-sm">PDF Document</p>
              </div>
            )}
            
            {filePreview?.type === 'other' && (
              <div className="flex flex-col items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <path d="M14 2v6h6"></path>
                </svg>
                <p className="text-sm">Generic File</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button variant="ghost" onClick={closePreview}>
              Cancel
            </Button>
            <Button onClick={handleFileAction}>
              {filePreview?.type === 'image' ? 'Use Image' : 'Open File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileHandler;