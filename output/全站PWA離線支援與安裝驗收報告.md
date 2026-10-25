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
| 16 | `deposit-settlement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 退租押金結算與點交扣款明細單產生器｜破日租金退補・水電預扣・雙向手寫簽章・A4確認書｜港居不動產 |
| 17 | `rent-subsidy-checker.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 300億租金補貼資格自檢與實質月租試算器｜高雄市分級・單身新婚育兒加碼・公益出租人節稅｜港居不動產 |
| 18 | `rent-receipt.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租金電子收據與屋主代管月結對帳單產生器｜雙模式・中文大寫金額・LINE圖卡匯出｜港居不動產 |
| 19 | `listing-post-generator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 591／社群招租文案與第33條法定揭露合成器｜防漏證號受罰・社群首圖一鍵生成｜港居不動產 |
| 20 | `legal-notice-generator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 欠租催告與終止租約「郵局存證信函」產生器｜民法第440條・20×10標準格線A4列印｜港居不動產 |
| 21 | `property-roi-calculator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 物業投資實質淨投報率與房貸現金流精算器｜Cap Rate・自備款現金殖利率・三方案淨現金流PK｜港居不動產 |
| 22 | `viewing-checklist.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租客看屋必備：30 項屋況自檢與避坑評分表產生器｜漏水・水壓・電路・隔音・宜居指數評估｜港居不動產 |
| 23 | `depreciation-calculator.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅設備損耗折舊與賠償殘值精算器｜固定資產耐用年數・冷氣熱水器折舊・防超額求償｜港居不動產 |
| 24 | `lease-termination-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租約提前終止協議書與遷讓交還切結產生器｜港居不動產 |
| 25 | `lease-renewal-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租約續約協議書與租金調幅精算產生器｜港居不動產・安心續約定期保障 |
| 26 | `tenant-screening-checker.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租客承租資格審查與租賃信用評分表產生器｜港居不動產・專業嚴選優質房客 |
| 27 | `mandate-contract.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃委託管理（包租／代管）契約書線上產生器｜港居不動產・官方合法特許範本 |
| 28 | `guarantor-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅連帶保證人保證書與履約切結書線上產生器｜港居不動產・債權擔保與法務保障 |
| 29 | `repair-work-order.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅修繕通報派工與完工驗收證明單產生器｜港居不動產・物業維護與請款核銷 |
| 30 | `holding-deposit-receipt.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租屋定金收據與承租保留切結產生器｜民法第248/249條合規・雙簽章與A4列印｜港居不動產 |
| 31 | `key-custody-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅現場看屋鑰匙借出保管與返還簽收切結產生器｜民法第432條・雙階段簽章點收與A4無痕列印｜港居不動產 |
| 32 | `tenant-check-in-form.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅房客遷入登記與住戶緊急聯絡人資料卡產生器｜公寓大廈第35條・緊急聯絡名冊與A4無痕列印｜港居不動產 |
| 33 | `routine-inspection-report.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃屋況定期巡檢維護報告書產生器｜租賃專法第28條・六大安全檢驗與A4無痕列印｜港居不動產 |
| 34 | `abandoned-property-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 承租人遺留物處理授權與拋棄切結書產生器｜港居不動產 |
| 35 | `rules-violation-notice.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅住戶違規行為勸導限期改善通知單產生器｜港居不動產 |
| 36 | `rent-arrears-notice.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃租金催繳與欠租限期清償催告書產生器｜港居不動產 |
| 37 | `proxy-authorization.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 租賃住宅授權委託代理人委任書產生器 ｜ 港居不動產開發 |
| 38 | `roommate-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃合租公約與共同承租連帶責任協議書產生器 ｜ 港居不動產開發 |
| 39 | `pet-addendum-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃飼養寵物特約承諾書產生器 ｜ 港居不動產 |
| 40 | `parking-lease-agreement.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 住宅租賃汽機車停車位租用與管理協議書產生器 ｜ 港居不動產 |
| 41 | `privacy.html` | ✅ 成功 (Status 200 From SW Cache) | ✅ 正常完整渲染 | 個人資料保護與隱私權政策｜港居不動產開發有限公司 |

**離線可用率**：**41 / 41 頁 (100%)**

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
