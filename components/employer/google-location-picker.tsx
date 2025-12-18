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
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export function GoogleLocationPicker({
  onLocationSelect,
  initialAddress = '',
  className = '',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      initializeServices();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapsLoaded(true);
      initializeServices();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializeServices = () => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(query.length > 2);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (!autocompleteService.current) {
      if (window.google?.maps?.places) {
        initializeServices();
      } else {
        return;
      }
    }

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: ['om'] }, // Restrict to Oman
        },
        (predictions: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSelectPlace = (placeId: string, description: string) => {
    setLoading(true);
    setSearchQuery(description);
    setShowSuggestions(false);

    if (!placesService.current) {
      if (window.google?.maps?.places) {
        initializeServices();
      } else {
        setLoading(false);
        return;
      }
    }

    const request = {
      placeId: placeId,
      fields: ['geometry', 'name', 'formatted_address', 'address_components'],
    };

    placesService.current.getDetails(request, (place: any, status: string) => {
      setLoading(false);

      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const location = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || description,
          name: place.name || description.split(',')[0],
        };

        setSelectedLocation(location);
        onLocationSelect(location);
      } else {
        // Fallback: try geocoding the description
        geocodeAddress(description);
      }
    });
  };

  const geocodeAddress = (address: string) => {
    if (!window.google?.maps?.Geocoder) {
      setLoading(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results: any[], status: string) => {
      setLoading(false);

      if (status === 'OK' && results && results[0]) {
        const location = {
          latitude: results[0].geometry.location.lat(),
          longitude: results[0].geometry.location.lng(),
          address: results[0].formatted_address || address,
          name: address.split(',')[0],
        };

        setSelectedLocation(location);
        onLocationSelect(location);
      } else {
        console.error('Geocoding failed:', status);
      }
    });
  };

  const clearSelection = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location-search">Search Location</Label>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="location-search"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search for location (e.g., Grand Mall Muscat, City Center Muscat)"
            className="pl-10 pr-10"
            disabled={!mapsLoaded}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {selectedLocation && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSelectPlace(suggestion.place_id, suggestion.description)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{suggestion.structured_formatting.main_text}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
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

      {!mapsLoaded && (
        <p className="text-xs text-muted-foreground">
          Loading Google Maps...
        </p>
      )}
    </div>
  );
}

