// Curated taxonomy lists for when CSV data is not available
// Used to populate filter dropdowns with meaningful options

export const FALLBACK_BRANDS = [
    'Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok',
    'New Balance', 'Converse', 'Vans', 'ASICS', 'Brooks',
    'Levi\'s', 'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren', 'Gap',
    'H&M', 'Zara', 'Uniqlo', 'Forever 21', 'Urban Outfitters',
    'Patagonia', 'The North Face', 'Columbia', 'REI Co-op',
    'Lululemon', 'Athleta', 'Old Navy', 'American Eagle'
];

export const FALLBACK_COLLECTIONS = [
    'Spring 2024', 'Summer 2024', 'Fall 2024', 'Winter 2024',
    'Spring 2025', 'Summer 2025', 'Fall 2025', 'Winter 2025',
    'Core', 'Essentials', 'Premium', 'Limited Edition',
    'Performance', 'Lifestyle', 'Casual', 'Formal',
    'Activewear', 'Streetwear', 'Workwear', 'Outdoor',
    'Holiday', 'Back to School', 'Resort', 'Transitional'
];

export const FALLBACK_CATEGORIES = [
    'Apparel', 'Footwear', 'Accessories', 'Bags',
    'Tops', 'Bottoms', 'Dresses', 'Outerwear',
    'Activewear', 'Underwear', 'Sleepwear', 'Swimwear',
    'Sneakers', 'Boots', 'Sandals', 'Dress Shoes',
    'Athletic Shoes', 'Casual Shoes', 'Flats', 'Heels',
    'Jewelry', 'Watches', 'Belts', 'Hats',
    'Scarves', 'Sunglasses', 'Wallets', 'Tech Accessories'
];

export const FALLBACK_COLOR_FAMILIES = [
    'Black', 'White', 'Gray', 'Navy', 'Blue',
    'Red', 'Pink', 'Purple', 'Green', 'Yellow',
    'Orange', 'Brown', 'Beige', 'Tan', 'Cream',
    'Khaki', 'Olive', 'Burgundy', 'Teal', 'Coral',
    'Mint', 'Lavender', 'Rose Gold', 'Silver', 'Gold',
    'Denim', 'Leopard', 'Floral', 'Stripe', 'Plaid'
];

export const FALLBACK_GENDERS = [
    'Women', 'Men', 'Unisex', 'Kids', 'Girls', 'Boys'
];

export const FALLBACK_CLASSES = [
    'Premium', 'Core', 'Value', 'Luxury', 'Entry',
    'Mid-tier', 'High-end', 'Budget', 'Designer',
    'Mass Market', 'Specialty', 'Limited', 'Exclusive'
];

// Intent options for the radio chips
export const INTENT_OPTIONS = [
    { value: 'sku', label: 'SKU' },
    { value: 'brand', label: 'Brand' },
    { value: 'collection', label: 'Collection' },
    { value: 'style', label: 'Style' },
    { value: 'color', label: 'Color' },
    { value: 'question', label: 'Question' }
];

// Horizon options for the knob
export const HORIZON_OPTIONS = [
    { value: 3, label: '3 months' },
    { value: 6, label: '6 months' },
    { value: 9, label: '9 months' },
    { value: 12, label: '12 months' }
];