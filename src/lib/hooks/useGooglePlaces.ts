/**
 * Google Places Autocomplete Hook
 * 
 * Uses the native Google Maps JavaScript API for Places Autocomplete.
 * This approach works correctly in the browser without CORS issues.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from 'react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track if Google Maps is being loaded to prevent duplicates
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

export interface PlacePrediction {
    placeId: string;
    mainText: string;
    secondaryText: string;
    fullAddress: string;
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    streetNumber?: string;
    route?: string;
    locality?: string;
    postalCode?: string;
    province?: string;
    country?: string;
    latitude: number;
    longitude: number;
}

/**
 * Load Google Maps script once
 */
function loadGoogleMaps(): Promise<void> {
    // Already loaded
    if (window.google?.maps?.places) {
        return Promise.resolve();
    }

    // Already loading
    if (googleMapsLoadPromise) {
        return googleMapsLoadPromise;
    }

    if (isGoogleMapsLoading) {
        // Wait for existing load
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    isGoogleMapsLoading = true;

    googleMapsLoadPromise = new Promise((resolve, reject) => {
        const callbackName = '__googleMapsCallback_' + Date.now();

        (window as unknown as Record<string, () => void>)[callbackName] = () => {
            isGoogleMapsLoading = false;
            delete (window as unknown as Record<string, () => void>)[callbackName];
            resolve();
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            isGoogleMapsLoading = false;
            googleMapsLoadPromise = null;
            reject(new Error('Failed to load Google Maps'));
        };
        document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
}

/**
 * Hook for Google Places Autocomplete
 */
export function useGooglePlacesAutocomplete() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    // Load Google Maps API
    useEffect(() => {
        if (!GOOGLE_API_KEY) {
            setError('Google Maps API key not configured');
            return;
        }

        // Already initialized
        if (autocompleteServiceRef.current) {
            setIsLoaded(true);
            return;
        }

        setIsLoading(true);

        loadGoogleMaps()
            .then(() => {
                initializeServices();
            })
            .catch((err: Error) => {
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    const initializeServices = () => {
        try {
            if (!window.google?.maps?.places) {
                throw new Error('Google Maps Places not available');
            }

            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

            // Create a dummy element for PlacesService (required by the API)
            const dummyDiv = document.createElement('div');
            placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

            // Create session token for billing optimization
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

            setIsLoaded(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Failed to initialize Places service:', err);
            setError('Failed to initialize Places service');
            setIsLoading(false);
        }
    };

    /**
     * Search for address predictions
     */
    const searchAddresses = useCallback(async (query: string): Promise<PlacePrediction[]> => {
        if (!autocompleteServiceRef.current || !query || query.length < 3) {
            return [];
        }

        return new Promise((resolve) => {
            autocompleteServiceRef.current!.getPlacePredictions(
                {
                    input: query,
                    componentRestrictions: { country: 'es' },
                    types: ['address'],
                    sessionToken: sessionTokenRef.current!,
                },
                (
                    predictions: google.maps.places.AutocompletePrediction[] | null,
                    status: google.maps.places.PlacesServiceStatus
                ) => {
                    if (status === window.google!.maps.places.PlacesServiceStatus.OK && predictions) {
                        const results: PlacePrediction[] = predictions.map((p: google.maps.places.AutocompletePrediction) => ({
                            placeId: p.place_id,
                            mainText: p.structured_formatting?.main_text || p.description,
                            secondaryText: p.structured_formatting?.secondary_text || '',
                            fullAddress: p.description,
                        }));
                        resolve(results);
                    } else {
                        resolve([]);
                    }
                }
            );
        });
    }, []);

    /**
     * Get detailed place information
     */
    const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
        if (!placesServiceRef.current) {
            return null;
        }

        return new Promise((resolve) => {
            placesServiceRef.current!.getDetails(
                {
                    placeId,
                    fields: ['formatted_address', 'address_components', 'geometry'],
                    sessionToken: sessionTokenRef.current!,
                },
                (
                    place: google.maps.places.PlaceResult | null,
                    status: google.maps.places.PlacesServiceStatus
                ) => {
                    // Create new session token after place details request (as per Google's billing)
                    if (window.google?.maps?.places) {
                        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
                    }

                    if (status === window.google!.maps.places.PlacesServiceStatus.OK && place) {
                        const components = place.address_components || [];

                        const getComponent = (type: string) => {
                            const comp = components.find((c: google.maps.GeocoderAddressComponent) => c.types.includes(type));
                            return comp?.long_name || '';
                        };

                        resolve({
                            placeId,
                            formattedAddress: place.formatted_address || '',
                            streetNumber: getComponent('street_number'),
                            route: getComponent('route'),
                            locality: getComponent('locality'),
                            postalCode: getComponent('postal_code'),
                            province: getComponent('administrative_area_level_2'),
                            country: getComponent('country'),
                            latitude: place.geometry?.location?.lat() || 0,
                            longitude: place.geometry?.location?.lng() || 0,
                        });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }, []);

    return {
        isLoaded,
        isLoading,
        error,
        searchAddresses,
        getPlaceDetails,
    };
}

/**
 * Get current location using browser geolocation
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    });
}

/**
 * Reverse geocode coordinates to get address using Google Geocoding
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<PlaceDetails | null> {
    // Wait for Google Maps if not loaded
    if (!window.google?.maps) {
        try {
            await loadGoogleMaps();
        } catch {
            return null;
        }
    }

    return new Promise((resolve) => {
        const geocoder = new window.google!.maps.Geocoder();

        geocoder.geocode(
            { location: { lat, lng } },
            (
                results: google.maps.GeocoderResult[] | null,
                status: google.maps.GeocoderStatus
            ) => {
                if (status === 'OK' && results && results[0]) {
                    const result = results[0];
                    const components = result.address_components || [];

                    const getComponent = (type: string) => {
                        const comp = components.find((c: google.maps.GeocoderAddressComponent) => c.types.includes(type));
                        return comp?.long_name || '';
                    };

                    resolve({
                        placeId: result.place_id,
                        formattedAddress: result.formatted_address,
                        streetNumber: getComponent('street_number'),
                        route: getComponent('route'),
                        locality: getComponent('locality'),
                        postalCode: getComponent('postal_code'),
                        province: getComponent('administrative_area_level_2'),
                        country: getComponent('country'),
                        latitude: lat,
                        longitude: lng,
                    });
                } else {
                    resolve(null);
                }
            }
        );
    });
}
