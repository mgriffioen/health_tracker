const FOOD_KEY = 'ht_food_entries';
const WEIGHT_KEY = 'ht_weight_entries';

export function getFoodEntries() {
  try {
    return JSON.parse(localStorage.getItem(FOOD_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveFoodEntry(entry) {
  const entries = getFoodEntries();
  entries.push({ ...entry, id: Date.now() });
  localStorage.setItem(FOOD_KEY, JSON.stringify(entries));
  return entries;
}

export function deleteFoodEntry(id) {
  const entries = getFoodEntries().filter(e => e.id !== id);
  localStorage.setItem(FOOD_KEY, JSON.stringify(entries));
  return entries;
}

export function getWeightEntries() {
  try {
    return JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveWeightEntry(entry) {
  const entries = getWeightEntries();
  // Replace existing entry for same date
  const idx = entries.findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = { ...entry, id: entries[idx].id };
  } else {
    entries.push({ ...entry, id: Date.now() });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(WEIGHT_KEY, JSON.stringify(entries));
  return entries;
}

export function deleteWeightEntry(id) {
  const entries = getWeightEntries().filter(e => e.id !== id);
  localStorage.setItem(WEIGHT_KEY, JSON.stringify(entries));
  return entries;
}
