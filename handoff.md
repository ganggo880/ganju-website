# 🤝 AI 交接說明文件 (AI Handover Document)

> 💡 **给接續工作的 AI Agent**：
> 歡迎閱讀本專案！本文件記錄了「港居不動產」全站系統目前的完成狀態、架構規範、已部署網址與開發約定。

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
