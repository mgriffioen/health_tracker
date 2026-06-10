// Open Food Facts API - free, no key required
const BASE = 'https://world.openfoodfacts.org';

export async function searchFoods(query) {
  if (!query || query.length < 2) return [];
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 10,
      fields: 'product_name,nutriments,categories_tags,brands',
    });
    const res = await fetch(`${BASE}/cgi/search.pl?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || [])
      .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map(p => ({
        name: p.product_name,
        brand: p.brands || '',
        caloriesPer100g: Math.round(p.nutriments['energy-kcal_100g']),
        category: mapCategory(p.categories_tags),
      }));
  } catch {
    return [];
  }
}

function mapCategory(tags = []) {
  if (!tags.length) return 'Other';
  const tag = tags[0].replace('en:', '').replace(/-/g, ' ');
  const map = {
    'beverages': 'Beverages',
    'dairy': 'Dairy',
    'meats': 'Proteins',
    'fish': 'Proteins',
    'seafood': 'Proteins',
    'fruits': 'Fruits & Vegetables',
    'vegetables': 'Fruits & Vegetables',
    'cereals': 'Grains',
    'breads': 'Grains',
    'snacks': 'Snacks',
    'sweets': 'Sweets',
    'oils': 'Fats & Oils',
  };
  for (const [k, v] of Object.entries(map)) {
    if (tag.includes(k)) return v;
  }
  return 'Other';
}

export const FOOD_GROUPS = [
  'Grains',
  'Fruits & Vegetables',
  'Proteins',
  'Dairy',
  'Fats & Oils',
  'Snacks',
  'Sweets',
  'Beverages',
  'Other',
];
