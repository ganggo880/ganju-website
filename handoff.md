# 🤝 AI 交接說明文件 (AI Handover Document)

> 💡 **給接續工作的 AI Agent**：
> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡（決策原因、踩坑細節）放 Obsidian：`obsidian/港居不動產官網/專案工作流程.md`。
> 專案藍圖請讀 [`AGENTS.md`](AGENTS.md)。

---

## ⏯️ 目前做到哪

全站共 **8 個頁面**，最近兩輪的進度：

**2026-08-11（本輪）— 全站架構與編排稽核修正**（commit `e6aec12`，16 檔 +514/−84）

以本地 server 實機量測 8 頁 × 4 斷點（1280/992/768/360），並以使用者視角逐頁點選操作，找出並修掉兩類問題：

- **架構根因**：基礎重置（`box-sizing`／`body margin`）、`.container`、`.form-control` 原本只寫在首頁專用的 `styles.css`，其餘 6 頁完全吃不到 → 已全數歸位至 `css/components.css`
- **導覽重構**：原本 8 頁選單各不相同、12 個頂層項目在 1280px 溢出 157px 被裁掉；改為「線上工具」下拉選單，頂層收斂為 7 項、7 個工具全數納入且 8 頁一致
- **8 項實測缺陷**：詳見下方「本輪修掉的缺陷」

**2026-08-06（前一輪）**：新增 `photo-time-location.html` 照片時間與地點浮水印工具並完成全站選單整合（commit `1464efa`）。⚠️ 該輪只補了頁面清單、未做正式收工，敘述與時間戳記已於本輪一併補齊。

---

## 🚦 目前狀態

- ✅ **可運行**：8 個頁面均可正常操作，已發布於 GitHub Pages
- ✅ **版面**：8 頁 × 4 斷點共 32 組，橫向溢出全為 0px
- ✅ **JS**：8 頁 × 4 斷點零 console 錯誤；全站連結、圖片、CSS/JS 資源、頁內錨點皆可解析
- ✅ **導覽**：8 頁皆含全部 7 個工具；漢堡選單可開啟、抽屜連結皆 ≥44×44px 且完整落在畫面內、`aria-expanded` 正確
- ✅ **深色模式**：8 頁文字與底色對比皆達標
- ✅ **功能迴歸**：租金換算 35,000÷30×12 = 14,000／代管費 1,400／屋主實收 12,600 正確；首頁 ROI 432,000 正確；房源篩選與彈窗正常；圖片轉換 PNG 1.44KB → WEBP 764B；四個上傳型工具（file-converter／card-merger／photo-watermark／id-card-watermark）上傳與輸出皆正常

## 🐞 本輪修掉的缺陷（皆為原本就存在、實機測出）

| # | 缺陷 | 影響 |
|---|---|---|
| 1 | `photo-time-location.js` 取用不存在的 `#dropzone`（實際 id 是 `empty-canvas-notice`），`if (dropzone && fileInput)` 整段跳過 | **該頁完全無法上傳照片**——點擊、拖放、上傳鈕全部失效 |
| 2 | `script.js` 與 `navigation.js`／`layout.js` **各綁一次** `#mobileToggle`，一次點擊切換兩下互相抵銷 | **首頁與租金換算頁的手機漢堡選單點了沒反應** |
| 3 | `script.js:141` 對不存在的 `#propertyModal` 掛事件且未判空 | 租金換算頁拋未捕捉 TypeError，該檔後續初始化全部中止 |
| 4 | `watermark.css` 引用 `--text-main` **11 次卻從未定義**，且沿用淺色模式的 `--text-secondary` | `photo-watermark.html` 導覽列／按鈕／輸入框為近黑字壓深藍底（亮度差僅 19～31） |
| 5 | `data-theme` 掛在 `<html>`，CSS 卻寫 `body:not([data-theme="dark"])`（永遠成立且排序在後） | 主題鈕**永遠顯示月亮圖示**，看不出當前模式 |
| 6 | `image-converter`／`photo-time-location`／`id-card-watermark` 三頁 CSS 無 `body` 規則 | 深色模式下近白字落在白底，讀不到 |
| 7 | 隱私權同意框寫死 `checked` | 個資法要求同意須為主動勾選，預設勾選不構成有效同意 |
| 8 | 行動端抽屜 `max-height: calc(100vh - 100%)` 未計入 top-bar 高度 | 捲動在頂端時抽屜最後一項超出畫面，要先捲頁才點得到 |

## ➡️ 下一步

1. 到 PageSpeed Insights 對 8 頁跑正式 Lighthouse 分數（本機無 Node/npx，CLI 跑不動）。
2. 使用 Google Rich Results Test 線上實測 8 頁 JSON-LD 標註。
3. `photo-time-location.html` 尚未補 JSON-LD 以外的 SEO 檢查，且該頁 `output/SPECIFICATION.md` 規格書未同步更新。
4. （可選）6 個有頁尾的頁面中，只有 `image-converter.html` 的頁尾設有「線上工具集」欄位，其餘 5 頁為 4 欄式標準頁尾。是否要全站統一加上工具集欄位，屬設計決策，待老闆決定。

## ⚠️ 注意事項

