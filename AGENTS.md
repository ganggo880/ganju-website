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
- [x] 階段十九：穩發漁業集團官網建置實施（遠洋艦隊與冷鏈圖資生成、三層式架構落地、10大船隊影音與新聞彈窗、B2B詢價與企業Corporation結構化標記）
- [x] 階段二十：Google Rich Results Test 線上實測 10 頁 JSON-LD（全站 10 頁 100% 0錯誤0警告通過、補齊 BreadcrumbList 階層導覽與 WebSite/Geo 標記）
- [x] 階段二十一：全站 10 款線上工具行動端（360px~414px）實機極限驗收與觸控熱區優化（CDP 40 組測試 100% 完美合格，橫向滾動溢出嚴格為 0px、按鈕/表單/色彩/滑桿等可互動元件 100% 符合 ≥ 44×44px WCAG 規範）
- [x] 階段二十二：全站 PWA 離線漸進式應用支援與原生桌面/手機安裝（`manifest.json` ＋ `sw.js` 48 項核心資產預載 ＋ Network-First 導航快取 ＋ 案場 100% 完全斷網實機 11 頁可用性通過）
- [x] 階段二十三：港居 3D 智慧營運島（數位孿生）全站選單、PWA 快取與 Schema.org 結構化資料全面整合（11/11 頁面導覽互通、離線秒開、首頁 iframe 嵌入與 360px~414px 零溢出通過）
- [x] 階段二十四：租賃契約與住戶公約線上套印產生器 `lease-contract.html`（雙欄即時連動、中文大寫自動轉換、搬遷免租期、水電度數計費、凶宅防範300萬違約金、27項通用標準住戶公約與設備點交清單、A4標準無痕列印與PDF匯出、全站12頁100% PWA離線可用與零溢出通過）
- [x] 階段二十五：房東包租代管節稅效益與實質收益試算神器 `tax-calculator.html`（精算法定1.5萬免稅額、60%必要費用率、房屋稅比照自住1.2%與地價稅千分之2減徵，對比自租/代管/全包租三大方案實質全年度淨收益PK，視覺化能量條、A4無痕列印節稅診斷書與LINE深度帶參預約評估、全站13頁100% PWA離線可用與零溢出通過）
- [x] 階段二十六：首頁 Lead 表單現代化升級（蜜罐防洗、LINE 深度帶參轉化確認彈窗、LocalStorage 預約備份）＋ 房東常見問答 FAQ 手風琴 ＋ Google FAQPage 結構化資料全面整合（100% 0px 溢出、觸控熱區合格、全站 13 頁 PWA 離線可用）
- [x] 階段二十七：租賃修繕點交與屋況瑕疵存證紀錄神器 `repair-inspection.html`（依據租賃專法第11條與民法第429/432條法定點交規範，支援起租交付/退租返還/修繕存證三大模式、六大空間分區、相機拍照自動壓印時間存證浮水印、四級責任歸屬判定、水電瓦斯指針登錄、雙畫布高靈敏電子手寫簽章、A4無痕列印出圖、JSON匯入匯出與LINE深度帶參回報，全站14頁100% PWA離線可用與零溢出通過）
- [x] 階段二十八：全站 SEO 搜尋引擎架構部署（`sitemap.xml` ＋ `robots.txt`）＋ 租務專欄現代化深度閱讀彈窗 ＋ Google `BlogPosting` 結構化資料全面整合（14頁Sitemap完整索引、專欄法規1.5萬與60%校正、3大專欄文章彈窗與工具轉化閉環、PWA 59項資產100%離線可用與52組情境零溢出通過）
- [x] 階段二十九：個人資料保護與隱私權政策專頁 `privacy.html` ＋ 房源 LINE 帶參預約看房深度串接（符合台灣《個人資料保護法》法定特定目的 086/069/040/090 與《租賃住宅市場發展及管理條例》規範、純前端零上傳本地運算安全透明化宣告、首頁 Lead 表單隱私權同意書直連、房源彈窗看房帶房名與租金一鍵加 LINE、全站 15 頁 100% PWA 離線可用與 56 組行動端 0px 溢出通過）
- [x] 階段三十：全站 MarTech 行銷科技與關鍵轉換追蹤系統（`js/tracking.js` ＋ GTM/GA4/Meta Pixel 雙向事件映射 ＋ 電話與 LINE 點擊全域 Capture 代理監聽 ＋ 離線靜默容錯 ＋ `GTM_GA4_事件追蹤設定規格說明書.md` 正式交付）
- [x] 階段三十一：首頁屋主口碑與客戶真實見證專區 `#testimonials` ＋ Google `AggregateRating` & `Review` 結構化資料全面整合（4大營運指標背書、小港/前鎮/鳳山3大案例、互動式分類頁籤、4.9星評價Schema、56組行動端0px溢出通過）
- [x] 階段三十二：房源已出租留存機制與 VR 看房支援 ＋ 品牌吉祥物（馬經理與羊管家）與實體門市導航整合（RFP §2.1、§3、§5.3 規範落地、已出租SEO流量長尾轉化、Matterport/720度VR語法相容、雙吉祥物迎賓卡、小港中安路Google Maps導航）
- [x] 階段三十三：專案全功能結案交付 ＋ 系統維護操作手冊 ＋ 一年期 SLA 保固與數位資產歸屬說明書（RFP §5.4、§5.5、§6.2 正式交付、《港居官網系統運營與房源維護操作手冊》與《數位資產權益歸屬與一年期SLA保固服務條款說明書》落地、PageSpeed 98/92 分雙達標、三層備份與災難復原）

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
├── island.html                      # 11. 3D 智慧營運島（數位孿生）微縮世界
├── island_standalone.html           # 11b. 3D 智慧營運島獨立全螢幕版本
├── lease-contract.html              # 12. 租賃契約與住戶公約線上套印產生器
├── tax-calculator.html              # 13. 房東包租代管節稅效益與實質收益試算神器
├── repair-inspection.html           # 14. 租賃修繕點交與屋況瑕疵存證紀錄神器
├── privacy.html                     # 15. 個人資料保護與隱私權政策專頁
├── sitemap.xml                      # 全站 15 頁 SEO XML 網站地圖
├── robots.txt                       # 搜尋引擎漫遊器規範檔
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
│   ├── lease-contract.css           # 租賃契約與公約產生器樣式與 A4 列印引擎
│   ├── tax-calculator.css           # 房東節稅試算樣式與 A4 診斷書列印引擎
│   ├── repair-inspection.css        # 屋況修繕點交與瑕疵存證專屬樣式與 A4 排版引擎
│   ├── privacy.css                  # 隱私權政策與個資保護專頁樣式
│   ├── ocr-translator.css           # 照片 OCR 文字辨識與翻譯專屬樣式
│   ├── converter.css                # 檔案轉換工具專屬樣式
│   ├── card-merger.css              # 名片合成工具樣式
│   ├── image-converter.css          # 圖像格式轉換工具樣式
│   ├── photo-time-location.css      # 照片時間地點浮水印工具樣式
│   └── id-card-watermark.css        # 身份證照裁剪工具樣式
├── js/
│   ├── tracking.js                  # 全站 MarTech 追蹤核心 (GTM / GA4 / Meta Pixel)
│   ├── utils.js                     # 千分位、日期差、Toast、主題切換
│   ├── navigation.js                # 導覽列與 Mobile Drawer（index.html 使用）
│   ├── layout.js                    # Active 點亮與跨頁 Layout 控制（工具頁使用）
│   ├── space-planner.js             # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── lease-contract.js            # 租賃契約雙向連動、中文大寫金額與 A4 排版引擎
│   ├── tax-calculator.js            # 房東節稅試算引擎、三方案 PK 與 LINE 深度帶參串接
│   ├── repair-inspection.js         # 租賃修繕點交、時間浮水印壓印與電子簽章核心引擎
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
