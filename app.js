import { TARGETS, DEFAULT_FOODS, scaleNutrition, dailyTotals, percent, validateBackup, csvEscape } from './nutrition.js';

const STORAGE_KEY = 'wai-shi-nutrition-diary-v1';
const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const emptyState = () => ({ entries: [], customFoods: [] });
let state = loadState();
let selectedDate = todayString();
let activeCategory = '全部';
let preferredFoodId = null;

const $ = id => document.getElementById(id);
const els = {
  date: $('selectedDate'), dateLabel: $('dateLabel'), entryList: $('entryList'), foodList: $('foodList'),
  historyList: $('historyList'), foodDialog: $('foodDialog'), foodForm: $('foodForm'), foodSelect: $('foodSelect'),
  quantity: $('quantity'), meal: $('meal'), preview: $('foodNutritionPreview'), customDialog: $('customDialog'),
  customForm: $('customForm'), toast: $('toast')
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && Array.isArray(parsed.entries) && Array.isArray(parsed.customFoods) ? parsed : emptyState();
  } catch { return emptyState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function allFoods() { return [...DEFAULT_FOODS, ...state.customFoods]; }
function format(value) { return Number(value.toFixed(1)).toLocaleString('zh-TW'); }
function formatDate(date) { return new Intl.DateTimeFormat('zh-TW', { month:'long', day:'numeric', weekday:'short' }).format(new Date(`${date}T12:00:00`)); }
function entriesFor(date) { return state.entries.filter(entry => entry.date === date); }
function uid() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function showToast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200); }
function download(content, name, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

function renderSummary() {
  const totals = dailyTotals(entriesFor(selectedDate));
  const valueIds = { calories: 'calorieValue', protein: 'proteinValue', fat: 'fatValue', carbs: 'carbsValue' };
  for (const key of Object.keys(TARGETS)) {
    $(valueIds[key]).textContent = format(totals[key]);
    const progress = $(`${key}Progress`); if (progress) progress.value = totals[key];
  }
  const pct = Math.round(percent(totals.calories, TARGETS.calories));
  $('calorieRing').style.setProperty('--progress', `${pct}%`);
  $('ringPercent').textContent = `${pct}%`;
  els.date.value = selectedDate;
  els.dateLabel.textContent = selectedDate === todayString() ? '今天' : formatDate(selectedDate);
}

function renderEntries() {
  const entries = entriesFor(selectedDate).sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  if (!entries.length) { els.entryList.innerHTML = '<div class="empty">這天還沒有紀錄。<br>從「常吃外食」挑一樣開始吧！</div>'; return; }
  els.entryList.innerHTML = entries.map(entry => `<article class="entry"><div class="entry-info"><h3>${escapeHtml(entry.name)}</h3><p>${escapeHtml(entry.meal)} · ${format(entry.quantity)} × ${escapeHtml(entry.serving)}<br>P ${format(entry.protein)}g · F ${format(entry.fat)}g · C ${format(entry.carbs)}g</p></div><div class="entry-actions"><span class="calories">${format(entry.calories)} kcal</span><button class="delete-button" data-delete="${entry.id}" aria-label="刪除 ${escapeHtml(entry.name)}">×</button></div></article>`).join('');
}

function renderFoods() {
  const foods = allFoods();
  const categories = ['全部', ...new Set(foods.map(f => f.category))];
  $('categoryFilters').innerHTML = categories.map(c => `<button class="filter ${c===activeCategory?'active':''}" data-category="${escapeHtml(c)}" type="button">${escapeHtml(c)}</button>`).join('');
  const q = $('foodSearch').value.trim().toLowerCase();
  const filtered = foods.filter(f => (activeCategory==='全部'||f.category===activeCategory) && `${f.name} ${f.category}`.toLowerCase().includes(q));
  els.foodList.innerHTML = filtered.length ? filtered.map(f => `<article class="food-item"><div class="food-info"><h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.category)} · ${escapeHtml(f.serving)}<br>${format(f.calories)} kcal · P ${format(f.protein)} · F ${format(f.fat)} · C ${format(f.carbs)}</p></div><button data-add-food="${f.id}" type="button" aria-label="加入 ${escapeHtml(f.name)}">＋</button></article>`).join('') : '<div class="empty">找不到符合的食物</div>';
}

function renderHistory() {
  const groups = new Map();
  for (const e of state.entries) { if (!groups.has(e.date)) groups.set(e.date, []); groups.get(e.date).push(e); }
  const dates = [...groups.keys()].sort().reverse();
  els.historyList.innerHTML = dates.length ? dates.map(date => { const t = dailyTotals(groups.get(date)); return `<article class="history-item"><div><div class="history-date">${formatDate(date)}</div><div class="history-stats">${format(t.calories)} kcal · P ${format(t.protein)}g · F ${format(t.fat)}g · C ${format(t.carbs)}g</div></div><button data-history-date="${date}" aria-label="查看 ${date}">›</button></article>`; }).join('') : '<div class="empty">開始記錄後，日期摘要會出現在這裡。</div>';
}
function renderAll() { renderSummary(); renderEntries(); renderFoods(); renderHistory(); }
function escapeHtml(text) { const div=document.createElement('div'); div.textContent=String(text); return div.innerHTML; }

function switchView(name) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id===`${name}View`));
  if (name==='history') renderHistory();
}
function openFoodDialog(foodId) {
  const foods=allFoods(); els.foodSelect.innerHTML=foods.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}（${escapeHtml(f.serving)}）</option>`).join('');
  els.foodSelect.value=foodId||preferredFoodId||foods[0].id; els.quantity.value='1'; updatePreview(); els.foodDialog.showModal();
}
function updatePreview() {
  const food=allFoods().find(f=>f.id===els.foodSelect.value); if(!food)return;
  const quantity=Math.max(.25, Number(els.quantity.value)||1); const n=scaleNutrition(food,quantity);
  els.preview.innerHTML=`<b>${escapeHtml(food.serving)} × ${format(quantity)}</b><br>${format(n.calories)} kcal　蛋白質 ${format(n.protein)}g　脂肪 ${format(n.fat)}g　碳水 ${format(n.carbs)}g`;
}
function moveDate(days) { const d=new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate()+days); selectedDate=d.toISOString().slice(0,10); renderSummary(); renderEntries(); }

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('previousDay').addEventListener('click',()=>moveDate(-1)); $('nextDay').addEventListener('click',()=>moveDate(1));
els.date.addEventListener('change',()=>{selectedDate=els.date.value||todayString();renderSummary();renderEntries();});
$('openAddFood').addEventListener('click',()=>openFoodDialog()); $('openCustomFood').addEventListener('click',()=>els.customDialog.showModal());
$('installHelp').addEventListener('click',()=>$('installDialog').showModal());
$('foodSearch').addEventListener('input',renderFoods);
$('categoryFilters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;activeCategory=b.dataset.category;renderFoods();});
els.foodList.addEventListener('click',e=>{const b=e.target.closest('[data-add-food]');if(!b)return;preferredFoodId=b.dataset.addFood;openFoodDialog(preferredFoodId);});
els.foodSelect.addEventListener('change',updatePreview); els.quantity.addEventListener('input',updatePreview);
$('decreaseQuantity').addEventListener('click',()=>{els.quantity.value=Math.max(.25,(Number(els.quantity.value)||1)-.25);updatePreview();});
$('increaseQuantity').addEventListener('click',()=>{els.quantity.value=Math.min(20,(Number(els.quantity.value)||1)+.25);updatePreview();});
els.foodForm.addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return; e.preventDefault(); const food=allFoods().find(f=>f.id===els.foodSelect.value); const quantity=Number(els.quantity.value); if(!food||!Number.isFinite(quantity)||quantity<=0)return; const n=scaleNutrition(food,quantity); state.entries.push({id:uid(),date:selectedDate,foodId:food.id,name:food.name,serving:food.serving,quantity,meal:els.meal.value,...n,createdAt:new Date().toISOString()}); saveState(); els.foodDialog.close(); renderAll(); switchView('diary'); showToast('已加入飲食紀錄');});
els.entryList.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;state.entries=state.entries.filter(x=>x.id!==b.dataset.delete);saveState();renderAll();showToast('已刪除紀錄');});
els.customForm.addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();const food={id:`custom-${uid()}`,category:'自訂',name:$('customName').value.trim(),serving:$('customServing').value.trim(),calories:Number($('customCalories').value),protein:Number($('customProtein').value),fat:Number($('customFat').value),carbs:Number($('customCarbs').value)};state.customFoods.push(food);saveState();els.customForm.reset();els.customDialog.close();activeCategory='自訂';renderFoods();showToast('已新增自訂食物');});
els.historyList.addEventListener('click',e=>{const b=e.target.closest('[data-history-date]');if(!b)return;selectedDate=b.dataset.historyDate;renderSummary();renderEntries();switchView('diary');window.scrollTo({top:0,behavior:'smooth'});});
$('backupJson').addEventListener('click',()=>{download(JSON.stringify({app:'wai-shi-nutrition-diary',version:1,exportedAt:new Date().toISOString(),entries:state.entries,customFoods:state.customFoods},null,2),`外食營養日記備份-${todayString()}.json`,'application/json');showToast('JSON 備份已下載');});
$('restoreJson').addEventListener('click',()=>$('restoreFile').click());
$('restoreFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!validateBackup(data))throw new Error();if(!confirm(`將以備份取代目前資料（${data.entries.length} 筆紀錄），確定繼續？`))return;state={entries:data.entries,customFoods:data.customFoods};saveState();renderAll();showToast('備份還原完成');}catch{alert('無法還原：檔案格式不正確。');}finally{e.target.value='';}});
$('exportCsv').addEventListener('click',()=>{const header=['日期','餐別','食物','份量說明','份量倍數','熱量(kcal)','蛋白質(g)','脂肪(g)','碳水(g)'];const rows=[header,...state.entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.meal,e.name,e.serving,e.quantity,e.calories,e.protein,e.fat,e.carbs])];download('\ufeff'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),`外食營養日記-${todayString()}.csv`,'text/csv;charset=utf-8');showToast('CSV 已匯出');});

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
renderAll();
