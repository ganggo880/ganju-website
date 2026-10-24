# 🤝 AI 交接說明文件 (AI Handover Document)

> 💡 **給接續工作的 AI Agent**：
> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡（決策原因、踩坑細節）放 Obsidian：`obsidian/港居不動產官網/專案工作流程.md`。
> 專案藍圖請讀 [`AGENTS.md`](AGENTS.md)。

---

## ⏯️ 目前做到哪

全站共 **14 個頁面**（港居不動產官網首頁、13 款高階線上工具集與 3D 智慧營運島）維持穩定運作，已完成技術規範全檢與資安防禦性加固：

**2026-10-24（最新推進）— 階段二十七：租賃修繕點交與屋況瑕疵存證紀錄神器 (`repair-inspection.html`) 完整研發與全站整合**
- **第 14 款核心工具 `repair-inspection.html`（`css/repair-inspection.css` ＋ `js/repair-inspection.js`）**：
  - **法定依據與三大模式切換**：
    - 依據《租賃住宅市場發展及管理條例》第 11 條及民法第 429 條（出租人修繕義務）、第 432 條（承租人注意義務）設計。
    - 支援「起租交付點交」、「退租返還核銷」與「現況修繕存證」三模式即時切換與標題/法律聲明連動。
  - **分區瑕疵存證與相機浮水印壓印引擎**：
    - 預設六大標準空間分區（玄關門廳、客廳公共區、主臥寢居、廚房設備、衛浴排水、工作陽台）。
    - 上傳現場照片在 Canvas 自動等比縮圖至最大 1200px（防止 12MP~48MP 高畫質照片造成行動端記憶體崩潰），自動壓印海軍藍/香檳金存證漸層標籤與時間戳記（`港居不動產 屋況點交存證 ｜ YYYY-MM-DD HH:mm`）。
    - 內建四級法律責任判定（🟢 正常自然折舊免責、🔵 出租人應行修繕、🔴 承租人注意義務疏失賠償/還原、⚪ 雙方合意現況點交）。
  - **水電指針與雙畫布高靈敏手寫電子簽章**：
    - 台電總表、獨立分表、自來水表、天然氣瓦斯表四重指針度數即時登錄。
    - 雙 Canvas 支援 Retina 2x 高平滑抗鋸齒書寫，配置 `touch-action: none` 防止滑動干擾，支援手指與手寫筆親簽，具備一鍵清除重簽。
  - **無痕 A4 列印與資料流通**：
    - `@media print` 隱藏導覽列與按鈕，自動排版為標準 A4 正式存證確認書，包含港居特許登記執照字號背書。
    - 一鍵組裝標的地址、點交日期、水電度數與瑕疵統計為 LINE 深度帶參訊息傳送陳俊銘經理。
    - LocalStorage 即時草稿自動保存（`ganju_inspection_draft`），支援 JSON 匯出備份與一鍵匯入。
- **全站導覽互通、PWA 57 項資產 100% 離線可用與極限驗收**：
  - 全站其餘 13 頁（index.html ＋ 12 款工具頁）導覽選單與頁尾全數統一補齊 `repair-inspection.html`（屋況修繕點交），全站 14 頁 100% 互通。
  - `sw.js` 快取版本升級至 `ganju-pwa-v1.3`，預載資產擴增至 57 項。
  - 經 `output/audit_site_specs.py` 稽核：全站 14/14 頁 (100%) 全部合格，0 失效連結。
  - 經 `output/audit_mobile_rwd.js` 實機 52 組情境驗收（360px~414px）：全站橫向溢出嚴格為 **0px**，觸控缺陷數為 **0 項**。
  - 經 `output/test_pwa_offline.js` 完全斷網模擬：全站 **14/14 頁 (100%) 全部成功秒開離線運作**。

