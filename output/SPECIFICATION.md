# 港居不動產開發有限公司 官方網站與線上工具系統技術規格書
## System Specification Document (2026 完整全功能版)

> **版本**：v2.8 (2026-10-24 房東包租代管節稅效益與實質收益試算神器上線版)  
> **系統名稱**：港居不動產品牌官網暨高階線上工具集  
> **發布網址**：[https://ganggo880.github.io/ganju-website/](https://ganggo880.github.io/ganju-website/)  
> **遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`  
> **架構特性**：純前端靜態無伺服器 (Zero-Backend Serverless)、純本地零知識運算 (Zero-Knowledge Privacy)、模組化 CSS Design Tokens、全站 360px~414px 行動端 0px 溢出與 100% ≥44px 觸控熱區合格、全頁 Schema.org 結構化資料、PWA 100% 離線可用。

---

## 1. 企業背景與登記背書 (Company Profile & Licensing)

本系統為「**港居不動產開發有限公司**」專屬之品牌官方網站與 12 款不動產專業線上工具集，旨在為注重物業質感的屋主與高階租客（外商主管、科技工程師、金融醫療菁英）提供最值得信賴的包租代管線上體驗。

| 項目 | 官方登記資料 |
|---|---|
| **公司全銜** | 港居不動產開發有限公司 (GANJU Real Estate Co., Ltd.) |
| **統一編號** | `96797997` |
| **租賃住宅管理證號** | `(112) 登字第013739號` |
| **經理人 / 負責人** | 陳俊銘 經理 / 不動產租賃管理師 |
| **服務專線** | 手機 `0968-863-880` / 市話 `07-791-2288` |
| **公司信箱** | `ganggo880@gmail.com` |
| **實體營業處** | 高雄市小港區合作里中安路825號 |
| **核心業務範疇** | • **包租業**：向房東承租住宅後轉租管理，全額承擔空置與管理風險，穩定收益。<br>• **代管業**：代理房東處理招租審客、簽約、租金代收、維修點交與糾紛協調。<br>• **不動產買賣與法拍代標**。 |

---

## 2. 三處同步對照表與部署資訊 (3-Way Sync & Deployment)

| 同步層級 | 平台 / 環境 | 實體路徑 / 網址 |
|---|---|---|
| **L1 本地工作目錄** | Google 雲端硬碟 | `g:\我的雲端硬碟\ai agent\Matt Pocock skills` |
| **L2 GitHub 倉庫** | GitHub 私有遠端 | `https://github.com/ganggo880/ganju-website.git` (main 分支) |
| **L2 生產發布環境** | GitHub Pages CDN | `https://ganggo880.github.io/ganju-website/` |
| **L3 第二大腦** | Obsidian Vault | `g:\我的雲端硬碟\ai agent\Matt Pocock skills\obsidian` |

---

## 3. 系統架構與全站 13 大核心頁面清單

系統由 **1 個品牌官網主頁** 與 **12 個不動產專業線上工具** 組成，全站共用一組設計 Token 與模組化 JavaScript：

```
Matt Pocock skills/
├── index.html                  # 1. 品牌官方網站首頁 (Hero, 方案比較, ROI 試算, 第33條揭示, 房源, 表單)
├── rent-calculator.html        # 2. 租金與代管服務費換算工具 (多基準天數、跨月拆分)
├── file-converter.html         # 3. 線上多功能檔案轉換神器 (PDF/DOCX/PNG/MP3/MP4/ZIP 本地轉檔)
├── photo-watermark.html        # 4. 房源照片 EXIF 時間戳記與防盜水印工具 (深色工作台)
├── id-card-watermark.html      # 5. 身份證照裁剪與租賃用途防偽水印工具 (深色工作台)
├── image-converter.html        # 6. 圖像格式與尺寸轉換神器 (JPG/PNG/WEBP/GIF/SVG/BMP 互轉與壓縮)
├── card-merger.html            # 7. 名片正反面／上下拼貼合成神器 (留白調整與高畫質匯出)
├── photo-time-location.html    # 8. 照片時間與地點浮水印工具 (EXIF/GPS 自動解析、三樣式五位置)
├── ocr-translator.html         # 9. 照片 OCR 文字辨識與多國語言翻譯神器 (99%+ 雙引擎、ROI 框選、詞庫校正)
├── space-planner.html          # 10. 2D 平面格局配置與 3D 即時轉換系統 (底圖校正、玄關連動隔間、CAD家具、60FPS 3D)
├── island.html                 # 11. 3D 智慧營運島 (數位孿生微縮世界，12六角島/48矩陣/10協作流)
├── island_standalone.html      # 11b. 3D 智慧營運島 (獨立全螢幕版本)
├── lease-contract.html         # 12. 租賃契約與住戶公約線上產生器 (雙欄即時連動、中文大寫、A4無痕列印)
├── tax-calculator.html         # 13. 房東節稅與包租代管實質淨收益試算 (租賃條例17條/囤房稅2.0/三方案PK)
├── .nojekyll                   # 停用 GitHub Pages Jekyll 編譯
├── css/
│   ├── tokens.css              # 全站設計 Token (海軍藍/香檳金/字型/陰影/深淺變數)
│   ├── components.css          # 全站共用組件 (TopBar, Navbar, Footer, Buttons, Toast, 下拉選單)
│   ├── space-planner.css       # 2D/3D 空間格局配置系統樣式
│   ├── lease-contract.css      # 租賃契約產生器樣式與 A4 排版引擎
│   ├── tax-calculator.css      # 房東節稅試算專屬樣式與 A4 診斷書列印引擎
│   ├── ocr-translator.css      # OCR 翻譯專屬樣式
│   ├── converter.css           # 檔案轉換工具專屬樣式
│   ├── image-converter.css     # 圖像轉換工具專屬樣式
│   ├── card-merger.css         # 名片合成工具專屬樣式
│   ├── photo-time-location.css # 照片時間地點浮水印樣式
│   └── id-card-watermark.css   # 身分證照裁剪樣式
├── js/
│   ├── utils.js                # 工具函式 (千分位、日期差、Toast、主題切換)
│   ├── navigation.js           # 首頁導覽列與行動端抽屜選單控制器
│   ├── layout.js               # 跨頁 Layout 控制與 Active 狀態點亮
│   ├── space-planner.js        # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── lease-contract.js       # 租賃契約雙向連動、中文大寫金額與 A4 排版引擎
│   ├── tax-calculator.js       # 房東節稅試算引擎、三方案 PK 與 LINE 深度帶參串接
│   ├── ocr-translator.js       # OCR 雙引擎核心與影像處理邏輯
│   ├── converter.js            # 檔案轉換核心 (Canvas / Blob 本地運算)
│   ├── image-converter.js      # 圖像格式與尺寸調控邏輯
│   ├── card-merger.js          # 名片正反面合成邏輯
│   ├── photo-time-location.js  # 照片時間地點浮水印渲染邏輯
│   └── watermark-app.js        # EXIF 水印工具邏輯
├── assets/                     # 品牌標誌 (logo.png) 與房源實景照片
└── output/                     # 規格書、技術指南與產出檔案歸檔目錄
    ├── winfar-website/         # 穩發漁業集團官方形象網站 (艦隊展示/冷鏈/影音新聞/B2B詢價)
    ├── SPECIFICATION.md        # 全站系統技術規格書 (本檔)
    └── 2D_3D_空間格局配置系統_使用操作手冊.md
```

---

## 4. 全頁面功能規格詳解 (Detailed Feature Specs)

### 4.1 品牌官網首頁 (`index.html`)
- **頂部宣告條 (`.top-bar`)**：標註特許證號、統一編號與經理人專線。
- **導覽列 (`.navbar`)**：置頂黏著導覽，整合「線上工具」下拉選單（13 頁一致）、深淺切換與預約評估按鈕。
- **Hero 品牌視覺區**：展示「讓優質資產，穩健增值；免改裝直上，省心收益」標語與雙吉祥物卡片。
- **包租 vs 代管方案雙卡**：清晰對比服務費率、風險承擔與維護責任。
- **動態 ROI 收益試算器**：滑動月租金即時試算全年毛收益與代管費明細，雙向跳轉節稅試算器。
- **3D 智慧營運島專區 (`#digital-twin`)**：純原生 WebGL 數位孿生微縮世界展示。
- **精選房源與 3D VR 導覽**：小港、前鎮、鳳山多條件篩選與寵物友善標籤。
- **房東常見問答 FAQ 手風琴 (`#faq`)**：6 大核心問答解答免改裝直上、包租 vs 代管挑選、節稅法規、欠租催收與工務修繕，配置 Google 官方 `FAQPage` 結構化資料。
- **Lead 資產評估預約表單 (`#contact`)**：隱形蜜罐 (Honeypot) 防機器人洗表單、LocalStorage 預約備份、尊榮預約成功確認彈窗 (`#bookingSuccessModal`)、一鍵直連 LINE 帶參深層傳送陳俊銘經理。
- **法定揭示專區 (`#disclosure`)**：租賃住宅服務業登記證、公會會員證書、管理人員證書、收費基準電子揭示。

### 4.2 租金與代管服務費換算工具 (`rent-calculator.html`)
- **三大基準天數**：固定 30 日/月、當月實際曆天數、自訂基準天數（如 36.5 天）。
- **跨月起迄區間精算**：支援多月份跨期精確權重天數拆算。
- **包租代管服務費率拆分**：自訂服務費率（預設 10%），試算屋主實收與港居服務費。
- **多幣別與捨入模式**：支援 TWD, HKD, CNY, USD 及四捨五入、無條件進位/捨去。

### 4.3 線上檔案轉換神器 (`file-converter.html`)
- **跨格式本機轉換**：文檔 (PDF/DOCX/HTML/TXT)、圖像 (PNG/JPG/WEBP/BMP/GIF)、音訊 (MP3/WAV/AAC)、視訊 (MP4/WEBP) 與 ZIP 壓縮包。
- **拖曳上傳與進度動畫**：支援 Drag & Drop 與一鍵下載。

### 4.4 房源照片 EXIF 水印工具 (`photo-watermark.html`)
- **自動 EXIF 解析**：讀取相機型號、ISO、快門、光圈與原始拍攝時間。
- **防盜浮水印合成**：全螢幕常駐深色工作台，支援批次加入品牌標誌與文字水印。

### 4.5 身份證照裁剪與租賃水印工具 (`id-card-watermark.html`)
- **專用防偽浮水印**：一鍵壓印「僅供港居不動產租賃使用，他用無效」旋轉文字。
- **個資遮蔽工具**：支援身分證號、出生年月日局部馬賽克與去識別化。

### 4.6 圖像格式與尺寸轉換神器 (`image-converter.html`)
- **多格式互轉**：JPG, PNG, WEBP, GIF, SVG, BMP 六大格式互轉。
- **批次處理**：支援最多 20 張照片批次轉換、原圖/大/中/小尺寸縮放與 ZIP 打包下載。

### 4.7 名片正反面／上下合成神器 (`card-merger.html`)
- **雙面拼貼**：支援「左右並排」與「上下垂直」雙模式對齊。
- **間距與背景調控**：自訂中縫間距、背景底色與高畫質 JPG/PNG 匯出。

### 4.8 照片時間與地點浮水印工具 (`photo-time-location.html`)
- **EXIF GPS 解析**：自動自相片萃取經緯度並轉換為地名標籤。
- **三種美學樣式**：質感印章、極簡打卡標籤、復古底片風格；五種畫面定位點。

### 4.9 照片 OCR 文字辨識與多國語言翻譯神器 (`ocr-translator.html`)
- **雙引擎架構**：
  - 🌟 **AI 雲端深度神經網路引擎**：準確率高達 **99%+**，專攻手機歪斜照、手寫字與招牌。
  - 🛡️ **本機極致超解析離線引擎**：2x 超解析度放大 + Sauvola 局部積分圖去陰影 + 邊緣銳化。
- **自由區域框選 (ROI Crop)**：滑鼠拖曳框選特定條款或欄位，零雜訊精準辨識。
- **不動產專業詞庫智慧校對**：自動修正「租貸➔租賃」、「代菅➔代管」、「統蝙➔統編」等光學混淆字。
- **即時多國語言翻譯與語音朗讀 (TTS)**：中/英/日/韓/越即時互譯與 .TXT/.MD 匯出。

### 4.10 Web 端互動式 2D 平面格局配置與 3D 即時轉換系統 (`space-planner.html`)
- **模組一（既有外牆建置與底圖描繪）**：底圖上傳與兩點基準線比例尺自動校正、10cm 格線與端點磁吸、90° 正交鎖定拉線繪牆、區分「既有鎖定外牆（20/24cm）」與「室內可調隔間牆（10/12/15cm）」、標準 CAD 45° 雙斜線剖面填充（ANSI31 Hatch）與門窗自動打斷及 90° 開啟弧線。
- **模組二（玄關連動與參數化自動隔間）**：支援自由拖曳「入口玄關大門」、「固定水電管道間」與切換「既有開窗採光面」；依公私領域拓撲即時演算生成 3 組室內隔間配置方案；支援免 CAD 指令滑鼠拖拉隔間牆、點擊尺寸直接輸入目標淨寬（cm），即時更新各空間名稱與換算坪數（$1\text{ m}^2 = 0.3025\text{ 坪}$）。
- **模組三（標準 CAD 家具圖塊庫與自訂色彩微調）**：內建 11 款人體工學比例 2D CAD 圖塊與對應 3D 模型、靠近牆面自動貼齊轉向（Auto-Align）、門扇開啟迴轉半徑（85~100cm）與走道重疊紅框警示；支援長寬高自訂（20~280cm）與 6 款色彩風格調色盤（海軍藍/原木/胡桃木/香檳金/石灰/米白/自選色），2D/3D 同步著色。
- **模組四（多方案切換、一鍵轉 3D 與租賃行銷出圖）**：單一 JSON Schema 支援「原始屋況 / 方案 A / 方案 B」多版本切換與指標比對表；Three.js (WebGL) 60 FPS 低多邊形 3D 即時擠出（預設樓高 300cm、門洞 210cm、窗台高 90cm），支援「俯視娃娃屋視角（自動半降剖切外牆）」與「室內第一人稱 WASD 漫遊視角」；支援 5 大地面鋪設材質（淺橡木/深胡桃/石英磚/微水泥/黑白石材）全室與房間獨立指定；一鍵匯出 PNG / SVG / PDF A4 工程圖紙，以及專為 591 / FB / LINE 刊登打造之「✨ 2400×1600 高質感租賃行銷宣傳圖」。
- **剖面殘影修復與同仁使用手冊**：以獨立 `Path2D` 嚴密隔離剖面斜線，徹底清除全螢幕斜線外溢；於頂部工具列整合「💡 使用手冊」四分頁互動式 Modal 並編撰獨立 SOP 文件。

### 4.11 穩發漁業集團官方形象網站 (`output/winfar-website/`)
- **遠洋船隊展示**：四大遠洋主力船隊切換展示（鮪延繩釣、鰹鮪圍網、魷釣秋刀魚兼營、超低溫冷凍運搬船）。
- **-60°C 極致冷鏈與 ESG 責任漁業**：穩大冷凍廠智慧倉儲、ISO 22000 / HACCP 國際品質認證、海鳥避撞繩與國際保育公約落實。
- **媒體與歷史專區**：半世紀 1974~2024 大事紀時間軸、10 部影音播放 Modal、10 篇新聞報導 Markdown 彈窗閱讀與 B2B 大宗水產詢價。
- **結構化資料**：配置 Schema.org `Corporation` 企業標記。

---

## 5. 視覺設計系統 (Design Tokens & UI/UX Standards)

### 5.1 品牌核心色彩
```css
:root {
  /* 品牌經典海軍藍 */
  --color-navy: #1A365D;
  --color-navy-dark: #0F2341;
  --color-navy-light: #2D4C7E;

  /* 尊榮香檳金 */
  --color-gold: #C5A059;
  --color-gold-dark: #B08C45;
  --color-gold-light: #DFCA9B;
  --bg-gold-light: #FDF9F2;

  /* 介面與文字 */
  --bg-body: #F8FAFC;
  --bg-card: #FFFFFF;
  --color-text-dark: #0F172A;
  --color-text-muted: #64748B;
  --border-color: #E2E8F0;
}

[data-theme="dark"] {
  --bg-body: #0A1628;
  --bg-card: #0F2341;
  --color-text-dark: #F8FAFC;
  --color-text-muted: #94A3B8;
  --border-color: rgba(197, 160, 89, 0.2);
}
```

### 5.2 陰影與圓角標準
- **按鈕圓角**：`border-radius: 50px`（膠囊圓角）
- **卡片圓角**：`border-radius: 16px` / `24px`
- **金色按鈕立體光暈**：`box-shadow: 0 10px 25px -4px rgba(197, 160, 89, 0.4)`

---

## 6. 響應式設計與無障礙標準 (RWD & Accessibility)

1. **斷點設定**：
   - 桌面端：`> 992px`（完整多欄 Grid）
   - 平板端：`768px ~ 992px`（雙欄折疊）
   - 行動端：`< 576px`（單欄垂直堆疊）
2. **觸控熱區規範 (Touch Target Size - WCAG 2.1 AA / 2.2 SC 2.5.8)**：
   - 全站所有按鈕、選單項目、輸入框、色彩選取器、滑桿、核取方塊感應標籤一律 **≥ 44×44px**（按鈕 min-height 48px / 44px，原生控制項封裝於關聯 label 或賦予 min-height 44px）。
   - 經 Chrome DevTools Protocol (CDP) 40 組測試實機檢驗，全站 10 頁 <44px 觸控缺陷數為 **0 項 (100% 合格)**。
3. **橫向溢出防護 (Zero-Overflow Guarantee)**：
   - 360px (Galaxy S8)、375px (iPhone SE)、390px (iPhone 14)、414px (iPhone Plus) 極限螢幕下，全站 10 頁橫向滾動溢出嚴格為 **0px**。
4. **色彩對比度**：
   - 淺色與深色模式之主要文字與底色對比度皆符合 **WCAG 2.1 AA 級標準 (≥ 4.5:1)**。

---

## 7. 資訊安全與防禦性架構 (Security & Defensive Architecture)

1. **純前端零知識運算 (Zero-Knowledge Client-Side Processing)**：
   - 檔案轉換、身分證裁剪、浮水印合成與本機 OCR 運算 100% 於使用者瀏覽器本地 Canvas / WebAssembly 內完成，**不將客戶個資與證件照片上傳至後端伺服器**。
2. **攻擊面最小化 (Attack Surface Reduction)**：
   - 零常駐資料庫、零伺服器後端漏洞暴露面，徹底根絕 SQL Injection 與伺服器滲透風險。
3. **CIA 三要素實踐**：
   - **機密性 (C)**：身分證浮水印遮蔽、本地記憶體即時釋放 (`revokeObjectURL`)。
   - **完整性 (I)**：靜態資源 CDN 雜湊校驗、合約文字結構化規範。
   - **可用性 (A)**：GitHub Pages 全球分散式 CDN 託管，防禦 DDoS 斷線風險。

---

## 8. SEO 與 Schema.org 結構化資料全覽 (Structured Data)

全站 10 大頁面皆完整配置 Google 官方認可之 JSON-LD 結構化資料：

| 頁面 | Schema.org 類型 | 核心欄位與特性 |
|---|---|---|
| `index.html` | `RealEstateAgent`, `WebSite`, `FAQPage` | `name`, `taxID`, `telephone`, `address`, `contactPoint`, `sameAs`, 6大常見問答 |
| `rent-calculator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `file-converter.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `photo-watermark.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `id-card-watermark.html`| `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `image-converter.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `card-merger.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `photo-time-location.html`| `WebApplication`, `BreadcrumbList`| `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `ocr-translator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `space-planner.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 麵包屑階層 |
| `island.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 數位孿生營運島 |
| `lease-contract.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 租賃契約與公約產生器 |
| `tax-calculator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 房東節稅與收益試算神器 |
| `output/winfar-website/` | `Corporation` | `name`, `foundingDate`, `founder`, `address`, `telephone`, `knowsAbout` |

---

## 9. PWA 漸進式網路應用與離線架構 (PWA & Offline First)

1. **Web App Manifest (`manifest.json`)**：
   - 品牌全銜與簡稱：`港居不動產｜包租代管與線上工具集` / `港居不動產`。
   - 顯示模式：`standalone`（全螢幕原生體驗，隱藏瀏覽器網址列）。
   - 色彩規範：`theme_color: #1A365D`、`background_color: #0F2341`。
   - 圖示庫：支援 192×192、512×512 之標準圖示與 Android Maskable 圖示，以及 Apple Touch Icon。
   - 快捷捷徑 (App Shortcuts)：直接跳轉 2D/3D 格局、租金試算、EXIF 水印與 OCR 翻譯。
2. **智慧 Service Worker 快取體系 (`sw.js`)**：
   - **Pre-caching**：安裝時預載全站 13 頁 HTML、全套 CSS Tokens、模組化 JS 引擎與品牌圖資（共 54 項核心資產）。
   - **導航請求 (Navigate)**：Network-First with Cache Fallback，網路在線時即時獲取最新修正，案場無訊號（地下室、高樓）自動回退至本機快取。
   - **靜態資源 (Assets/CDN)**：Stale-While-Revalidate 與動態快取，自動緩存 Three.js 與 FontAwesome 等第三方相依庫。
3. **原生安裝引導與連線監控 (`js/pwa.js`)**：
   - 攔截 `beforeinstallprompt` 提供符合品牌色系與 ≥ 44×44px 觸控標準之「免費安裝」提示卡片。
   - 監聽 `online` / `offline` 事件，斷網時浮動顯示離線指示徽章，連線恢復時 Toast 提示自動同步。
   - 經 CDP 實機模擬斷網驗收，全站 13 頁完全離線可用率達 **13/13 頁 (100%)**。

---

## 10. 租賃契約與住戶公約線上套印產生器系統規格 (`lease-contract.html`)

1. **雙欄即時連動架構**：
   - 左側編輯控制器（440px 寬度，分頁標籤：立約人、標的租期、租金費用、特約公約、設備點交）。
   - 右側 A4 仿真紙張預覽區（`210mm × 297mm`，多頁式連動，自動計算 3 或 4 頁排版）。
   - 行動端適應（360px~414px）：一鍵切換「填寫合約資料」與「預覽 A4 合約書」模式，完全零橫向溢出。
2. **法定與法規防護條款**：
   - 中文金額大寫自動換算引擎（如 `NT$15,000` ➔ `新台幣壹萬伍仟元整`、押金自動換算 `新台幣參萬元整`）。
   - 租賃期限與搬遷免租期自動天數運算。
   - 室內全區嚴禁吸菸、加熱菸與焚香拜拜（違約罰則 NT$ 10,000 元）。
   - 寵物飼養條款（冷氣清洗分擔費 NT$ 1,250 元/台）。
   - 凶宅防範懲罰性違約金（NT$ 3,000,000 元整）與重大緊急事故授權破門排險條款。
   - 【附表一】Master 通用標準住戶公約（27 項細目全條款）。
   - 【附表二】附屬設備與屋況點交清冊（含起租電表與水表度數）。
3. **無痕列印與備份機制**：
   - `@media print` 徹底隱藏 Navbar、Footer、表單側欄與懸浮按鈕，僅精準印出標準 A4 紙張與簽署印鑑處。
   - LocalStorage 草稿即時自動存取（`ganju_lease_contract_draft`），防止重整丟失。
   - 一鍵載入港居官方標準範本、JSON 備份下載與匯入功能。

---

## 11. 房東包租代管節稅效益與實質淨收益試算神器系統規格 (`tax-calculator.html`)

1. **法規公式與稅負減免引擎**：
   - **綜合所得稅（《租賃住宅市場發展及管理條例》第 17 條）**：
     - 每屋每月租金最高 **NT$ 15,000 元** 免稅額度（年免稅 18 萬元）。
     - 超過 15,000 元部分，必要費用率提高至 **60%**（自租僅 43%）。
     - 精算 5 大個人綜所稅級距（5%, 12%, 20%, 30%, 40%）之應稅所得與實質省稅額。
   - **房屋稅（囤房稅 2.0 新制）**：
     - 自租非自住稅率 2.0%~4.8%（申報租賃預設 2.4%）。
     - 委託包租代管地方自治條例減徵比照自住稅率 **1.2%**（省稅達 50%）。
   - **地價稅**：
     - 自租一般用地基本稅率 10‰ (1.0%)。
     - 委託包租代管減徵比照自用住宅用地優惠稅率 **2‰ (0.2%)**（減徵幅度整整 80%）。
2. **三大方案實質全年度淨收益對比 (Net Cash In Hand PK)**：
   - **方案 1：房東自行出租**（扣除平均 1~2 個月空置招租期無收入 + 自租三大重稅）。
   - **方案 2：港居精緻代管**（扣除 12% 服務費 + 三大稅負減徵，專業審客快速出租，淨得往往反超自租）。
   - **方案 3：港居全包租**（全年 12 個月保證撥款 88% + 零空置期風險 + 三大稅負減徵，極致省心旱澇保收）。
   - 視覺化能量比較條（CSS 動態 Flex Fill）與「委託港居比自租多賺多少」動態計算。
3. **行動轉化與資產評估報告匯出**：
   - **LINE 深度帶參諮詢**：一鍵產生帶有預估租金、綜所稅率、年節稅額與預約評估文字之深層 URL，點擊直達陳俊銘經理對話視窗。
   - **A4 診斷書無痕列印**：`@media print` 精準印出「港居不動產｜房東節稅效益與包租代管資產評估報告」。
   - **一鍵複製試算摘要**：格式化純文字便於跨平台分享與歸檔。

---

## 12. 租賃修繕點交與屋況瑕疵存證紀錄神器系統規格 (`repair-inspection.html`)

1. **法規基準與點交存證架構**：
   - **法規依據**：《租賃住宅市場發展及管理條例》第 11 條（租賃標的現況確認書與屋況點交）及民法第 429 條（出租人修繕義務）、第 432 條（承租人之善良管理人注意義務）。
   - **三大操作模式**：
     - `checkin`：起租交付點交確認書（詳細記錄初交付現況與瑕疵免責協議）。
     - `checkout`：退租返還核銷確認書（對比初驗現況、結算押金扣抵與責任歸屬）。
     - `repair`：租賃住宅修繕存證現況紀錄表（物業派工維修前後存證查驗）。
2. **分區查驗與時間浮水印壓印引擎**：
   - **六大標準空間分區**：玄關門廳、客廳公共區、主臥室寢居、廚房烹飪區、衛浴給排水、工作陽台。
   - **自適應縮圖與記憶體保護**：上傳手機相機照片（支援 1200 萬~4800 萬高畫素）自動在 Canvas 縮放至最長邊 1200px，防止行動瀏覽器記憶體崩潰。
   - **存證時間浮水印**：照片右下角自動壓印海軍藍漸層標籤、香檳金方塊裝飾與高對比白色文字：「港居不動產 屋況點交存證 ｜ YYYY-MM-DD HH:mm」。
   - **四級法律責任判定歸屬**：
     - 🟢 正常自然折舊（正常耗損，承租人免除賠償還原責任）
     - 🔵 出租人應行修繕改善（民法第429條法定修繕義務）
     - 🔴 承租人注意義務疏失（人為破壞或重大過失，應還原或自押金扣抵）
     - ⚪ 雙方合意現況點交（不修繕並載入協議）
3. **水電指針與雙方電子簽章**：
   - **能源儀表紀錄**：台電總表、獨立分表、自來水表、天然氣/瓦斯表精準度數登錄。
   - **高靈敏雙 Canvas 簽名板**：支援 Apple Pencil、電容筆與手指觸控，`touch-action: none` 防止滑動頁面干擾，Retina 2x 採樣高平滑抗鋸齒筆觸。
4. **報告匯出與資料流通**：
   - **無痕 A4 列印**：`@media print` 自適應直式排版，自動隱藏工具列與無關介面，附帶港居特許登記執照法定背書。
   - **LINE 深度帶參回報**：一鍵將標的地址、點交日期、水電度數與瑕疵統計匯編成專業文字發送至陳俊銘經理。
   - **JSON 匯入匯出與 LocalStorage 自動草稿備份**：完全前端本地處理，保障房東與租客個資隱私。

---

## 13. 全站 SEO 搜尋引擎架構與租務專欄深度閱讀系統規格

1. **搜尋引擎索引標準架構 (`sitemap.xml` ＋ `robots.txt`)**：
   - **`sitemap.xml`**：遵循 Sitemaps.org 0.9 協議，涵蓋全站 14 頁（品牌主頁、13 款線上工具與 3D 智慧營運島），嚴格配置標準 Canonical URL、`lastmod` (ISO 8601)、`changefreq` (weekly/monthly) 與權重等級（首頁 1.0、高階法規與節稅工具 0.9、空間格局與營運島 0.8、多媒體轉換 0.7）。
   - **`robots.txt`**：標準允許搜尋引擎爬取公開頁面，指向 Sitemap 絕對網址，並封鎖 `obsidian/`、`agent/`、`skills/` 等後台知識庫與系統目錄。
   - **HTML Sitemap 標記**：於 `<head>` 配置 `<link rel="sitemap" type="application/xml" title="Sitemap" href="...">`。
2. **租務與稅務專欄法規校正與深度閱讀彈窗 (`#articleModal`)**：
   - **法規數字校正**：將原舊文案徹底修正為現行法定標準：「每屋每月租金 15,000 元以下免稅，超過部分必要費用率高達 60%（《租賃住宅市場發展及管理條例》第 17 條）＋ 2024 囤房稅 2.0 房屋稅減半 1.2% 與地價稅 0.2% 減徵」。
   - **互動式深度閱讀彈窗**：
     - 淘汰舊有跳轉至聯絡表單之簡陋互動，點擊「閱讀全文」即刻開啟高質感海軍藍/香檳金專欄彈窗。
     - 具備文章標籤、作者（陳俊銘 經理 / 特許租賃住宅管理師）、發布日期、預估閱讀時間、重點摘要金牌卡（Key Takeaways）。
     - 專利轉化漏斗：文末配置專屬工具深度跳轉 CTA（如跳轉 `tax-calculator.html`、`space-planner.html`、`repair-inspection.html`），打造完整業務轉換閉環。
3. **Google `BlogPosting` 結構化資料**：
   - 於首頁 `<head>` 注入標準 `Blog` 包含 `BlogPosting` 結構化陣列，精確標記文章標題、發布日期、作者與描述，強化 SERP 文章摘要與 Google Discover 曝光。

---

## 14. 維護與版控流程規範 (Governance & Git Workflow)

1. **AI 產出統一歸檔**：所有新產出之技術指南、規格書與教材一律存入專案 `output/` 目錄。
2. **三處同步維護**：
   - 程式碼變更 ➔ 本地 Google Drive Git Repo。
   - 遠端備份 ➔ GitHub 私有倉庫 (`ganggo880/ganju-website`)。
   - 知識庫與決策紀錄 ➔ Obsidian 工作筆記 (`obsidian/港居不動產官網/`)。
3. **標準發布指令**：
   ```bash
   git status
   git add .
   git commit -m "feat/fix: 更新摘要說明"
   git push origin main
   ```
