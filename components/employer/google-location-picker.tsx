'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X, Navigation, Clock, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
  }) => void;
  initialAddress?: string;
  className?: string;
  showOfficeLocations?: boolean;
  showRecentLocations?: boolean;
  showCurrentLocation?: boolean;
  autoDetectLocation?: boolean;
}

interface RecentLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': React.DetailedHTMLProps<any, HTMLElement>;
      'gmpx-place-picker': React.DetailedHTMLProps<any, HTMLElement>;
    }
  }
}

const STORAGE_KEY = 'google_location_picker_recent';
const MAX_RECENT_LOCATIONS = 10;

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function GoogleLocationPicker({
  onLocationSelect,
  initialAddress = '',
  className = '',
  showOfficeLocations = true,
  showRecentLocations = true,
  showCurrentLocation = true,
  autoDetectLocation = false,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const placePickerRef = useRef<any>(null);
  const apiLoaderRef = useRef<any>(null);
  const { toast } = useToast();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load recent locations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const locations = JSON.parse(stored) as RecentLocation[];
        setRecentLocations(locations.slice(0, MAX_RECENT_LOCATIONS));
      }
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
  }, []);

  // Load office locations
  useEffect(() => {
    if (showOfficeLocations) {
      fetchOfficeLocations();
    }
  }, [showOfficeLocations]);

  // Auto-detect current location
  useEffect(() => {
    if (autoDetectLocation && showCurrentLocation && navigator.geolocation) {
      detectCurrentLocation();
    }
  }, [autoDetectLocation, showCurrentLocation]);

  const fetchOfficeLocations = async () => {
    try {
      const response = await fetch('/api/employer/office-locations');
      if (response.ok) {
        const data = await response.json();
        if (data.locations) {
          setOfficeLocations(data.locations);
        }
      }
    } catch (error) {
      console.error('Error fetching office locations:', error);
    }
  };

  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: 'Location Access Denied',
            description: 'Please enable location permissions to use this feature.',
            variant: 'destructive',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [toast]);

  const saveToRecent = useCallback((location: RecentLocation) => {
    try {
      const updated = [
        location,
        ...recentLocations.filter(
          (loc) =>
            !(
              Math.abs(loc.latitude - location.latitude) < 0.0001 &&
              Math.abs(loc.longitude - location.longitude) < 0.0001
            )
        ),
      ].slice(0, MAX_RECENT_LOCATIONS);

      setRecentLocations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  }, [recentLocations]);

  // Load Extended Component Library
  useEffect(() => {
    if (!apiKey) {
      setApiError('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
      return;
    }

    // Check if already loaded
    const existingScript = document.querySelector('script[src*="extended-component-library"]');
    if (existingScript) {
      setMapsLoaded(true);
      setTimeout(() => {
        initializePlacePicker();
      }, 100);
      return;
    }

    // Load the Extended Component Library
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
    script.onload = () => {
      setMapsLoaded(true);
      customElements.whenDefined('gmpx-place-picker').then(() => {
        setTimeout(() => {
          initializePlacePicker();
        }, 100);
      }).catch((error) => {
        console.error('Failed to define gmpx-place-picker:', error);
        setApiError('Failed to initialize Google Maps place picker.');
      });
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps Extended Component Library.');
      setMapsLoaded(false);
      setApiError('Failed to load Google Maps. Please check your internet connection and try again.');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  const initializePlacePicker = () => {
    if (!placePickerRef.current) {
      setTimeout(() => {
        if (placePickerRef.current) {
          initializePlacePicker();
        }
      }, 200);
      return;
    }

    const placePicker = placePickerRef.current as any;

    // Set initial value if provided
    if (initialAddress && placePicker.value !== initialAddress) {
      placePicker.value = initialAddress;
    }

    // Listen for place selection
    const handlePlaceChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const place = customEvent.detail?.place || placePicker.value;

      if (!place) {
        setApiError('No place selected.');
        return;
      }

      if (!place.location) {
        setApiError(`No details available for: "${place.displayName || place.name || 'selected location'}"`);
        setSelectedLocation(null);
        return;
      }

      setLoading(true);
      setApiError(null);
      setShowSuggestions(false);

      try {
        // Handle different location formats
        let lat = 0;
        let lng = 0;
        
        if (typeof place.location.lat === 'function') {
          lat = place.location.lat();
          lng = place.location.lng();
        } else {
          lat = place.location.lat || place.location.latitude || 0;
          lng = place.location.lng || place.location.longitude || 0;
        }

        const location = {
          latitude: lat,
          longitude: lng,
          address: place.formattedAddress || place.formatted_address || place.displayName || '',
          name: place.displayName || place.name || (place.formattedAddress?.split(',')[0]) || '',
        };

        setSelectedLocation(location);
        
        // Save to recent locations
        saveToRecent({
          ...location,
          timestamp: Date.now(),
        });

        // Check distance to office locations
        if (officeLocations.length > 0) {
          const nearestOffice = officeLocations.reduce((nearest, office) => {
            const distance = calculateDistance(lat, lng, office.latitude, office.longitude);
            const nearestDistance = nearest ? calculateDistance(lat, lng, nearest.latitude, nearest.longitude) : Infinity;
            return distance < nearestDistance ? office : nearest;
          }, null as OfficeLocation | null);

          if (nearestOffice) {
            const distance = calculateDistance(lat, lng, nearestOffice.latitude, nearestOffice.longitude);
            if (distance <= nearestOffice.radius_meters) {
              toast({
                title: 'Location Verified',
                description: `This location is within ${formatDistance(nearestOffice.radius_meters)} of ${nearestOffice.name}`,
              });
            }
          }
        }

        onLocationSelect(location);
      } catch (error: any) {
        console.error('Error processing place:', error);
        setApiError('Failed to process selected location. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to process selected location.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Remove existing listener if any
    placePicker.removeEventListener('gmpx-placechange', handlePlaceChange);

    // Listen for the placechange event
    placePicker.addEventListener('gmpx-placechange', handlePlaceChange);

    // Also listen for global errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      if (errorMessage.includes('BillingNotEnabled') || errorMessage.includes('billing')) {
        setApiError('Google Maps billing is not enabled. Please enable billing in Google Cloud Console.');
      } else if (errorMessage.includes('RefererNotAllowed')) {
        setApiError('API key is not authorized for this domain. Please add your domain to API key restrictions.');
      }
    };

    window.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      if (placePicker) {
        placePicker.removeEventListener('gmpx-placechange', handlePlaceChange);
      }
      window.removeEventListener('error', handleError);
    };
  };

  const handleSelectRecentLocation = (location: RecentLocation) => {
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      name: location.name,
    });
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      name: location.name,
    });
    setShowSuggestions(false);
  };

  const handleSelectOfficeLocation = (office: OfficeLocation) => {
    setSelectedLocation({
      latitude: office.latitude,
      longitude: office.longitude,
      address: office.address,
      name: office.name,
    });
    onLocationSelect({
      latitude: office.latitude,
      longitude: office.longitude,
      address: office.address,
      name: office.name,
    });
    setShowSuggestions(false);
    
    // Set value in place picker
    if (placePickerRef.current) {
      placePickerRef.current.value = office.name;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!currentLocation) {
      detectCurrentLocation();
      return;
    }

    // Reverse geocode current location
    if (!window.google?.maps?.Geocoder) {
      toast({
        title: 'Error',
        description: 'Google Maps Geocoder not available.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: currentLocation.lat, lng: currentLocation.lng } },
      (results: any[], status: string) => {
        setLoading(false);
        if (status === 'OK' && results && results[0]) {
          const location = {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            address: results[0].formatted_address || '',
            name: results[0].formatted_address?.split(',')[0] || 'Current Location',
          };
          setSelectedLocation(location);
          saveToRecent({ ...location, timestamp: Date.now() });
          onLocationSelect(location);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to get address for current location.',
            variant: 'destructive',
          });
        }
      }
    );
  };

  const clearSelection = () => {
    if (placePickerRef.current) {
      placePickerRef.current.value = '';
    }
    setSelectedLocation(null);
    setApiError(null);
    setShowSuggestions(false);
  };

  const clearRecentLocations = () => {
    setRecentLocations([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'Recent Locations Cleared',
      description: 'All recent locations have been removed.',
    });
  };

  if (!apiKey) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor="location-search">Search Location</Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasSuggestions = (showRecentLocations && recentLocations.length > 0) || 
                        (showOfficeLocations && officeLocations.length > 0) ||
                        (showCurrentLocation && currentLocation);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="location-search" className="text-sm font-semibold">
          Search Location
        </Label>
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={detectingLocation || loading}
            className="h-7 text-xs"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="mr-1 h-3 w-3" />
                Use Current
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* API Loader */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment, react/no-unknown-property */}
      <gmpx-api-loader
        key={apiKey}
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
        // @ts-ignore - Web component requires inline style
        style={{ display: 'none' }}
      >
        {apiKey}
      </gmpx-api-loader>

      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          
          {/* Place Picker Component */}
          <div className="relative">
            {/* eslint-disable-next-line react/no-unknown-property */}
            <gmpx-place-picker
              ref={placePickerRef}
              placeholder="Search for location (e.g., Grand Mall Muscat, City Center Muscat)"
              className="w-full pl-10 pr-10"
              onFocus={() => {
                setIsFocused(true);
                if (hasSuggestions) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              // @ts-ignore - CSS custom properties for web component theming
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                '--gmpx-color-surface': 'hsl(var(--background))',
                '--gmpx-color-on-surface': 'hsl(var(--foreground))',
                '--gmpx-color-outline': 'hsl(var(--input))',
                '--gmpx-font-family-base': 'inherit',
                '--gmpx-font-size-base': '0.875rem',
              } as React.CSSProperties}
            />
            
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
            )}
            
            {selectedLocation && !loading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 z-10"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Smart Suggestions Panel */}
        {showSuggestions && hasSuggestions && isFocused && (
          <Card className="absolute z-50 w-full mt-2 shadow-lg border">
            <CardContent className="p-3 space-y-3 max-h-80 overflow-auto">
              {/* Current Location */}
              {showCurrentLocation && currentLocation && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">CURRENT LOCATION</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 hover:bg-accent"
                    onClick={handleUseCurrentLocation}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Use Current Location</p>
                        <p className="text-xs text-muted-foreground">
                          {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </Button>
                </div>
              )}

              {/* Office Locations */}
              {showOfficeLocations && officeLocations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">OFFICE LOCATIONS</span>
                  </div>
                  <div className="space-y-1">
                    {officeLocations.map((office) => (
                      <Button
                        key={office.id}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start h-auto p-2 hover:bg-accent"
                        onClick={() => handleSelectOfficeLocation(office)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate">{office.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{office.address}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
                            {formatDistance(office.radius_meters)}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Locations */}
              {showRecentLocations && recentLocations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground">RECENT LOCATIONS</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs"
                      onClick={clearRecentLocations}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentLocations.map((location, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start h-auto p-2 hover:bg-accent"
                        onClick={() => handleSelectRecentLocation(location)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate">{location.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            <div className="space-y-1.5">
              <p className="font-semibold text-sm text-green-900 dark:text-green-100">
                {selectedLocation.name || 'Selected Location'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">{selectedLocation.address}</p>
              <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                <span>
                  <span className="font-medium">Lat:</span> {selectedLocation.latitude.toFixed(6)}
                </span>
                <span>
                  <span className="font-medium">Lng:</span> {selectedLocation.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Error Message */}
      {apiError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {apiError}
            {apiError.includes('billing') && (
              <div className="mt-2">
                <a
                  href="https://console.cloud.google.com/project/_/billing/enable"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:no-underline font-medium"
                >
                  Enable Billing in Google Cloud Console →
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!mapsLoaded && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading Google Maps...</p>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            If loading persists, check browser console for API key errors. You may need to enable billing or add your domain to the API key restrictions in Google Cloud Console.
          </p>
        </div>
      )}
    </div>
  );
}