**2026-10-24（前一輪）— 階段二十六：首頁 Lead 表單現代化升級 ＋ 房東常見問答 FAQ 手風琴 ＋ Google FAQPage 結構化資料**
- **首頁 Lead 預約表單現代化升級 (`index.html` ＋ `script.js` ＋ `styles.css`)**：
  - **蜜罐防洗防機器人機制 (Honeypot Anti-Spam)**：加入隱形欄位 `#formHoneypot`，阻斷惡意自動化爬蟲洗單。
  - **尊榮預約成功確認彈窗 (`#bookingSuccessModal`)**：徹底淘汰瀏覽器原生 `alert()`，改為高質感海軍藍/香檳金確認卡片，顯示預約姓名、電話、區域與方案。
  - **一鍵直連 LINE 帶參傳送陳俊銘經理**：自動將表單內容組裝為深度參數連結（`https://lin.ee/Q71pw2I?text=...`），房東點擊即可直接於 LINE 發送預約訊息給陳經理，雙重管道確保零漏單。
  - **本地預約備份 (LocalStorage `ganju_lead_history`)**：在瀏覽器本地保存最近 10 筆預約歷史，防止網路波動或房東忘記資料。
  - **全站懸浮 LINE 按鈕深度帶參**：點擊帶入「您好，我是屋主，想諮詢港居包租代管服務與現場評估」預設文字。
- **房東專區常見問答 FAQ 手風琴 (`#faq`) ＋ Google FAQPage JSON-LD**：
  - 增設 6 大核心問答手風琴（免改裝直上標準、包租 vs 代管挑選、節稅法規、欠租催收、工務修繕、委託流程），具備平滑高度過渡與 100% WCAG $\ge 44\times 44$px 觸控熱區。
  - 配置 Google 官方認可之 `FAQPage` 結構化資料，搶攻搜尋引擎結果 Rich Results 問答卡片曝光。
- **嚴格驗收成果**：
  - `output/audit_site_specs.py`：全站 13/13 頁 (100%) 全部合格，新增 `FAQPage` 結構化資料 100% 驗證通過。
  - `output/audit_mobile_rwd.js`：48 組情境（360px~414px）實機驗收，**橫向滾動溢出嚴格為 0px**，觸控缺陷數為 **0 項**。
  - `output/test_pwa_offline.js`：全站 13/13 頁在完全斷網模擬下 **100% 秒開離線可用**。

**2026-10-24（前一輪）— 階段二十五：房東包租代管節稅效益與實質收益試算神器 (`tax-calculator.html`) 完整研發與全站整合**
- **第 13 款核心工具 `tax-calculator.html`（`css/tax-calculator.css` ＋ `js/tax-calculator.js`）**：
  - **精算三大稅負減免引擎（租賃專法第 17 條 ＋ 囤房稅 2.0 新制）**：
    - **綜合所得稅**：每屋每月最高 **NT$ 15,000 元** 租金免稅額（年免稅 18 萬元），超過部分必要費用率提升至 **60%**（自租僅 43%）；支援 5 大所得稅級距（5%, 12%, 20%, 30%, 40%）動態試算。
    - **房屋稅**：自租非自住 2.0%~4.8%（申報租賃預設 2.4%），委託包租代管減徵比照自住稅率 **1.2%**，省稅達 50%。
    - **地價稅**：自租一般用地 10‰ (1.0%)，委託包租代管減徵比照自用住宅優惠稅率 **2‰ (0.2%)**，省稅達整整 80%。
    - **全年總節稅金牌 Hero 徽章**：大字醒目呈現「每年為您省下稅金 NT$ XX,XXX 元」。
  - **三大方案實質全年度總淨得大 PK（扣除稅費與空置後的口袋實拿金額）**：
    - **方案 1：房東自行出租**（扣除平均 1~2 個月空置期無租金損失 + 自租三大重稅）。
    - **方案 2：港居精緻代管**（扣除 12% 代管服務費 + 享有三大稅負減免，專業審客快速出租，實質淨得反超自租）。
    - **方案 3：港居住宅全包租**（全年 12 個月 100% 保證撥款 88% + 零空置期風險 + 享有三大稅負減免，旱澇保收最省心）。
    - 具備 CSS 動態能量柱狀圖（Visual Bar），即時動態伸縮與比例對照。
  - **一鍵行動轉化與 A4 診斷書輸出**：
    - **LINE 深度帶參諮詢**：一鍵將月租金、綜所稅率、試算節稅額、代管實得金額組裝為 LINE 訊息深層連結，點擊直達陳俊銘經理對話視窗。
    - **A4 節稅診斷書無痕列印**：`@media print` 隱藏導覽列與背景，標準印出正式資產評估單與公司證照資訊。
    - **一鍵複製摘要**：純文字摘要便於跨平台分享。
  - **包租代管節稅小百科與常見 Q&A 專區**：
    - 針對 300 億租金補貼查稅風險、囤房稅 2.0 申報與包租代管方案挑選提供權威說明。
