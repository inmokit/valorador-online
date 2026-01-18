import { useState, useEffect, useCallback } from 'react';
import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';
import {
    useGooglePlacesAutocomplete,
    getCurrentLocation,
    reverseGeocode,
    type PlacePrediction,
} from '../../lib/hooks/useGooglePlaces';
import { getCadastralDataByCoordinates, getBuildingUnits } from '../../lib/api/catastro';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export default function AddressSearch() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { updatePropertyData } = useValuationStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<PlacePrediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Google Places hook
    const { isLoaded, isLoading: isGoogleLoading, error: googleError, searchAddresses, getPlaceDetails } = useGooglePlacesAutocomplete();

    // Debounce search term by 300ms
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Search addresses when debounced term changes
    useEffect(() => {
        if (!isLoaded || debouncedSearchTerm.length < 3) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const predictions = await searchAddresses(debouncedSearchTerm);
                setResults(predictions);
            } catch (error) {
                console.error('Error searching addresses:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchResults();
    }, [debouncedSearchTerm, isLoaded, searchAddresses]);

    // Handle selecting a search result
    const handleResultClick = useCallback(async (prediction: PlacePrediction) => {
        setIsSearching(true);
        try {
            const details = await getPlaceDetails(prediction.placeId);
            const { updatePropertyData, setBuildingUnits } = useValuationStore.getState();

            if (details) {
                updatePropertyData({
                    address: prediction.mainText,
                    city: details.locality || prediction.secondaryText.split(',')[0].trim(),
                    postalCode: details.postalCode || '',
                    latitude: details.latitude,
                    longitude: details.longitude,
                });

                // Check if it's a plurifamiliar building
                if (details.latitude && details.longitude) {
                    try {
                        const cadastralData = await getCadastralDataByCoordinates(details.latitude, details.longitude);
                        if (cadastralData?.cadastralReference) {
                            const buildingRC = cadastralData.cadastralReference.substring(0, 14);
                            const { inmuebles, numeroInmuebles } = await getBuildingUnits(buildingRC);

                            if (numeroInmuebles > 1) {
                                // Multiple units - save and redirect to selector first
                                setBuildingUnits(inmuebles);
                                updatePropertyData({
                                    cadastralReference: cadastralData.cadastralReference,
                                });
                                navigateTo('seleccionar-vivienda');
                                return;
                            }
                        }
                    } catch (error) {
                        console.error('Error checking building units:', error);
                    }
                }
            } else {
                // Fallback if details fail
                updatePropertyData({
                    address: prediction.mainText,
                    city: prediction.secondaryText.split(',')[0].trim(),
                });
            }

            navigateTo('detalles');
        } catch (error) {
            console.error('Error getting place details:', error);
            // Navigate anyway with basic data
            updatePropertyData({
                address: prediction.mainText,
                city: prediction.secondaryText.split(',')[0].trim(),
            });
            navigateTo('detalles');
        } finally {
            setIsSearching(false);
        }
    }, [updatePropertyData, navigateTo, getPlaceDetails]);

    // Handle using current location
    const handleUseLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        try {
            // Get current coordinates
            const coords = await getCurrentLocation();

            // Reverse geocode to get address
            const details = await reverseGeocode(coords.latitude, coords.longitude);

            if (details) {
                updatePropertyData({
                    address: details.route
                        ? `${details.route}${details.streetNumber ? ` ${details.streetNumber}` : ''}`
                        : details.formattedAddress,
                    city: details.locality || '',
                    postalCode: details.postalCode || '',
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                navigateTo('detalles');
            } else {
                // If reverse geocode fails, still proceed with coordinates
                updatePropertyData({
                    address: 'Mi ubicación actual',
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                navigateTo('detalles');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Permiso de ubicación denegado. Activa la ubicación en tu navegador.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('No se pudo obtener tu ubicación. Intenta de nuevo.');
                        break;
                    case error.TIMEOUT:
                        setLocationError('Tiempo de espera agotado. Intenta de nuevo.');
                        break;
                    default:
                        setLocationError('Error al obtener ubicación.');
                }
            } else {
                setLocationError('Error al obtener ubicación. Verifica que el GPS está activado.');
            }
        } finally {
            setIsLoadingLocation(false);
        }
    }, [updatePropertyData, navigateTo]);

    // Show loading state while Google Maps is loading
    const showLoadingIndicator = isSearching || (isGoogleLoading && searchTerm.length >= 3);

    return (
        <div className="relative flex h-full min-dvh w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-3 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <button
                    onClick={() => goBack()}
                    className="text-[#111418] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                    Valoración de Vivienda
                </h2>
                <div className="size-10"></div>
            </div>

            {/* Headline */}
            <div className="px-4 pt-4 pb-2">
                <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-extrabold leading-tight text-center">
                    ¿Cuál es la dirección del inmueble?
                </h1>
            </div>

            {/* Google Maps loading/error status */}
            {googleError && (
                <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        {googleError}
                    </p>
                </div>
            )}

            {/* Search Bar */}
            <div className="px-4 py-4 sticky top-[60px] z-10 bg-background-light dark:bg-background-dark">
                <label className="flex flex-col w-full">
                    <div className="flex w-full items-center rounded-lg h-14 bg-white dark:bg-[#283039] shadow-sm ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-2 focus-within:ring-primary transition-all">
                        <div className="flex items-center justify-center pl-4 pr-3 text-[#637588] dark:text-[#9dabb9]">
                            {showLoadingIndicator ? (
                                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined">search</span>
                            )}
                        </div>
                        <input
                            autoFocus
                            className="flex w-full flex-1 bg-transparent text-[#111418] dark:text-white placeholder:text-[#637588] dark:placeholder:text-[#9dabb9] text-base font-medium border-none focus:ring-0 focus:outline-none h-full p-0 caret-primary"
                            placeholder="Ej: Calle Gran Vía 12, Madrid..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <div className="flex items-center justify-center pr-4">
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="flex items-center justify-center text-[#637588] dark:text-[#9dabb9] hover:text-[#111418] dark:hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                </label>
            </div>

            {/* List Content */}
            <div className="flex-1 flex flex-col px-4 gap-2">
                {/* Use Current Location */}
                <div
                    onClick={!isLoadingLocation ? handleUseLocation : undefined}
                    className={`group flex items-center gap-4 p-3 rounded-lg transition-colors ${isLoadingLocation
                        ? 'opacity-70 cursor-wait'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                        }`}
                >
                    <div className="flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary shrink-0 size-10">
                        {isLoadingLocation ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[20px]">my_location</span>
                        )}
                    </div>
                    <div className="flex flex-col flex-1">
                        <p className="text-primary text-base font-bold leading-normal">
                            {isLoadingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                        </p>
                        {locationError && (
                            <p className="text-red-500 text-sm mt-1">{locationError}</p>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#e5e7eb] dark:bg-[#283039] mx-3 my-1"></div>

                {/* API Status indicator */}
                {isGoogleLoading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-[#637588] dark:text-[#9dabb9]">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        <p className="text-sm">Cargando servicio de búsqueda...</p>
                    </div>
                )}

                {/* Search Results */}
                {results.map((item) => (
                    <div
                        key={item.placeId}
                        onClick={() => handleResultClick(item)}
                        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-center rounded-full bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white shrink-0 size-10 group-hover:bg-white dark:group-hover:bg-[#323b46] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                            <p className="text-[#111418] dark:text-white text-base font-medium leading-normal truncate">
                                {item.mainText}
                            </p>
                            <p className="text-[#637588] dark:text-[#9dabb9] text-sm font-normal leading-normal truncate">
                                {item.secondaryText}
                            </p>
                        </div>
                        <div className="shrink-0 text-[#637588] dark:text-[#9dabb9]">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                ))}

                {/* Empty state when searching */}
                {isLoaded && searchTerm.length >= 3 && results.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-[48px] text-[#637588] dark:text-[#9dabb9] mb-3">
                            search_off
                        </span>
                        <p className="text-[#637588] dark:text-[#9dabb9] text-base">
                            No se encontraron resultados
                        </p>
                        <p className="text-[#637588] dark:text-[#9dabb9] text-sm mt-1">
                            Prueba con otra dirección
                        </p>
                    </div>
                )}

                {/* Hint when not searching */}
                {searchTerm.length < 3 && searchTerm.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 text-[#637588] dark:text-[#9dabb9]">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <p className="text-sm">Escribe al menos 3 caracteres para buscar</p>
                    </div>
                )}
            </div>

            {/* Keyboard Spacer */}
            <div className="h-[100px] w-full bg-background-light dark:bg-background-dark pointer-events-none"></div>
        </div>
    );
}
