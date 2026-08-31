# 港居不動產開發有限公司 官方網站與線上工具系統技術規格書
## System Specification Document (2026 完整全功能版)

> **版本**：v2.5 (2026-09 最新修訂版)  
> **系統名稱**：港居不動產品牌官網暨高階線上工具集  
> **發布網址**：[https://ganggo880.github.io/ganju-website/](https://ganggo880.github.io/ganju-website/)  
> **遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`  
> **架構特性**：純前端靜態無伺服器 (Zero-Backend Serverless)、純本地零知識運算 (Zero-Knowledge Privacy)、模組化 CSS Design Tokens、全站 RWD 響應式、全頁 Schema.org 結構化資料。

---

## 1. 企業背景與特許背書 (Company Profile & Licensing)

本系統為「**港居不動產開發有限公司**」專屬之品牌官方網站與 8 款不動產專業線上工具集，旨在為注重物業質感的屋主與高階租客（外商主管、科技工程師、金融醫療菁英）提供最值得信賴的包租代管線上體驗。

| 項目 | 官方登記資料 |
|---|---|
| **公司全銜** | 港居不動產開發有限公司 (GANJU Real Estate Co., Ltd.) |
| **統一編號** | `96797997` |
| **營業員證號** | `(108) 登字第354198號` |
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

## 3. 系統架構與全站 9 大核心頁面清單

系統由 **1 個品牌官網主頁** 與 **8 個不動產專業線上工具** 組成，全站共用一組設計 Token 與模組化 JavaScript：

```
Matt Pocock skills/
├── index.html                  # 1. 品牌官方網站首頁 (Hero, 方案比較, ROI 試算, 3D VR 房源, 表單)
├── rent-calculator.html        # 2. 租金與 10% 代管服務費換算工具 (多基準天數、跨月拆分)
├── file-converter.html         # 3. 線上多功能檔案轉換神器 (PDF/DOCX/PNG/MP3/MP4/ZIP 本地轉檔)
├── photo-watermark.html        # 4. 房源照片 EXIF 時間戳記與防盜水印工具 (深色工作台)
├── id-card-watermark.html      # 5. 身份證照裁剪與租賃用途防偽水印工具 (深色工作台)
├── image-converter.html        # 6. 圖像格式與尺寸轉換神器 (JPG/PNG/WEBP/GIF/SVG/BMP 互轉與壓縮)
├── card-merger.html            # 7. 名片正反面／上下拼貼合成神器 (留白調整與高畫質匯出)
├── photo-time-location.html    # 8. 照片時間與地點浮水印工具 (EXIF/GPS 自動解析、三樣式五位置)
├── ocr-translator.html         # 9. 照片 OCR 文字辨識與多國語言翻譯神器 (99%+ 雙引擎、ROI 框選、詞庫校正)
├── .nojekyll                   # 停用 GitHub Pages Jekyll 編譯
├── css/
│   ├── tokens.css              # 全站設計 Token (海軍藍/香檳金/字型/陰影/深淺變數)
│   ├── components.css          # 全站共用組件 (TopBar, Navbar, Footer, Buttons, Toast, 下拉選單)
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
│   ├── ocr-translator.js       # OCR 雙引擎核心與影像處理邏輯
│   ├── converter.js            # 檔案轉換核心 (Canvas / Blob 本地運算)
│   ├── image-converter.js      # 圖像格式與尺寸調控邏輯
│   ├── card-merger.js          # 名片正反面合成邏輯
│   ├── photo-time-location.js  # 照片時間地點浮水印渲染邏輯
│   └── watermark-app.js        # EXIF 水印工具邏輯
├── assets/                     # 品牌標誌 (logo.png) 與房源實景照片
└── output/                     # 規格書、技術指南與產出檔案歸檔目錄
```

---

## 4. 全頁面功能規格詳解 (Detailed Feature Specs)

### 4.1 品牌官網首頁 (`index.html`)
- **頂部宣告條 (`.top-bar`)**：標註特許證號、統一編號與經理人專線。
- **導覽列 (`.navbar`)**：置頂黏著導覽，整合「線上工具」下拉選單（8 頁一致）、深淺切換與預約評估按鈕。
- **Hero 品牌視覺區**：展示「讓優質資產，穩健增值；免改裝直上，省心收益」標語與雙吉祥物卡片。
- **包租 vs 代管方案雙卡**：清晰對比服務費率、風險承擔與維護責任。
- **動態 ROI 收益試算器**：滑動月租金即時試算全年毛收益與代管費明細。
- **精選房源與 3D VR 導覽**：小港、前鎮、鳳山多條件篩選與寵物友善標籤。

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
2. **觸控熱區規範 (Touch Target)**：
   - 全站所有按鈕、選單項目、輸入框之點擊感應範圍一律 **≥ 44×44px**（按鈕 min-height 48px）。
3. **橫向溢出防護**：
   - 360px 極限螢幕下，全域 `overflow-x: hidden`，橫向溢出嚴格為 **0px**。
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

全站 9 大頁面皆完整配置 Google 官方認可之 JSON-LD 結構化資料：

| 頁面 | Schema.org 類型 | 核心欄位 |
|---|---|---|
| `index.html` | `RealEstateAgent` | `name`, `taxID`, `telephone`, `address`, `offers`, `openingHours` |
| `rent-calculator.html` | `WebApplication` (FinanceApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `file-converter.html` | `WebApplication` (UtilitiesApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `photo-watermark.html` | `WebApplication` (MultimediaApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `id-card-watermark.html`| `WebApplication` (UtilitiesApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `image-converter.html` | `WebApplication` (MultimediaApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `card-merger.html` | `WebApplication` (GraphicsApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `photo-time-location.html`| `WebApplication` (MultimediaApplication)| `applicationCategory`, `operatingSystem`, `offers`, `publisher` |
| `ocr-translator.html` | `WebApplication` (UtilitiesApplication) | `applicationCategory`, `operatingSystem`, `offers`, `publisher` |

---

## 9. 維護與版控流程規範 (Governance & Git Workflow)

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