- **全站導覽互通、PWA 54 項資產 100% 離線可用與極限驗收**：
  - 全站其餘 11 頁導覽選單全數統一補齊 `tax-calculator.html`（房東節稅試算），達成全站 13 頁 100% 互通。
  - `index.html` 首頁 ROI 收益試算器與服務方案雙卡增加全包租模式選項與節稅試算器直接跳轉捷徑，頁尾服務清單補齊連結。
  - `sw.js` 快取版本升級至 `ganju-pwa-v1.2`，預載資產擴增至 54 項。
  - 經 `output/audit_site_specs.py` 稽核：全站 13/13 頁 (100%) 全部合格，0 失效連結。
  - 經 `output/audit_mobile_rwd.js` 實機 48 組情境驗收：全站橫向溢出嚴格為 **0px**，所有可點擊互動元素 100% 符合 WCAG $\ge 44\times 44$px 觸控熱區標準。
  - 經 `output/test_pwa_offline.js` 完全斷網模擬：全站 **13/13 頁 (100%) 全部成功秒開離線運作**。

**2026-10-24（前一輪）— 階段二十四：租賃契約與住戶公約線上套印產生器 (`lease-contract.html`) 完整研發與全站整合**
- **第 12 款核心工具 `lease-contract.html`（`css/lease-contract.css` ＋ `js/lease-contract.js`）**：
  - **雙欄即時連動工作台**：左側 440px 表單面板（立約人、標的租期、租金費用、特約公約、設備點交 5 大分頁）與右側真實 A4 仿真紙張預覽（`210mm × 297mm`）雙向即時連動。
  - **法律級資料模型與自動換算**：
    - 中文金額大寫全自動演算法轉換（如 `NT$15,000` ➔ `新台幣壹萬伍仟元整`、押金自動換算 `新台幣參萬元整`）。
    - 搬遷免租期自動天數計算、正式租期年/月自動換算、民國紀年轉換。
    - 出租人（甲方）港居官方資料（統編 `96797997`、郵局帳號）預設綁定；承租人、共同承租人、連帶保證人、雙緊急聯絡人完整欄位。
    - 大樓管理費與水電獨立分錶每度計費連動。
    - 嚴禁室內吸菸/加熱菸/拜拜香薰條款（違約金 NT$ 10,000 元）。
    - 寵物飼養條款（退租冷氣清洗分擔費 NT$ 1,250 元/台）。
    - 凶宅防範懲罰性違約金（NT$ 3,000,000 元整）與重大緊急事故授權破門排險條款。
    - 入住前 7 日管線阻塞責任切分、3M 無痕掛鉤損壞每處賠償 NT$ 500 元。
    - 【附表一】通用標準住戶公約（Master 版完整 27 條款）同步排版與開關。
    - 【附表二】房屋附屬設備與屋況點交清冊（含起租電表與水表度數）。
  - **無痕 A4 列印與資料備份**：
    - `@media print` 徹底隱藏全站 Navbar、Footer、表單側欄與懸浮按鈕，以標準 12pt Serif 字體精準列印 A4 合約紙張與簽署用印格。
    - LocalStorage 草稿即時自動存取（`ganju_lease_contract_draft`），一鍵載入示範範本、JSON 備份下載與匯入功能。
