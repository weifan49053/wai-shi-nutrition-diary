import test from 'node:test';
import assert from 'node:assert/strict';
import { TARGETS, scaleNutrition, dailyTotals, percent, validateBackup, csvEscape } from '../nutrition.js';

test('daily targets match specification', () => {
  assert.deepEqual(TARGETS, { calories: 2100, protein: 140, fat: 70, carbs: 228 });
});

test('portion adjustment scales every nutrient', () => {
  assert.deepEqual(scaleNutrition({ calories: 200, protein: 10, fat: 5, carbs: 30 }, 1.5), { calories: 300, protein: 15, fat: 7.5, carbs: 45 });
  assert.throws(() => scaleNutrition({ calories: 1 }, 0), /份量/);
});

test('daily totals sum entries safely', () => {
  assert.deepEqual(dailyTotals([
    { calories: 100, protein: 10, fat: 2, carbs: 12 },
    { calories: 200, protein: 20, fat: 3, carbs: 24 }
  ]), { calories: 300, protein: 30, fat: 5, carbs: 36 });
});

test('percentage is clamped for progress bars', () => {
  assert.equal(percent(1050, 2100), 50);
  assert.equal(percent(3000, 2100), 100);
});

test('backup validation rejects unrelated files', () => {
  assert.equal(validateBackup({ app: 'wai-shi-nutrition-diary', entries: [], customFoods: [] }), true);
  assert.equal(validateBackup({ entries: [] }), false);
});

test('CSV values are escaped', () => {
  assert.equal(csvEscape('牛肉,麵'), '"牛肉,麵"');
  assert.equal(csvEscape('一般'), '一般');
});
