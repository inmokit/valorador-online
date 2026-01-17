import { useNavigate } from 'react-router-dom';
import { useValuationStore } from '../../store/valuationStore';

export default function UnitSelector() {
    const navigate = useNavigate();
    const { propertyData, buildingUnits, updatePropertyData, selectUnit } = useValuationStore();

    // Parse floor and door from inmueble data
    const parseFloorDoor = (inmueble: any): { planta: string; puerta: string } => {
        const direccion = inmueble.direccion || {};
        const planta = direccion.planta || direccion.piso || '';
        const puerta = direccion.puerta || direccion.letra || '';
        return { planta, puerta };
    };

    // Parse surface and year from datosEconomicos
    const parseDatosEconomicos = (inmueble: any): { superficie: number; uso: string; ano: number } => {
        const economicos = inmueble.datosEconomicos || {};
        const superficie = parseInt(String(economicos.superficieConstruida || economicos.superficie || '0'), 10);
        const uso = economicos.uso || 'Residencial';
        const ano = parseInt(String(economicos.añoConstruccion || economicos.anoConstruccion || '0'), 10);
        return { superficie, uso, ano };
    };

    // Get RC string from referenciaCatastral object
    const getRCString = (inmueble: any): string => {
        const rc = inmueble.referenciaCatastral;
        if (typeof rc === 'string') return rc;
        if (rc && typeof rc === 'object') {
            return rc.referenciaCatastral ||
                `${rc.pc1 || ''}${rc.pc2 || ''}${rc.car || ''}${rc.cc1 || ''}${rc.cc2 || ''}`;
        }
        return '';
    };

    // Format floor display
    const formatFloor = (planta: string): string => {
        if (!planta) return 'Bajo';
        const num = parseInt(planta, 10);
        if (isNaN(num) || num === 0) return 'Bajo';
        return `${num}º`;
    };

    // Get use icon
    const getUseIcon = (uso: string): string => {
        const useMap: Record<string, string> = {
            'Residencial': 'home',
            'Comercial': 'storefront',
            'Industrial': 'factory',
            'Oficinas': 'business',
            'Almacén-Estacionamiento': 'local_parking',
            'V': 'home',
            'C': 'storefront',
            'I': 'factory',
            'O': 'business',
            'B': 'local_parking',
        };
        return useMap[uso] || 'apartment';
    };

    // Handle unit selection
    const handleSelectUnit = (index: number) => {
        const inmueble = buildingUnits[index];
        const { superficie, uso, ano } = parseDatosEconomicos(inmueble);
        const rc = getRCString(inmueble);
        const direccion = inmueble.direccion || {};

        selectUnit(index);
        updatePropertyData({
            cadastralReference: rc,
            surface: superficie,
            constructionYear: ano,
            propertyType: uso,
            postalCode: direccion.codigoPostal || propertyData.postalCode,
        });

        navigate('/detalles');
    };

    // If no units to show, go back
    if (!buildingUnits || buildingUnits.length === 0) {
        return (
            <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark items-center justify-center p-6">
                <p className="text-[#637588] dark:text-[#9ca3af]">No se encontraron viviendas</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-6 py-3 bg-primary text-white rounded-lg"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto shadow-xl overflow-hidden bg-background-light dark:bg-background-dark">
            {/* TopAppBar */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between shrink-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                    Selecciona tu vivienda
                </h2>
            </div>

            {/* Address Header */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-2 text-[#637588] dark:text-[#9ca3af]">
                    <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                    <span className="text-sm font-medium">{propertyData.address}, {propertyData.city}</span>
                </div>
                <p className="text-xs text-[#637588] dark:text-[#9ca3af] mt-1 ml-7">
                    {buildingUnits.length} viviendas encontradas
                </p>
            </div>

            {/* Units List */}
            <main className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
                <div className="space-y-3 pt-4">
                    {buildingUnits.map((inmueble, index) => {
                        const { planta, puerta } = parseFloorDoor(inmueble);
                        const { superficie, uso, ano } = parseDatosEconomicos(inmueble);
                        const icon = getUseIcon(uso);

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelectUnit(index)}
                                className="w-full rounded-xl bg-surface-light dark:bg-surface-dark p-4 border border-border-light dark:border-border-dark shadow-sm hover:border-primary/50 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-[24px] text-primary">{icon}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-[#111418] dark:text-white">
                                            {formatFloor(planta)}{puerta ? ` - Puerta ${puerta}` : ''}
                                        </p>
                                        <p className="text-sm text-[#637588] dark:text-[#9ca3af] truncate">
                                            {superficie > 0 ? `${superficie} m²` : ''}
                                            {superficie > 0 && uso ? ' · ' : ''}
                                            {uso}
                                            {ano > 0 ? ` · ${ano}` : ''}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <span className="material-symbols-outlined text-[20px] text-[#637588] dark:text-[#9ca3af] group-hover:text-primary transition-colors">
                                        chevron_right
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
