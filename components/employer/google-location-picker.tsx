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
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      initializeServices();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
      return;
    }

    const script = document.createElement('script');
    // Use loading=async for better performance (as recommended by Google)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapsLoaded(true);
      initializeServices();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script. Check your API key and referrer restrictions.');
      setMapsLoaded(false);
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
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If query is too short, clear suggestions but keep dropdown open if focused
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the API call to avoid too many requests while typing
    debounceTimer.current = setTimeout(() => {
      if (!autocompleteService.current) {
        if (window.google?.maps?.places) {
          initializeServices();
        } else {
          return;
        }
      }

      // Only search if query is at least 2 characters
      if (query.length >= 2) {
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
                setShowSuggestions(true); // Automatically show suggestions when available
              } else {
                setSuggestions([]);
                setShowSuggestions(false);
              }
            }
          );
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 300); // 300ms debounce delay
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleSelectPlace = (placeId: string, description: string) => {
    setLoading(true);
    setSearchQuery(description);
    setShowSuggestions(false);
    setIsFocused(false);

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
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location-search">Search Location</Label>
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="location-search"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              // Show suggestions if they exist and query is long enough
              if (suggestions.length > 0 && searchQuery.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on suggestion to register
              setTimeout(() => {
                setIsFocused(false);
              }, 200);
            }}
            placeholder="Search for location (e.g., Grand Mall Muscat, City Center Muscat)"
            className="pl-10 pr-10"
            disabled={!mapsLoaded}
            autoComplete="off"
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
        {showSuggestions && suggestions.length > 0 && searchQuery.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors"
                onMouseDown={(e) => {
                  // Prevent input blur when clicking suggestion
                  e.preventDefault();
                  handleSelectPlace(suggestion.place_id, suggestion.description);
                }}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Show message when typing but no results */}
        {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && isFocused && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              No locations found. Try a different search term.
            </p>
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
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Loading Google Maps...
          </p>
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              If loading persists, check browser console for API key errors. You may need to add your domain to the API key restrictions in Google Cloud Console.
            </p>
          ) : (
            <p className="text-xs text-red-600 dark:text-red-400">
              ⚠️ Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

