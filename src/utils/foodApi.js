import { searchLocal } from './foodDatabase';

const OFF_BASE = 'https://world.openfoodfacts.org';
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';

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
    const res = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`, { signal: AbortSignal.timeout(4000) });
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

async function searchUSDA(query) {
  try {
    const params = new URLSearchParams({
      query,
      api_key: USDA_KEY,
      pageSize: 8,
      dataType: 'Foundation,SR Legacy,Branded',
    });
    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.foods || [])
      .map(f => {
        const kcal = f.foodNutrients?.find(n => n.nutrientId === 1008 || n.nutrientName === 'Energy')?.value;
        if (!kcal) return null;
        return {
          name: f.description
            .split(',').slice(0, 2).join(',')
            .toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
          brand: f.brandName || f.brandOwner || '',
          caloriesPer100g: Math.round(kcal),
          category: mapUSDACategory(f.foodCategory || ''),
          source: 'usda',
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function searchFoods(query) {
  if (!query || query.length < 2) return [];

  const local = searchLocal(query);
  const localNames = new Set(local.map(f => f.name.toLowerCase()));

  function dedup(results) {
    return results.filter(f => {
      const n = f.name.toLowerCase();
      return ![...localNames].some(l => n.includes(l) || l.includes(n));
    });
  }

  // Return local immediately if we have 4+ matches
  if (local.length >= 4) {
    Promise.all([searchOpenFoodFacts(query), searchUSDA(query)]).then(() => {});
    return local;
  }

  // Otherwise run both APIs in parallel
  const [off, usda] = await Promise.all([searchOpenFoodFacts(query), searchUSDA(query)]);

  // Merge: prefer USDA (more reliable), then OFF, dedup against local and each other
  const usdaDeduped = dedup(usda);
  const usdaNames = new Set(usdaDeduped.map(f => f.name.toLowerCase()));
  const offDeduped = dedup(off).filter(f => {
    const n = f.name.toLowerCase();
    return ![...usdaNames].some(u => n.includes(u) || u.includes(n));
  });

  return [...local, ...usdaDeduped, ...offDeduped].slice(0, 12);
}

function mapCategory(tags = []) {
  if (!tags.length) return 'Other';
  const tag = tags[0].replace('en:', '').replace(/-/g, ' ');
  const map = {
    'beverages': 'Beverages', 'dairy': 'Dairy', 'meats': 'Proteins',
    'fish': 'Proteins', 'seafood': 'Proteins', 'fruits': 'Fruits & Vegetables',
    'vegetables': 'Fruits & Vegetables', 'cereals': 'Grains', 'breads': 'Grains',
    'snacks': 'Snacks', 'sweets': 'Sweets', 'oils': 'Fats & Oils',
  };
  for (const [k, v] of Object.entries(map)) {
    if (tag.includes(k)) return v;
  }
  return 'Other';
}

function mapUSDACategory(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('poultry') || c.includes('beef') || c.includes('pork') || c.includes('fish') || c.includes('egg') || c.includes('legume')) return 'Proteins';
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) return 'Dairy';
  if (c.includes('vegetable') || c.includes('fruit')) return 'Fruits & Vegetables';
  if (c.includes('grain') || c.includes('bread') || c.includes('cereal') || c.includes('pasta') || c.includes('rice')) return 'Grains';
  if (c.includes('fat') || c.includes('oil') || c.includes('nut')) return 'Fats & Oils';
  if (c.includes('snack') || c.includes('chip')) return 'Snacks';
  if (c.includes('sweet') || c.includes('candy') || c.includes('dessert')) return 'Sweets';
  if (c.includes('beverage') || c.includes('drink') || c.includes('juice')) return 'Beverages';
  return 'Other';
}

export const FOOD_GROUPS = [
  'Meals',
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
