import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getClientBySlug, type Client } from '../lib/supabase';

interface ClientContextType {
    client: Client | null;
    loading: boolean;
    error: string | null;
}

const ClientContext = createContext<ClientContextType>({
    client: null,
    loading: true,
    error: null,
});

export function useClient() {
    return useContext(ClientContext);
}

interface ClientProviderProps {
    slug: string;
    children: ReactNode;
}

export function ClientProvider({ slug, children }: ClientProviderProps) {
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadClient() {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                const data = await getClientBySlug(slug);
                if (data) {
                    setClient(data);
                    // Apply primary color as CSS variable if available
                    if (data.primary_color) {
                        document.documentElement.style.setProperty('--color-primary', data.primary_color);
                    }
                } else {
                    setError('Cliente no encontrado');
                }
            } catch (err) {
                setError('Error al cargar cliente');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadClient();
    }, [slug]);

    return (
        <ClientContext.Provider value={{ client, loading, error }}>
            {children}
        </ClientContext.Provider>
    );
}
