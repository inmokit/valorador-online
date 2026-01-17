/**
 * Google Places API Client
 * 
 * Provides address autocomplete and place details functionality.
 * Uses the Google Places Autocomplete API restricted to Spain.
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface PlacePrediction {
    placeId: string;
    mainText: string;      // e.g., "Calle Gran Vía 12"
    secondaryText: string; // e.g., "Madrid, España"
    fullAddress: string;
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    streetNumber?: string;
    route?: string;        // Street name
    locality?: string;     // City
    postalCode?: string;
    province?: string;
    country?: string;
    latitude: number;
    longitude: number;
}

/**
 * Search for addresses using Google Places Autocomplete
 * Restricted to Spain for better results
 */
export async function searchAddresses(query: string): Promise<PlacePrediction[]> {
    if (!GOOGLE_API_KEY) {
        console.warn('Google Maps API key not configured. Using mock data.');
        return getMockPredictions(query);
    }

    if (!query || query.length < 3) {
        return [];
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        url.searchParams.set('input', query);
        url.searchParams.set('types', 'address');
        url.searchParams.set('components', 'country:es');
        url.searchParams.set('language', 'es');
        url.searchParams.set('key', GOOGLE_API_KEY);

        // Note: In production, this should go through a backend proxy
        // to avoid exposing the API key in client-side code
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.predictions) {
            return data.predictions.map((prediction: any) => ({
                placeId: prediction.place_id,
                mainText: prediction.structured_formatting?.main_text || prediction.description,
                secondaryText: prediction.structured_formatting?.secondary_text || '',
                fullAddress: prediction.description,
            }));
        }

        return [];
    } catch (error) {
        console.error('Error searching addresses:', error);
        return getMockPredictions(query);
    }
}

/**
 * Get detailed information about a place by its ID
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!GOOGLE_API_KEY) {
        console.warn('Google Maps API key not configured. Using mock data.');
        return getMockPlaceDetails(placeId);
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        url.searchParams.set('place_id', placeId);
        url.searchParams.set('fields', 'formatted_address,address_components,geometry');
        url.searchParams.set('language', 'es');
        url.searchParams.set('key', GOOGLE_API_KEY);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            const result = data.result;
            const components = result.address_components || [];

            const getComponent = (type: string) => {
                const comp = components.find((c: any) => c.types.includes(type));
                return comp?.long_name || '';
            };

            return {
                placeId,
                formattedAddress: result.formatted_address,
                streetNumber: getComponent('street_number'),
                route: getComponent('route'),
                locality: getComponent('locality'),
                postalCode: getComponent('postal_code'),
                province: getComponent('administrative_area_level_2'),
                country: getComponent('country'),
                latitude: result.geometry?.location?.lat || 0,
                longitude: result.geometry?.location?.lng || 0,
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting place details:', error);
        return getMockPlaceDetails(placeId);
    }
}

/**
 * Get coordinates from browser geolocation
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
                maximumAge: 300000, // 5 minutes cache
            }
        );
    });
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceDetails | null> {
    if (!GOOGLE_API_KEY) {
        console.warn('Google Maps API key not configured. Using mock data.');
        return getMockPlaceDetails('current_location');
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('latlng', `${lat},${lng}`);
        url.searchParams.set('language', 'es');
        url.searchParams.set('key', GOOGLE_API_KEY);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.results?.[0]) {
            const result = data.results[0];
            const components = result.address_components || [];

            const getComponent = (type: string) => {
                const comp = components.find((c: any) => c.types.includes(type));
                return comp?.long_name || '';
            };

            return {
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
            };
        }

        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}

// ============ Mock Data for Development ============

function getMockPredictions(query: string): PlacePrediction[] {
    const allMocks: PlacePrediction[] = [
        {
            placeId: 'mock_1',
            mainText: 'Calle Gran Vía 12',
            secondaryText: 'Madrid, España',
            fullAddress: 'Calle Gran Vía 12, 28013 Madrid, España',
        },
        {
            placeId: 'mock_2',
            mainText: 'Calle Gran Vía 122',
            secondaryText: 'Barcelona, España',
            fullAddress: 'Calle Gran Vía 122, 08015 Barcelona, España',
        },
        {
            placeId: 'mock_3',
            mainText: 'Calle de Alcalá 42',
            secondaryText: 'Madrid, España',
            fullAddress: 'Calle de Alcalá 42, 28014 Madrid, España',
        },
        {
            placeId: 'mock_4',
            mainText: 'Paseo de la Castellana 89',
            secondaryText: 'Madrid, España',
            fullAddress: 'Paseo de la Castellana 89, 28046 Madrid, España',
        },
        {
            placeId: 'mock_5',
            mainText: 'Avenida Diagonal 530',
            secondaryText: 'Barcelona, España',
            fullAddress: 'Avenida Diagonal 530, 08006 Barcelona, España',
        },
    ];

    const lowerQuery = query.toLowerCase();
    return allMocks.filter(
        (p) =>
            p.mainText.toLowerCase().includes(lowerQuery) ||
            p.secondaryText.toLowerCase().includes(lowerQuery)
    );
}

function getMockPlaceDetails(placeId: string): PlaceDetails {
    const mockDetails: Record<string, PlaceDetails> = {
        mock_1: {
            placeId: 'mock_1',
            formattedAddress: 'Calle Gran Vía 12, 28013 Madrid, España',
            streetNumber: '12',
            route: 'Calle Gran Vía',
            locality: 'Madrid',
            postalCode: '28013',
            province: 'Madrid',
            country: 'España',
            latitude: 40.4203,
            longitude: -3.7059,
        },
        mock_2: {
            placeId: 'mock_2',
            formattedAddress: 'Calle Gran Vía 122, 08015 Barcelona, España',
            streetNumber: '122',
            route: 'Calle Gran Vía',
            locality: 'Barcelona',
            postalCode: '08015',
            province: 'Barcelona',
            country: 'España',
            latitude: 41.3762,
            longitude: 2.1484,
        },
        mock_3: {
            placeId: 'mock_3',
            formattedAddress: 'Calle de Alcalá 42, 28014 Madrid, España',
            streetNumber: '42',
            route: 'Calle de Alcalá',
            locality: 'Madrid',
            postalCode: '28014',
            province: 'Madrid',
            country: 'España',
            latitude: 40.4178,
            longitude: -3.6951,
        },
        current_location: {
            placeId: 'current_location',
            formattedAddress: 'Tu ubicación actual, Madrid, España',
            route: 'Tu ubicación',
            locality: 'Madrid',
            postalCode: '28001',
            province: 'Madrid',
            country: 'España',
            latitude: 40.4168,
            longitude: -3.7038,
        },
    };

    return mockDetails[placeId] || mockDetails.mock_1;
}
