# 港居不動產開發有限公司 官網與工具集（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準，Claude Code / Codex / Gemini CLI / OpenCode 皆可讀）。
> **任何 Agent 的每個 session，都應先讀本檔 ＋ `handoff.md`。**
> 專案詳細開發規範與品牌資料另見 [`CLAUDE.md`](CLAUDE.md)（內容與本檔一致，本檔為開放標準入口）。

---

## 專案簡介

「港居不動產開發有限公司」（GANJU Real Estate，統編 `96797997`）的品牌官方網站與全套線上工具集。
目標是以**一組共用設計 Token 與模組化 JS**，撐起官網主頁與 4 個不動產專用線上工具，全部以純靜態網頁發布於 GitHub Pages，零後端、零部署成本。

同一 repository 另收納 Matt Pocock 技能集（`skills/`、`docs/`、`agent/`）作為 AI 協作素材庫。

## 關鍵時程

- 專案初始化（三層級）：2026-07-25
- 全站二次深度重構完成：commit `29fcd5a`（導入 `js/layout.js`、全站 Token 繼承、Schema.org、圖片 Lazy Loading）
- 系統技術規格書定稿：commit `f9a7947`（`output/SPECIFICATION.md`）

## 目標與路線圖

- [x] 階段一：官網主頁 `index.html`（HERO、包租 vs 代管方案、ROI 試算器、房源 VR 彈窗、Lead 表單、`RealEstateAgent` JSON-LD）
- [x] 階段二：租金與 10% 代管服務費換算工具 `rent-calculator.html`（多基準天數、跨月區間、LocalStorage 歷史）
- [x] 階段三：線上檔案轉換神器 `file-converter.html`（瀏覽器端本地轉檔，PDF/DOCX/PNG/MP3/MP4/ZIP）
- [x] 階段四：房源照片 EXIF 時間戳記與水印工具 `photo-watermark.html`
- [x] 階段五：全站模組化重構（`css/tokens.css`＋`css/components.css`＋`js/layout.js`）與 SEO 結構化資料
- [x] 階段六：專案三層級初始化（AGENTS.md／handoff.md／GitHub／Obsidian）
- [x] 階段七：身份證照裁剪與租賃水印工具 `id-card-watermark.html`（含七項缺陷修正）
- [x] 階段八：JSON-LD 結構化資料校正（修掉不存在的 `FinancialCalculator` 型別、補 `offers`、補 canonical／絕對路徑 og:image）
- [x] 階段九：SEO／無障礙／載入效能／RWD 觸控熱區優化（共用組件 RWD 規則歸位 `components.css`）
- [x] 階段十：**RWD 收尾**（`file-converter.html` 在 360px 螢幕下 `.category-tabs` 橫向滑動與 grid 子項 `min-width: 0` 修正、`rent-calculator.html` 360px 下 `.bg-glow` 9px 光暈溢出消除與 `.brand-logo` 44px 觸控熱區）
- [x] 階段十一：圖像格式與尺寸轉換神器 `image-converter.html`（JPG, PNG, WEBP, GIF, SVG, BMP 互轉、20張上限、大/中/小/原圖調控、ZIP 打包）
- [x] 階段十二：名片正反面／上下合成神器 `card-merger.html`（對齊拼貼、留白與背景色控制、高畫質 JPG 匯出）與全站選單整合
- [x] 階段十三：GitHub Pages 發布修正——新增 `.nojekyll` 停用 Jekyll 處理、補 canonical 標籤觸發 CDN 快取更新
- [x] 階段十四：照片時間與地點浮水印工具 `photo-time-location.html`（EXIF 時間/GPS 解析、自訂時間地點、三樣式五位置合成、ZIP 打包）
- [x] 階段十五：**全站架構與編排稽核修正**——CSS 基礎重置／`.container`／`.form-control` 歸位 `components.css`、導覽列統一為「線上工具」下拉選單（8 頁一致、解除孤兒頁）、修掉 8 項實機測出的功能缺陷
- [x] 階段十六：照片 OCR 文字辨識與多國語言翻譯神器 `ocr-translator.html`（99%+ AI 深度神經網路雙引擎、ROI 自由區域框選、自適應去陰影、不動產智慧詞庫校對、語音朗讀）
- [x] 階段十七：全站資安防禦性加固與規範自動化稽核（全 9 頁 JSON-LD 100% 合格、Noopener 反向標籤防護、Referrer-Policy、MIME-Sniffing 防護、XSS 轉義）
- [x] 階段十八：Web 端互動式 2D 平面格局配置與 3D 即時轉換系統 `space-planner.html`（底圖兩點比例尺校正、ANSI31 45°斜線與門窗開啟弧線、玄關/管道間連動參數化自動隔間、11 款標準 CAD 家具圖塊與 85cm 迴轉半徑防呆、Three.js 60FPS 娃娃屋與第一人稱漫遊、PNG/SVG/PDF 出圖與多方案比對、剖面殘影徹底修復、同仁操作使用手冊與線上 Modal 整合）
- [ ] 階段十九：穩發漁業集團官網建置實施（遠洋艦隊與冷鏈圖資生成、三層式架構落地）
- [x] 階段二十：Google Rich Results Test 線上實測 10 頁 JSON-LD（全站 10 頁 100% 0錯誤0警告通過、補齊 BreadcrumbList 階層導覽與 WebSite/Geo 標記）

