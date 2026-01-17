/**
 * Google Street View Static API Client
 * 
 * Generates URLs for Street View static images.
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface StreetViewOptions {
    width?: number;
    height?: number;
    heading?: number;  // 0-360, direction camera faces
    pitch?: number;    // -90 to 90, up/down angle
    fov?: number;      // 10-120, field of view (zoom)
}

/**
 * Get a Street View image URL for given coordinates
 */
export function getStreetViewUrl(
    latitude: number,
    longitude: number,
    options: StreetViewOptions = {}
): string {
    const {
        width = 640,
        height = 400,
        heading,
        pitch = 0,
        fov = 90,
    } = options;

    if (!GOOGLE_API_KEY) {
        // Return a placeholder image if no API key
        return getPlaceholderImage(width, height);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/streetview');
    url.searchParams.set('size', `${width}x${height}`);
    url.searchParams.set('location', `${latitude},${longitude}`);
    url.searchParams.set('pitch', pitch.toString());
    url.searchParams.set('fov', fov.toString());
    url.searchParams.set('key', GOOGLE_API_KEY);

    if (heading !== undefined) {
        url.searchParams.set('heading', heading.toString());
    }

    return url.toString();
}

/**
 * Get a Street View image URL for a given address
 */
export function getStreetViewUrlByAddress(
    address: string,
    options: StreetViewOptions = {}
): string {
    const {
        width = 640,
        height = 400,
        heading,
        pitch = 0,
        fov = 90,
    } = options;

    if (!GOOGLE_API_KEY) {
        return getPlaceholderImage(width, height);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/streetview');
    url.searchParams.set('size', `${width}x${height}`);
    url.searchParams.set('location', address);
    url.searchParams.set('pitch', pitch.toString());
    url.searchParams.set('fov', fov.toString());
    url.searchParams.set('key', GOOGLE_API_KEY);

    if (heading !== undefined) {
        url.searchParams.set('heading', heading.toString());
    }

    return url.toString();
}

/**
 * Check if Street View is available at given coordinates
 * Returns metadata if available, null if not
 */
export async function checkStreetViewAvailability(
    latitude: number,
    longitude: number
): Promise<{ available: boolean; date?: string } | null> {
    if (!GOOGLE_API_KEY) {
        return { available: true }; // Assume available for mock
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata');
        url.searchParams.set('location', `${latitude},${longitude}`);
        url.searchParams.set('key', GOOGLE_API_KEY);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK') {
            return {
                available: true,
                date: data.date,
            };
        }

        return { available: false };
    } catch (error) {
        console.error('Error checking Street View availability:', error);
        return null;
    }
}

/**
 * Generate a placeholder image URL when API key is not available
 */
function getPlaceholderImage(_width: number, _height: number): string {
    // Using a sample building image from Google's AIDA public images
    // In production, you could use your own placeholder
    return `https://lh3.googleusercontent.com/aida-public/AB6AXuDaz4vBqBbdz8_u--mrfXcs4SZknjuRduBN3qoZIuFkdu7MnReKs1404zd7BfIEumEwyHr1_A2jtg1c-6h_fjZNxrfY5l-HgLuNBmGw2PtUhkOVHTSqeZnf85NU2OAcTE1ucIiTGU_thdauARb3BdJh9Qt0jZYAxxuAutnCUGbxgDcQV8YWoq6KEL5qP1IZvJEjCGGhrAreK2gTPyQFKimHN5e94Vw0qam7AgrSzHhgY36IDjAvDmRqYJixVv2RiYeLqxzANOTMtyU`;
}

/**
 * Get thumbnail URL for preview (smaller size)
 */
export function getStreetViewThumbnail(
    latitude: number,
    longitude: number
): string {
    return getStreetViewUrl(latitude, longitude, {
        width: 320,
        height: 200,
    });
}
