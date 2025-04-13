import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Info, Navigation } from 'lucide-react';
import { formatSpeed, formatCurrency, calculateFuelConsumption } from '@/lib/utils';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyADsGW1KYzzL14SE58vjAcRHzc0cBKUDWM';

// Function to check if we should try to load Google Maps
function shouldLoadGoogleMaps() {
  // If there's an error in local storage, don't try again for 5 minutes
  const lastError = localStorage.getItem('googlemaps_load_error');
  if (lastError) {
    const errorTime = parseInt(lastError, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - errorTime < fiveMinutes) {
      console.log("Skipping Google Maps load due to recent error");
      return false;
    } else {
      // Clear old error
      localStorage.removeItem('googlemaps_load_error');
    }
  }
  
  return true;
}

interface VehicleMapProps {
  journeyId?: number;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  destination?: string;
  distance?: number;
  startTime?: string;
  estimatedArrivalTime?: string;
}

interface JourneyProgress {
  percent: number;
  elapsedTime: string;
}

export function VehicleMap({ journeyId, latitude, longitude, speed, destination, distance, startTime, estimatedArrivalTime }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fuelStations, setFuelStations] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: string;
    directions: string[];
  } | null>(null);
  
  // Calculate fuel consumption
  const fuelUsed = distance 
    ? Math.round(calculateFuelConsumption(distance, 'MEDIUM_TRUCK'))
    : 0;
    
  // Calculate journey progress
  const calculateJourneyProgress = (): { percent: number, elapsedTime: string } => {
    if (!startTime) return { percent: 0, elapsedTime: '0 min' };
    
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const elapsed = now - start;
    
    // Format elapsed time
    const minutes = Math.floor(elapsed / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const elapsedTime = hours > 0 
      ? `${hours}h ${minutes % 60}m` 
      : `${minutes}m`;
    
    // If we have an estimated arrival time, calculate progress based on time
    if (estimatedArrivalTime) {
      const estimated = new Date(estimatedArrivalTime).getTime();
      const totalDuration = estimated - start;
      if (totalDuration <= 0) return { percent: 100, elapsedTime };
      
      const progressPercent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      return { percent: progressPercent, elapsedTime };
    }
    
    // If no estimated time but we have distance, use a simple approximation
    if (distance) {
      // Assuming average speed of 50 km/h for approximation
      const estimatedTotalMinutes = (distance / 50) * 60;
      const progressPercent = Math.min(Math.round((minutes / estimatedTotalMinutes) * 100), 100);
      return { percent: progressPercent, elapsedTime };
    }
    
    return { percent: 0, elapsedTime };
  };
  
  const [journeyProgress, setJourneyProgress] = useState(calculateJourneyProgress());
  
  // Update progress periodically
  useEffect(() => {
    if (!startTime) return;
    
    const progressInterval = setInterval(() => {
      setJourneyProgress(calculateJourneyProgress());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(progressInterval);
  }, [startTime, estimatedArrivalTime]);

  useEffect(() => {
    // Load Google Maps
    const loadGoogleMaps = () => {
      if (!window.google && shouldLoadGoogleMaps()) {
        setIsLoading(true);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        window.initMap = () => {
          console.log("Google Maps API loaded successfully");
          // Clear any stored error state
          localStorage.removeItem('googlemaps_load_error');
          setIsLoading(false);
          initializeMap();
        };
        
        script.onerror = () => {
          console.error("Failed to load Google Maps API");
          // Store the error time
          localStorage.setItem('googlemaps_load_error', Date.now().toString());
          setError('Failed to load Google Maps API. Using fallback display.');
          setIsLoading(false);
        };
        
        // Set a timeout to catch slow loading or other issues
        const timeoutId = setTimeout(() => {
          if (!window.google) {
            console.error("Google Maps API load timeout");
            localStorage.setItem('googlemaps_load_error', Date.now().toString());
            setError('Google Maps API load timed out. Using fallback display.');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout
        
        document.head.appendChild(script);
        
        return () => {
          window.initMap = null as any;
          clearTimeout(timeoutId);
          if (script.parentNode) {
            document.head.removeChild(script);
          }
        };
      } else if (window.google) {
        setIsLoading(false);
        initializeMap();
      } else {
        // Skip Google Maps loading due to recent error
        setIsLoading(false);
        setError('Maps temporarily unavailable. Using fallback display.');
      }
    };
    
    loadGoogleMaps();
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
      
      // If we have a destination, calculate the route and find fuel stations
      if (destination && !routeInfo) {
        calculateRoute(position, destination);
        findFuelStations(position);
      }
    }
  }, [latitude, longitude, destination]);
  
  const initializeMap = () => {
    if (!mapRef.current) {
      console.error("Map reference is not available");
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      setError("Google Maps API not loaded. Please refresh the page.");
      return;
    }
    
    try {
      console.log("Initializing map...");
      
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
      
      // Create the map instance
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      console.log("Map created successfully");
      
      // Add vehicle marker if we have coordinates
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
        console.log("Vehicle marker added");
        
        // Set up directions renderer
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2563EB',
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        console.log("Directions renderer initialized");
        
        // If we have a destination, calculate route and find fuel stations
        if (destination) {
          console.log("Calculating route to destination:", destination);
          calculateRoute({ lat: latitude, lng: longitude }, destination);
          findFuelStations({ lat: latitude, lng: longitude });
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Could not initialize Google Maps. Please try refreshing the page.");
    }
  };
  
  const calculateRoute = (origin: any, destination: string) => {
    if (!window.google || !mapInstanceRef.current) return;
    
    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result: any, status: string) => {
          if (status === 'OK') {
            try {
              // Display route on map
              if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
              }
              
              // Extract route information
              const route = result.routes[0];
              const leg = route.legs[0];
              
              // Get distance in kilometers
              const distanceInMeters = leg.distance.value;
              const distanceInKm = Math.round(distanceInMeters / 1000);
              
              // Get duration as text
              const durationText = leg.duration.text;
              
              // Get step-by-step directions
              const directions = leg.steps.map((step: any) => {
                // Remove HTML tags from instructions
                const div = document.createElement('div');
                div.innerHTML = step.instructions;
                return div.textContent || div.innerText;
              });
              
              setRouteInfo({
                distance: distanceInKm,
                duration: durationText,
                directions
              });
              
              // Add destination marker
              try {
                new window.google.maps.Marker({
                  position: leg.end_location,
                  map: mapInstanceRef.current,
                  icon: {
                    path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 5,
                    fillColor: '#E02424',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                  },
                  title: "Destination"
                });
              } catch (markerError) {
                console.error("Error creating destination marker:", markerError);
              }
            } catch (routeError) {
              console.error("Error processing route results:", routeError);
            }
          } else {
            console.error(`Directions request failed due to ${status}`);
            setError('Failed to calculate route');
          }
        }
      );
    } catch (directionsError) {
      console.error("Error setting up directions:", directionsError);
      setError("Could not calculate directions");
    }
  };
  
  // Find fuel stations near the route
  const findFuelStations = (position: any) => {
    if (!window.google || !mapInstanceRef.current) return;
    
    try {
      const placesService = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      
      placesService.nearbySearch(
        {
          location: position,
          radius: 5000, // 5km radius
          type: 'gas_station'
        },
        (results: any, status: string) => {
          if (status === 'OK' && results) {
            try {
              setFuelStations(results);
              
              // Clear existing fuel station markers
              try {
                markersRef.current.forEach(marker => {
                  if (marker && marker.setMap) marker.setMap(null);
                });
                markersRef.current = [];
              } catch (clearError) {
                console.error("Error clearing markers:", clearError);
              }
              
              // Add new fuel station markers
              results.forEach((station: any) => {
                try {
                  if (station && station.geometry && station.geometry.location) {
                    const marker = new window.google.maps.Marker({
                      position: station.geometry.location,
                      map: mapInstanceRef.current,
                      icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/gas.png',
                        scaledSize: new window.google.maps.Size(24, 24)
                      },
                      title: station.name
                    });
                    
                    // Add info window for each fuel station
                    const infoWindow = new window.google.maps.InfoWindow({
                      content: `
                        <div style="padding: 8px;">
                          <h3 style="margin: 0 0 8px; font-size: 14px;">${station.name || 'Fuel Station'}</h3>
                          <p style="margin: 0; font-size: 12px;">${station.vicinity || 'No address available'}</p>
                          ${station.rating ? `<p style="margin: 4px 0 0; font-size: 12px;">Rating: ${station.rating}/5</p>` : ''}
                        </div>
                      `
                    });
                    
                    marker.addListener('click', () => {
                      infoWindow.open(mapInstanceRef.current, marker);
                    });
                    
                    markersRef.current.push(marker);
                  }
                } catch (markerError) {
                  console.error("Error creating fuel station marker:", markerError);
                }
              });
            } catch (markersError) {
              console.error("Error setting fuel station markers:", markersError);
            }
          } else {
            console.error(`Places request failed due to ${status}`);
          }
        }
      );
    } catch (placesError) {
      console.error("Error initializing places service:", placesError);
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
        {(distance || routeInfo?.distance) && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-xs text-gray-600">Distance</div>
              <div className="text-sm font-medium text-right">{routeInfo?.distance || distance} km</div>
              
              <div className="text-xs text-gray-600">Est. Duration</div>
              <div className="text-sm font-medium text-right">{routeInfo?.duration || 'Calculating...'}</div>
              
              <div className="text-xs text-gray-600">Fuel Required</div>
              <div className="text-sm font-medium text-right">{fuelUsed} L</div>
              
              <div className="text-xs text-gray-600">Fuel Stations</div>
              <div className="text-sm font-medium text-right">{fuelStations.length || 0} nearby</div>
            </div>
            
            {/* Journey Progress Indicator */}
            {startTime && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Info className="h-3 w-3 mr-1" /> Journey Progress:
                </div>
                <div className="mb-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${journeyProgress.percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <div>
                      <span className="text-blue-600 font-medium">{journeyProgress.percent}%</span> Complete
                    </div>
                    <div>
                      Time Elapsed: <span className="font-medium">{journeyProgress.elapsedTime}</span>
                    </div>
                  </div>
                  
                  {estimatedArrivalTime && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      ETA: {new Date(estimatedArrivalTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {routeInfo?.directions && routeInfo.directions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Navigation className="h-3 w-3 mr-1" /> Directions:
                </div>
                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto pr-1">
                  {routeInfo.directions.slice(0, 3).map((direction, index) => (
                    <div key={index} className="mb-1 flex">
                      <span className="font-medium mr-1">{index + 1}.</span>
                      <span>{direction}</span>
                    </div>
                  ))}
                  {routeInfo.directions.length > 3 && (
                    <div className="text-blue-500 text-xs">+ {routeInfo.directions.length - 3} more steps</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg text-xs">
          <div className="flex items-center mb-1">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span>Current Location</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="h-3 w-3 border-t-4 border-l-4 border-r-4 border-red-500 rounded-full mr-2"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center">
            <img src="https://maps.google.com/mapfiles/ms/icons/gas.png" alt="Fuel" className="h-3 w-3 mr-2" />
            <span>Fuel Station</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
