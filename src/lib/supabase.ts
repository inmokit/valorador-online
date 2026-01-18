import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

export interface Client {
    id: string;
    slug: string;
    nombre?: string;
    agent_name: string;
    agency_name: string;
    agent_photo_url?: string;
    agency_logo_url?: string;
    logo_url?: string;
    primary_color?: string;
    telefono?: string;
    email?: string;
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    return data;
}

export async function getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching client by ID:', error);
        return null;
    }

    return data;
}
