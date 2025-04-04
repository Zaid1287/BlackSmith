import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatSpeed, formatCurrency, estimateFuelCost } from '@/lib/utils';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface VehicleMapProps {
  journeyId?: number;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  destination?: string;
  distance?: number;
}

export function VehicleMap({ journeyId, latitude, longitude, speed, destination, distance }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estimated fuel used (4 km per liter)
  const fuelUsed = distance ? Math.round(distance / 4) : 0;
  // Estimated fuel cost (₹100 per liter)
  const fuelCost = estimateFuelCost(distance || 0);

  useEffect(() => {
    // Use a simplified map view without Google Maps API
    // Since we don't have an API key, we'll display a fallback view
    setIsLoading(false);
    
    // In a real implementation, load Google Maps if an API key is provided
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY && !window.google) {
      const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = () => {
        setIsLoading(false);
        initializeMap();
      };
      
      script.onerror = () => {
        setError('Failed to load Google Maps API.');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
        window.initMap = null as any;
        document.head.removeChild(script);
      };
    } else if (window.google) {
      setIsLoading(false);
      initializeMap();
    }
  }, []);
  
  // Update marker position when location changes
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      const position = { lat: latitude, lng: longitude };
      
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          },
        });
      }
      
      mapInstanceRef.current.panTo(position);
    }
  }, [latitude, longitude]);
  
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    
    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India
    const center = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;
    
    const mapOptions = {
      center,
      zoom: 12,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    };
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    
    if (latitude && longitude) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
      });
    }
  };

  if (error) {
    return (
      <Card className="mb-4">
        <CardContent className="p-6 text-center">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px] bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : window.google ? (
          <div ref={mapRef} className="h-[400px] w-full"></div>
        ) : (
          // Fallback view when Google Maps is not available
          <div className="h-[400px] w-full bg-gray-100 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-4">
              <div className="text-xl font-semibold text-gray-800 mb-2">Vehicle Location</div>
              <div className="text-sm text-gray-600">
                {latitude && longitude ? (
                  <>
                    Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
                  </>
                ) : (
                  "Vehicle location data not available"
                )}
              </div>
            </div>
            {destination && (
              <div className="text-center mb-4">
                <div className="text-sm font-medium">Destination: {destination}</div>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-4 max-w-xs text-center">
              Note: Live map view requires a Google Maps API key.
            </div>
          </div>
        )}
        
        {/* Speed indicator */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600 mb-1">Current Speed</div>
          <div className="text-xl font-semibold">{formatSpeed(speed)}</div>
        </div>
        
        {/* Journey details */}
        {distance && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-600">Distance</div>
              <div className="text-sm font-medium text-right">{distance} km</div>
              
              <div className="text-xs text-gray-600">Fuel Used</div>
              <div className="text-sm font-medium text-right">{fuelUsed} L</div>
              
              <div className="text-xs text-gray-600">Est. Fuel Cost</div>
              <div className="text-sm font-medium text-right">{formatCurrency(fuelCost)}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
