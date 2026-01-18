import { useEffect } from 'react';
import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';
import ValoradorHeader from '../../components/ValoradorHeader';

// Calculate smart room/bath defaults based on surface area
function getSmartDefaults(surface: number): { bedrooms: number; bathrooms: number } {
    if (surface < 40) {
        return { bedrooms: 1, bathrooms: 1 };
    } else if (surface < 60) {
        return { bedrooms: 2, bathrooms: 1 };
    } else if (surface < 80) {
        return { bedrooms: 2, bathrooms: 1 };
    } else if (surface < 100) {
        return { bedrooms: 3, bathrooms: 1 };
    } else if (surface < 120) {
        return { bedrooms: 3, bathrooms: 2 };
    } else if (surface < 150) {
        return { bedrooms: 4, bathrooms: 2 };
    } else {
        return { bedrooms: 4, bathrooms: 3 };
    }
}

export default function RoomsConfig() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { propertyData, updatePropertyData } = useValuationStore();

    // Set smart defaults based on surface area when component mounts
    useEffect(() => {
        const surface = propertyData.surface || 100;
        const defaults = getSmartDefaults(surface);

        // Only update if current values are the initial defaults (3 rooms, 2 baths)
        if (propertyData.bedrooms === 3 && propertyData.bathrooms === 2) {
            updatePropertyData({
                bedrooms: defaults.bedrooms,
                bathrooms: defaults.bathrooms,
            });
        }
    }, [propertyData.surface]);

    const rooms = propertyData.bedrooms || 3;
    const baths = propertyData.bathrooms || 2;

    return (
        <div className="relative flex h-full min-dvh w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Unified Header */}
            <ValoradorHeader
                title="Valoración"
                currentStep={3}
                totalSteps={5}
                onBack={goBack}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col px-4 pt-6 pb-24">
                <h2 className="text-gray-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight text-left pb-2">
                    ¿Cuántas habitaciones y baños tiene?
                </h2>

                <div className="flex flex-col gap-4 pt-8">
                    {/* Bedrooms */}
                    <div className="flex items-center p-4 bg-white dark:bg-[#1a2634] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 justify-between gap-4">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                                <span className="material-symbols-outlined text-[24px]">bed</span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight truncate">
                                    Habitaciones
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">Dormitorios</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => updatePropertyData({ bedrooms: Math.max(0, rooms - 1) })}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b4754] transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">remove</span>
                            </button>
                            <input
                                className="w-10 p-0 text-center bg-transparent text-gray-900 dark:text-white text-xl font-bold focus:outline-0 focus:ring-0 focus:border-none border-none"
                                readOnly
                                type="number"
                                value={rooms}
                            />
                            <button
                                onClick={() => updatePropertyData({ bedrooms: rooms + 1 })}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>
                    </div>

                    {/* Bathrooms */}
                    <div className="flex items-center p-4 bg-white dark:bg-[#1a2634] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 justify-between gap-4">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                                <span className="material-symbols-outlined text-[24px]">bathtub</span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight truncate">
                                    Baños
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                                    Completos o aseos
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => updatePropertyData({ bathrooms: Math.max(0, baths - 1) })}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b4754] transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">remove</span>
                            </button>
                            <input
                                className="w-10 p-0 text-center bg-transparent text-gray-900 dark:text-white text-xl font-bold focus:outline-0 focus:ring-0 focus:border-none border-none"
                                readOnly
                                type="number"
                                value={baths}
                            />
                            <button
                                onClick={() => updatePropertyData({ bathrooms: baths + 1 })}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 z-10">
                <button
                    onClick={() => navigateTo('extras')}
                    className="w-full flex items-center justify-center bg-primary hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg shadow-primary/25 text-base active:scale-[0.98]"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}
