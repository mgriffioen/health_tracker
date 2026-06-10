import { searchLocal } from './foodDatabase';

const BASE = 'https://world.openfoodfacts.org';

async function searchOpenFoodFacts(query) {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 6,
      fields: 'product_name,nutriments,categories_tags,brands',
    });
    const res = await fetch(`${BASE}/cgi/search.pl?${params}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || [])
      .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map(p => ({
        name: p.product_name,
        brand: p.brands || '',
        caloriesPer100g: Math.round(p.nutriments['energy-kcal_100g']),
        category: mapCategory(p.categories_tags),
        source: 'api',
      }));
  } catch {
    return [];
  }
}

export async function searchFoods(query) {
  if (!query || query.length < 2) return [];

  const local = searchLocal(query);

  // Fire API search in parallel but don't block on it
  const apiPromise = searchOpenFoodFacts(query);

  // Return local results immediately if we have enough
  if (local.length >= 4) {
    // Still fetch API in background to append branded results
    apiPromise.then(() => {}); // fire and forget
    return local;
  }

  // Otherwise wait for API to fill the gap
  const api = await apiPromise;

  // Deduplicate: skip API results whose name closely matches a local one
  const localNames = new Set(local.map(f => f.name.toLowerCase()));
  const filtered = api.filter(f => {
    const n = f.name.toLowerCase();
    return ![...localNames].some(l => n.includes(l) || l.includes(n));
  });

  return [...local, ...filtered].slice(0, 10);
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