- **全站導覽互通與 PWA 51 項核心資產 100% 離線可用**：
  - 全站 11 頁導覽選單全數統一補齊 `lease-contract.html` 項目，達成全站 12 頁導覽 100% 互通。
  - `sw.js` 預載快取資產擴增至 51 項，經 `output/test_pwa_offline.js` 完全斷網實測，全站 **12/12 頁 (100%) 全部成功秒開離線運作**。
  - 經 CDP 44 組行動端斷點（360px、375px、390px、414px）實機驗收，全站橫向溢出嚴格為 **0px**，所有互動按鈕與輸入項 100% 符合 WCAG $\ge 44\times 44$px 觸控標準。

**2026-10-24（前一輪）— 階段二十三：港居 3D 智慧營運島（數位孿生）全站整合與 11 頁 100% 離線支援**
- **遠端 3D 智慧營運島功能合併與首頁專區落地（`island.html` ＋ `island_standalone.html`）**：
  - 順暢合併遠端提交 `808c406`，首頁正式上線「3D 智慧營運島（數位孿生）」專區（#digital-twin）與即時 iframe 預覽體驗。
  - 12 座營運六角島、48 項專業服務矩陣與 10 條智慧協作流完整於瀏覽器本地 WebGL 運行。
- **全站選單互通與合規整合**：
  - 全站其餘 9 款工具頁導覽列「線上工具」下拉選單全數統一補齊 `island.html` 項目，達成全站 11 頁導覽 100% 互通。
  - `island.html` 整合回官網按鈕（`./index.html`，符合 ≥44px 觸控標準）、PWA 核心 Meta 標籤、`manifest.json` 與 Schema.org `WebApplication` ＋ `BreadcrumbList` 結構化資料。
- **PWA 48 項資產離線秒開與 0px 溢出雙重驗證**：
  - `sw.js` 擴增 `./island.html` 預載快取（核心資產達 48 項）。
  - 通過 `output/test_pwa_offline.js` 完全斷網模擬實測，全站 **11/11 頁 (100%) 全部成功秒開離線運作**。
  - 通過 CDP 40 組行動端斷點驗證，包含首頁新區塊與 `island.html` 在 360px~414px 下橫向溢出嚴格為 **0px**。

**2026-10-24（前一輪）— 階段二十二：全站 PWA 漸進式應用支援與案場 100% 離線可用性達成**
- **全站 PWA 與原生 App 安裝體驗落地（`manifest.json` ＋ `assets/icons/` ＋ `js/pwa.js`）**：
  - 產出標準 Web App Manifest，配置全螢幕 `standalone` 模式、海軍藍/香檳金主題規範與 4 大核心工具快速捷徑（空間格局、租金換算、EXIF水印、OCR翻譯）。
  - 使用 Python Pillow 與 Noto Sans CJK TC 字型生成全套標準解析度與 Maskable 圖示（192×192、512×512、apple-touch-icon 180×180、favicon-32×32），建築屋頂輪廓線結合品牌尊榮排版。
  - 撰寫 `js/pwa.js`：攔截 `beforeinstallprompt` 提供優雅不打擾之原生安裝卡片（符合 ≥44px 觸控熱區）；即時監聽 `online`/`offline` 網路狀態並於完全斷網時浮動提示離線模式徽章。
  - 全站 10 頁全面整合 PWA Meta 標籤與 `js/pwa.js` 模組。
- **Service Worker 47 項核心資產預載與智慧快取（`sw.js`）**：
  - 安裝階段預先快取全站 10 頁 HTML、全套 CSS Tokens、模組化 JS 引擎與核心圖資（47 項精準資產）。
  - HTML 頁面採用 Network-First with Cache Fallback，網路暢通時保障版本即時更新，在地下室或高樓無基地台訊號時自動降級由 Service Worker 快取秒開。
  - 靜態資源與第三方 CDN 採用 Stale-While-Revalidate 動態擴充快取。
- **自動化離線實機驗收（`output/test_pwa_offline.js`）**：
  - 使用 CDP 協議執行 `Network.emulateNetworkConditions({ offline: true })` 進行 100% 斷網實機檢驗。
  - **成果**：全站 10 大頁面在完全斷網狀態下 **10/10 頁 (100%) 全部成功載入並正常運作**；CDP 行動端回歸驗收確認 0px 橫向溢出與 0 觸控缺陷保持完美。