## 資料夾結構

```
Matt Pocock skills/                  # 專案根目錄（Google 雲端硬碟同步）
├── AGENTS.md                        # 本檔：跨 Agent 專案藍圖
├── CLAUDE.md                        # Claude Code 專案指引（開發規範、品牌資料）
├── handoff.md                       # 交接檔：開工必讀、收工必更新
├── README.md / CHANGELOG.md / LICENSE / CONTEXT.md
│
├── index.html                       # 1. 品牌官網主頁
├── rent-calculator.html             # 2. 租金與代管服務費換算工具
├── file-converter.html              # 3. 線上多功能檔案轉換神器
├── photo-watermark.html             # 4. 房源照片 EXIF 水印生成器
├── id-card-watermark.html           # 5. 身份證照裁剪與租賃用途水印工具
├── image-converter.html             # 6. 圖像格式與尺寸轉換神器
├── card-merger.html                 # 7. 名片正反面／上下合成神器
├── photo-time-location.html         # 8. 照片時間與地點浮水印工具
├── ocr-translator.html              # 9. 照片 OCR 文字辨識與翻譯神器
├── space-planner.html               # 10. 2D 平面格局配置與 3D 即時轉換系統
├── .nojekyll                        # ⚠️ 停用 GitHub Pages 的 Jekyll 處理，勿刪
├── styles.css / rent-calc.css / watermark.css
├── script.js / rent-calc.js
│
├── css/
│   ├── tokens.css                   # 品牌設計 Token（海軍藍／香檳金、陰影、圓角、深淺模式）
│   ├── components.css               # 公用組件（TopBar / Navbar / Footer / Buttons / Toast）
│   │                                # ⚠️ 全站共用組件的 RWD @media 一律寫在這裡
│   │                                # ⚠️ 基礎重置、.container、.form-control、body 主題底色
│   │                                #    也一律寫在這裡（只寫在 styles.css 的話，其餘 7 頁吃不到）
│   ├── space-planner.css            # 2D/3D 空間格局配置系統樣式
│   ├── ocr-translator.css           # 照片 OCR 文字辨識與翻譯專屬樣式
│   ├── converter.css                # 檔案轉換工具專屬樣式
│   ├── card-merger.css              # 名片合成工具樣式
│   ├── image-converter.css          # 圖像格式轉換工具樣式
│   ├── photo-time-location.css      # 照片時間地點浮水印工具樣式
│   └── id-card-watermark.css        # 身份證照裁剪工具樣式
├── js/
│   ├── utils.js                     # 千分位、日期差、Toast、主題切換
│   ├── navigation.js                # 導覽列與 Mobile Drawer（index.html 使用）
│   ├── layout.js                    # Active 點亮與跨頁 Layout 控制（工具頁使用）
│   ├── space-planner.js             # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── ocr-translator.js            # 照片 OCR 雙引擎與翻譯邏輯
│   ├── converter.js                 # 轉檔核心（Canvas / Blob 本地運算）
│   ├── image-converter.js           # 圖像格式與尺寸轉換邏輯
│   ├── card-merger.js               # 名片正反面合成邏輯
│   ├── photo-time-location.js       # 照片時間地點浮水印邏輯
│   ├── exif-parser.js               # EXIF 解析
│   ├── watermark-engine.js          # 水印合成引擎（Canvas）
│   ├── watermark-app.js             # 照片水印工具 UI 控制
│   └── id-card-watermark.js         # 身份證照裁剪與水印邏輯
│
├── assets/                          # 品牌 LOGO 與房源實景照
├── output/                          # ⚠️ 所有 AI 產出一律歸檔於此
│   ├── SPECIFICATION.md             # 全站系統技術規格書
│   ├── 高優質住宅包租代管官方網站建置需求規格書_完整修訂版(RFP).md
│   └── winfar-website/
│
├── obsidian/                        # Obsidian 第二大腦 vault（L3）
│   ├── 港居不動產官網/專案工作流程.md   # 專案詳細脈絡與決策紀錄
│   ├── 2026-07-2X_工作筆記_*.md      # 每日收工筆記
│   ├── 知識庫 / 創作庫 / 每日筆記 / Clippings / Templates
│
├── skills/                          # Matt Pocock 技能集（engineering / productivity / …）
├── docs/ · agent/ · scripts/ · .agents/ · .claude-plugin/   # 技能集配套文件與工具
└── .github/ · .changeset/ · package.json
```

