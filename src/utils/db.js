import { supabase } from './supabase';

// Food entries
export async function fetchFoodEntries() {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    date: row.date,
    time: row.time,
    name: row.name,
    calories: row.calories,
    servingSize: row.serving_size,
    foodGroup: row.food_group,
  }));
}

export async function insertFoodEntry(entry, userId) {
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      user_id: userId,
      date: entry.date,
      time: entry.time,
      name: entry.name,
      calories: Number(entry.calories),
      serving_size: entry.servingSize,
      food_group: entry.foodGroup,
    })
    .select()
    .single();
  if (error) throw error;
  return { ...entry, id: data.id };
}

export async function removeFoodEntry(id) {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function updateFoodEntry(id, entry) {
  const { data, error } = await supabase
    .from('food_entries')
    .update({
      name: entry.name,
      calories: Number(entry.calories),
      food_group: entry.foodGroup,
      date: entry.date,
      time: entry.time,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    calories: data.calories,
    foodGroup: data.food_group,
    date: data.date,
    time: data.time,
  };
}

// Weight entries
export async function fetchWeightEntries() {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    date: row.date,
    weight: row.weight,
    unit: row.unit,
  }));
}

export async function upsertWeightEntry(entry, userId) {
  const { data: existing } = await supabase
    .from('weight_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('date', entry.date)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('weight_entries')
      .update({ weight: entry.weight, unit: entry.unit })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { ...entry, id: data.id };
  } else {
    const { data, error } = await supabase
      .from('weight_entries')
      .insert({ user_id: userId, date: entry.date, weight: entry.weight, unit: entry.unit })
      .select()
      .single();
    if (error) throw error;
    return { ...entry, id: data.id };
  }
}

export async function removeWeightEntry(id) {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);
  if (error) throw error;
}
