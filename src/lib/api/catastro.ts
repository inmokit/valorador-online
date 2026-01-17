/**
 * CatastroAPI Client
 * 
 * Client for catastro-api.es - provides access to Spanish cadastral data.
 * Includes property reference, surface, construction year, and property type.
 */

const CATASTRO_API_KEY = import.meta.env.VITE_CATASTRO_API_KEY;
const CATASTRO_API_BASE = 'https://api.catastro-api.es';

export interface CadastralData {
    cadastralReference: string;  // 20-character unique ID
    address: string;
    postalCode: string;
    municipality: string;
    province: string;
    propertyType: string;        // Residencial, Comercial, Industrial, etc.
    buildingType: string;        // Plurifamiliar, Unifamiliar, etc.
    surface: number;             // Built surface in m²
    constructionYear: number;
    floors?: number;
    latitude?: number;
    longitude?: number;
}

export interface CadastralProperty {
    rc: string;                  // Cadastral reference
    address: string;
    use: string;
    surface: number;
    year: number;
}

/**
 * Get cadastral data by coordinates (lat/lng)
 */
export async function getCadastralDataByCoordinates(
    latitude: number,
    longitude: number
): Promise<CadastralData | null> {
    if (!CATASTRO_API_KEY) {
        console.warn('CatastroAPI key not configured. Using mock data.');
        return getMockCadastralData(latitude, longitude);
    }

    try {
        // First, get the cadastral reference from coordinates
        // Note: x = longitude, y = latitude according to CatastroAPI docs
        const rcResponse = await fetch(
            `${CATASTRO_API_BASE}/api/coordenadas/rc-por-coordenadas?x=${longitude}&y=${latitude}`,
            {
                headers: {
                    'x-api-key': CATASTRO_API_KEY,
                },
            }
        );

        if (!rcResponse.ok) {
            throw new Error(`Catastro API error: ${rcResponse.status}`);
        }

        const rcData = await rcResponse.json();
        console.log('CatastroAPI response:', rcData);

        // The response format is: { referencias: [{ rc: "..." }], numeroReferencias: 1 }
        let cadastralRef: string | null = null;

        if (rcData.referencias && rcData.referencias.length > 0) {
            const ref = rcData.referencias[0];
            cadastralRef = ref.rc || ref.referenciaCatastral || ref.refCatastral || null;
            console.log('Found reference object:', ref);
        } else if (rcData.coordenadas && rcData.coordenadas.length > 0) {
            const coords = rcData.coordenadas[0];
            cadastralRef = coords.referenciaCatastral || coords.rc || null;
        } else {
            // Fallback to other possible formats
            cadastralRef = rcData.rc || rcData.referenciaCatastral || rcData.refCatastral || null;
        }

        if (!cadastralRef) {
            console.warn('No cadastral reference found for coordinates', rcData);
            return getMockCadastralData(latitude, longitude);
        }

        console.log('Found cadastral reference:', cadastralRef);

        // Then get full property details by reference
        return getCadastralDataByReference(cadastralRef);
    } catch (error) {
        console.error('Error fetching cadastral data by coordinates:', error);
        return getMockCadastralData(latitude, longitude);
    }
}

/**
 * Get cadastral data by cadastral reference (RC)
 */
