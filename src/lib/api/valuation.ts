/**
 * Property Valuation Engine
 * 
 * Calculates estimated property values based on:
 * - Location (postal code → price/m²)
 * - Property characteristics (surface, year, type)
 * - Extras and amenities
 * - Quality of finishes
 * 
 * Provides conservative, estimated, and optimistic price ranges.
 */

import pricesData from '../../data/pricesByZone.json';
import type { PropertyData, ValuationResult } from '../../store/valuationStore';

// Type definitions for the price data
interface ZoneData {
    city: string;
    zone: string;
    pricePerSqm: number;
    tier: 'luxury' | 'premium' | 'high' | 'medium' | 'low';
}

interface PricesDatabase {
    metadata: {
        source: string;
        lastUpdated: string;
        currency: string;
        unit: string;
    };
    zones: Record<string, ZoneData>;
    defaults: {
        spain_average: number;
        capital_average: number;
        coastal_premium: number;
        island_premium: number;
    };
}

const prices = pricesData as PricesDatabase;

/**
 * Main valuation function
 * Returns conservative, estimated, and optimistic price ranges
 */
export function calculateValuation(property: Partial<PropertyData>): ValuationResult {
    // 1. Get base price per m² for the zone
    const basePricePerSqm = getBasePricePerSqm(property.postalCode, property.city);

    // 2. Apply adjustments
    const yearAdjustment = getYearAdjustment(property.constructionYear);
    const extrasAdjustment = getExtrasAdjustment(property.extras || []);
    const finishAdjustment = getFinishQualityAdjustment(property.finishQuality);
    const sizeAdjustment = getSizeAdjustment(property.surface || 100);
    const roomsAdjustment = getRoomsAdjustment(property.bedrooms, property.bathrooms, property.surface);

    // 3. Calculate total adjustment factor
    const totalAdjustment = 1 + yearAdjustment + extrasAdjustment + finishAdjustment + sizeAdjustment + roomsAdjustment;

    // 4. Calculate adjusted price per m²
    const adjustedPricePerSqm = basePricePerSqm * totalAdjustment;

    // 5. Calculate total estimated value
    const surface = property.surface || 100;
    const estimatedValue = adjustedPricePerSqm * surface;

    // 6. Calculate ranges (±10% for conservative/optimistic)
    const marginPercent = 0.10;
    const conservativeValue = estimatedValue * (1 - marginPercent);
    const optimisticValue = estimatedValue * (1 + marginPercent);

    // 7. Calculate confidence score
    const confidence = calculateConfidence(property);

    return {
        conservative: Math.round(conservativeValue),
        estimated: Math.round(estimatedValue),
        optimistic: Math.round(optimisticValue),
        pricePerSqm: Math.round(adjustedPricePerSqm),
        confidence,
    };
}

/**
 * Get base price per m² for a postal code or city
 */
function getBasePricePerSqm(postalCode?: string, city?: string): number {
    // Try exact postal code match first
    if (postalCode && prices.zones[postalCode]) {
        return prices.zones[postalCode].pricePerSqm;
    }

    // Try to find by city (look for any zone in that city)
    if (city) {
        const cityLower = city.toLowerCase();
        const cityZone = Object.values(prices.zones).find(
            (zone) => zone.city.toLowerCase() === cityLower
        );
        if (cityZone) {
            return cityZone.pricePerSqm;
        }
    }

    // Try postal code prefix (first 3 digits = province)
    if (postalCode) {
        const prefix = postalCode.substring(0, 3);
        const prefixMatch = Object.entries(prices.zones).find(
            ([code]) => code.startsWith(prefix)
        );
        if (prefixMatch) {
            return prefixMatch[1].pricePerSqm * 0.85; // 15% discount for non-exact match
        }
    }

    // Fall back to Spain average
    return prices.defaults.spain_average;
}

/**
 * Adjustment based on construction year
 * Newer buildings generally command higher prices
 */
function getYearAdjustment(year?: number): number {
    if (!year) return 0;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 0) {
        // Brand new (obra nueva)
        return 0.15;
    } else if (age <= 5) {
        // Very new
        return 0.10;
    } else if (age <= 10) {
        // Recent
        return 0.05;
    } else if (age <= 20) {
        // Modern
        return 0;
    } else if (age <= 40) {
        // Older
        return -0.05;
    } else if (age <= 60) {
        // Old
        return -0.10;
    } else {
        // Very old (but could be historic)
        return -0.12;
    }
}

