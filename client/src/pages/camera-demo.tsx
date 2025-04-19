import { useState } from 'react';
import { Camera, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CameraCapture } from '@/components/camera-capture';
import { ImageUploader } from '@/components/image-uploader';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CameraDemo() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  
  // Download the captured image
  const downloadImage = (imageData: string) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `blacksmith_photo_${new Date().toISOString().replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="container py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-8">Camera Functions Demo</h1>
      
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="camera">
            <Camera className="h-4 w-4 mr-2" />
            Live Camera
          </TabsTrigger>
          <TabsTrigger value="uploader">
            <Download className="h-4 w-4 mr-2" />
            Image Uploader
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="camera">
          <div className="max-w-2xl mx-auto">
            <CameraCapture 
              onCapture={(imageData) => setCapturedImage(imageData)} 
            />
            
            {capturedImage && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Captured Image</CardTitle>
                  <CardDescription>
                    You can use this image or download it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-auto rounded-md shadow-md" 
                  />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadImage(capturedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="uploader">
          <div className="max-w-2xl mx-auto grid gap-8 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Image Uploader</CardTitle>
                <CardDescription>
                  Upload an image from file or use your camera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImageSelect={(imageData) => setUploadedImage(imageData)}
                  label="Upload Image for Expense Receipt"
                />
              </CardContent>
            </Card>
            
            {uploadedImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Preview</CardTitle>
                  <CardDescription>
                    Image that would be saved with the expense record
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-40">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-w-full max-h-48 rounded-md shadow-md" 
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadImage(uploadedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-8" />
      
      <div className="text-center text-sm text-gray-500">
        <p>
          Camera functionality can be integrated into various parts of the application, such as:
        </p>
        <ul className="list-disc pl-8 mt-2 text-left max-w-md mx-auto">
          <li>Capturing photos of expense receipts</li>
          <li>Documenting vehicle conditions before/after journeys</li>
          <li>Taking photos of loading/unloading operations</li>
          <li>Recording visual evidence for toll receipts</li>
          <li>Capturing images of maintenance work</li>
        </ul>
      </div>
    </div>
  );
}