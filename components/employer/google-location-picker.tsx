'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
  }) => void;
  initialAddress?: string;
  className?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': React.DetailedHTMLProps<any, HTMLElement>;
      'gmpx-place-picker': React.DetailedHTMLProps<any, HTMLElement>;
    }
  }
}

export function GoogleLocationPicker({
  onLocationSelect,
  initialAddress = '',
  className = '',
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
  const placePickerRef = useRef<any>(null);
  const apiLoaderRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
      // Wait a bit for elements to be ready
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
      // Wait for custom elements to be defined
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
      // Retry after a short delay
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
        onLocationSelect(location);
      } catch (error: any) {
        console.error('Error processing place:', error);
        setApiError('Failed to process selected location. Please try again.');
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

  const clearSelection = () => {
    if (placePickerRef.current) {
      placePickerRef.current.value = '';
    }
    setSelectedLocation(null);
    setApiError(null);
  };

  if (!apiKey) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor="location-search">Search Location</Label>
        <Alert variant="destructive">
          <AlertDescription>
            Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location-search">Search Location</Label>
      
      {/* API Loader - must be present for components to work */}
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
              // @ts-ignore - CSS custom properties for web component theming (inline styles required)
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
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{selectedLocation.name || 'Selected Location'}</p>
              <p className="text-xs text-muted-foreground">{selectedLocation.address}</p>
              <p className="text-xs text-muted-foreground">
                Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Error Message */}
      {apiError && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-xs">
            {apiError}
            {apiError.includes('billing') && (
              <div className="mt-2">
                <a
                  href="https://console.cloud.google.com/project/_/billing/enable"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:no-underline"
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
          <p className="text-xs text-muted-foreground">
            Loading Google Maps...
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            If loading persists, check browser console for API key errors. You may need to enable billing or add your domain to the API key restrictions in Google Cloud Console.
          </p>
        </div>
      )}
    </div>
  );
}
