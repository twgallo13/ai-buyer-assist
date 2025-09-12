// Multi-color parsing and palette grouping utilities for v1.9.5

export type PaletteGroup = 'earth' | 'pastel' | 'neon' | 'mono' | 'primary';

/**
 * Parse color string into array of individual color tags
 * Splits on /, comma, + and trims whitespace
 */
export function parseColorTags(colorStr: string | undefined): string[] {
    if (!colorStr || typeof colorStr !== 'string') return [];

    return colorStr
        .split(/[\/,+]/)
        .map(color => color.trim())
        .filter(color => color.length > 0)
        .map(color => color.toLowerCase());
}

/**
 * Categorize colors into palette groups using keyword matching
 */
export function getPaletteGroup(colorTags: string[]): PaletteGroup {
    const colors = colorTags.map(c => c.toLowerCase());

    // Earth tones - natural, warm, muted colors
    const earthKeywords = ['brown', 'tan', 'beige', 'sand', 'khaki', 'olive', 'forest', 'rust', 'burgundy', 'maroon', 'clay', 'copper', 'bronze', 'camel', 'taupe', 'mushroom', 'moss', 'sage', 'terracotta'];

    // Pastel - soft, light, muted versions
    const pastelKeywords = ['pastel', 'light', 'soft', 'pale', 'baby', 'powder', 'cream', 'ivory', 'mint', 'lavender', 'peach', 'rose', 'blush', 'lilac', 'sky', 'seafoam', 'coral', 'vanilla', 'champagne'];

    // Neon/Bright - vibrant, electric, highlighter colors
    const neonKeywords = ['neon', 'electric', 'bright', 'fluorescent', 'glow', 'volt', 'laser', 'atomic', 'highlighter', 'vivid', 'hot', 'fire', 'blaze', 'flash', 'shock'];

    // Monochrome - black, white, grays
    const monoKeywords = ['black', 'white', 'gray', 'grey', 'charcoal', 'slate', 'silver', 'platinum', 'ash', 'smoke', 'coal', 'snow', 'pearl', 'graphite', 'steel', 'pewter'];

    // Primary - pure, saturated basic colors
    const primaryKeywords = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'violet', 'crimson', 'scarlet', 'azure', 'navy', 'royal', 'emerald', 'jade', 'amber', 'magenta', 'turquoise', 'teal', 'indigo'];

    // Check for matches in priority order
    if (colors.some(color => earthKeywords.some(keyword => color.includes(keyword)))) {
        return 'earth';
    }

    if (colors.some(color => pastelKeywords.some(keyword => color.includes(keyword)))) {
        return 'pastel';
    }

    if (colors.some(color => neonKeywords.some(keyword => color.includes(keyword)))) {
        return 'neon';
    }

    if (colors.some(color => monoKeywords.some(keyword => color.includes(keyword)))) {
        return 'mono';
    }

    if (colors.some(color => primaryKeywords.some(keyword => color.includes(keyword)))) {
        return 'primary';
    }

    // Default to primary if no clear match
    return 'primary';
}

/**
 * Get palette group color for UI display
 */
export function getPaletteColor(group: PaletteGroup): string {
    const colors = {
        earth: '#8B4513',    // SaddleBrown
        pastel: '#DDA0DD',   // Plum
        neon: '#00FF00',     // Lime
        mono: '#808080',     // Gray
        primary: '#FF0000'   // Red
    };
    return colors[group];
}

/**
 * Get a representative color for a color tag (for UI chips)
 */
export function getColorForColorTag(colorTag: string): string {
    const color = colorTag.toLowerCase();

    // Direct color mappings
    const colorMap: Record<string, string> = {
        // Reds
        'red': '#DC2626',
        'crimson': '#DC143C',
        'scarlet': '#FF2400',
        'maroon': '#800000',
        'burgundy': '#800020',
        'rose': '#FF007F',
        'coral': '#FF7F50',
        'salmon': '#FA8072',

        // Blues
        'blue': '#2563EB',
        'navy': '#000080',
        'royal': '#4169E1',
        'azure': '#007FFF',
        'sky': '#87CEEB',
        'turquoise': '#40E0D0',
        'teal': '#008080',
        'cyan': '#00FFFF',

        // Greens
        'green': '#16A34A',
        'forest': '#228B22',
        'emerald': '#50C878',
        'jade': '#00A86B',
        'lime': '#00FF00',
        'mint': '#98FB98',
        'sage': '#9CAF88',
        'olive': '#808000',

        // Yellows/Oranges
        'yellow': '#EAB308',
        'gold': '#FFD700',
        'amber': '#FFBF00',
        'orange': '#EA580C',
        'peach': '#FFCBA4',
        'apricot': '#FBCEB1',

        // Purples/Pinks
        'purple': '#7C3AED',
        'violet': '#8A2BE2',
        'indigo': '#4B0082',
        'magenta': '#FF00FF',
        'pink': '#EC4899',
        'lavender': '#E6E6FA',
        'lilac': '#C8A2C8',
        'plum': '#8E4585',

        // Neutrals
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#6B7280',
        'grey': '#6B7280',
        'charcoal': '#36454F',
        'slate': '#708090',
        'silver': '#C0C0C0',
        'platinum': '#E5E4E2',
        'pewter': '#96A8A1',
        'steel': '#4682B4',

        // Browns/Earth tones
        'brown': '#92400E',
        'tan': '#D2691E',
        'beige': '#F5F5DC',
        'sand': '#C2B280',
        'khaki': '#F0E68C',
        'bronze': '#CD7F32',
        'copper': '#B87333',
        'rust': '#B7410E',
        'clay': '#8B4513',
        'taupe': '#483C32',
        'mushroom': '#C3B091',
        'camel': '#C19A6B',
        'terracotta': '#E2725B',
    };

    // Check for direct matches first
    for (const [key, value] of Object.entries(colorMap)) {
        if (color.includes(key)) {
            return value;
        }
    }

    // Fallback based on palette group
    const paletteGroup = getPaletteGroup([colorTag]);
    return getPaletteColor(paletteGroup);
}

/**
 * Get all unique color tags from a dataset
 */
export function getUniqueColorTags<T extends { colorTags?: string[] }>(rows: T[]): string[] {
    const allTags = new Set<string>();

    rows.forEach(row => {
        if (row.colorTags) {
            row.colorTags.forEach(tag => allTags.add(tag));
        }
    });

    return Array.from(allTags).sort();
}

/**
 * Group color tags by palette
 */
export function groupColorTagsByPalette(colorTags: string[]): Record<PaletteGroup, string[]> {
    const groups: Record<PaletteGroup, string[]> = {
        earth: [],
        pastel: [],
        neon: [],
        mono: [],
        primary: []
    };

    colorTags.forEach(tag => {
        const group = getPaletteGroup([tag]);
        groups[group].push(tag);
    });

    return groups;
}

/**
 * Filter rows by color tags
 */
export function filterRowsByColorTags<T extends { colorTags?: string[] }>(
    rows: T[],
    filterTags: string[]
): T[] {
    if (filterTags.length === 0) return rows;

    return rows.filter(row => {
        if (!row.colorTags || row.colorTags.length === 0) return false;
        return filterTags.some(filterTag =>
            row.colorTags!.some(rowTag =>
                rowTag.toLowerCase().includes(filterTag.toLowerCase())
            )
        );
    });
}