/**
 * Adjustment based on property extras
 */
function getExtrasAdjustment(extras: string[]): number {
    const extraValues: Record<string, number> = {
        'Terraza': 0.05,
        'Amueblado': 0.02,
        'Trastero': 0.02,
        'Piscina': 0.04,
        'Parking': 0.05,
        'Jardín': 0.04,
        'Cerca ciudad': 0.02,
        'Com. cerrada': 0.03,
        'Buenas vistas': 0.04,
        'Seguridad': 0.02,
        'Deportes': 0.02,
        'Portero': 0.02,
        'Aire A/C': 0.02,
        'Calefacción': 0.02,
        'Domótica': 0.03,
        'Ascensor': 0.02,
        'Balcón': 0.02,
    };

    let totalAdjustment = 0;
    for (const extra of extras) {
        totalAdjustment += extraValues[extra] || 0.01;
    }

    // Cap maximum extras adjustment at 25%
    return Math.min(totalAdjustment, 0.25);
}

/**
 * Adjustment based on finish quality
 */
function getFinishQualityAdjustment(quality?: PropertyData['finishQuality']): number {
    switch (quality) {
        case 'design':
            return 0.15; // Acabados de diseño / lujo
        case 'good':
            return 0.05; // Buenos acabados
        case 'acceptable':
            return 0; // Buen estado (base)
        case 'small_reform':
            return -0.10; // Necesita pequeña reforma
        case 'full_reform':
            return -0.20; // Necesita reforma completa
        default:
            return 0;
    }
}

/**
 * Adjustment based on property size
 * Larger properties tend to have lower price/m²
 */
function getSizeAdjustment(surface: number): number {
    if (surface < 50) {
        // Very small (estudios)
        return 0.10;
    } else if (surface < 80) {
        // Small
        return 0.05;
    } else if (surface < 120) {
        // Medium (most common)
        return 0;
    } else if (surface < 180) {
        // Large
        return -0.03;
    } else if (surface < 250) {
        // Very large
        return -0.05;
    } else {
        // Mansions / exceptionally large
        return -0.08;
    }
}

/**
 * Adjustment based on room distribution
 * Optimal distribution (not too few, not too many rooms for the size)
 */
function getRoomsAdjustment(
    bedrooms?: number,
    bathrooms?: number,
    surface?: number
): number {
    if (!bedrooms || !surface) return 0;

    // Optimal m² per bedroom
    const sqmPerBedroom = surface / bedrooms;

    if (sqmPerBedroom < 15) {
        // Too cramped
        return -0.05;
    } else if (sqmPerBedroom > 50) {
        // Could use more rooms
        return -0.02;
    }

    // Bonus for multiple bathrooms in larger properties
    if (bathrooms && bathrooms >= 2 && surface >= 100) {
        return 0.02;
    }

    return 0;
}

/**
 * Calculate confidence score (0-100) based on data completeness
 */
function calculateConfidence(property: Partial<PropertyData>): number {
    let score = 50; // Base score

    // Location data
    if (property.postalCode) {
        if (prices.zones[property.postalCode]) {
            score += 15; // Exact postal code match
        } else {
            score += 5; // Have postal code but no exact match
        }
    }

    if (property.city) score += 5;
    if (property.latitude && property.longitude) score += 5;

    // Property characteristics
    if (property.surface) score += 5;
    if (property.constructionYear) score += 5;
    if (property.cadastralReference) score += 5;

    // Additional details
    if (property.bedrooms) score += 3;
    if (property.bathrooms) score += 2;
    if (property.extras && property.extras.length > 0) score += 3;
    if (property.finishQuality) score += 2;

    return Math.min(score, 95); // Cap at 95% (never 100% confident)
}

/**
 * Get zone information for a postal code
 */
export function getZoneInfo(postalCode: string): ZoneData | null {
    return prices.zones[postalCode] || null;
}

/**
 * Get all available zones (for debugging/display)
 */
export function getAllZones(): Record<string, ZoneData> {
    return prices.zones;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

/**
 * Format price range for display
 */
export function formatPriceRange(low: number, high: number): string {
    return `${formatPrice(low)} - ${formatPrice(high)}`;
}