## 同步層級（本專案初始化至 **第 3 層級**）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（Google 雲端硬碟） | `g:\我的雲端硬碟\ai agent\Matt Pocock skills\` → `AGENTS.md`＋`handoff.md` | **每個 session** |
| L2 | GitHub（私有 repo） | https://github.com/ganggo880/ganju-website.git（main 分支）<br>發布網址：https://ganggo880.github.io/ganju-website/ | 指定時 |
| L3 | Obsidian | `obsidian/港居不動產官網/專案工作流程.md` | 有需要時 |

> ⚠️ 本專案位於 Google 雲端硬碟，換電腦前請確認桌面版同步圖示已打勾。
> ⚠️ 本機**未安裝 `gh` CLI**，GitHub 操作一律用原生 `git` 指令（remote 已設定完成）。

## 工作約定

- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 所有回應與文件使用**繁體中文（台灣）**，語氣親切、專業、有耐心
- 所有新產出的規格書、講義、文件**一律存放 `output/`**
- CSS 必須引入 `css/tokens.css` 與 `css/components.css`，**禁止死寫色碼**
  - 品牌主色：經典海軍藍 `#1A365D` / `#0F2341`；典雅香檳金 `#C5A059` / `#B08C45`
- 全站 RWD（360px 手機 → 大螢幕），所有觸控區域 **≥ 44×44px**
- 修改共用檔案（`tokens.css`／`components.css`／`layout.js`）前先讀最新內容，避免覆蓋他人變更
- 版本控制流程：`git status` → `git add .` → `git commit` → `git push origin main`
- **API Key、密碼等敏感資訊嚴禁提交**（`.gitignore` 已封鎖 `.env`／`*.key`／`credentials.*`）

## 企業資料（供文案與 Schema.org 引用）

| 項目 | 內容 |
|---|---|
| 公司名稱 | 港居不動產開發有限公司（GANJU Real Estate Co., Ltd.） |
| 統一編號 | `96797997` |
| 租賃管理證號 | `(112) 登字第013739號` |
| 聯絡窗口 | 陳俊銘 經理 |
| 電話 | `0968-863-880` ／ 市話 `07-791-2288` |
| 信箱 | `ganggo880@gmail.com` |
| Line 官方（預約看房） | https://lin.ee/Q71pw2I（港居｜租屋看房預約） |
| 地址 | 高雄市小港區合作里中安路825號 |

🔴 不對外顯示營業員證號：港居不是不動產經紀業，營業員證號會被看成從事仲介的徵象（業主 2026-10-20 決定；依據見「出租物件自動刊登」專案 output/20261020_刊登業者資格與揭露查證_港居.md）

`data/listings.json`：首頁房源區的資料檔，由「出租物件自動刊登」系統（listing_auto）以 GitHub API 更新，**請勿手動編輯**；欄位契約見該專案 listing_auto/adapters/website.py
