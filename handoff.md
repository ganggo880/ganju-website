# 🤝 AI 交接說明文件 (AI Handover Document)

> 💡 **給接續工作的 AI Agent**：
> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡（決策原因、踩坑細節）放 Obsidian：`obsidian/港居不動產官網/專案工作流程.md`。
> 專案藍圖請讀 [`AGENTS.md`](AGENTS.md)。

---

## ⏯️ 目前做到哪

全站已擴充至 **7 個頁面**。最近一輪（2026-07-29 ~ 08-03）完成：

- **`image-converter.html`**：圖像格式與尺寸轉換神器（JPG/PNG/WEBP/GIF/SVG/BMP 六格式互轉、最多 20 張、大中小原圖尺寸調控、ZIP 打包）
- **`card-merger.html`**：名片正反面／上下合成神器（對齊拼貼、留白與背景色控制、高畫質 JPG 匯出），並完成全站選單整合
- **`file-converter.html` 批次強化**：單次最多 20 張照片批次上傳、放上去自動即時轉換、一鍵打包 ZIP；後續重構多檔批次渲染容器、單檔容錯隔離與圖片副檔名聯防，確保 20 張連續轉檔不中斷
- **RWD 收尾全數完成**（先前的未竟項目已結案，細節見下方「目前狀態」）
- **GitHub Pages 發布修正**：新增 `.nojekyll` 停用 Jekyll 處理、補 canonical 標籤觸發 CDN 快取更新

---

早前在 `feat/seo-a11y-rwd-optimize` 分支完成三件事並合併回 `main`：

1. **JSON-LD 結構化資料校正**（已完成）：查證後確認 `FinancialCalculator` **不是 schema.org 型別**（schema.org/FinancialCalculator 回 404），改為 `WebApplication` + `applicationCategory: FinanceApplication`；三個工具頁補 `offers`（免費、TWD 0，這是 Google SoftwareApplication rich result 的必填項）；首頁 `RealEstateAgent` 補 `image`／`postalCode`／`areaServed`／`contactPoint`／`sameAs`，並修正 `addressLocality` 應為「小港區」而非「小港區合作里」。
2. **無障礙與載入效能**（已完成）：漢堡鈕／彈窗關閉鈕／懸浮按鈕補 `aria-label`；表單控制項補 label 關聯（`rentSlider`、`planSelect`、`daysInput`、日期起迄、轉檔品質下拉、色碼輸入框等）；`target="_blank"` 全數補 `rel="noopener noreferrer"`；圖片補 `width`/`height`/`loading`/`decoding`；4 頁補 canonical 與絕對路徑 `og:image`；字型改由 HTML `<link>` 載入（原本藏在 `styles.css` 的 `@import`，造成三層阻塞式請求鏈）；轉檔頁 dropzone 補鍵盤操作。
3. **RWD 與 44×44px 觸控熱區**（**未完成，剩收尾**）：找出並修掉根本原因——全站共用組件的 RWD `@media` 規則原本只寫在 `styles.css`（只有 `index.html` 載入），導致三個工具頁在手機上**完全沒有行動選單、且頁面橫向溢出到 930～946px**。已把 Drawer／`.mobile-toggle`／`footer-grid` 等響應式規則歸位到 `css/components.css`，並替 `photo-watermark.html` 補上原本不存在的漢堡鈕。

另外本次也完成 `id-card-watermark.html`（身份證照裁剪與租賃水印工具）新增與七項缺陷修正。

## 🚦 目前狀態

- ✅ **可運行**：7 個頁面均可正常操作，無阻斷性錯誤，已發布於 GitHub Pages
- ✅ RWD 主要缺陷已修：三個工具頁 360px／768px 現在都正確收合成漢堡選單、無橫向溢出
- ✅ **RWD 微調收尾（已全數完成）**：
  - `file-converter.html` @360px：已修正 `.converter-layout > * { min-width: 0; }` 消除 CSS Grid 子項卡死寬度，且 `.category-tabs` 於 ≤576px 改為 smooth snap 橫向滾動容器，解決水平溢出。
  - `rent-calculator.html` @360px：已為 `.bg-glow` 加入 `max-width: 100vw; overflow: hidden;` 限制，且在 ≤576px 將光暈直徑縮小至 280px，徹底消除 9px 螢幕外框溢出。
  - `.brand-logo` 在 768px 高度：已補充 `min-height: 44px` 滿足 44×44px 觸控熱區標準。

## ➡️ 下一步

