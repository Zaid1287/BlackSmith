import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraModal } from './camera-modal';

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  currentImage?: string;
  label?: string;
}

export function ImageUploader({
  onImageSelect,
  currentImage,
  label = 'Add Image'
}: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | undefined>(currentImage);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setImagePreview(imageData);
      onImageSelect(imageData);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle camera capture
  const handleCameraCapture = (imageData: string) => {
    setImagePreview(imageData);
    onImageSelect(imageData);
  };
  
  // Handle removing the image
  const handleRemoveImage = () => {
    setImagePreview(undefined);
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {imagePreview ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full h-auto max-h-48 object-cover" 
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Image
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowCameraModal(true)}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Use Camera
          </Button>
        </div>
      )}
      
      {/* Camera modal */}
      <CameraModal
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}