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
      
      // Determine if we're on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Create a simple set of constraints that should work on most devices
      const constraints = {
        video: {
          facingMode: facing,
          // Avoid setting resolution constraints as they can cause issues on some devices
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 1280 : 720 }
        },
        audio: false
      };
      
      console.log("Requesting camera with constraints:", constraints);
      
      // Important: Use try/catch inside to handle specific device issues
      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Camera stream obtained successfully");
        
        setStream(newStream);
        
        // Connect stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          
          // Add event listeners to ensure video is playing properly
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => {
              console.error("Error playing video:", e);
              setError("Could not start video playback. Please check your device settings.");
            });
          };
        }
      } catch (streamErr) {
        console.error("First camera attempt failed, trying fallback constraints", streamErr);
        
        // Try a more basic fallback with minimal constraints
        try {
          const fallbackConstraints = { 
            video: { facingMode: facing }, 
            audio: false 
          };
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          setStream(fallbackStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => {
                console.error("Error playing video with fallback:", e);
                setError("Could not start video playback. Please check your device settings.");
              });
            };
          }
        } catch (fallbackErr) {
          // Finally, try with no constraints at all
          try {
            const basicConstraints = { video: true, audio: false };
            const basicStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
            setStream(basicStream);
            
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream;
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("Error playing video with basic constraints:", e));
              };
            }
          } catch (basicErr) {
            // If all attempts fail, throw the error to be caught by the outer catch block
            throw basicErr;
          }
        }
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
    <Card className="w-full max-w-lg mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Take Photo
        </CardTitle>
        <CardDescription className="text-blue-100">
          {error ? (
            <span className="text-white font-medium">
              Camera error. You can still upload a photo from your gallery.
            </span>
          ) : (
            <div className="space-y-1">
              <p>Capture images directly from your device camera</p>
              {/iPad|iPhone|iPod|Android/i.test(navigator.userAgent) && (
                <p className="text-xs text-white/90 font-medium">
                  Note: Please allow camera permissions when prompted
                </p>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center shadow-inner">
          {!capturedImage ? (
            <>
              {/* Video element only shown when there's no error */}
              {!error && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover ${facing === 'user' ? 'transform scale-x-[-1]' : ''}`}
                  />
                  <div className="absolute bottom-4 right-4">
                    <button 
                      onClick={captureImage}
                      aria-label="Take photo"
                      className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-4 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    >
                      <div className="bg-blue-500 rounded-full w-12 h-12"></div>
                    </button>
                  </div>
                </>
              )}
              {error && 
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-90 p-4 text-center overflow-y-auto">
                  <Camera className="h-16 w-16 mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold mb-3 text-white">Camera Not Available</h3>
                  <p className="text-base mb-5 max-w-md">{error}</p>
                  
                  <div className="mt-2 bg-gray-800/90 p-5 rounded-xl w-full max-w-md border border-gray-700">
                    <p className="font-semibold mb-3 text-lg text-blue-300">Quick Fix:</p>
                    <ul className="text-left list-disc pl-5 space-y-3 mb-5 text-gray-200">
                      <li>Check camera permissions in your browser settings</li>
                      <li>Ensure you're using a secure HTTPS connection</li>
                      <li>Try using your default browser (Safari on iOS, Chrome on Android)</li>
                    </ul>
                    
                    <Button 
                      onClick={startCamera} 
                      className="w-full mb-5 bg-blue-600 hover:bg-blue-700 py-3 text-lg font-medium"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Try Again
                    </Button>
                  </div>
                  
                  <div className="mt-6 w-full max-w-md">
                    <p className="mb-3 font-medium text-xl">Or Upload a Photo Instead</p>
                    <label className="bg-green-600 hover:bg-green-700 text-white py-4 px-4 rounded-xl cursor-pointer inline-flex items-center w-full justify-center text-lg font-medium">
                      <Upload className="h-6 w-6 mr-3" />
                      Select from Gallery
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
            <>
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
            </>
          )}
          
          {/* Hidden canvas used for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
      
      {showControls && (
        <CardFooter className="flex flex-col w-full gap-4 pt-5 pb-6">
          {!capturedImage ? (
            <>
              <div className="flex justify-between flex-wrap gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={toggleFacing} 
                  disabled={!!error}
                  title="Switch camera"
                  className="text-base py-6 flex-1"
                >
                  <FlipHorizontal className="h-5 w-5 mr-2" />
                  Switch Camera
                </Button>
                
                {!error && (
                  <Button 
                    onClick={captureImage} 
                    className="bg-blue-600 hover:bg-blue-700 text-base py-6 flex-1"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </Button>
                )}
                
                {onClose && (
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="text-base py-6 flex-1"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
              
              {/* Gallery upload option - only when camera is working */}
              {!error && (
                <>
                  <Separator className="my-3" />
                  <div className="text-center w-full">
                    <p className="text-base mb-3 text-gray-600">
                      Or select an existing photo
                    </p>
                    <label className="inline-flex items-center px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg cursor-pointer shadow-sm text-base">
                      <Upload className="h-5 w-5 mr-3" />
                      Choose from gallery
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
            <div className="flex justify-between flex-wrap gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={retakePhoto}
                className="text-base py-6 flex-1"
              >
                <Camera className="h-5 w-5 mr-2" />
                Retake Photo
              </Button>
              
              <Button 
                onClick={acceptImage}
                className="bg-green-600 hover:bg-green-700 text-base py-6 flex-1"
              >
                <Check className="h-5 w-5 mr-2" />
                Use This Photo
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}