import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CameraCapture } from './camera-capture';

interface CameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
  title?: string;
  description?: string;
}

export function CameraModal({
  open,
  onOpenChange,
  onCapture,
  title = 'Take a Photo',
  description = 'Use your device camera to capture an image'
}: CameraModalProps) {
  
  const handleCapture = (imageData: string) => {
    onCapture(imageData);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <CameraCapture 
            onCapture={handleCapture} 
            onClose={handleClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}