import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Download, X, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser or requires HTTPS on iOS devices");
      }
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // iOS-specific constraints - keep simpler for better compatibility
      // Start a new stream with the selected facing mode
      const constraints = {
        video: { 
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      console.log("Requesting camera with constraints:", constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera stream obtained successfully");
      
      setStream(newStream);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      // More detailed error message
      let errorMessage = 'Could not access the camera. ';
      
      if (err instanceof Error) {
        errorMessage += err.message;
      }
      
      // For iOS Safari, add specific instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        errorMessage += ' iOS requires HTTPS for camera access. Make sure you\'re using a secure connection and have granted camera permissions in Settings.';
      } else {
        errorMessage += ' Please make sure you have granted camera permissions.';
      }
      
      setError(errorMessage);
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
  
  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
    };
    reader.readAsDataURL(file);
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
            <span className="text-red-500">
              Camera error. You can still upload a photo from your gallery.
            </span> : 
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
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-70 p-4 text-center">
                  <Camera className="h-12 w-12 mb-4 text-red-400" />
                  <h3 className="text-lg font-semibold mb-2 text-red-300">Camera Access Error</h3>
                  <p>{error}</p>
                  {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                    <div className="mt-4 text-sm bg-gray-800 p-3 rounded-md">
                      <p className="font-semibold mb-1">Troubleshooting for iOS:</p>
                      <ul className="text-left list-disc pl-5">
                        <li>Make sure you're using a secure HTTPS connection</li>
                        <li>Check camera permissions in Safari Settings</li>
                        <li>Try using Safari browser instead of in-app browsers</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <p className="mb-2 font-medium">Alternative: Upload from Gallery</p>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer inline-flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Select Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
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
        <CardFooter className="flex flex-col w-full gap-4">
          {!capturedImage ? (
            <>
              <div className="flex justify-between flex-wrap gap-2 w-full">
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
              </div>
              
              {!error && (
                <>
                  <Separator />
                  <div className="text-center w-full">
                    <p className="text-sm text-gray-500 mb-2">Or upload from your device</p>
                    <label className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Select from gallery
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex justify-between flex-wrap gap-2 w-full">
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
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}