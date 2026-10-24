# 📱 港居不動產 全站 PWA 離線與原生應用安裝深度實測報告

> **檢驗日期**：2026-10-24
> **測試環境**：Node.js 本地伺服器 ＋ Headless Chrome CDP 協議
> **離線模擬技術**：`Network.emulateNetworkConditions({ offline: true })`

---

## 📊 離線能力驗收總表

| # | 頁面名稱 | 離線載入狀態 | 離線 DOM 渲染 | 頁面標題 |
|---|---|---|---|---|
| 1 | `index.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜高雄高質感住宅包租代管首選・屋況免改裝直上 |
| 2 | `rent-calculator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租金換算工具｜港居不動產包租代管專用 |
| 3 | `file-converter.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 線上檔案轉換工具｜港居不動產專屬多功能轉換神器 |
| 4 | `photo-watermark.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜照片 EXIF & 拍攝日期浮水印工具 |
| 5 | `id-card-watermark.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜身份證照裁剪與租賃水印工具 |
| 6 | `image-converter.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 圖像格式與尺寸轉換神器｜JPG, PNG, WEBP, GIF, SVG, BMP 互轉｜港居不動產線上工具集 |
| 7 | `card-merger.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 名片正反面上下合成神器｜港居不動產專屬名片拼貼工具 |
| 8 | `photo-time-location.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜照片時間與地點浮水印工具 (照片增加時間與地點神器) |
| 9 | `ocr-translator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜照片 OCR 文字辨識與多國語言翻譯神器 (合約/證件/看板文字辨識) |
| 10 | `space-planner.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產｜2D 平面格局配置與 3D 即時轉換系統 (智慧自動隔間/CAD家具/坪數換算) |
| 11 | `island.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 港居不動產・智慧包租代管營運島 | 3D 微縮世界 |
| 12 | `lease-contract.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃契約與住戶公約線上產生器｜港居不動產包租代管專用 |
| 13 | `tax-calculator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 房東節稅與包租代管實質淨收益試算神器｜租賃專法第17條・囤房稅2.0・三方案淨得對比｜港居不動產 |
| 14 | `repair-inspection.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃修繕點交與屋況瑕疵存證紀錄神器｜起租退租・浮水印拍照・電子簽章・A4點交報告｜港居不動產 |
| 15 | `utility-splitter.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 分租水電費與公電分攤結算單產生器｜符合2024租賃電費新制・LINE催繳圖卡・A4公告表｜港居不動產 |
| 16 | `privacy.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 個人資料保護與隱私權政策｜港居不動產開發有限公司 |

**離線可用率**：**16 / 16 頁 (100%)**

---

## 🛠️ PWA 核心技術規格落實清單

1. **Web App Manifest (`manifest.json`)**：
   - 品牌名稱：`港居不動產｜包租代管與線上工具集`
   - 簡稱：`港居不動產`
   - 啟動模式：`display: standalone`（全螢幕原生 App 外觀）
   - 主題色：`#1A365D`（海軍藍）、背景底色：`#0F2341`（深海軍藍）
   - 4 款快捷動作 (Shortcuts)：2D/3D 格局配置、租金試算、照片水印、OCR 翻譯。
2. **多解析度與 Maskable 圖示庫 (`assets/icons/`)**：
   - `icon-192.png`、`icon-512.png`、`icon-maskable-192.png`、`icon-maskable-512.png`、`apple-touch-icon.png`、`favicon-32.png`。
3. **智慧 Service Worker 快取架構 (`sw.js`)**：
   - **預先快取 (Pre-caching)**：安裝時主動預載全站 10 頁 HTML、全套 CSS、全套模組化 JS 與品牌圖資。
   - **導航請求 (HTML Navigation)**：採用 Network-First with Cache Fallback，網路在線時保證最新版本，進入地下室、高樓案場無訊號時無縫切換至本地快取。
   - **靜態資源 (Assets & CDN)**：採用 Stale-While-Revalidate 與動態快取，自動緩存第三方 CDN 腳本（Three.js, FontAwesome 等）。
4. **原生安裝引導與離線連線監控 (`js/pwa.js`)**：
   - 攔截 `beforeinstallprompt`，提供兼顧美感與 WCAG $\ge 44$px 觸控熱區的香檳金安裝提示卡片。
   - 實時監聽 `online` / `offline` 事件，斷網時浮動顯示 `pwa-offline-badge` 提示使用者。
