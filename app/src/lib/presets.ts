import type { Preset, RegionWeights } from './types';

export const AOV_USD = 86;

export const DEFAULT_REGION_WEIGHTS: RegionWeights = {
    'Central CA': 0.45,
    'Las Vegas': 0.35,
    'Houston': 0.12,
    'Seattle': 0.08
};

export const DEFAULT_PRESETS: Preset[] = [
    {
        id: 'sneakerhead',
        label: 'Sneakerhead (Hype Focus)',
        weights: {
            demand: 0.4,
            momentum: 0.35,
            saturation: 0.1,
            freshness: 0.1,
            styleFit: 0.05
        },
        thresholds: {
            demandGo: 75,
            momentumGo: 70,
            freshnessGo: 65,
            demandHold: 50,
            momentumHold: 45,
            freshnessHold: 40
        },
        expectations: {
            targetPriceMax: 220,
            focusGender: ['men', 'women'],
            sizeNotes: 'Full size runs critical for hype releases',
            riskTolerance: 'high'
        }
    },
    {
        id: 'lifestyle',
        label: 'Lifestyle (Versatile Daily)',
        weights: {
            demand: 0.3,
            momentum: 0.2,
            saturation: 0.25,
            freshness: 0.15,
            styleFit: 0.1
        },
        thresholds: {
            demandGo: 65,
            momentumGo: 55,
            freshnessGo: 45,
            demandHold: 45,
            momentumHold: 35,
            freshnessHold: 25
        },
        expectations: {
            targetPriceMax: 120,
            focusGender: ['men', 'women'],
            sizeNotes: 'Wide size availability, comfort priority',
            riskTolerance: 'medium'
        }
    },
    {
        id: 'performance',
        label: 'Performance (Technical Focus)',
        weights: {
            demand: 0.25,
            momentum: 0.3,
            saturation: 0.2,
            freshness: 0.15,
            styleFit: 0.1
        },
        thresholds: {
            demandGo: 70,
            momentumGo: 65,
            freshnessGo: 55,
            demandHold: 50,
            momentumHold: 45,
            freshnessHold: 35
        },
        expectations: {
            targetPriceMax: 180,
            focusGender: ['men', 'women'],
            sizeNotes: 'Performance sizing, half sizes important',
            riskTolerance: 'medium'
        }
    },
    {
        id: 'kids_youth_parent',
        label: 'Kids/Youth (Parent Buyers)',
        weights: {
            demand: 0.2,
            momentum: 0.15,
            saturation: 0.3,
            freshness: 0.2,
            styleFit: 0.15
        },
        thresholds: {
            demandGo: 60,
            momentumGo: 50,
            freshnessGo: 40,
            demandHold: 40,
            momentumHold: 30,
            freshnessHold: 25
        },
        expectations: {
            targetPriceMax: 85,
            focusGender: ['kids'],
            sizeNotes: 'Fast growth sizing, durability over style',
            riskTolerance: 'low'
        }
    }
];