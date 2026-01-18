import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getValuationByToken, type SavedValuation } from '../../lib/api/valuations';
import { getClientById, type Client } from '../../lib/supabase';

export default function PublicReport() {
    const { token } = useParams<{ token: string }>();
    const [valuation, setValuation] = useState<SavedValuation | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!token) {
                setError('Token no válido');
                setLoading(false);
                return;
            }

            try {
                const data = await getValuationByToken(token);
                if (!data) {
                    setError('Valoración no encontrada');
                    setLoading(false);
                    return;
                }

                setValuation(data);

                // Load client data
                if (data.clientId) {
                    const clientData = await getClientById(data.clientId);
                    if (clientData) {
                        setClient(clientData);
                        // Apply client primary color
                        if (clientData.primary_color) {
                            document.documentElement.style.setProperty('--color-primary', clientData.primary_color);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading valuation:', err);
                setError('Error al cargar la valoración');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [token]);

    const formatCurrency = (value: number | undefined) => {
        if (!value) return '—';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#FDF9F3]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-primary animate-pulse">home</span>
                    </div>
                    <p className="text-gray-600">Cargando informe...</p>
                </div>
            </div>
        );
    }

    if (error || !valuation) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#FDF9F3]">
                <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px] text-red-500">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Informe no encontrado</h1>
                    <p className="text-gray-600">
                        {error || 'El enlace puede haber expirado o ser incorrecto.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#FDF9F3]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {client?.logo_url ? (
                        <img src={client.logo_url} alt={client.nombre} className="h-10 object-contain" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-white font-bold">{client?.nombre?.charAt(0) || 'V'}</span>
                            </div>
                            <span className="font-bold text-gray-900">{client?.nombre || 'Valoración'}</span>
                        </div>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(valuation.createdAt)}</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Hero Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-8">
                    {/* Street View Image */}
                    {valuation.streetViewUrl && (
                        <div className="relative h-48 sm:h-64">
                            <img
                                src={valuation.streetViewUrl}
                                alt="Vista de la propiedad"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                                    {valuation.address}
                                </h1>
                                <p className="text-white/80 text-sm mt-1">
                                    {valuation.postalCode} {valuation.city}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="p-6 text-center border-b border-gray-100">
                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Valor estimado</p>
                        <div className="text-4xl sm:text-5xl font-bold text-primary">
                            {formatCurrency(valuation.estimatedValueRecommended)}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-600">
                            <span>Mín: {formatCurrency(valuation.estimatedValueMin)}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                            <span>Máx: {formatCurrency(valuation.estimatedValueMax)}</span>
                        </div>
                        {valuation.pricePerM2 && (
                            <p className="mt-2 text-sm text-gray-500">
                                {formatCurrency(valuation.pricePerM2)}/m²
                            </p>
                        )}
                    </div>

                    {/* Property Details */}
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Datos de la propiedad</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {valuation.surface && (
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="material-symbols-outlined text-primary mb-1">square_foot</span>
                                    <span className="text-lg font-bold text-gray-900">{valuation.surface} m²</span>
                                    <span className="text-xs text-gray-500">Superficie</span>
                                </div>
                            )}
                            {valuation.bedrooms && (
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="material-symbols-outlined text-primary mb-1">bed</span>
                                    <span className="text-lg font-bold text-gray-900">{valuation.bedrooms}</span>
                                    <span className="text-xs text-gray-500">Habitaciones</span>
                                </div>
                            )}
                            {valuation.bathrooms && (
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="material-symbols-outlined text-primary mb-1">bathtub</span>
                                    <span className="text-lg font-bold text-gray-900">{valuation.bathrooms}</span>
                                    <span className="text-xs text-gray-500">Baños</span>
                                </div>
                            )}
                            {valuation.constructionYear && (
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="material-symbols-outlined text-primary mb-1">calendar_month</span>
                                    <span className="text-lg font-bold text-gray-900">{valuation.constructionYear}</span>
                                    <span className="text-xs text-gray-500">Año</span>
                                </div>
                            )}
                        </div>

                        {/* Extras */}
                        {valuation.extras && valuation.extras.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Características</h3>
                                <div className="flex flex-wrap gap-2">
                                    {valuation.extras.map((extra, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full"
                                        >
                                            {extra}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA Section */}
                {client && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">¿Te interesa vender?</h2>
                        <p className="text-gray-600 text-sm mb-6">
                            Contacta con {client.nombre} para obtener una valoración personalizada y conocer las mejores opciones para tu vivienda.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {client.telefono && (
                                <a
                                    href={`tel:${client.telefono}`}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    <span className="material-symbols-outlined">call</span>
                                    Llamar ahora
                                </a>
                            )}
                            {client.email && (
                                <a
                                    href={`mailto:${client.email}?subject=Consulta sobre valoración - ${valuation.address}`}
                                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
                                >
                                    <span className="material-symbols-outlined">mail</span>
                                    Enviar email
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-8 text-center text-xs text-gray-400">
                    <p>Esta valoración es orientativa y está basada en datos del mercado.</p>
                    <p className="mt-1">Para una tasación oficial, consulte con un profesional.</p>
                </footer>
            </main>
        </div>
    );
}
