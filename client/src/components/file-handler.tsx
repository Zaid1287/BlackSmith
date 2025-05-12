import React, { useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

/**
 * FileHandler component that registers with the browser to handle files
 * This addresses the PWA builder recommendation "Be a default handler for certain filetypes"
 */
const FileHandler: React.FC = () => {
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
  }, []);

  const handleFiles = async (fileHandles: any[]) => {
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
        
        // Determine file type
        if (file.type.startsWith('image/')) {
          // Handle image files
          toast({
            title: "Image opened",
            description: `Opening ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          });
          
          // Create object URL for preview
          const objectUrl = URL.createObjectURL(file);
          
          // You would typically dispatch to your app state manager here
          // For example: dispatch({ type: 'OPEN_IMAGE', payload: { name: file.name, url: objectUrl } });
          
        } else if (file.type === 'application/pdf') {
          // Handle PDF files
          toast({
            title: "PDF opened",
            description: `Opening ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          });
          
          // Create object URL for preview
          const objectUrl = URL.createObjectURL(file);
          
          // You would typically dispatch to your app state manager here
          // For example: dispatch({ type: 'OPEN_PDF', payload: { name: file.name, url: objectUrl } });
        }
      }
    } catch (error) {
      console.error('Error handling files:', error);
      toast({
        title: "Error",
        description: "There was a problem opening the file.",
        variant: "destructive"
      });
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default FileHandler;