**2026-10-23（前一輪）— 階段二十一：全站 10 款線上工具行動端（360px~414px）實機極限驗收與觸控熱區 100% 完美達標**
- **自動化實機檢測架構（`output/audit_mobile_rwd.js`）**：
  - 打造基於 Node.js 內建 http + WebSocket + Chrome DevTools Protocol (CDP) 的自動化行動端檢測引擎，零外部套件依賴。
  - 針對全站 10 大頁面（`index.html` 與 9 款線上工具）在 4 大主流行動端視窗（360px Galaxy S8、375px iPhone SE、390px iPhone 14、414px iPhone Plus，共 40 組測試情境）進行真實 Touch 模擬與幾何 Bounds 深度掃描。
- **橫向滾動溢出（Horizontal Overflow）**：
  - 全站 10 大頁面在 360px 至 414px 下，橫向溢出全部嚴格為 **0 px (100% 完美無橫向滾動)**。
- **觸控熱區標準化（WCAG 2.1 AA / 2.2 SC 2.5.8 ≥ 44×44px）**：
  - 針對實測中發現小於 44px 之按鈕、標籤與原生控制項進行精準修復：
    - `css/components.css`：修復 `@media (max-width: 576px)` 下 `.brand-logo` 被壓縮之問題，鎖定 `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center;`；加入全域原生控制項規範，規範 `input[type="color"]`, `.form-control-color`, `input[type="range"]` 之 `min-height: 44px`。
    - `css/id-card-watermark.css`：修訂 `.btn-small` 為 `min-height: 44px !important; padding: 10px 14px !important;`，顏色選擇器升級至 44px。
    - `css/image-converter.css`：`.btn-pill` 與 `.card-action-btn` 升級 `min-height: 44px; min-width: 44px; padding: 8px 16px;`。
    - `css/photo-time-location.css`：`.chip-btn` 升級 `min-height: 44px; padding: 8px 14px;`。
    - `css/ocr-translator.css` ＋ `ocr-translator.html`：`.sample-chip`、`.tool-btn`、`.action-icon-btn`、`.lang-select`、`.swap-lang-btn` 與 `#btn-translate` 全面升級至 ≥ 44×44px。
    - `space-planner.html` ＋ `css/space-planner.css`：`select#globalFloorSelect` 升級 `min-height: 44px`，`.inline-field`（如 `chkCutawayWall` 標籤）賦予 `min-height: 44px`。
    - 依據 WCAG 2.2 SC 2.5.8 控制項關聯標籤規則，合規認列具備 `min-height: 44px` 之父階/關聯 `<label>`（如隱私權勾選框與格線磁吸開關）。
  - **驗收成果**：40 組測試檢驗結果 **10/10 頁面 (100%) 全部「✅ 完美合格」**，缺陷項目數為 **0**。

**2026-10-23（前一輪）— 階段十九與階段二十：穩發漁業集團官網建置 ＋ Google Rich Results 全站 10 頁結構化資料 100% 實測通過**
- **階段十九：穩發漁業集團官網建置實施（`output/winfar-website/`）**：
  - 完整建立獨立企業官方形象站（`index.html` 65KB、`styles.css` 24KB、`script.js` 28KB），具備玻璃擬態（Glassmorphism）與深海科技藍/香檳金配色。
  - 核心模組落地：四大遠洋船隊切換（鮪延繩釣／鰹鮪圍網／魷秋兼營／超低溫運搬船）、穩大 -60°C 極速凍結倉儲冷鏈、ESG 責任漁業與保育、半世紀大事紀。
  - 媒體中心整合：10 部船隊影音 Modal 播放、10 篇新聞報導 Markdown 即時彈窗閱讀、10 張高清實景圖；B2B 大宗水產詢價表單；置入 `Corporation` JSON-LD 結構化資料；修復健康檢查工具相容性。
