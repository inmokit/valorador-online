

interface ValoradorHeaderProps {
    title: string;
    currentStep: number;
    totalSteps: number;
    onBack: () => void;
}

/**
 * Unified header component for all valorador screens.
 * Includes back button, centered title, and step indicator with segmented progress bars.
 */
export default function ValoradorHeader({ title, currentStep, totalSteps, onBack }: ValoradorHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-background-light dark:bg-background-dark">
            {/* Top Bar with Back Button and Title */}
            <div className="flex items-center justify-between px-4 py-3 pt-4">
                <button
                    onClick={onBack}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#111418] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-tight text-center flex-1 pr-10">
                    {title}
                </h2>
            </div>

            {/* Step Indicator - Segmented Progress Bars */}
            <div className="flex flex-col items-center gap-2 px-4 pb-3">
                <div className="flex w-full flex-row items-center justify-center gap-2">
                    {Array.from({ length: totalSteps }, (_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${index < currentStep
                                ? 'bg-primary'
                                : 'bg-[#d1d5db] dark:bg-[#3b4754]'
                                }`}
                        />
                    ))}
                </div>
                <p className="text-xs font-medium text-[#637588] dark:text-[#94A3B8]">
                    Paso {currentStep} de {totalSteps}
                </p>
            </div>
        </div>
    );
}