1. 到 PageSpeed Insights 對 7 頁跑正式 Lighthouse 分數（本機無 Node/npx，CLI 跑不動）。
2. 使用 Google Rich Results Test 線上工具實測 7 頁 JSON-LD 標註。
3. 兩個新工具（`image-converter.html`、`card-merger.html`）比照舊頁補齊 RWD 360/768/1280 三斷點與 44×44px 觸控熱區複檢。

## ⚠️ 注意事項

- 🔴 **CSS 層疊陷阱（本次最大的坑）**：`styles.css` / `rent-calc.css` / `watermark.css` / `converter.css` 都在檔首 `@import css/components.css`。被 import 的規則排在該檔**所有**規則之前，所以只要頁面 CSS 又重新宣告了 `.nav-menu { display: flex }`、`.mobile-toggle { display: none }`、`.nav-link { font-size }`，就會蓋掉 `components.css` 裡的 `@media` 響應式規則。**共用組件的樣式請只在 `components.css` 寫一份**，頁面 CSS 只做微調、不要重複宣告 `display`。
- 🔴 **驗證時的 CSS 快取**：Python `http.server` 不送 no-cache，改完 CSS 後瀏覽器會沿用舊檔，量測結果會騙人。驗證前請換一個 port 重啟（`.claude/launch.json` 內的 port）或強制重新整理。
- 本機**未安裝 `gh` CLI**、也**沒有 Node/npx** → GitHub 操作用原生 `git`，前端工具鏈相關指令跑不動
- 專案在 Google 雲端硬碟上，已設 `git config windows.appendAtomically false`，換電腦務必確認同步完成再開工
- **不要死寫色碼**：改樣式一律走 `css/tokens.css` 變數
- 結構化資料**不要編造事實**：本次刻意不加 `priceRange`、`openingHoursSpecification`、`aggregateRating`——營業時間與評價都需要真實資料才能填
- AI 產出的文件一律歸檔 `output/`，不要散落根目錄

## 📄 已上線頁面速覽

| 頁面 | 功能 | JSON-LD |
|---|---|---|
| `index.html` | TopBar 特許證號、Hero、包租 vs 代管方案、ROI 試算器、房源 VR 彈窗與篩選、Lead 表單 | `RealEstateAgent` |
| `rent-calculator.html` | 30日／當月實際／自訂基準天數、跨月區間、10% 代管費與屋主實收拆分、LocalStorage 歷史 | `WebApplication` (FinanceApplication) |
| `file-converter.html` | PDF/DOCX/PNG/JPG/WEBP/MP3/MP4/ZIP 瀏覽器端本地轉檔與歷史紀錄 | `WebApplication` (UtilitiesApplication) |
| `photo-watermark.html` | 房源巡檢照 EXIF 時間戳記與品牌浮水印批次合成 | `WebApplication` (MultimediaApplication) |
| `id-card-watermark.html` | 身份證照裁剪與租賃用途水印 | — |
| `image-converter.html` | JPG, PNG, WEBP, GIF, SVG, BMP 六大格式雙向互轉、最多20張上限、大/中/小/原圖尺寸調控與 ZIP 打包 | `WebApplication` (MultimediaApplication) |
| `card-merger.html` | 名片正反面/上下對齊拼貼合成、留白與背景色控制、高畫質 JPG 匯出 | `WebApplication` (GraphicsApplication) |

## 🔗 線上營運與倉庫網址

- **GitHub 遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`
- **GitHub Pages 網址**：`https://ganggo880.github.io/ganju-website/`
- **系統技術規格書**：`output/SPECIFICATION.md`

## 🕐 最後更新

- 時間：2026-08-03 09:22
- 更新者：Claude Code (Opus 5) @ KEN-PC
- Git push：✅ 已推（`origin/main` 與本地 main 同步）
- 上一輪更新者：Antigravity (Gemini 3.6 Flash) @ KEN-PC（2026-07-26 23:33）
- 分支保留：`origin/feat/seo-a11y-rwd-optimize` → `4e13986`（SEO/無障礙/RWD 逐一 commit 歷史）
- ⚠️ 本次**無法用 `git merge` 合併**：`.claude/` 目錄在本機被系統保護（`cannot stat '.claude': Permission denied`），
  只要它在版控內，`git checkout` / `git merge` 就會直接失敗。已把 `.claude/` 加入 `.gitignore` 並改用
  `git checkout <branch> -- ':(exclude).claude'` 把分支內容帶進 main 後單一 commit。
  下次若還要跨分支切換，記得 `.claude/` 已不在版控、不會再擋路。