- **階段二十：Google Rich Results Test 全站 10 頁結構化資料 100% 合規**：
  - 補齊 `card-merger.html` 缺漏之 `offers`（0元 TWD）與 `inLanguage`，升級 `photo-time-location.html` 品牌提供者標記。
  - 首頁 `index.html` 增補 `WebSite` 官方站點 Schema，並移除無精確依據之 `geo` 座標以嚴格遵守「結構化資料寧缺勿假」合規原則。
  - 全站 9 款線上工具全數補齊 Google 官方階層式 `BreadcrumbList`（港居不動產 > 工具名稱），提升搜尋結果呈現品質。
  - 撰寫自動化檢驗程式 `output/test_google_rich_results.py`，全站 10 頁本機與部署版本 100% 一致無誤。
- **空間格局系統功能深化（家具自訂長寬高與色彩風格＋5大3D地面材質＋591高質感行銷宣傳圖出圖）**：
  - **家具自訂長寬高與色彩調色盤**：長寬高精準微調（20~280cm），內建 6 款專用色彩風格預設（原木、胡桃木、海軍藍、香檳金、石墨灰、米白）與原生調色盤，2D 畫布與 3D WebGL 模型同步即時著色。
  - **5 大擬真地面鋪設材質**：溫潤淺橡木、沉穩深胡桃木、60×60 奢華石英磚、淺灰微水泥、經典黑白石材，支援頂部工具列全室一鍵切換與房間個別獨立指定，Canvas Procedural Texture 程序化貼圖無外部圖檔依賴，內顯筆電 60 FPS 流暢運行。
  - **✨ 2400×1600 高質感租賃行銷宣傳圖出圖**：專為 591 / FB / LINE 物件刊登打造，自動採用設計師柔和粉彩色塊、家具立體陰影、空間坪數摘要表、隨附家具設備清單、採光方位與港居品牌經理人服務專線（0968-863-880）與法定證號，一鍵產出即為可直接發布之精緻宣傳海報。
- **2D Canvas 殘影修正（徹底解決 ANSI31 剖面線外溢問題）**：
  - 診斷出原 `drawWallsWithANSI31Hatch2D` 因 `ctx.clip()` 後 `ctx.restore()` 未能自動恢復原始多邊形路徑，導致後續 `ctx.stroke()` 將剖面斜線誤描為粗黑邊框外溢至全畫布。
  - 全面升級改用標準 `Path2D` 封閉多邊形架構，透過 `ctx.clip(wallPath)` 嚴格鎖定剖面線於牆體幾何內，並以 `ctx.stroke(wallPath)` 繪製邊框；於 `render2DCanvas` 開頭加入 `ctx.clearRect` 清除像素緩衝，經實測驗證殘影 100% 消除，2D 畫布呈現晶透清爽之專業工程級線條。
- **產出同仁操作使用手冊（線上即時 Modal ＋ 離線 Markdown 雙管齊下）**：
  - 於 `output/2D_3D_空間格局配置系統_使用操作手冊.md` 編撰完整業務與工務 SOP 說明文件（涵蓋四大模組步驟圖解、11 款人體工學家具尺寸依據、85cm 動線防呆、3D 娃娃屋剖切漫遊與常見 FAQ）。
  - 於 `space-planner.html` 頂部工具列整合醒目「💡 使用手冊」按鈕與互動式 Modal，包含「5分鐘快速上手」、「四大核心模組」、「鍵盤快捷鍵」與「常見問題 FAQ」四分頁，同仁可在線上邊規劃邊速查。

**2026-10-23（前一輪）— 新增第 10 個核心工具：Web 端互動式 2D 平面格局配置與 3D 即時轉換系統 (`space-planner.html`)**