- 🔴 **共用樣式一律寫在 `css/components.css`**：基礎重置、`.container`、`.form-control`、`body` 主題底色如果只寫在 `styles.css`，就只有 `index.html` 吃得到——這正是本輪最大的坑（6 頁 body 保留預設 `margin:8px`、`box-sizing` 是 `content-box`、`.container` 毫無樣式）。
- 🔴 **CSS 層疊陷阱**：各頁 CSS 在檔首 `@import css/components.css`。被 import 的規則排在該檔**所有**規則之前，所以頁面 CSS 重新宣告 `.nav-menu { display: flex }` 之類就會蓋掉 `components.css` 的 `@media`。共用組件樣式只寫一份，頁面 CSS 只做微調。
- 🔴 **驗證時的 CSS 快取**：Python `http.server` 不送 no-cache，改完 CSS 後瀏覽器會沿用舊檔（連 `@import` 進來的也一樣），量測結果會騙人。**驗證前務必換一個 port 重啟**（改 `.claude/launch.json` 的 port），新 origin 才拿不到舊快取。本輪為此換了 8899→8901→8902→8903→8904→8905→8910→8911→8912。
- 🟡 **無頭瀏覽器不合成畫面 → CSS transition 會卡住**：`getComputedStyle` 讀到的是 transition 的起始值（例如 dropdown 永遠 `visibility:hidden`），會誤判成功能壞掉。驗證互動前先注入 `*{transition:none!important}` 再量測。
- 🟡 **量測背景色要處理漸層與 alpha**：`.btn-gold`／`.region-chip.active` 的底色是 `background-image: linear-gradient(...)`，`backgroundColor` 讀到透明，對比度腳本會誤報「字色與底色相同」。
- 本機**未安裝 `gh` CLI**、也**沒有 Node/npx** → GitHub 操作用原生 `git`，前端工具鏈相關指令跑不動
- 專案在 Google 雲端硬碟上，已設 `git config windows.appendAtomically false`，換電腦務必確認同步完成再開工
- `.claude/` 已在 `.gitignore` 內，**不要**再納入版控（曾造成 `git checkout`／`merge` 全面失敗）
- **不要死寫色碼**：改樣式一律走 `css/tokens.css` 變數
- 結構化資料**不要編造事實**：刻意不加 `priceRange`、`openingHoursSpecification`、`aggregateRating`——營業時間與評價都需要真實資料才能填
- AI 產出的文件一律歸檔 `output/`，不要散落根目錄

## 📄 已上線頁面速覽

| 頁面 | 功能 | JSON-LD |
|---|---|---|
| `index.html` | TopBar 特許證號、Hero、包租 vs 代管方案、ROI 試算器、房源 VR 彈窗與篩選、Lead 表單 | `RealEstateAgent` |
| `rent-calculator.html` | 30日／當月實際／自訂基準天數、跨月區間、10% 代管費與屋主實收拆分、LocalStorage 歷史 | `WebApplication` (FinanceApplication) |
| `file-converter.html` | PDF/DOCX/PNG/JPG/WEBP/MP3/MP4/ZIP 瀏覽器端本地轉檔與歷史紀錄 | `WebApplication` (UtilitiesApplication) |
| `photo-watermark.html` | 房源巡檢照 EXIF 時間戳記與品牌浮水印批次合成（常駐深色工作台） | `WebApplication` (MultimediaApplication) |
| `id-card-watermark.html` | 身份證照裁剪與租賃用途水印（常駐深色工作台） | — |
| `image-converter.html` | JPG, PNG, WEBP, GIF, SVG, BMP 六大格式雙向互轉、最多 20 張、大/中/小/原圖尺寸調控與 ZIP 打包 | `WebApplication` (MultimediaApplication) |
| `card-merger.html` | 名片正反面/上下對齊拼貼合成、留白與背景色控制、高畫質 JPG 匯出 | `WebApplication` (GraphicsApplication) |
| `photo-time-location.html` | 照片時間與地點浮水印（EXIF 時間/GPS 解析、自訂時間地點、三樣式五位置合成、ZIP 打包） | `WebApplication` (MultimediaApplication) |

> ℹ️ `photo-watermark.html` 與 `id-card-watermark.html` 是刻意設計的**全螢幕常駐深色工作台**，
> 沒有全站頁尾、也沒有深淺模式切換鈕，這是設計決定而非缺漏，請勿「順手補上」。

## 🔗 線上營運與倉庫網址

- **GitHub 遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`
- **GitHub Pages 網址**：`https://ganggo880.github.io/ganju-website/`
- **系統技術規格書**：`output/SPECIFICATION.md`（⚠️ 尚未納入 photo-time-location 與本輪重構）

## 🕐 最後更新

- 時間：2026-08-11 01:17
- 更新者：Claude Code (Opus 5) @ KEN-PC
- Git push：✅ 已推（`origin/main` 與本地同步）
- 本輪 commit：`e6aec12`（程式碼修正）＋ `556a6c3`（文件三處同步）
- 上一輪更新者：Claude Code @ KEN-PC（2026-08-06 17:27，commit `1464efa`，未做正式收工）
- 分支保留：`origin/feat/seo-a11y-rwd-optimize` → `4e13986`（SEO/無障礙/RWD 逐一 commit 歷史）
