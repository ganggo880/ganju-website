# 港居不動產開發有限公司 專案指引 (CLAUDE.md / AGENTS.md)

> 🤖 **致接班 / 協作 AI Agent (For AI Collaboration & Handover)**：
> 本檔案為「港居不動產」品牌官網與全套線上工具集之 AI 核心協作指南。請遵守以下開發規範、架構設計與三處同步規則。

---

## 1. 專案說明與三處同步對照表 (3-Way Sync Matrix)

本專案為「港居不動產開發有限公司」品牌官方網站、包租代管業務運作、線上工具集與 AI Agent 技能集之核心 repository。

### 三處同步對照表
| 項目 | 路徑 / URL | 說明 |
|---|---|---|
| **本地專案路徑** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills` | 本地工作區根目錄 |
| **GitHub 遠端倉庫** | `https://github.com/ganggo880/ganju-website.git` | GitHub Pages 發布來源 (main 分支) |
| **Obsidian 第二大腦** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills\obsidian` | 工作筆記、剪藏與知識庫 |
| **GitHub Pages 網址** | `https://ganggo880.github.io/ganju-website/` | 官方線上維運網址 |

---

## 2. 全站網頁 SITEMAP 與檔案結構

```
g:\我的雲端硬碟\ai agent\Matt Pocock skills\
├── index.html               # 1. 品牌官網主頁 (Landing Page, HERO, ROI計算器, 房源VR彈窗, 評估表單)
├── rent-calculator.html     # 2. 租金與 10% 代管服務費精確拆分換算工具 (支援多基準, 跨月區間)
├── file-converter.html      # 3. 線上多功能檔案轉換神器 (PDF/DOCX/PNG/MP3/MP4/ZIP 本地轉檔)
├── photo-watermark.html     # 4. 房源照片 EXIF 拍攝時間戳記與水印生成器 (常駐深色工作台)
├── id-card-watermark.html   # 5. 身份證照裁剪與租賃用途水印工具 (常駐深色工作台)
├── image-converter.html     # 6. 圖像格式與尺寸轉換神器 (JPG/PNG/WEBP/GIF/SVG/BMP 互轉與壓縮)
├── card-merger.html         # 7. 名片正反面／上下拼貼合成神器 (留白與高畫質匯出)
├── photo-time-location.html # 8. 照片時間與地點浮水印工具 (EXIF GPS 自動解析、三樣式五位置)
├── ocr-translator.html      # 9. 照片 OCR 文字辨識與多國語言翻譯神器 (99%+ 雙引擎、ROI 框選、詞庫校正)
├── space-planner.html       # 10. 2D 平面格局配置與 3D 即時轉換系統 (底圖校正、玄關連動隔間、CAD家具、60FPS 3D)
├── island.html              # 11. 3D 智慧營運島 (數位孿生微縮世界)
├── lease-contract.html      # 12. 租賃契約與住戶公約線上套印產生器 (雙欄即時連動、中文大寫、凶宅公約、A4列印PDF)
├── tax-calculator.html      # 13. 房東包租代管節稅效益與實質收益試算神器 (租賃條例17條、囤房稅2.0、三方案PK、LINE諮詢)
├── repair-inspection.html   # 14. 租賃修繕點交與屋況瑕疵存證紀錄神器 (租賃條例11條、浮水印拍照、四級責任判定、電子簽章、A4列印)
├── privacy.html             # 15. 個人資料保護與隱私權政策專頁 (符合個資法特定目的086/069/040/090、純前端安全宣告)
├── sitemap.xml              # 全站 15 頁 SEO XML 網站地圖
├── robots.txt               # 搜尋引擎漫遊器規範檔
├── styles.css               # 主頁專屬區塊樣式
├── rent-calc.css            # 租金換算工具樣式
├── script.js                # 主頁互動邏輯 (ROI計算器, 房源條件篩選, Modal 彈窗)
├── rent-calc.js             # 租金換算計算邏輯、代管拆分與歷史紀錄
├── css/
│   ├── tokens.css           # 品牌設計 Token (海軍藍 #1A365D, 香檳金 #C5A059, 陰影, 圓角, 深淺模式)
│   ├── components.css       # 全站公用組件樣式 (TopBar, Navbar, Footer, Buttons, Toast)
│   ├── space-planner.css    # 2D/3D 空間格局配置系統樣式
│   ├── lease-contract.css   # 租賃契約與公約產生器專用樣式與 A4 列印引擎
│   ├── tax-calculator.css   # 房東節稅試算樣式與 A4 診斷書列印引擎
│   ├── repair-inspection.css # 屋況修繕點交與瑕疵存證專用樣式與 A4 排版引擎
│   ├── privacy.css          # 隱私權政策與個資法遵循專用樣式
│   ├── ocr-translator.css   # 照片 OCR 翻譯專用樣式
│   ├── converter.css        # 檔案轉換工具專屬樣式
│   ├── image-converter.css  # 圖像轉換工具專屬樣式
│   ├── card-merger.css      # 名片合成工具專屬樣式
│   ├── photo-time-location.css # 照片時間地點浮水印樣式
│   └── id-card-watermark.css   # 身份證照裁剪工具樣式
├── js/
│   ├── tracking.js          # 全站 MarTech 追蹤核心 (GTM / GA4 / Meta Pixel)
│   ├── utils.js             # 公用工具函式 (千分位, 日期差, Toast 提示, escapeHTML, 主題切換)
│   ├── navigation.js        # 導覽列與 Mobile Drawer 控制器
│   ├── layout.js            # 版面 Active 點亮與跨頁面 Layout 控制器
│   ├── space-planner.js     # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── lease-contract.js    # 租賃契約雙向連動、中文大寫金額與 A4 排版引擎
│   ├── tax-calculator.js    # 房東節稅試算引擎、三方案 PK 與 LINE 深度帶參串接
│   ├── repair-inspection.js # 租賃修繕點交、時間浮水印壓印與電子簽章核心引擎
│   ├── ocr-translator.js    # OCR 雙引擎核心與影像處理邏輯 (純前端自包含腳本)
│   ├── converter.js         # 檔案轉換核心邏輯 (Canvas/Blob 本地加密運算)
│   ├── image-converter.js   # 圖像格式與尺寸調控邏輯
│   ├── card-merger.js       # 名片正反面合成邏輯
│   ├── photo-time-location.js # 照片時間地點浮水印渲染邏輯
│   └── watermark-app.js     # EXIF 水印工具邏輯
├── assets/                  # 品牌 LOGO (logo.png) 與房源照片實景
├── output/                  # 所有 AI 產出之規格書 (SPECIFICATION.md)、講義、文件歸檔資料夾
└── obsidian/                # Obsidian 工作筆記與 Karpathy 三層式知識庫
```

