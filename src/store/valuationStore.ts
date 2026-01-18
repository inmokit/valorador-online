import { create } from 'zustand';

export interface PropertyData {
    // Address
    address: string;
    city: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;

    // Catastro data
    cadastralReference: string;
    propertyType: string; // Residencial, Comercial, etc.
    buildingType: string; // Plurifamiliar, Unifamiliar, etc.

    // Property details
    surface: number; // m²
    constructionYear: number;

    // Rooms
    bedrooms: number;
    bathrooms: number;

    // Extras
    extras: string[];

    // Finishes quality
    finishQuality: 'design' | 'good' | 'acceptable' | 'small_reform' | 'full_reform';

    // Street View
    streetViewUrl?: string;
}

export interface ValuationResult {
    conservative: number; // Low estimate
    estimated: number;    // Mid estimate
    optimistic: number;   // High estimate
    pricePerSqm: number;
    confidence: number;   // 0-100
}

export interface UserContact {
    email: string;
    phone?: string;
    acceptedTerms: boolean;
}

interface ValuationStore {
    // Current step (1-7)
    currentStep: number;
    setCurrentStep: (step: number) => void;

    // Property data being collected
    propertyData: Partial<PropertyData>;
    updatePropertyData: (data: Partial<PropertyData>) => void;

    // Valuation result
    valuationResult: ValuationResult | null;
    setValuationResult: (result: ValuationResult) => void;

    // User contact for email
    userContact: UserContact | null;
    setUserContact: (contact: UserContact) => void;

    // Loading states
    isLoadingCatastro: boolean;
    setLoadingCatastro: (loading: boolean) => void;

    isLoadingStreetView: boolean;
    setLoadingStreetView: (loading: boolean) => void;

    isLoadingValuation: boolean;
    setLoadingValuation: (loading: boolean) => void;

    // Building units for plurifamiliar
    buildingUnits: any[];
    setBuildingUnits: (units: any[]) => void;
    selectedUnitIndex: number | null;
    selectUnit: (index: number) => void;

    // Reset
    reset: () => void;

    // Lead data for capture
    leadData: LeadData | null;
    updateLeadData: (data: LeadData) => void;

    // Saved valuation token
    savedValuationToken: string | null;
    setSavedValuationToken: (token: string) => void;
}

export interface LeadData {
    name: string;
    email: string;
    phone?: string;
}

const initialPropertyData: Partial<PropertyData> = {
    address: '',
    city: '',
    postalCode: '',
    cadastralReference: '',
    propertyType: 'Residencial',
    buildingType: 'Plurifamiliar',
    surface: 100,
    constructionYear: 2000,
    bedrooms: 3,
    bathrooms: 2,
    extras: [],
    finishQuality: 'good',
};

export const useValuationStore = create<ValuationStore>((set) => ({
    currentStep: 1,
    setCurrentStep: (step) => set({ currentStep: step }),

    propertyData: initialPropertyData,
    updatePropertyData: (data) =>
        set((state) => ({
            propertyData: { ...state.propertyData, ...data }
        })),

    valuationResult: null,
    setValuationResult: (result) => set({ valuationResult: result }),

    userContact: null,
    setUserContact: (contact) => set({ userContact: contact }),

    isLoadingCatastro: false,
    setLoadingCatastro: (loading) => set({ isLoadingCatastro: loading }),

    isLoadingStreetView: false,
    setLoadingStreetView: (loading) => set({ isLoadingStreetView: loading }),

    isLoadingValuation: false,
    setLoadingValuation: (loading) => set({ isLoadingValuation: loading }),

    buildingUnits: [],
    setBuildingUnits: (units) => set({ buildingUnits: units }),
    selectedUnitIndex: null,
    selectUnit: (index) => set({ selectedUnitIndex: index }),

    leadData: null,
    updateLeadData: (data) => set({ leadData: data }),

    savedValuationToken: null,
    setSavedValuationToken: (token) => set({ savedValuationToken: token }),

    reset: () => set({
        currentStep: 1,
        propertyData: initialPropertyData,
        valuationResult: null,
        userContact: null,
        buildingUnits: [],
        selectedUnitIndex: null,
        leadData: null,
        savedValuationToken: null,
    }),
}));
