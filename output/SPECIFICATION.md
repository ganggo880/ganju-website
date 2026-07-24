# 港居不動產開發有限公司 官方網站與在線工具系統技術規格書 (System Specification Document)

---

## 1. 系統概述 (System Overview)

本系統為「**港居不動產開發有限公司**」之品牌官方網站與全套不動產線上工具集。為提供注重物業質感的屋主與高階租客（如外商高管、科技業工程師、醫療與金融專業人士）最優質、安心的體驗，本系統採用響應式設計（RWD）、極致 UI/UX 視覺美學（海軍藍與香檳金品牌識別）與全端流暢互動邏輯。

### 1.1 企業與特許背書
- **公司名稱**：港居不動產開發有限公司 (GANJU Real Estate Co., Ltd.)
- **統一編號**：96797997
- **特許證號**：
  - 營業員證號：(108) 登字第354198號
  - 租賃管理證號：(112) 登字第013739號
- **業務類別**：
  - **租賃住宅包租業**：向房東承租房屋，承擔空置與管理風險，定期定額撥款。
  - **租賃住宅代管業**：作為房東代理人，處理招租、收租、修繕、糾紛協調與屋況還原。
  - **不動產買賣與法拍代標**。

---

## 2. 三處同步對照表與部署資訊 (3-Way Sync & Deployment)

| 項目 | 路徑 / 網址 |
|---|---|
| **本地專案路徑** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills` |
| **GitHub 遠端倉庫** | `https://github.com/ganggo880/ganju-website.git` |
| **Obsidian 第二大腦** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills\obsidian` |
| **GitHub Pages 部署網址** | `https://ganggo880.github.io/ganju-website/` |

---

## 3. 系統架構與檔案目錄 (Architecture & File Directory)

本專案採用前端模組化架構（HTML5 Semantic + CSS Design Tokens + ES6 JavaScript Modules）：

```
Matt Pocock skills/
├── index.html               # 品牌官網主頁 (Landing Page)
├── rent-calculator.html     # 租金與代管服務費精確換算工具子網頁
├── file-converter.html      # 線上多功能檔案轉換神器 (Aconvert 轉檔機制)
├── photo-watermark.html     # 房源照片 EXIF 水印工具頁面
├── styles.css               # 主頁專屬區塊樣式
├── rent-calc.css            # 租金換算工具樣式
├── script.js                # 主頁互動邏輯 (ROI計算器, 房源篩選, Modal, Lead表單)
├── rent-calc.js             # 租金換算邏輯、代管拆分與歷史紀錄
├── css/
│   ├── tokens.css           # 品牌設計 Token、色彩、陰影、字體與深淺模式變數
│   ├── components.css       # 公用組件樣式 (TopBar, Navbar, Footer, Buttons, Toast)
│   └── converter.css        # 檔案轉換工具專屬樣式
├── js/
│   ├── utils.js             # 公用工具函式 (千分位, 日期差, Toast, 主題切換)
│   ├── navigation.js        # 導覽列與 Mobile Drawer 選單控制模組
│   ├── converter.js         # 檔案轉換核心邏輯 (Canvas轉檔, 拖曳上傳, 進度條)
│   ├── watermark-app.js     # 水印應用邏輯
│   ├── watermark-engine.js  # 水印渲染引擎
│   └── exif-parser.js       # EXIF 數據解析器
├── assets/                  # 品牌圖片、標誌與房源實景照片
├── obsidian/                # Obsidian 第二大腦結構 (Clippings, 知識庫, 創作庫)
└── output/                  # 產出檔案、規格書與教材歸檔目錄
```

---

## 4. 網站地圖與頁面功能說明 (Sitemap & Feature Analysis)

### 4.1 品牌官網首頁 (`index.html`)
1. **頂部宣告條 (`.top-bar`)**：標註特許執照證號、統一編號與陳俊銘經理直撥專線。
2. **主導覽列 (`.navbar`)**：Sticky 貼頂導覽，包含品牌 LOGO (`assets/logo.png`)、全站雙向連結、深淺色切換鈕及「免費現場評估」CTA 按鈕。
3. **Hero 主視覺區**：展示品牌宣言「讓優質資產，穩健增值；免改裝直上，省心收益」、三大強勢數據、雙 CTA 按鈕與皮克斯吉祥物卡片（阿港經理 🐴 & 阿居管家 🐑）。
4. **核心保障與方案卡片**：
   - 嚴審優質租客、專業保養與原狀還原、零空置風險。
   - 包租方案 vs 精緻代管方案比較雙卡片。
