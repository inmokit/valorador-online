import { useEffect, useState } from 'react';
import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';
import { getCadastralDataByCoordinates, type CadastralData } from '../../lib/api/catastro';
import { getStreetViewUrl } from '../../lib/api/streetView';

export default function PropertyDetails() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { propertyData, updatePropertyData, isLoadingCatastro, setLoadingCatastro } = useValuationStore();

    const [cadastralData, setCadastralData] = useState<CadastralData | null>(null);
    const [streetViewImageUrl, setStreetViewImageUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Fetch cadastral data and street view when component mounts
    useEffect(() => {
        const fetchData = async () => {
            setLoadingCatastro(true);
            setError(null);

            try {
                // Get Street View image URL
                if (propertyData.latitude && propertyData.longitude) {
                    const svUrl = getStreetViewUrl(propertyData.latitude, propertyData.longitude, {
                        width: 640,
                        height: 400,
                    });
                    setStreetViewImageUrl(svUrl);
                }

                // Check if we already have data from unit selector
                const { selectedUnitIndex } = useValuationStore.getState();

                if (selectedUnitIndex !== null && propertyData.cadastralReference) {
                    // Coming from unit selector - use data already in store
                    setCadastralData({
                        cadastralReference: propertyData.cadastralReference || '',
                        address: propertyData.address || '',
                        postalCode: propertyData.postalCode || '',
                        municipality: propertyData.city || '',
                        province: '',
                        propertyType: propertyData.propertyType || 'Residencial',
                        buildingType: propertyData.buildingType || 'Plurifamiliar',
                        surface: propertyData.surface || 100,
                        constructionYear: propertyData.constructionYear || 2000,
                    });
                } else if (propertyData.latitude && propertyData.longitude) {
                    // Not from unit selector - fetch cadastral data
                    const data = await getCadastralDataByCoordinates(
                        propertyData.latitude,
                        propertyData.longitude
                    );

                    if (data) {
                        setCadastralData(data);

                        // Update store with cadastral data
                        updatePropertyData({
                            cadastralReference: data.cadastralReference,
                            propertyType: data.propertyType,
                            buildingType: data.buildingType,
                            surface: data.surface,
                            constructionYear: data.constructionYear,
                            // Only update postal code if we don't already have one from Google Places
                            ...(propertyData.postalCode ? {} : { postalCode: data.postalCode }),
                        });
                    }
                } else {
                    // No coordinates, use mock data
                    const mockData: CadastralData = {
                        cadastralReference: '9872023VH5797S0001WX',
                        address: propertyData.address || 'Calle de Alcalá, 42',
                        postalCode: propertyData.postalCode || '28014',
                        municipality: propertyData.city || 'Madrid',
                        province: 'Madrid',
                        propertyType: 'Residencial',
                        buildingType: 'Plurifamiliar',
                        surface: 120,
                        constructionYear: 1995,
                    };
                    setCadastralData(mockData);
                    updatePropertyData({
                        cadastralReference: mockData.cadastralReference,
                        propertyType: mockData.propertyType,
                        buildingType: mockData.buildingType,
                        surface: mockData.surface,
                        constructionYear: mockData.constructionYear,
                    });
                }
            } catch (err) {
                console.error('Error fetching property data:', err);
                setError('Error al obtener datos del Catastro. Usando datos de ejemplo.');

                // Set mock data on error
                const mockData: CadastralData = {
                    cadastralReference: '9872023VH5797S0001WX',
                    address: propertyData.address || 'Dirección no disponible',
                    postalCode: propertyData.postalCode || '28001',
                    municipality: propertyData.city || 'Madrid',
                    province: 'Madrid',
                    propertyType: 'Residencial',
                    buildingType: 'Plurifamiliar',
                    surface: 100,
                    constructionYear: 2000,
                };
                setCadastralData(mockData);
            } finally {
                setLoadingCatastro(false);
            }
        };

        fetchData();
    }, [propertyData.latitude, propertyData.longitude]);

    // Default Street View placeholder if no URL
    const displayImageUrl = streetViewImageUrl ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDaz4vBqBbdz8_u--mrfXcs4SZknjuRduBN3qoZIuFkdu7MnReKs1404zd7BfIEumEwyHr1_A2jtg1c-6h_fjZNxrfY5l-HgLuNBmGw2PtUhkOVHTSqeZnf85NU2OAcTE1ucIiTGU_thdauARb3BdJh9Qt0jZYAxxuAutnCUGbxgDcQV8YWoq6KEL5qP1IZvJEjCGGhrAreK2gTPyQFKimHN5e94Vw0qam7AgrSzHhgY36IDjAvDmRqYJixVv2RiYeLqxzANOTMtyU';

    const handleCopyReference = () => {
        if (cadastralData?.cadastralReference) {
            navigator.clipboard.writeText(cadastralData.cadastralReference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleContinue = () => {
        // Ensure data is saved before navigating
        if (cadastralData) {
            updatePropertyData({
                surface: cadastralData.surface,
                constructionYear: cadastralData.constructionYear,
            });
        }
        navigateTo('verificar');
    };

    return (
        <div className="relative flex h-full min-dvh w-full flex-col overflow-x-hidden pb-32 bg-background-light dark:bg-background-dark">
            {/* TopAppBar */}
            <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md border-b border-transparent dark:border-white/5 transition-all duration-200">
                <button
                    onClick={() => goBack()}
                    className="group flex size-10 items-center justify-center rounded-lg text-[#111418] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h1 className="text-base font-bold leading-tight tracking-tight opacity-90">
                    Detalles de la Propiedad
                </h1>
                <div className="size-10"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col gap-6 p-4 pt-2">
                {/* Hero Image Section */}
                <div className="@container">
                    <div className="w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 relative group">
                        <div
                            className="relative w-full aspect-[16/10] bg-center bg-cover bg-no-repeat bg-[#e0e0e0] dark:bg-[#1A2633]"
                            style={{ backgroundImage: `url("${displayImageUrl}")` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                <div className="bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                                    Vista de calle
                                </div>
                                {propertyData.latitude && propertyData.longitude && (
                                    <div className="bg-black/40 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg border border-white/10">
                                        {propertyData.latitude.toFixed(4)}, {propertyData.longitude.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Headline */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-[26px] font-extrabold leading-[1.1] text-[#111418] dark:text-white tracking-tight">
                        {propertyData.address || cadastralData?.address || 'Calle de Alcalá, 42'}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[#637588] dark:text-[#94A3B8]">
                        <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                        <p className="text-base font-medium">
                            {propertyData.postalCode || cadastralData?.postalCode || '28014'}{' '}
                            {propertyData.city || cadastralData?.municipality || 'Madrid'}, España
                        </p>
                    </div>
                </div>

                {/* Error message if any */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
                    </div>
                )}

                {/* Loading state */}
                {isLoadingCatastro ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">
                            progress_activity
                        </span>
                        <p className="text-[#637588] dark:text-[#9dabb9]">
                            Consultando datos del Catastro...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Cadastral Reference Card */}
                        <div className="rounded-lg bg-surface-light dark:bg-surface-dark p-4 flex items-center justify-between border border-border-light dark:border-border-dark shadow-sm">
                            <div className="flex items-center gap-3.5 overflow-hidden">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                    <span className="material-symbols-outlined text-[24px]">badge</span>
                                </div>
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#637588] dark:text-[#8b9bb4]">
                                        Referencia Catastral
                                    </p>
                                    <p className="truncate text-[15px] font-bold text-[#111418] dark:text-white font-mono tracking-tight">
                                        {cadastralData?.cadastralReference || '—'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCopyReference}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#637588] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary transition-all"
                                title="Copiar referencia"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {copied ? 'check' : 'content_copy'}
                                </span>
                            </button>
                        </div>

                        {/* Data Grid */}
                        <div>
                            <h3 className="text-sm font-bold text-[#111418] dark:text-white mb-3 px-1">
                                Datos Catastrales
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                <div className="flex flex-col justify-start gap-1">
                                    <span className="text-xs font-medium uppercase tracking-wide text-[#637588] dark:text-[#94A3B8]">
                                        Uso
                                    </span>
                                    <p className="text-lg font-bold text-[#111418] dark:text-white truncate">
                                        {cadastralData?.propertyType || 'Residencial'}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-start gap-1">
                                    <span className="text-xs font-medium uppercase tracking-wide text-[#637588] dark:text-[#94A3B8]">
                                        Tipo
                                    </span>
                                    <p className="text-lg font-bold text-[#111418] dark:text-white truncate">
                                        {cadastralData?.buildingType || 'Plurifamiliar'}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-start gap-1">
                                    <span className="text-xs font-medium uppercase tracking-wide text-[#637588] dark:text-[#94A3B8]">
                                        Año
                                    </span>
                                    <p className="text-lg font-bold text-[#111418] dark:text-white">
                                        {cadastralData?.constructionYear || '—'}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-start gap-1">
                                    <span className="text-xs font-medium uppercase tracking-wide text-[#637588] dark:text-[#94A3B8]">
                                        Superficie
                                    </span>
                                    <p className="text-lg font-bold text-[#111418] dark:text-white">
                                        {cadastralData?.surface || '—'} m²
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <p className="text-xs text-center text-[#637588] dark:text-[#64748b] mt-2 px-6">
                    Información obtenida de la Sede Electrónica del Catastro. Verifique que los datos coinciden con su propiedad.
                </p>
            </main>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pt-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent z-30 pb-8">
                <button
                    onClick={handleContinue}
                    disabled={isLoadingCatastro}
                    className="w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-[17px] h-[56px] flex items-center justify-center shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoadingCatastro ? (
                        <>
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            Cargando...
                        </>
                    ) : (
                        'Continuar'
                    )}
                </button>
            </div>
        </div>
    );
}