export async function getCadastralDataByReference(
    cadastralReference: string
): Promise<CadastralData | null> {
    if (!CATASTRO_API_KEY) {
        console.warn('CatastroAPI key not configured. Using mock data.');
        return getMockCadastralDataByRC(cadastralReference);
    }

    try {
        console.log('Fetching property details for RC:', cadastralReference);
        const response = await fetch(
            `${CATASTRO_API_BASE}/api/callejero/inmueble-rc?rc=${cadastralReference}`,
            {
                headers: {
                    'x-api-key': CATASTRO_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Catastro API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Property details response:', data);

        return parseCadastralResponse(data);
    } catch (error) {
        console.error('Error fetching cadastral data by reference:', error);
        return getMockCadastralDataByRC(cadastralReference);
    }
}

/**
 * Get all building units (inmuebles) for a cadastral reference
 * Returns raw inmuebles array for unit selector
 */
export async function getBuildingUnits(
    cadastralReference: string
): Promise<{ inmuebles: any[]; numeroInmuebles: number }> {
    if (!CATASTRO_API_KEY) {
        console.warn('CatastroAPI key not configured.');
        return { inmuebles: [], numeroInmuebles: 0 };
    }

    try {
        const response = await fetch(
            `${CATASTRO_API_BASE}/api/callejero/inmueble-rc?rc=${cadastralReference}`,
            {
                headers: {
                    'x-api-key': CATASTRO_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Catastro API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            inmuebles: data.inmuebles || [],
            numeroInmuebles: data.numeroInmuebles || 0,
        };
    } catch (error) {
        console.error('Error fetching building units:', error);
        return { inmuebles: [], numeroInmuebles: 0 };
    }
}

/**
 * Search for properties by address
 */
export async function searchCadastralByAddress(
    province: string,
    municipality: string,
    street: string,
    number: string
): Promise<CadastralProperty[]> {
    if (!CATASTRO_API_KEY) {
        console.warn('CatastroAPI key not configured. Using mock data.');
        return getMockSearchResults();
    }

    try {
        const url = new URL(`${CATASTRO_API_BASE}/callejero/inmuebles`);
        url.searchParams.set('provincia', province);
        url.searchParams.set('municipio', municipality);
        url.searchParams.set('via', street);
        url.searchParams.set('numero', number);

        const response = await fetch(url.toString(), {
            headers: {
                'x-api-key': CATASTRO_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Catastro API error: ${response.status}`);
        }

        const data = await response.json();

        return (data.inmuebles || []).map((item: any) => ({
            rc: item.rc,
            address: item.direccion,
            use: item.uso,
            surface: item.superficie,
            year: item.anoConstruccion,
        }));
    } catch (error) {
        console.error('Error searching cadastral by address:', error);
        return getMockSearchResults();
    }
}

/**
 * Parse the API response into our CadastralData structure
 */
function parseCadastralResponse(data: any): CadastralData | null {
    if (!data) return null;

    // The API returns { inmuebles: [...], numeroInmuebles: X }
    // We need to extract property data from the inmuebles array
    let propertyData = data;

    if (data.inmuebles && data.inmuebles.length > 0) {
        // Take the first property (usually the main/largest one or first floor)
        // Could also find one based on floor number if needed
        propertyData = data.inmuebles[0];
        console.log('Using property from inmuebles:', propertyData);
    }

    // Map property use to Spanish labels
    const useMapping: Record<string, string> = {
        'V': 'Residencial',
        'I': 'Industrial',
        'O': 'Oficinas',
        'C': 'Comercial',
        'K': 'Deportivo',
        'T': 'Espectáculos',
        'G': 'Ocio y Hostelería',
        'Y': 'Sanidad y Beneficencia',
        'E': 'Educación',
        'R': 'Religioso',
        'M': 'Obras de urbanización',
        'P': 'Edificio singular',
        'B': 'Almacén-Estacionamiento',
        'A': 'Almacén agrario',
        'J': 'Industrial agrario',
        'Z': 'Agrario',
    };

    // Try different possible field names from the API
    // Handle the case where referenciaCatastral can be an object like {referenciaCatastral, pc1, pc2, car, cc1, cc2}
    let rc = '';
    const rcValue = propertyData.rc || propertyData.referenciaCatastral || data.rc;
    if (typeof rcValue === 'string') {
        rc = rcValue;
    } else if (rcValue && typeof rcValue === 'object') {
        // Build the RC from components if it's an object
        rc = rcValue.referenciaCatastral ||
            `${rcValue.pc1 || ''}${rcValue.pc2 || ''}${rcValue.car || ''}${rcValue.cc1 || ''}${rcValue.cc2 || ''}`;
    }

    const address = typeof propertyData.direccion === 'string' ? propertyData.direccion :
        (propertyData.direccion?.valor || propertyData.domicilio || '');

    // Data can be in datosEconomicos object
    const economicos = propertyData.datosEconomicos || {};
    // Data can be in direccion object  
    const direccion = (typeof propertyData.direccion === 'object') ? propertyData.direccion : {};

    const postalCode = direccion.codigoPostal || direccion.cp || propertyData.codigoPostal || '';
    const municipality = direccion.nombreMunicipio || direccion.municipio || propertyData.municipio || '';
    const province = direccion.nombreProvincia || direccion.provincia || propertyData.provincia || '';

    // Use from datosEconomicos first, then propertyData
    const uso = economicos.uso || propertyData.uso || propertyData.usoPrincipal || 'V';

    // Surface from datosEconomicos (note: "superficieConstruida" field)
    const surfaceStr = economicos.superficieConstruida || economicos.superficie ||
        propertyData.superficie || propertyData.superficieConstruida || '100';
    const surface = parseInt(String(surfaceStr).replace(',', '.'), 10) || 100;

    // Year from datosEconomicos (note: field is "añoConstruccion" with ñ)  
    const yearStr = economicos.añoConstruccion || economicos.anoConstruccion ||
        propertyData.anoConstruccion || propertyData.ano || '2000';
    const year = parseInt(String(yearStr), 10) || 2000;

    const buildingType = (typeof propertyData.tipoInmueble === 'string' ? propertyData.tipoInmueble : '') ||
        (data.numeroInmuebles > 1 ? 'Plurifamiliar' : 'Unifamiliar');

    console.log('Parsed cadastral data:', { rc, address, postalCode, municipality, surface, year, uso });

    return {
        cadastralReference: rc,
        address,
        postalCode,
        municipality,
        province,
        propertyType: useMapping[uso] || uso || 'Residencial',
        buildingType,
        surface,
        constructionYear: year,
        floors: propertyData.plantas ? parseInt(propertyData.plantas, 10) : undefined,
        latitude: propertyData.lat ? parseFloat(propertyData.lat) : undefined,
        longitude: propertyData.lng ? parseFloat(propertyData.lng) : undefined,
    };
}

// ============ Mock Data for Development ============

function getMockCadastralData(lat: number, lng: number): CadastralData {
    // Generate a pseudo-random but consistent cadastral reference based on coordinates
    const coordHash = Math.abs(Math.floor((lat * 10000 + lng * 10000) % 10000000));
    const rc = `${coordHash.toString().padStart(7, '0')}VH5797S0001WX`;

    // Determine city based on approximate coordinates
    let city = 'Madrid';
    let province = 'Madrid';
    let postalCode = '28001';

    if (lat > 41.3 && lat < 41.5 && lng > 2.0 && lng < 2.3) {
        city = 'Barcelona';
        province = 'Barcelona';
        postalCode = '08001';
    } else if (lat > 37.3 && lat < 37.5 && lng > -6.0 && lng < -5.8) {
        city = 'Sevilla';
        province = 'Sevilla';
        postalCode = '41001';
    } else if (lat > 39.4 && lat < 39.5 && lng > -0.4 && lng < -0.3) {
        city = 'Valencia';
        province = 'Valencia';
        postalCode = '46001';
    }

    return {
        cadastralReference: rc,
        address: 'Calle de Alcalá, 42',
        postalCode,
        municipality: city,
        province,
        propertyType: 'Residencial',
        buildingType: 'Plurifamiliar',
        surface: 95 + Math.floor(Math.random() * 60), // 95-155 m²
        constructionYear: 1980 + Math.floor(Math.random() * 40), // 1980-2020
        latitude: lat,
        longitude: lng,
    };
}

function getMockCadastralDataByRC(rc: string): CadastralData {
    return {
        cadastralReference: rc,
        address: 'Calle de Alcalá, 42',
        postalCode: '28014',
        municipality: 'Madrid',
        province: 'Madrid',
        propertyType: 'Residencial',
        buildingType: 'Plurifamiliar',
        surface: 120,
        constructionYear: 1995,
    };
}

function getMockSearchResults(): CadastralProperty[] {
    return [
        {
            rc: '9872023VH5797S0001WX',
            address: 'Calle de Alcalá, 42, Piso 1º',
            use: 'Residencial',
            surface: 120,
            year: 1995,
        },
        {
            rc: '9872023VH5797S0002AB',
            address: 'Calle de Alcalá, 42, Piso 2º',
            use: 'Residencial',
            surface: 115,
            year: 1995,
        },
    ];
}