- **第 10 個頁面 `space-planner.html`（`css/space-planner.css` ＋ `js/space-planner.js`）**：
  - **模組一（既有外牆建置與底圖描繪）**：支援上傳既有平面圖／手繪草圖（JPG/PNG/WEBP）作為半透明底圖，拉一條基準線並輸入實際長度（cm）自動完成全圖比例尺校正；支援 10cm 格線吸附、端點磁吸、90° 正交鎖定拉線繪牆；區分「既有鎖定外牆（20/24cm）」與「室內可調隔間牆（10/12/15cm）」，渲染標準 CAD 45° 雙斜線剖面填充（ANSI31 Hatch），門窗嵌入自動打斷牆線並繪製 90° 開啟弧線。
  - **模組二（玄關連動與參數化自動隔間）**：支援在外牆自由拖曳「🚪 入口玄關大門」、切換「☀️ 既有開窗採光面」與自由拖曳「🚰 固定水電管道間」；依公私領域拓撲（玄關 → 客餐廳 → 採光臥室／管道間衛廚）即時演算生成 3 組室內隔間配置方案；支援免 CAD 指令滑鼠拖拉室內隔間牆、點擊畫布尺寸標籤直接輸入目標淨寬（cm），即時更新各空間名稱與坪數換算（$1\text{ m}^2 = 0.3025\text{ 坪}$）。
  - **模組三（標準 CAD 家具圖塊庫與自動避讓）**：內建 11 款人體工學比例 2D CAD 圖塊與對應 3D 模型（雙人床、單人床、系統衣櫃、書桌椅、三人沙發、茶几、四人餐桌椅、單體馬桶、洗手面盆、淋浴間、一字型流理台）；支援依房間屬性一鍵配置全室家具、靠近牆面自動貼齊轉向（Auto-Align），並即時檢測門扇開啟迴轉半徑（85~100cm）與家具重疊，發生衝突時以紅框與狀態列警示。
  - **模組四（多方案切換、一鍵轉 3D 與成品出圖）**：單一 JSON Schema 支援「原始屋況 / 方案 A / 方案 B」多版本切換、複製與指標比對表；支援「2D 平面」、「2D+3D 左右同步雙視窗」、「3D 立體預覽」，以 Three.js (WebGL) 低多邊形程序化幾何依設定樓高（預設 300cm）垂直擠出牆體、自動挖空門洞（210cm）與窗洞（檯度 90cm），確保無獨顯文書筆電維持 60 FPS；支援「俯視娃娃屋視角（自動半降剖切外牆）」與「室內第一人稱 WASD 漫遊視角（眼高 165cm）」；支援匯出附帶尺寸、空間名稱、坪數統計表、指北針與港居浮水印之 PNG / SVG / PDF A4 格局圖，以及 LocalStorage 儲存、JSON 匯出入與 URL Hash 唯讀分享連結。
- **全站選單與規範同步**：
  - 全站 10 頁導覽列「線上工具」下拉選單全數納入 `space-planner.html`（`2D/3D 格局配置`）。
  - 產出完整技術規格書 `output/2D_3D_空間格局配置系統技術規格書.md`。
  - 通過 `output/audit_site_specs.py` 全站 10 頁 100% 合格驗證與 `output/run_security_audit.py` 零新增資安風險驗證。

---

## 🚦 目前狀態

- ✅ **可運行**：14 個頁面均可正常操作，純靜態免建置即可於本地與 GitHub Pages 流暢運行。
- ✅ **版面**：全站頁面在 360px 極限螢幕下橫向溢出嚴格為 0px，觸控熱區皆 ≥ 44×44px。
- ✅ **JS**：零語法與執行期錯誤；安全 DOM 操作與資料綁定。
- ✅ **導覽**：全站工具頁「線上工具」下拉選單皆含全部 13 款工具＋3D營運島（14/14 頁面全面互通）。
- ✅ **離線 PWA**：`sw.js` 預載 57 項核心資產，14/14 頁 (100%) 在完全斷網模擬下秒開可用。
- ✅ **深色模式**：全站文字與底色對比皆符合 WCAG 2.1 AA 級標準，100% 繼承 `css/tokens.css`。

---

## 📄 已上線頁面全景速覽 (全 14 頁)