5. **房東 ROI 預估試算器**：滑動月租金行情（NT$ 15,000 ~ 80,000），動態試算年度預估收益。
6. **精選質感房源列表**：支援區域（小港、前鎮、鳳山）與「可養寵物 🐾」多條件篩選，點擊啟動 3D VR 實境虛擬導覽彈窗 Modal。
7. **資產評估預估 Lead 表單**：收集房東需求，並配置隱形防護說明。

### 4.2 租金與代管服務費換算工具 (`rent-calculator.html`)
1. **多基準計算**：固定 30 日/月、當月實際天數、自訂基準天數（例 36.5 天）。
2. **天數與跨月日期計算**：支援直接天數輸入及起迄日期選擇（可處理跨月份天數精確權重換算）。
3. **包租代管服務費拆分**：設定代管服務費率（預設 10%），即時試算屋主實收與港居服務費。
4. **數值捨入與多幣別**：四捨五入、無條件捨去、無條件進位、保留小數兩位；TWD, HKD, CNY, USD 幣別。
5. **明細複製與歷史紀錄**：一鍵複製排版好的租金明細，並存入 LocalStorage 歷史紀錄。

### 4.3 線上多功能檔案轉換神器 (`file-converter.html`)
1. **多類別轉檔分頁**：
   - 📄 文檔/PDF（PDF, DOCX, HTML, TXT）
   - 🖼️ 圖像照片（PNG, JPG, WEBP, BMP, GIF）
   - 🎵 音訊檔案（MP3, WAV, AAC, OGG）
   - 🎬 視訊影片（MP4, AVI, MOV, WEBP）
   - 📚 電子書與 ZIP 壓縮包
2. **資安隱私防護**：瀏覽器本機端即時運算，個資不外洩。
3. **拖曳上傳與動態進度條**：支援 Drag & Drop，展示即時進度與一鍵下載卡片。

---

## 5. 視覺設計系統 (Design System Standards)

### 5.1 色彩 Tokens
```css
:root {
  --primary-navy: #1A365D;        /* 海軍藍 */
  --primary-dark: #0F2341;        /* 暗夜海軍藍 */
  --accent-gold: #C5A059;         /* 尊榮香檳金 */
  --accent-gold-hover: #B08C45;   /* 深香檳金 */
  --accent-gold-light: #FFE8B8;
  --bg-light: #FAFCFE;
  --bg-card: #FFFFFF;
  --text-dark: #0F172A;
  --text-muted: #64748B;
  --border-color: #E2E8F0;
}
```

### 5.2 陰影與圓角
- **按鈕圓角**：`border-radius: 50px`
- **卡片圓角**：`border-radius: 16px` / `24px`
- **金色立體陰影**：`box-shadow: 0 12px 30px -5px rgba(197, 160, 89, 0.35)`

---

## 6. 響應式規範與觸控體驗 (RWD & Touch Specs)

- **斷點設定**：
  - 桌面端：`> 992px` (多欄 Layout)
  - 平板端：`768px ~ 992px` (單欄或雙欄調降)
  - 手機端：`< 576px` (按鈕滿版縱向、圖文單欄堆疊)
- **橫向溢出防護**：全域 `html, body { overflow-x: hidden; max-width: 100vw; }`，圖片與媒體 `max-width: 100%`。
- **觸控目標尺寸 (Touch Target)**：所有按鈕、選單項目與標籤點擊區域皆 ≥ **44×44px**（按鈕 min-height 48px）。

---

## 7. SEO 與 Schema.org 結構化標註

本專案在 `index.html` head 區域配置 Google 官方推薦之 JSON-LD 結構化資料：

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "港居不動產開發有限公司",
  "alternateName": "Harbor Residence Real Estate",
  "url": "https://ganggo880.github.io/ganju-website/",
  "logo": "https://ganggo880.github.io/ganju-website/assets/logo.png",
  "telephone": "+886-968-863-880",
  "email": "ganggo880@gmail.com",
  "taxID": "96797997",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "中安路825號",
    "addressLocality": "小港區合作里",
    "addressRegion": "高雄市",
    "addressCountry": "TW"
  },
  "description": "港居不動產專注高雄高質感住宅包租與代管服務，特許登記證號：(108)登字第354198號、(112)登字第013739號。"
}
```

---

## 8. 維護與版控指引

1. **產出檔案歸檔**：所有新產出的技術文件、講義、試卷與規格書，統一存放在專案的 `output/` 資料夾中。
2. **Git 工作流程**：修改後執行 `git status` -> `git add .` -> `git commit` -> `git push origin main` 進行 GitHub Pages 自動部署。
3. **Obsidian 知識連動**：定期更新 `obsidian/` 資料夾中對應的工作筆記與營運紀錄。
