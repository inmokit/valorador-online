import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';

export default function VerifyData() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { propertyData, updatePropertyData } = useValuationStore();

    const surface = propertyData.surface || 120;
    const year = propertyData.constructionYear || 1995;

    const handleSurfaceChange = (delta: number) => {
        updatePropertyData({ surface: Math.max(1, surface + delta) });
    };

    const handleYearChange = (delta: number) => {
        updatePropertyData({ constructionYear: Math.max(1800, Math.min(2026, year + delta)) });
    };

    // Generate real map URL using coordinates if available
    const getMapUrl = () => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (propertyData.latitude && propertyData.longitude && apiKey) {
            const lat = propertyData.latitude;
            const lng = propertyData.longitude;
            return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x200&maptype=roadmap&markers=color:orange%7C${lat},${lng}&key=${apiKey}`;
        }

        // Fallback to placeholder
        return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxN2-_riMLw2CLUAs_pQ7-PWUNRmUSGLCYGjS0P8OrnJApwn-Tk600VmXZQvMTT8GS6cGXTfc-dhMupPhQLCNZTA5TDEok798YplTlcFxJ3SSB0ATxqo0vjj2_NpcMw3MQDnsff6gwpNLaMoSjfFD7Qiojr66Zg2-jq6LQXxPI08AbsfExn3MGAToqI0ud8bEO9lusB9zGP2KDRpEs54lRtzFW6g1XPXSenGOzWmAz8fgpfHwf_DzTvGQ-4Uwj2ZUVHM3mpe5zY-M';
    };

    const mapUrl = getMapUrl();

    return (
        <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto shadow-xl overflow-hidden bg-background-light dark:bg-background-dark">
            {/* TopAppBar */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between shrink-0 z-10">
                <button
                    onClick={() => goBack()}
                    className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                    Detalles de la Propiedad
                </h2>
            </div>

            {/* PageIndicators */}
            <div className="flex w-full flex-row items-center justify-center gap-2 py-3 shrink-0 bg-background-light dark:bg-background-dark">
                <div className="h-1.5 w-1.5 rounded-full bg-[#3b4754]/40 dark:bg-[#3b4754]"></div>
                <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-[#3b4754]/40 dark:bg-[#3b4754]"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-[#3b4754]/40 dark:bg-[#3b4754]"></div>
            </div>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                <div className="px-5 pt-4 pb-2">
                    <h3 className="text-[#111418] dark:text-white tracking-tight text-3xl font-bold leading-tight text-left">
                        ¿Son correctos estos datos?
                    </h3>
                </div>

                {/* Map Context Card */}
                <div className="px-5 pb-6 pt-4">
                    <div className="relative overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <div
                            className="w-full bg-center bg-no-repeat h-32 bg-cover object-cover"
                            style={{ backgroundImage: `url("${mapUrl}")` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                            <span className="text-sm font-semibold truncate">
                                {propertyData.address || 'Dirección'}, {propertyData.city || 'Ciudad'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Inputs Section - Same style as RoomsConfig */}
                <div className="px-5 space-y-4">
                    {/* Surface Input */}
                    <div className="rounded-xl bg-surface-light dark:bg-surface-dark p-4 border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-center gap-3">
                            {/* Left side: Icon */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <span className="material-symbols-outlined text-[24px] text-primary">square_foot</span>
                            </div>

                            {/* Center: Label */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-base font-bold text-[#111418] dark:text-white truncate">Superficie</span>
                                <span className="text-sm text-[#637588] dark:text-[#9ca3af] truncate">m² construidos</span>
                            </div>

                            {/* Right side: Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleSurfaceChange(-5)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white hover:bg-[#e0e2e4] dark:hover:bg-[#323b46] active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                </button>
                                <div className="flex items-center justify-center w-16 text-center">
                                    <span className="text-xl font-bold text-[#111418] dark:text-white">{surface}</span>
                                </div>
                                <button
                                    onClick={() => handleSurfaceChange(5)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-orange-600 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Year Input */}
                    <div className="rounded-xl bg-surface-light dark:bg-surface-dark p-4 border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-center gap-3">
                            {/* Left side: Icon */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <span className="material-symbols-outlined text-[24px] text-primary">calendar_month</span>
                            </div>

                            {/* Center: Label */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-base font-bold text-[#111418] dark:text-white truncate">Año</span>
                                <span className="text-sm text-[#637588] dark:text-[#9ca3af] truncate">Construcción</span>
                            </div>

                            {/* Right side: Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleYearChange(-1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white hover:bg-[#e0e2e4] dark:hover:bg-[#323b46] active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                </button>
                                <div className="flex items-center justify-center w-16 text-center">
                                    <span className="text-xl font-bold text-[#111418] dark:text-white">{year}</span>
                                </div>
                                <button
                                    onClick={() => handleYearChange(1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-orange-600 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Helper text */}
                <div className="px-5 pt-4">
                    <p className="text-xs text-center text-[#637588] dark:text-[#9ca3af]">
                        Ajusta los valores si no coinciden con los datos de tu vivienda
                    </p>
                </div>

                <div className="h-8"></div>
            </main>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent pt-8">
                <button
                    onClick={() => navigateTo('habitaciones')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-4 px-6 text-base font-bold text-white shadow-lg shadow-primary/30 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                    <span>Continuar</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