| # | 頁面 | 功能說明 | JSON-LD |
|---|---|---|---|
| 1 | `index.html` | TopBar 登記證號、Hero、包租 vs 代管方案、ROI 試算器、3D營運島專區、第 33 條法定揭示、房源區、蜜罐防洗 Lead 表單、FAQ 手風琴 | `RealEstateAgent`, `WebSite`, `FAQPage` |
| 2 | `rent-calculator.html` | 30日／當月實際／自訂基準天數、跨月區間、代管費與屋主實收拆分、LocalStorage 歷史 | `WebApplication` (FinanceApplication) |
| 3 | `file-converter.html` | PDF/DOCX/PNG/JPG/WEBP/MP3/MP4/ZIP 瀏覽器端本地轉檔與歷史紀錄 | `WebApplication` (UtilitiesApplication) |
| 4 | `photo-watermark.html` | 房源巡檢照 EXIF 時間戳記與品牌浮水印批次合成（常駐深色工作台） | `WebApplication` (MultimediaApplication) |
| 5 | `id-card-watermark.html` | 身份證照裁剪與租賃用途水印（常駐深色工作台） | `WebApplication` (UtilitiesApplication) |
| 6 | `image-converter.html` | JPG, PNG, WEBP, GIF, SVG, BMP 六大格式雙向互轉、最多 20 張、尺寸調控與 ZIP 打包 | `WebApplication` (MultimediaApplication) |
| 7 | `card-merger.html` | 名片正反面/上下對齊拼貼合成、留白與背景色控制、高畫質 JPG 匯出 | `WebApplication` (GraphicsApplication) |
| 8 | `photo-time-location.html` | 照片時間與地點浮水印（EXIF 時間/GPS 解析、自訂時間地點、三樣式五位置合成、ZIP 打包） | `WebApplication` (MultimediaApplication) |
| 9 | `ocr-translator.html` | 照片 OCR 文字辨識與多國語言即時翻譯神器（99%+ 雙引擎、ROI 區域框選、智慧詞庫校對、語音朗讀） | `WebApplication` (UtilitiesApplication) |
| 10 | `space-planner.html` | Web 端互動式 2D 平面格局配置與 3D 即時轉換系統（底圖比例尺校正、玄關連動自動隔間、CAD 家具防呆、60FPS 3D 娃娃屋與漫遊、PNG/SVG/PDF 出圖） | `WebApplication` (DesignApplication) |
| 11 | `island.html` | 港居 3D 智慧營運島（數位孿生微縮世界，12座六角島、48項服務矩陣、10條協作流、繁中語音導覽） | `WebApplication` (BusinessApplication) |
| 12 | `lease-contract.html` | 租賃契約與住戶公約線上套印產生器（雙欄即時連動、中文大寫自動轉換、搬遷免租期、水電度數計費、凶宅防範300萬違約金、27項住戶公約、A4無痕列印與PDF匯出） | `WebApplication` (BusinessApplication) |
| 13 | `tax-calculator.html` | 房東節稅與包租代管實質淨收益試算神器（租賃專法1.5萬免稅額+60%費用率、囤房稅2.0減半1.2%、地價稅0.2%、自租/代管/全包租三大方案實質淨得大PK、A4診斷書列印與LINE諮詢） | `WebApplication` (FinanceApplication) |
| 14 | `repair-inspection.html` | 租賃修繕點交與屋況瑕疵存證紀錄神器（租賃專法第11條與民法第429/432條、起租/退租/修繕三大模式、相機時間存證浮水印、四級責任判定、水電指針、雙畫布電子手寫簽章、A4存證書匯出與LINE回傳） | `WebApplication` (BusinessApplication) |

---

## 🔗 線上營運與倉庫網址

- **GitHub 遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`
- **GitHub Pages 網址**：`https://ganggo880.github.io/ganju-website/`
- **系統技術規格書**：`output/SPECIFICATION.md`、`output/2D_3D_空間格局配置系統技術規格書.md`
- **資安架構指南**：`output/information_security_architecture_guide.md`

## 🕐 最後更新

- 時間：2026-10-24 19:48
- 更新者：Antigravity Agent @ Linux
- 狀態：完成第 14 款線上工具 `repair-inspection.html`（租賃修繕點交與屋況瑕疵存證紀錄神器）正式上線與全站整合，包含浮水印相機壓印、水電指針、雙電子簽章、A4 存證書輸出、全站 14 頁全面互通，PWA 57 項核心資產 100% 離線可用，行動端 52 組情境 360px~414px 零溢出與 0 觸控缺陷全數通過。
