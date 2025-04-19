import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Download, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
  showControls?: boolean;
}

export function CameraCapture({ onCapture, onClose, showControls = true }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      // Reset any previous error
      setError(null);
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Start a new stream with the selected facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(newStream);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please make sure you have granted camera permissions.');
    }
  }, [facing, stream]);
  
  // Start camera on component mount
  useEffect(() => {
    startCamera();
    
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);
  
  // Switch between front and back cameras
  const toggleFacing = () => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  // Capture image from video stream
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip horizontally if using front camera
      if (facing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
    }
  };
  
  // Accept the captured image
  const acceptImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      if (onClose) onClose();
    }
  };
  
  // Retake the photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };
  
  // Download the captured image
  const downloadImage = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `photo_${new Date().toISOString().replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Camera Capture
        </CardTitle>
        <CardDescription>
          {error ? 
            <span className="text-red-500">{error}</span> : 
            'Capture images directly from your device camera'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center">
          {!capturedImage ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${facing === 'user' ? 'transform scale-x-[-1]' : ''}`}
              />
              {error && 
                <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-70 p-4 text-center">
                  {error}
                </div>
              }
            </>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover" 
            />
          )}
          
          {/* Hidden canvas used for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="flex justify-between flex-wrap gap-2">
          {!capturedImage ? (
            <>
              <Button 
                variant="outline" 
                onClick={toggleFacing} 
                disabled={!!error}
                title="Switch camera"
              >
                <FlipHorizontal className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
              
              <Button 
                onClick={captureImage} 
                disabled={!!error}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              
              {onClose && (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={retakePhoto}
              >
                <Camera className="h-4 w-4 mr-2" />
                Retake
              </Button>
              
              <Button 
                variant="outline" 
                onClick={downloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button 
                onClick={acceptImage}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}