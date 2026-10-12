export const TARGETS = Object.freeze({ calories: 2100, protein: 140, fat: 70, carbs: 228 });

export const DEFAULT_FOODS = Object.freeze([
  { id: 'convenience-chicken', category: '便利商店', name: '即食雞胸肉', serving: '1 包', calories: 130, protein: 26, fat: 2, carbs: 2 },
  { id: 'convenience-egg', category: '便利商店', name: '茶葉蛋', serving: '1 顆', calories: 75, protein: 7, fat: 5, carbs: 1 },
  { id: 'convenience-sweet-potato', category: '便利商店', name: '烤地瓜', serving: '150 g', calories: 190, protein: 3, fat: 0.3, carbs: 44 },
  { id: 'convenience-rice-ball', category: '便利商店', name: '鮪魚飯糰', serving: '1 顆', calories: 220, protein: 6, fat: 5, carbs: 38 },
  { id: 'breakfast-egg-toast', category: '早餐店', name: '蛋吐司', serving: '1 份', calories: 310, protein: 13, fat: 12, carbs: 38 },
  { id: 'breakfast-tuna-egg', category: '早餐店', name: '鮪魚蛋餅', serving: '1 份', calories: 430, protein: 19, fat: 20, carbs: 43 },
  { id: 'breakfast-soy', category: '早餐店', name: '無糖豆漿', serving: '400 ml', calories: 140, protein: 13, fat: 7, carbs: 8 },
  { id: 'bento-chicken', category: '便當', name: '雞腿便當', serving: '1 份', calories: 780, protein: 38, fat: 28, carbs: 92 },
  { id: 'bento-pork', category: '便當', name: '排骨便當', serving: '1 份', calories: 850, protein: 36, fat: 34, carbs: 99 },
  { id: 'bento-fish', category: '便當', name: '烤鯖魚便當', serving: '1 份', calories: 720, protein: 35, fat: 26, carbs: 85 },
  { id: 'noodle-beef', category: '麵食', name: '紅燒牛肉麵', serving: '1 碗', calories: 650, protein: 35, fat: 20, carbs: 82 },
  { id: 'noodle-dry', category: '麵食', name: '乾麵', serving: '1 碗', calories: 420, protein: 12, fat: 14, carbs: 62 },
  { id: 'dumpling', category: '麵食', name: '水餃', serving: '10 顆', calories: 500, protein: 22, fat: 20, carbs: 58 },
  { id: 'hotpot', category: '鍋物', name: '涮涮鍋（不含飲料）', serving: '1 鍋', calories: 720, protein: 48, fat: 30, carbs: 65 },
  { id: 'fast-burger', category: '速食', name: '牛肉漢堡', serving: '1 個', calories: 520, protein: 25, fat: 27, carbs: 43 },
  { id: 'fast-fries', category: '速食', name: '中份薯條', serving: '1 份', calories: 360, protein: 5, fat: 17, carbs: 47 },
  { id: 'salad', category: '輕食', name: '雞肉沙拉', serving: '1 盒', calories: 320, protein: 28, fat: 16, carbs: 18 },
  { id: 'poke', category: '輕食', name: '鮭魚波奇碗', serving: '1 碗', calories: 610, protein: 32, fat: 22, carbs: 70 },
  { id: 'drink-latte', category: '飲品', name: '拿鐵（無糖）', serving: '360 ml', calories: 180, protein: 10, fat: 9, carbs: 14 },
  { id: 'drink-bubble', category: '飲品', name: '珍珠奶茶（半糖）', serving: '中杯', calories: 520, protein: 5, fat: 12, carbs: 98 }
]);

export function scaleNutrition(food, quantity) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) throw new Error('份量必須大於 0');
  return ['calories', 'protein', 'fat', 'carbs'].reduce((result, key) => {
    result[key] = Math.round(Number(food[key]) * q * 10) / 10;
    return result;
  }, {});
}

export function dailyTotals(entries) {
  return entries.reduce((total, entry) => {
    for (const key of Object.keys(TARGETS)) total[key] += Number(entry[key]) || 0;
    return total;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
}

export function percent(value, target) {
  return Math.min(100, Math.max(0, (Number(value) || 0) / target * 100));
}

export function validateBackup(data) {
  if (!data || typeof data !== 'object' || data.app !== 'wai-shi-nutrition-diary') return false;
  if (!Array.isArray(data.entries) || !Array.isArray(data.customFoods)) return false;
  return data.entries.every(e => e && typeof e.date === 'string' && typeof e.name === 'string' && Number.isFinite(Number(e.calories)));
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
