import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore, type PropertyData } from '../../store/valuationStore';
import ValoradorHeader from '../../components/ValoradorHeader';

interface FinishOptionProps {
    icon: string;
    title: string;
    subtitle: string;
    colorClass: string;
    value: PropertyData['finishQuality'];
    selected: PropertyData['finishQuality'];
    onChange: (value: PropertyData['finishQuality']) => void;
}

function FinishOption({ icon, title, subtitle, colorClass, value, selected, onChange }: FinishOptionProps) {
    const isSelected = selected === value;

    return (
        <label
            className={`relative flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-all shadow-sm ${isSelected
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a2632] hover:border-primary/50'
                }`}
        >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex grow flex-col">
                <span className="text-[#111418] dark:text-white text-base font-bold leading-snug">{title}</span>
                <span className="text-[#637588] dark:text-[#9ca3af] text-sm leading-normal">{subtitle}</span>
            </div>
            <input
                className="h-6 w-6 border-2 border-gray-300 dark:border-gray-500 bg-transparent text-primary focus:ring-primary checked:border-primary checked:bg-primary transition-all accent-primary"
                name="finish_quality"
                type="radio"
                checked={isSelected}
                onChange={() => onChange(value)}
            />
        </label>
    );
}

export default function Finishes() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { propertyData, updatePropertyData } = useValuationStore();

    const selected = propertyData.finishQuality || 'good';

    const handleChange = (value: PropertyData['finishQuality']) => {
        updatePropertyData({ finishQuality: value });
    };

    return (
        <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl">
            <ValoradorHeader
                title="Valoración"
                currentStep={5}
                totalSteps={6}
                onBack={goBack}
            />

            <main className="flex-1 flex flex-col px-5 pb-24">
                <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-left pb-3 pt-2 text-[#111418] dark:text-white">
                    ¿Cómo son los acabados de la vivienda?
                </h1>
                <p className="text-[#637588] dark:text-[#9ca3af] text-base font-normal leading-normal pb-6">
                    Selecciona la opción que mejor describa el estado actual de la propiedad para ajustar la valoración.
                </p>

                <div className="flex flex-col gap-3">
                    <FinishOption
                        icon="diamond"
                        title="Acabados de diseño"
                        subtitle="Materiales de lujo, reformado"
                        colorClass="bg-blue-50 dark:bg-blue-900/20 text-primary"
                        value="design"
                        selected={selected}
                        onChange={handleChange}
                    />
                    <FinishOption
                        icon="verified"
                        title="Buenos acabados"
                        subtitle="Calidad y buen mantenimiento"
                        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        value="good"
                        selected={selected}
                        onChange={handleChange}
                    />
                    <FinishOption
                        icon="thumb_up"
                        title="Buen estado"
                        subtitle="Habitable y funcional"
                        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                        value="acceptable"
                        selected={selected}
                        onChange={handleChange}
                    />
                    <FinishOption
                        icon="construction"
                        title="Pequeña reforma"
                        subtitle="Necesita pintura o arreglos"
                        colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                        value="small_reform"
                        selected={selected}
                        onChange={handleChange}
                    />
                    <FinishOption
                        icon="home_repair_service"
                        title="Reforma completa"
                        subtitle="Baños, cocina e instalaciones"
                        colorClass="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        value="full_reform"
                        selected={selected}
                        onChange={handleChange}
                    />
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-20 max-w-md mx-auto">
                <button
                    onClick={() => navigateTo('datos')}
                    className="flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3.5 text-base font-bold leading-normal text-white shadow-lg transition-transform active:scale-[0.98] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}
