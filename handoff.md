# 🤝 AI 交接說明文件 (AI Handover Document)

> 💡 **給接續工作的 AI Agent**：
> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian：`obsidian/港居不動產官網/專案工作流程.md`。
> 專案藍圖請讀 [`AGENTS.md`](AGENTS.md)。

---

## ⏯️ 目前做到哪

完成專案三層級初始化：`AGENTS.md` 由空殼擴寫為完整專案藍圖、`handoff.md` 補上標準交接欄位、`.gitignore` 加上敏感檔封鎖、Obsidian 建立 `港居不動產官網/專案工作流程.md`。全站 4 個頁面功能均已完成並上線。

## 🚦 目前狀態

- ✅ **可運行**：4 個頁面全數上線於 GitHub Pages，無已知阻斷性錯誤
- ✅ 工作區乾淨，上一輪變更已 push（`e7a6460`）
- 🔸 未完成：全站 RWD 與 44×44px 觸控區域逐頁複檢、Lighthouse 效能／無障礙優化

## ➡️ 下一步

1. 逐頁複檢 RWD 斷點（360px / 768px / 1280px）與觸控區域 ≥ 44×44px
2. 跑 Lighthouse，針對效能與無障礙評分做優化
3. 檢查 4 個頁面的 JSON-LD 結構化資料是否通過 Google Rich Results Test

## ⚠️ 注意事項

- 本機**未安裝 `gh` CLI** → GitHub 操作一律用原生 `git`（remote 已設好，不需重建）
- 專案在 Google 雲端硬碟上，已設 `git config windows.appendAtomically false`，換電腦務必確認同步完成再開工
- **不要死寫色碼**：改樣式一律走 `css/tokens.css` 變數
- `css/tokens.css`、`css/components.css`、`js/layout.js` 是全站共用，改動前先讀最新內容
- AI 產出的文件一律歸檔 `output/`，不要散落根目錄

## 🕐 最後更新

- 時間：2026-07-25 10:06
- 更新者：Claude Code (Opus 5) @ KEN-PC
- Git push：⏳ 待本次初始化變更 commit 後推送

---

## 📌 當前專案進度摘要 (Current System Status)

本專案已完成全套品牌官網與 3 大不動產專用在線工具頁面建置，所有程式碼均經過二階段模組化重構，並發布至 GitHub Pages。

### 1. 已上線頁面與功能
1. 🌐 **港居官網首頁 (`index.html`)**：
   - 包含 TopBar（特許證號、統編 96797997）、Hero 主視覺、包租 vs 代管雙方案卡片、房東 ROI 預估試算器、精選房源 3D VR 彈窗與條件篩選、Lead 諮詢表單。
   - 配置 Schema.org `RealEstateAgent` JSON-LD 結構化資料標註。
2. 🧮 **租金與代管服務費換算工具 (`rent-calculator.html`)**：
   - 支援 30日 / 當月實際 / 自訂基準天數，跨月日期區間計算，10% 代管服務費與屋主實收拆分，LocalStorage 歷史紀錄。
   - 配置 Schema.org `FinancialCalculator` JSON-LD 結構化標註。
3. 📂 **線上多功能檔案轉換神器 (`file-converter.html`)**：
   - 參考 Aconvert 轉檔機制，支援 PDF/DOCX/PNG/JPG/WEBP/MP3/MP4/ZIP 瀏覽器端本地即時轉檔與歷史紀錄。
   - 配置 Schema.org `WebApplication` JSON-LD 結構化標註。
4. 📷 **照片 EXIF & 拍攝日期水印工具 (`photo-watermark.html`)**：
   - 專為不動產巡檢與招租照提供 EXIF 時間戳記與浮水印合成。

---

## 🛠️ 架構規範 (Architecture Standards)

- **CSS Tokens & Components**：所有 CSS 檔案（`styles.css`, `rent-calc.css`, `css/converter.css`, `watermark.css`）統一引入 `css/tokens.css` 與 `css/components.css`，不可隨意死寫顏色與組件樣式。
- **JS 模組化**：使用原生 ES6 Modules (`import / export`)。`js/utils.js` 處理通用工具，`js/layout.js` 處理全站選單與版面控制。
- **輸出歸檔規範**：所有產出之規格書、講義、試卷與文件，統一存放在 `output/` 資料夾（如 `output/SPECIFICATION.md`）。
- **RWD 與觸控點擊**：確保全站響應式，所有按鈕與觸控元件點擊區域 ≥ **44×44px**。

---

## 🔗 線上營運與倉庫網址

- **GitHub 遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`
- **GitHub Pages 網址**：`https://ganggo880.github.io/ganju-website/`
- **系統技術規格書**：`output/SPECIFICATION.md`
