# 外食營養日記 PWA

一個以 iPhone 使用情境為主、完全在瀏覽器本機運作的外食營養紀錄工具。

## 功能

- 每日目標：2,100 kcal、蛋白質 140 g、脂肪 70 g、碳水 228 g
- 內建 20 種常見外食，支援搜尋、分類與 0.25 倍份量調整
- 可新增自訂食物、切換日期、查詢歷史與刪除紀錄
- JSON 完整備份／還原，以及 UTF-8 CSV 匯出
- iPhone PWA、主畫面圖示、safe-area 版面與離線快取
- 資料只儲存在目前瀏覽器的 `localStorage`，沒有後端或 API 金鑰

## 本機執行與測試

```bash
npm test
npm run serve
```

開啟 `http://localhost:4173`。PWA service worker 必須從 localhost 或 HTTPS 提供。

## Netlify 部署

此專案不需要建置。連接 GitHub 儲存庫後，Netlify 的 Publish directory 使用 `.`；`netlify.toml` 已包含設定。

## iPhone 安裝

1. 用 Safari 開啟 Netlify 的 HTTPS 網址。
2. 點 Safari 的「分享」。
3. 選「加入主畫面」→「新增」。

第一次需連線載入；之後可從主畫面離線開啟。清除 Safari 網站資料會移除尚未備份的紀錄，建議定期下載 JSON 備份。
