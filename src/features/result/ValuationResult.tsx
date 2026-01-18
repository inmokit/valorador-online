import { useState, useEffect, useRef } from 'react';
import { useValoradorNavigation } from '../../lib/hooks/useValoradorNavigation';
import { useValuationStore } from '../../store/valuationStore';
import { useClient } from '../../context/ClientContext';
import { calculateValuation, formatPrice, getZoneInfo } from '../../lib/api/valuation';
import { saveValuation, sendValuationEmail } from '../../lib/api/valuations';
import { getStreetViewUrl } from '../../lib/api/streetView';
import type { ValuationResult as ValuationResultType } from '../../store/valuationStore';

export default function ValuationResult() {
    const { goBack } = useValoradorNavigation();
    const { client } = useClient();
    const {
        propertyData,
        valuationResult,
        setValuationResult,
        isLoadingValuation,
        setLoadingValuation,
        leadData,
        setSavedValuationToken
    } = useValuationStore();

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const hasSaved = useRef(false);

    // Calculate valuation and save to database when component mounts
    useEffect(() => {
        const processValuation = async () => {
            if (!valuationResult) {
                setLoadingValuation(true);

                // Calculate valuation
                const result = calculateValuation(propertyData);
                setValuationResult(result);

                // Save to database if we have lead data and haven't saved yet
                if (leadData && client?.id && !hasSaved.current) {
                    hasSaved.current = true;

                    const streetViewUrl = propertyData.latitude && propertyData.longitude
                        ? getStreetViewUrl(propertyData.latitude, propertyData.longitude)
                        : undefined;

                    const saved = await saveValuation({
                        clientId: client.id,
                        leadName: leadData.name,
                        leadEmail: leadData.email,
                        leadPhone: leadData.phone,
                        address: propertyData.address || '',
                        city: propertyData.city,
                        postalCode: propertyData.postalCode,
                        latitude: propertyData.latitude,
                        longitude: propertyData.longitude,
                        surface: propertyData.surface,
                        constructionYear: propertyData.constructionYear,
                        bedrooms: propertyData.bedrooms,
                        bathrooms: propertyData.bathrooms,
                        extras: propertyData.extras,
                        finishQuality: propertyData.finishQuality,
                        propertyType: propertyData.propertyType,
                        buildingType: propertyData.buildingType,
                        cadastralReference: propertyData.cadastralReference,
                        estimatedValueMin: result.conservative,
                        estimatedValueMax: result.optimistic,
                        estimatedValueRecommended: result.estimated,
                        pricePerM2: result.pricePerSqm,
                        streetViewUrl,
                    });

                    if (saved) {
                        setSavedValuationToken(saved.reportToken);
                        console.log('Valuation saved with token:', saved.reportToken);

                        // Send email notification
                        const reportUrl = `https://valorador-online.vercel.app/v/${saved.reportToken}`;
                        sendValuationEmail({
                            leadName: leadData.name,
                            leadEmail: leadData.email,
                            address: propertyData.address || '',
                            city: propertyData.city,
                            postalCode: propertyData.postalCode,
                            estimatedValue: result.estimated,
                            estimatedValueMin: result.conservative,
                            estimatedValueMax: result.optimistic,
                            pricePerM2: result.pricePerSqm,
                            surface: propertyData.surface,
                            bedrooms: propertyData.bedrooms,
                            bathrooms: propertyData.bathrooms,
                            constructionYear: propertyData.constructionYear,
                            finishQuality: propertyData.finishQuality,
                            extras: propertyData.extras,
                            cadastralReference: propertyData.cadastralReference,
                            streetViewUrl,
                            reportUrl,
                            agentName: client.agent_name,
                            agencyName: client.agency_name,
                            agentPhotoUrl: client.agent_photo_url,
                            agencyLogoUrl: client.agency_logo_url,
                        }).then((sent) => {
                            if (sent) {
                                console.log('Valuation email sent successfully');
                            }
                        });
                    }
                }

                setLoadingValuation(false);
            }
        };

        processValuation();
    }, [propertyData, valuationResult, setValuationResult, setLoadingValuation, leadData, client, setSavedValuationToken]);

    // Pre-fill email from lead data
    useEffect(() => {
        if (leadData?.email) setEmail(leadData.email);
        if (leadData?.phone) setPhone(leadData.phone || '');
    }, [leadData]);

    // Get zone info if available
    const zoneInfo = propertyData.postalCode ? getZoneInfo(propertyData.postalCode) : null;

    // Use calculated values or defaults
    const result: ValuationResultType = valuationResult || {
        conservative: 0,
        estimated: 0,
        optimistic: 0,
        pricePerSqm: 0,
        confidence: 50,
    };

    const handleSendReport = async () => {
        if (!email || !acceptedTerms) return;

        setIsSending(true);
        // TODO: Call API to send email with valuation report
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSending(false);
        setSent(true);
    };

    // Calculate confidence level label
    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 80) return { label: 'Alta', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
        if (confidence >= 60) return { label: 'Media', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' };
        return { label: 'Baja', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    };

    const confidenceInfo = getConfidenceLabel(result.confidence);

    // Loading state
    if (isLoadingValuation) {
        return (
            <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark items-center justify-center">
                <div className="flex flex-col items-center gap-6 p-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[48px] text-primary animate-pulse">calculate</span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
                            Calculando valoración...
                        </h2>
                        <p className="text-[#637588] dark:text-[#9ca3af] text-sm">
                            Analizando datos del mercado inmobiliario
                        </p>
                    </div>
                    <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full min-dvh w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-background-light dark:bg-background-dark sticky top-0 z-10">
                <button
                    onClick={() => goBack()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-[#111418] dark:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-tight text-center flex-1 pr-10">
                    Resultado
                </h2>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto no-scrollbar">
                {/* Success Icon */}
                <div className="flex justify-center pt-6 pb-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px] text-primary filled">home</span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-[28px] font-bold leading-tight text-center pb-2 text-[#111418] dark:text-white">
                    Valoración de tu vivienda
                </h1>
                <p className="text-[#637588] dark:text-[#9ca3af] text-sm text-center pb-6">
                    {propertyData.address || 'Tu vivienda'}{propertyData.city ? `, ${propertyData.city}` : ''}
                </p>

                {/* Main Value Card */}
                <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 mb-6 shadow-lg shadow-primary/25">
                    <p className="text-white/80 text-sm font-medium mb-2 text-center">Valor estimado</p>
                    <p className="text-white text-4xl md:text-5xl font-extrabold text-center mb-2">
                        {formatPrice(result.estimated)}
                    </p>
                    <p className="text-white/70 text-sm text-center">
                        {formatPrice(result.pricePerSqm)}/m² · {propertyData.surface || 100} m²
                    </p>

                    {/* Confidence badge */}
                    <div className="flex justify-center mt-4">
                        <div className={`${confidenceInfo.bg} px-3 py-1 rounded-full flex items-center gap-1.5`}>
                            <span className={`material-symbols-outlined text-[16px] ${confidenceInfo.color}`}>
                                {result.confidence >= 70 ? 'verified' : 'info'}
                            </span>
                            <span className={`text-xs font-semibold ${confidenceInfo.color}`}>
                                Confianza {confidenceInfo.label} ({result.confidence}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Three Scenarios */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* Conservative */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark text-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-[18px] text-red-500">trending_down</span>
                        </div>
                        <p className="text-xs text-[#637588] dark:text-[#9ca3af] mb-1">Conservador</p>
                        <p className="text-base font-bold text-[#111418] dark:text-white">
                            {formatPrice(result.conservative)}
                        </p>
                    </div>

                    {/* Estimated */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border-2 border-primary text-center relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            RECOMENDADO
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2 mt-1">
                            <span className="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                        </div>
                        <p className="text-xs text-[#637588] dark:text-[#9ca3af] mb-1">Estimado</p>
                        <p className="text-base font-bold text-[#111418] dark:text-white">
                            {formatPrice(result.estimated)}
                        </p>
                    </div>

                    {/* Optimistic */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark text-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-[18px] text-blue-500">trending_up</span>
                        </div>
                        <p className="text-xs text-[#637588] dark:text-[#9ca3af] mb-1">Optimista</p>
                        <p className="text-base font-bold text-[#111418] dark:text-white">
                            {formatPrice(result.optimistic)}
                        </p>
                    </div>
                </div>

                {/* Zone Info (if available) */}
                {zoneInfo && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-500">location_on</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {zoneInfo.zone}
                            </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Precio medio de la zona: {formatPrice(zoneInfo.pricePerSqm)}/m²
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-[10px] uppercase font-semibold">
                                {zoneInfo.tier}
                            </span>
                        </p>
                    </div>
                )}

                {/* Property Summary - Collapsible */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark mb-6">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <h3 className="text-sm font-bold text-[#111418] dark:text-white">
                            Resumen de la propiedad
                        </h3>
                        <span className={`material-symbols-outlined text-[#637588] transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {showDetails && (
                        <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">square_foot</span>
                                    <span className="text-[#637588] dark:text-[#9ca3af]">{propertyData.surface || 100} m²</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                                    <span className="text-[#637588] dark:text-[#9ca3af]">Año {propertyData.constructionYear || 2000}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">bed</span>
                                    <span className="text-[#637588] dark:text-[#9ca3af]">{propertyData.bedrooms || 3} habitaciones</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">bathtub</span>
                                    <span className="text-[#637588] dark:text-[#9ca3af]">{propertyData.bathrooms || 2} baños</span>
                                </div>
                            </div>

                            {/* Extras */}
                            {propertyData.extras && propertyData.extras.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                    <p className="text-xs font-medium text-[#637588] dark:text-[#9ca3af] mb-2">Extras incluidos:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {propertyData.extras.map((extra, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                                            >
                                                {extra}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Finish quality */}
                            {propertyData.finishQuality && (
                                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                    <p className="text-xs font-medium text-[#637588] dark:text-[#9ca3af] mb-1">Estado de acabados:</p>
                                    <p className="text-sm text-[#111418] dark:text-white capitalize">
                                        {propertyData.finishQuality.replace('_', ' ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border-light dark:bg-border-dark my-4"></div>

                {/* Email Form */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#111418] dark:text-white">
                        Recibe tu informe completo
                    </h3>
                    <p className="text-sm text-[#637588] dark:text-[#9ca3af]">
                        Te enviaremos un informe detallado con comparables de la zona y recomendaciones.
                    </p>

                    {!sent ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-[#111418]/60 dark:text-white/60 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    className="w-full h-12 px-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-[#111418] dark:text-white placeholder:text-[#637588] focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#111418]/60 dark:text-white/60 mb-2">
                                    Teléfono (opcional)
                                </label>
                                <input
                                    type="tel"
                                    className="w-full h-12 px-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-[#111418] dark:text-white placeholder:text-[#637588] focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="+34 600 000 000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                <span className="text-xs text-[#637588] dark:text-[#9ca3af]">
                                    Acepto la política de privacidad y consiento que mis datos sean tratados para recibir el informe de valoración.
                                </span>
                            </label>

                            <button
                                onClick={handleSendReport}
                                disabled={!email || !acceptedTerms || isSending}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">mail</span>
                                        Enviar informe
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-[32px] text-green-500 filled">check_circle</span>
                            </div>
                            <h4 className="text-lg font-bold text-[#111418] dark:text-white mb-2">
                                ¡Informe enviado!
                            </h4>
                            <p className="text-sm text-[#637588] dark:text-[#9ca3af]">
                                Revisa tu bandeja de entrada en {email}
                            </p>
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-center text-[#637588] dark:text-[#64748b] mt-6 px-4">
                    Esta valoración es orientativa y no constituye una tasación oficial. Los valores pueden variar según las condiciones del mercado y las características específicas del inmueble.
                </p>

                <div className="h-8"></div>
            </main>
        </div>
    );
}
