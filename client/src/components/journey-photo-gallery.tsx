import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, Download, Eye, X } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CameraCapture } from "./camera-capture";

interface JourneyPhoto {
  id: number;
  journeyId: number;
  imageData: string;
  description: string | null;
  createdAt: string;
}

interface JourneyPhotoGalleryProps {
  photos: JourneyPhoto[];
  isAdmin?: boolean;
  journeyId?: number;
  onAddPhoto?: (imageData: string, description: string) => void;
  className?: string;
}

export function JourneyPhotoGallery({
  photos = [],
  isAdmin = false,
  journeyId,
  onAddPhoto,
  className = ""
}: JourneyPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<JourneyPhoto | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoDescription, setPhotoDescription] = useState<string>("");

  const handleCapture = (imageData: string) => {
    setShowCamera(false);
    if (onAddPhoto) {
      onAddPhoto(imageData, photoDescription || "Journey photo");
      setPhotoDescription("");
    }
  };

  const handleDownload = (photo: JourneyPhoto) => {
    const link = document.createElement("a");
    link.href = photo.imageData;
    link.download = `journey-${journeyId}-photo-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (photos.length === 0 && !onAddPhoto) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex justify-between items-center">
            Journey Photos
            {onAddPhoto && (
              <Button 
                onClick={() => setShowCamera(true)} 
                variant="outline" 
                size="sm"
                className="ml-auto"
              >
                <Camera className="h-4 w-4 mr-2" /> 
                Add Photo
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {photos.length > 0 
              ? `${photos.length} photo${photos.length > 1 ? 's' : ''} from this journey` 
              : 'No photos available for this journey'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-md"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.imageData}
                    alt={photo.description || "Journey photo"}
                    className="h-full w-full object-cover transition-all hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No photos</AlertTitle>
              <AlertDescription>
                There are no photos associated with this journey yet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-full p-1 md:p-6 h-auto max-h-[90vh] overflow-auto">
          <div className="absolute right-2 top-2 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedPhoto(null)}
              className="h-8 w-8 rounded-full bg-background/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedPhoto && (
            <div className="flex flex-col space-y-4">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={selectedPhoto.imageData}
                  alt={selectedPhoto.description || "Journey photo"}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              
              <div className="px-4 py-2">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-lg font-semibold">
                    {selectedPhoto.description || "Journey Photo"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Added on {new Date(selectedPhoto.createdAt).toLocaleString()}
                  </p>
                  <div className="flex mt-2 space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(selectedPhoto)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4">
            <DialogTitle>Take a Journey Photo</DialogTitle>
            <DialogDescription>
              Capture a photo for this journey. The photo will be visible to admins.
            </DialogDescription>
          </DialogHeader>
          <CameraCapture 
            onCapture={handleCapture} 
            onClose={() => setShowCamera(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}