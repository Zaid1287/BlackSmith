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
  
  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      // Reset any previous error
      setError(null);
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser or requires HTTPS");
      }
      
      // Check if we can query permissions
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("Camera permission status:", result.state);
          
          if (result.state === 'denied') {
            throw new Error('Camera permission has been denied. Please enable it in your browser settings.');
          }
        } catch (permErr) {
          // Some browsers might not support permissions query for camera
          console.log("Could not query camera permission:", permErr);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error checking camera permissions:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error checking camera permissions');
      }
      return false;
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      // Reset any previous error
      setError(null);
      
      // First check permissions
      const permissionOk = await checkCameraPermission();
      if (!permissionOk) {
        return;
      }
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Try different video constraints that are more likely to work across devices
      // Start with minimal constraints to improve success rate
      let constraints = {
        video: {
          facingMode: facing
        },
        audio: false
      };
      
      // For mobile devices, use simpler constraints
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, use facingMode as the primary constraint
        console.log("Using mobile-optimized camera constraints");
      } else {
        // On desktop, we can try more specific constraints
        console.log("Using desktop-optimized camera constraints");
        constraints = {
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
      }
      
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
        // Extract more specific error information
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access was denied. Please allow camera access in your browser permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera was found on your device or the camera is in use by another application.';
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          errorMessage = 'The camera is already in use by another application or has hardware issues.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'The requested camera constraints cannot be satisfied.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access is blocked by a security policy.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'The constraints specified are incompatible with your device.';
        } else {
          errorMessage += err.message;
        }
      }
      
      // For iOS Safari, add specific instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        errorMessage += ' iOS requires HTTPS for camera access. Make sure you\'re using a secure connection and have granted camera permissions in Settings > Safari > Camera.';
      }
      
      setError(errorMessage);
    }
  }, [facing, stream, checkCameraPermission]);
  
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
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-80 p-4 text-center overflow-y-auto">
                  <Camera className="h-12 w-12 mb-4 text-red-400" />
                  <h3 className="text-xl font-semibold mb-2 text-red-300">Camera Access Error</h3>
                  <p className="text-base mb-4 max-w-md">{error}</p>
                  
                  <div className="mt-2 bg-gray-800/80 p-4 rounded-lg w-full max-w-md">
                    <p className="font-semibold mb-3 text-lg">Troubleshooting Steps:</p>
                    <ul className="text-left list-disc pl-5 space-y-2 mb-4">
                      <li>Check if your browser has permission to access the camera</li>
                      <li>Make sure you are using a secure HTTPS connection</li>
                      <li>Ensure no other application is using your camera</li>
                      <li>Try refreshing the page or using a different browser</li>
                      {navigator.userAgent.match(/Android/i) && (
                        <li>On Android, check camera permissions in your system settings</li>
                      )}
                    </ul>
                    
                    {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                      <div className="mb-4 p-3 bg-gray-700/80 rounded-md">
                        <p className="font-semibold mb-2 text-yellow-300">iOS-Specific Tips:</p>
                        <ul className="text-left list-disc pl-5">
                          <li>iOS requires HTTPS for camera access</li>
                          <li>Go to Settings &gt; Safari &gt; Camera and ensure access is allowed</li>
                          <li>Try using Safari instead of in-app browsers</li>
                          <li>Make sure camera is not being used by another app</li>
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      onClick={startCamera} 
                      className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                  
                  <div className="mt-6 w-full max-w-md">
                    <p className="mb-3 font-medium text-lg">Upload From Gallery Instead</p>
                    <label className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md cursor-pointer inline-flex items-center w-full justify-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Select Photo from Gallery
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