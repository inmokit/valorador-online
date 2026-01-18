import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ValuationData {
    clientId: string;
    leadName: string;
    leadEmail: string;
    leadPhone?: string;
    address: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    surface?: number;
    constructionYear?: number;
    bedrooms?: number;
    bathrooms?: number;
    extras?: string[];
    finishQuality?: string;
    propertyType?: string;
    buildingType?: string;
    cadastralReference?: string;
    estimatedValueMin?: number;
    estimatedValueMax?: number;
    estimatedValueRecommended?: number;
    pricePerM2?: number;
    streetViewUrl?: string;
}

export interface SavedValuation extends ValuationData {
    id: string;
    reportToken: string;
    createdAt: string;
}

/**
 * Save a valuation to Supabase
 */
export async function saveValuation(data: ValuationData): Promise<SavedValuation | null> {
    const { data: result, error } = await supabase
        .from('valuations')
        .insert({
            client_id: data.clientId,
            lead_name: data.leadName,
            lead_email: data.leadEmail,
            lead_phone: data.leadPhone,
            address: data.address,
            city: data.city,
            postal_code: data.postalCode,
            latitude: data.latitude,
            longitude: data.longitude,
            surface: data.surface,
            construction_year: data.constructionYear,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            extras: data.extras,
            finish_quality: data.finishQuality,
            property_type: data.propertyType,
            building_type: data.buildingType,
            cadastral_reference: data.cadastralReference,
            estimated_value_min: data.estimatedValueMin,
            estimated_value_max: data.estimatedValueMax,
            estimated_value_recommended: data.estimatedValueRecommended,
            price_per_m2: data.pricePerM2,
            street_view_url: data.streetViewUrl,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving valuation:', error);
        return null;
    }

    return {
        id: result.id,
        reportToken: result.report_token,
        createdAt: result.created_at,
        clientId: result.client_id,
        leadName: result.lead_name,
        leadEmail: result.lead_email,
        leadPhone: result.lead_phone,
        address: result.address,
        city: result.city,
        postalCode: result.postal_code,
        latitude: result.latitude,
        longitude: result.longitude,
        surface: result.surface,
        constructionYear: result.construction_year,
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        extras: result.extras,
        finishQuality: result.finish_quality,
        propertyType: result.property_type,
        buildingType: result.building_type,
        cadastralReference: result.cadastral_reference,
        estimatedValueMin: result.estimated_value_min,
        estimatedValueMax: result.estimated_value_max,
        estimatedValueRecommended: result.estimated_value_recommended,
        pricePerM2: result.price_per_m2,
        streetViewUrl: result.street_view_url,
    };
}

/**
 * Get a valuation by report token (for public report page)
 */
export async function getValuationByToken(token: string): Promise<SavedValuation | null> {
    const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('report_token', token)
        .single();

    if (error || !data) {
        console.error('Error fetching valuation:', error);
        return null;
    }

    return {
        id: data.id,
        reportToken: data.report_token,
        createdAt: data.created_at,
        clientId: data.client_id,
        leadName: data.lead_name,
        leadEmail: data.lead_email,
        leadPhone: data.lead_phone,
        address: data.address,
        city: data.city,
        postalCode: data.postal_code,
        latitude: data.latitude,
        longitude: data.longitude,
        surface: data.surface,
        constructionYear: data.construction_year,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        extras: data.extras,
        finishQuality: data.finish_quality,
        propertyType: data.property_type,
        buildingType: data.building_type,
        cadastralReference: data.cadastral_reference,
        estimatedValueMin: data.estimated_value_min,
        estimatedValueMax: data.estimated_value_max,
        estimatedValueRecommended: data.estimated_value_recommended,
        pricePerM2: data.price_per_m2,
        streetViewUrl: data.street_view_url,
    };
}

/**
 * Get all valuations for a client
 */
export async function getValuationsByClient(clientId: string): Promise<SavedValuation[]> {
    const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        console.error('Error fetching valuations:', error);
        return [];
    }

    return data.map((item) => ({
        id: item.id,
        reportToken: item.report_token,
        createdAt: item.created_at,
        clientId: item.client_id,
        leadName: item.lead_name,
        leadEmail: item.lead_email,
        leadPhone: item.lead_phone,
        address: item.address,
        city: item.city,
        postalCode: item.postal_code,
        latitude: item.latitude,
        longitude: item.longitude,
        surface: item.surface,
        constructionYear: item.construction_year,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        extras: item.extras,
        finishQuality: item.finish_quality,
        propertyType: item.property_type,
        buildingType: item.building_type,
        cadastralReference: item.cadastral_reference,
        estimatedValueMin: item.estimated_value_min,
        estimatedValueMax: item.estimated_value_max,
        estimatedValueRecommended: item.estimated_value_recommended,
        pricePerM2: item.price_per_m2,
        streetViewUrl: item.street_view_url,
    }));
}

/**
 * Send valuation email via Edge Function
 */
export async function sendValuationEmail(data: {
    leadName: string;
    leadEmail: string;
    address: string;
    city?: string;
    postalCode?: string;
    estimatedValue: number;
    estimatedValueMin: number;
    estimatedValueMax: number;
    pricePerM2?: number;
    surface?: number;
    bedrooms?: number;
    bathrooms?: number;
    constructionYear?: number;
    finishQuality?: string;
    extras?: string[];
    cadastralReference?: string;
    streetViewUrl?: string;
    reportUrl: string;
    agentName?: string;
    agencyName?: string;
    agentPhotoUrl?: string;
    agencyLogoUrl?: string;
}): Promise<boolean> {
    try {
        const { data: result, error } = await supabase.functions.invoke('send-valuation-email', {
            body: data,
        });

        if (error) {
            console.error('Error sending valuation email:', error);
            return false;
        }

        console.log('Valuation email sent:', result);
        return true;
    } catch (err) {
        console.error('Error calling send-valuation-email function:', err);
        return false;
    }
}

