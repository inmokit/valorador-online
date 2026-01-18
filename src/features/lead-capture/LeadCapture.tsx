import { useState } from 'react';
import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';
import ValoradorHeader from '../../components/ValoradorHeader';

export default function LeadCapture() {
    const { navigateTo, goBack } = useValoradorNavigation();
    const { updateLeadData } = useValuationStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async () => {
        const newErrors: { name?: string; email?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
        }
        if (!email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Introduce un email válido';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);

            // Save lead data to store
            updateLeadData({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
            });

            // Navigate to result
            navigateTo('resultado');
        }
    };

    return (
        <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl">
            {/* Header */}
            <ValoradorHeader
                title="Valoración"
                currentStep={5}
                totalSteps={6}
                onBack={goBack}
            />

            {/* Content */}
            <main className="flex-1 flex flex-col px-5 pb-24 pt-4">
                <h1 className="text-2xl md:text-[28px] font-bold leading-tight text-left pb-3 text-[#111418] dark:text-white">
                    ¿Dónde te enviamos el informe?
                </h1>
                <p className="text-[#637588] dark:text-[#9ca3af] text-base font-normal leading-normal pb-6">
                    Introduce tus datos para recibir la valoración completa de tu vivienda.
                </p>

                <div className="flex flex-col gap-4">
                    {/* Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111418] dark:text-white">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre"
                            className={`w-full px-4 py-3 rounded-lg border ${errors.name
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2634]'
                                } text-[#111418] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                        />
                        {errors.name && (
                            <span className="text-sm text-red-500">{errors.name}</span>
                        )}
                    </div>

                    {/* Email Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111418] dark:text-white">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className={`w-full px-4 py-3 rounded-lg border ${errors.email
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2634]'
                                } text-[#111418] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                        />
                        {errors.email && (
                            <span className="text-sm text-red-500">{errors.email}</span>
                        )}
                    </div>

                    {/* Phone Input (optional) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#111418] dark:text-white">
                            Teléfono <span className="text-gray-400">(opcional)</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="612 345 678"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2634] text-[#111418] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Privacy note */}
                <p className="text-xs text-center text-[#637588] dark:text-[#64748b] mt-6 px-2">
                    Tus datos serán tratados de forma confidencial y solo se usarán para enviarte el informe de valoración.
                </p>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-20 max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-lg bg-primary px-5 py-4 text-base font-bold leading-normal text-white shadow-lg transition-transform active:scale-[0.98] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            Procesando...
                        </>
                    ) : (
                        <>
                            Ver mi valoración
                            <span className="material-symbols-outlined ml-2">arrow_forward</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
