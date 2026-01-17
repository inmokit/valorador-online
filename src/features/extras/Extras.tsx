import { useNavigate } from 'react-router-dom';
import { useValuationStore } from '../../store/valuationStore';

const EXTRAS_LIST = [
    { id: 'terraza', label: 'Terraza' },
    { id: 'amueblado', label: 'Amueblado' },
    { id: 'trastero', label: 'Trastero' },
    { id: 'piscina', label: 'Piscina' },
    { id: 'parking', label: 'Parking' },
    { id: 'jardin', label: 'Jardín' },
    { id: 'cerca_ciudad', label: 'Cerca ciudad' },
    { id: 'com_cerrada', label: 'Com. cerrada' },
    { id: 'buenas_vistas', label: 'Buenas vistas' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'deportes', label: 'Deportes' },
    { id: 'portero', label: 'Portero' },
    { id: 'aire_ac', label: 'Aire A/C' },
    { id: 'calefaccion', label: 'Calefacción' },
    { id: 'domotica', label: 'Domótica' },
];

interface ExtraButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

function ExtraButton({ label, isSelected, onClick }: ExtraButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`relative group flex flex-col items-start justify-center gap-3 rounded-lg border p-4 text-left shadow-sm transition-all active:scale-[0.98] ${isSelected
                    ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2634] hover:border-primary/50'
                }`}
        >
            {isSelected && (
                <div className="absolute top-3 right-3 text-primary">
                    <span className="material-symbols-outlined text-[20px] filled">check_circle</span>
                </div>
            )}
            <span className="text-slate-900 dark:text-white text-sm font-semibold leading-normal">
                {label}
            </span>
        </button>
    );
}

export default function Extras() {
    const navigate = useNavigate();
    const { propertyData, updatePropertyData } = useValuationStore();

    const selected = propertyData.extras || [];

    const toggleExtra = (label: string) => {
        if (selected.includes(label)) {
            updatePropertyData({ extras: selected.filter((i) => i !== label) });
        } else {
            updatePropertyData({ extras: [...selected, label] });
        }
    };

    return (
        <div className="relative flex h-full min-dvh w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center px-4 py-3 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark/95 backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
                    Valoración
                </h2>
            </div>

            {/* Progress */}
            <div className="flex w-full flex-col items-center justify-center gap-2 py-2 px-4">
                <div className="flex w-full flex-row items-center justify-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-primary"></div>
                    <div className="h-1.5 flex-1 rounded-full bg-primary"></div>
                    <div className="h-1.5 flex-1 rounded-full bg-primary"></div>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Paso 3 de 5</p>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col px-4 pb-24 overflow-y-auto no-scrollbar">
                <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] md:text-[32px] font-bold leading-tight text-left pt-4 pb-2">
                    ¿Qué extras tiene la vivienda?
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-6">
                    Selecciona las características para afinar el precio estimado.
                </p>

                <div className="grid grid-cols-2 gap-3 pb-4">
                    {EXTRAS_LIST.map((extra) => (
                        <ExtraButton
                            key={extra.id}
                            label={extra.label}
                            isSelected={selected.includes(extra.label)}
                            onClick={() => toggleExtra(extra.label)}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-center py-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                    <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <span className="material-symbols-outlined">add_circle</span>
                        <span className="text-sm font-semibold">¿Falta alguna característica?</span>
                    </button>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] max-w-md mx-auto z-20">
                <button
                    onClick={() => navigate('/acabados')}
                    className="w-full flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
                >
                    <span className="truncate">Continuar</span>
                </button>
            </div>
        </div>
    );
}