---

## 3. 開發與核心 AI 規範 (Core AI Rules)

1. **統一檔案歸檔**：所有新產出的檔案、規格書、講義或試卷，**統一存放在 `output/` 資料夾中**。
2. **語言與語氣**：一律使用**繁體中文（台灣）**，保持親切、專業、有耐心的助教語氣。
3. **UI/UX 設計與品牌 Tokens**：
   - 品牌主色系：**經典海軍藍 (`#1A365D` / `#0F2341`)** 與 **典雅香檳金 (`#C5A059` / `#B08C45`)**。
   - 所有 CSS 檔案必須引入 `css/tokens.css` 與 `css/components.css`，不得隨意死板寫死色彩。
   - 網頁必須符合 **RWD 響應式**（支援手機 360px 到大螢幕），所有觸控區域 **≥ 44×44px**。
4. **版本控制與部署**：
   - 修改完成後必須進行 `git status` -> `git add .` -> `git commit` -> `git push origin main`。
   - 敏感資訊（API Keys、密碼）嚴禁提交至 Git。

---

## 4. 企業背景與特許資料 (Business Entity)

- **公司名稱**：港居不動產開發有限公司 (GANJU Real Estate Co., Ltd.)
- **統一編號**：`96797997`
- **特許證號**：
  - 租賃住宅服務業登記證：`(113)高市租登字第0012號`（高雄市政府核發，見 `assets/certs/rental-license.jpg`）
  - 同業公會會員證號：`高雄市租賃住宅證字第 115-046 號`（見 `assets/certs/association-member-cert.jpg`）
  - 租賃管理證號：`(112) 登字第013739號`（見 `assets/certs/rental-manager-cert.jpg`）
- **聯絡窗口**：陳俊銘 經理（`0968-863-880` / 市話 `07-791-2288` / 信箱 `ganggo880@gmail.com`）
- **Line 官方短網址（預約看房）**：`https://lin.ee/Q71pw2I`（港居｜租屋看房預約）
- **公司地址**：高雄市小港區合作里中安路825號
- 🔴 不對外顯示營業員證號：港居不是不動產經紀業，營業員證號會被看成從事仲介的徵象（業主 2026-10-20 決定；依據見「出租物件自動刊登」專案 output/20261020_刊登業者資格與揭露查證_港居.md）
- `data/listings.json`：首頁房源區的資料檔，由「出租物件自動刊登」系統（listing_auto）以 GitHub API 更新，**請勿手動編輯**；欄位契約見該專案 listing_auto/adapters/website.py
