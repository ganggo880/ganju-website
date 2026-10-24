# 港居不動產開發有限公司 官方網站與線上工具系統技術規格書
## System Specification Document (2026 完整全功能版)

> **版本**：v3.0 (2026-10-24 房源留存、VR看房、品牌吉祥物與MarTech行銷科技整合版)  
> **系統名稱**：港居不動產品牌官網暨高階線上工具集  
> **發布網址**：[https://ganggo880.github.io/ganju-website/](https://ganggo880.github.io/ganju-website/)  
> **遠端倉庫**：`https://github.com/ganggo880/ganju-website.git`  
> **架構特性**：純前端靜態無伺服器 (Zero-Backend Serverless)、純本地零知識運算 (Zero-Knowledge Privacy)、模組化 CSS Design Tokens、全站 360px~414px 行動端 0px 溢出與 100% ≥44px 觸控熱區合格、全頁 Schema.org 結構化資料、PWA 100% 離線可用。

---

## 1. 企業背景與登記背書 (Company Profile & Licensing)

本系統為「**港居不動產開發有限公司**」專屬之品牌官方網站與 13 款不動產專業線上工具集，旨在為注重物業質感的屋主與高階租客（外商主管、科技工程師、金融醫療菁英）提供最值得信賴的包租代管線上體驗。

| 項目 | 官方登記資料 |
|---|---|
| **公司全銜** | 港居不動產開發有限公司 (GANJU Real Estate Co., Ltd.) |
| **統一編號** | `96797997` |
| **租賃住宅服務業登記證** | `(113)高市租登字第0012號`（高雄市政府核發，見 `assets/certs/rental-license.jpg`） |
| **同業公會會員證號** | `高雄市租賃住宅證字第 115-046 號`（見 `assets/certs/association-member-cert.jpg`） |
| **租賃住宅管理證號** | `(112) 登字第013739號`（見 `assets/certs/rental-manager-cert.jpg`） |
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

## 3. 系統架構與全站 15 大核心頁面清單

系統由 **1 個品牌官網主頁** 與 **14 個不動產專業線上工具與法規政策專頁** 組成，全站共用一組設計 Token 與模組化 JavaScript：

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
├── repair-inspection.html      # 14. 租賃修繕點交與屋況瑕疵存證紀錄神器 (租賃條例11條/存證水印/電子簽章)
├── privacy.html                # 15. 個人資料保護與隱私權政策專頁 (個資法特定目的086/069/040/090/純前端安全宣告)
├── sitemap.xml                 # 全站 15 頁 SEO XML 網站地圖
├── robots.txt                  # 搜尋引擎漫遊器規範檔
├── .nojekyll                   # 停用 GitHub Pages Jekyll 編譯
├── css/
│   ├── tokens.css              # 全站設計 Token (海軍藍/香檳金/字型/陰影/深淺變數)
│   ├── components.css          # 全站共用組件 (TopBar, Navbar, Footer, Buttons, Toast, 下拉選單)
│   ├── space-planner.css       # 2D/3D 空間格局配置系統樣式
│   ├── lease-contract.css      # 租賃契約產生器樣式與 A4 排版引擎
│   ├── tax-calculator.css      # 房東節稅試算專屬樣式與 A4 診斷書列印引擎
│   ├── repair-inspection.css   # 屋況修繕點交與瑕疵存證專用樣式與 A4 排版引擎
│   ├── privacy.css             # 隱私權政策與個資保護專用樣式
│   ├── ocr-translator.css      # OCR 翻譯專屬樣式
│   ├── converter.css           # 檔案轉換工具專屬樣式
│   ├── image-converter.css     # 圖像轉換工具專屬樣式
│   ├── card-merger.css         # 名片合成工具專屬樣式
│   ├── photo-time-location.css # 照片時間地點浮水印樣式
│   └── id-card-watermark.css   # 身分證照裁剪樣式
├── js/
│   ├── tracking.js             # 全站 MarTech 追蹤核心 (GTM / GA4 / Meta Pixel)
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
    ├── GTM_GA4_事件追蹤設定規格說明書.md # MarTech 追蹤設定技術交付書 (RFP §5.1, §6.2)
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

### 4.12 3D 智慧營運島數位孿生微縮世界 (`island.html` / `island_standalone.html`)
- **純原生 WebGL / Three.js 數位孿生**：以港居總部為核心打造 3D 智慧物業營運微縮島嶼，支援日夜循環、浮動路燈與即時光影渲染。
- **四大營運地標即時互動**：包含港居營運總部大樓、優質託管公寓、智慧倉儲中心與綠能巡邏車隊，支援視角平滑聚焦與運營數據彈窗。
- **雙版型部署**：首頁嵌入式互動體驗與全螢幕獨立沉浸式版本（`island_standalone.html`）。

### 4.13 租賃契約與住戶公約線上套印產生器 (`lease-contract.html`)
- **住宅租賃定型化契約法定規範**：嚴格依據內政部《住宅租賃定型化契約應記載及不得記載事項》設計，雙欄即時連動預覽。
- **大寫金額與法定防呆**：租金與押金自動轉換繁體中文金融大寫（例：`新臺幣 貳萬伍仟元整`），自動檢核押金不得超逾 2 個月租金上限。
- **公約與設備點交**：內建 27 項標準住戶生活公約、家具家電設備點交清單、凶宅防範與 300 萬違約金保障條款。
- **無痕列印**：支援 `@media print` A4 標準雙面無痕列印與 PDF 匯出。

### 4.14 房東包租代管節稅效益與實質收益試算神器 (`tax-calculator.html`)
- **住宅法第 15 條與租賃專法第 17 條試算**：精算法定每屋每月 1.5 萬元免稅額、超過部分 60% 必要費用減除率。
- **三方案實質淨收益 PK**：房東自行出租（無租補/無專法減免）、委託專業代管、全包租保證收益三大方案全年稅後淨利動態能量條比對。
- **三大高質感輸出**：支援 A4 節稅診斷書無痕列印、LINE 深度帶參諮詢陳經理與試算摘要複製。

### 4.15 租賃修繕點交與屋況瑕疵存證紀錄神器 (`repair-inspection.html`)
- **民法第 429/432 條與租賃專法第 11 條點交規範**：起租交付、退租返還與修繕存證三大模式切換。
- **六大空間與四級責任歸屬**：客廳、臥室、衛浴、廚房、陽台、公共區域分區盤點，清晰判定自然耗損、承租人過失、房東修繕與不可抗力責任。
- **相機拍照存證與電子手寫簽章**：現場拍照自動壓印時間存證浮水印，支援雙畫布 Retina 2x 高靈敏電子簽章板、儀表指針登錄、JSON 備份與 A4 存證報告列印。

### 4.16 個人資料保護與隱私權政策專頁 (`privacy.html`)
- **個資法法定特定目的規範**：遵循台灣《個人資料保護法》法定特定目的代號 086、069、040、090，明確揭示個資蒐集範疇、利用對象與期間。
- **純前端零上傳安全透明宣告**：正式對外宣告本站所有線上工具皆於使用者本地端運算，不傳輸儲存合約、證件或影像至遠端伺服器。
- **全站雙向互通**：全站 21 頁頁尾全面配置直連錨點，首頁預約表單直連隱私權同意書。

### 4.17 分租水電費與公電分攤結算單產生器 (`utility-splitter.html`)
- **2024.07.15 住宅租賃電費新制防呆**：依台電當期總金額與總度數精算當期每度平均電價上限，超逾上限自動亮紅燈防呆。
- **四種公電分攤模式**：「人數 × 天數」加權分攤（推薦・最公平）、按戶平均分攤、用電比例分攤、房東吸收。
- **三大高質感輸出**：A4 公告總表無痕列印、單房專屬 LINE 催繳文字一鍵複製、Canvas 800×980px PNG 繳費通知圖卡下載。

### 4.18 退租押金結算與點交扣款明細單產生器 (`deposit-settlement.html`)
- **定型化契約第 14 點提前解約違約金上限防呆**：提前終止租約違約金最高不得超過 1 個月租金，超逾自動亮紅燈並提供一鍵修正。
- **破日租金退補與最後一期水電結算**：支援日割精算退補、跨工具一鍵從 `repair-inspection.html` 匯入承租人修繕扣款。
- **雙電子簽章與三大輸出**：出租人與承租人雙畫布親簽、A4 退租結算確認書列印、LINE 明細複製、820×1040px PNG 圖卡下載。

### 4.19 300 億中央擴大租金補貼資格自檢與實質月租試算器 (`rent-subsidy-checker.html`)
- **內政部國土管理署高雄市級距與加碼精算**：四大資格自檢、高雄第一區（$5,000/$4,000/$2,400）與第二區基準額，自動套用單身 1.2 倍、新婚 1.3 倍、育兒 1.4~2.0 倍、弱勢 1.2~1.4 倍加碼。
- **雙贏導流與動態比例條**：呈現租客實付自負額能量條，宣導房東公益出租人與港居包租代管 60% 費用率雙贏優勢。
- **三大高質感輸出**：A4 診斷單列印、LINE 試算摘要複製、800×940px PNG 圖卡下載。

### 4.20 租金電子收據與屋主代管月結對帳單產生器 (`rent-receipt.html`)
- **雙模式架構**：模式一（租客繳租電子收據）、模式二（屋主代管月結匯款對帳單，自動精算 10% 服務費與代墊修繕款）。
- **跨工具資料串聯**：一鍵從 `utility-splitter.html` 匯入水電費、從 `repair-inspection.html` 匯入房東修繕費。
- **雙電子簽章與認證紅章**：雙畫布手寫簽章、港居紅色專用收訖章、繁體中文金融大寫金額、LINE 文字複製、840×1060px PNG 圖卡下載、A4 無痕列印。

### 4.21 591／社群招租文案與第 33 條法定揭露合成器 (`listing-post-generator.html`)
- **租賃專法第 33 條強制合規護欄**：自動帶入港居統編 `96797997`、特許登記證 `(113)高市租登字第0012號`、公會會員字號 `115-046` 與管理人員證號 `(112)登字第013739號`，防範漏報受罰 1~5 萬元並攔截營業員證號。
- **三平台文案生成**：591 結構長文版、FB 租屋社團吸睛版、LINE 招租速報版。
- **1080×1080 社群招租首圖合成**：上傳實景照合成含 300 億租補金章、月租價格卡與底部法定浮水印條之高畫質首圖。

### 4.22 欠租催告與終止租約「郵局存證信函」產生器 (`legal-notice-generator.html`)
- **民法第 440 條二個月欠租法定門檻防呆**：欠租未達二個月自動警示不得主張終止租約，保障程序正當性。
- **四大權威法務範本**：積欠租金限期催告、催告期滿終止租約暨限期遷讓、違約催告、租期屆滿不續租通知（防默示更新）。
- **中華郵政標準 20×10 格線排版與規費精算**：自動分頁每頁 200 字、試算存證規費（首頁 50 元、續頁每頁 30 元）、LINE 最後通牒複製、920×1120px PNG 圖卡下載、A4 一式三份列印。

### 4.23 官網主頁「全方位不動產與租務線上工具中心 (`#tools`)」
- **全站 19 款工具實體展示**：完整展示全站各項專業工具，具備彩色專屬圖標、業務場景標籤、核心價值說明與一鍵直達按鈕。
- **4 大分類標籤動態切換**：全部工具 (19)、房東節稅與法務 (7)、租客權益與試算 (4)、空間與數位神器 (8) 即時動態過濾切換，並自動掛載 GTM/GA4 行為追蹤。

### 4.24 物業投資實質淨投報率與房貸現金流精算器 (`property-roi-calculator.html`)
- **專業財務模型**：涵蓋購置與改造成本 (CapEx)、銀行融資與房貸 (Debt Financing)、租金收益與營運開銷 (Income & OpEx)。
- **核心投資指標**：毛投報率 (Gross Cap Rate)、淨營運收益率 (NOI Yield)、自備款現金殖利率 (Cash-on-Cash Return, CoC)、每月實質淨現金流、回本年限 (Payback Period)。
- **三大營運方案實質淨現金流 PK**：對比「房東自租自管」、「委託港居代管（10%服務費＋專法節稅）」與「港居全包租保證收益（0%空屋風險＋3~5年穩定撥款）」，搭配視覺化能量條。
- **三大輸出**：支援 A4 物業投資診斷評估書列印、Canvas 840×1080px 高畫質圖卡下載、LINE 試算摘要一鍵複製與預約會勘。

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
   - 經 Chrome DevTools Protocol (CDP) 84 組測試實機檢驗，全站 21 頁 <44px 觸控缺陷數為 **0 項 (100% 合格)**。
3. **橫向溢出防護 (Zero-Overflow Guarantee)**：
   - 360px (Galaxy S8)、375px (iPhone SE)、390px (iPhone 14)、414px (iPhone Plus) 極限螢幕下，全站 21 頁橫向滾動溢出嚴格為 **0px**。
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

全站 22 大頁面皆完整配置 Google 官方認可之 JSON-LD 結構化資料：

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
| `repair-inspection.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 租賃修繕點交與屋況瑕疵存證神器 |
| `privacy.html` | `WebPage`, `BreadcrumbList` | `name`, `description`, `publisher`, `inLanguage`, 個資保護與隱私權專頁 |
| `utility-splitter.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 分租水電費與公電分攤結算單產生器 |
| `deposit-settlement.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 退租押金結算與點交扣款明細單產生器 |
| `rent-subsidy-checker.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 300億租金補貼自檢與月租試算器 |
| `rent-receipt.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 租金電子收據與代管月結對帳單產生器 |
| `listing-post-generator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 591／社群招租文案與第33條揭露合成器 |
| `legal-notice-generator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 欠租催告與終止租約郵局存證信函產生器 |
| `property-roi-calculator.html` | `WebApplication`, `BreadcrumbList` | `applicationCategory`, `operatingSystem`, `offers` (0元 TWD), `provider`, 物業投資實質投報與房貸現金流精算器 |
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
   - **Pre-caching**：安裝時預載全站 22 頁 HTML、全套 CSS Tokens、模組化 JS 引擎與品牌圖資（`ganju-pwa-v2.3` 共 83 項核心資產）。
   - **導航請求 (Navigate)**：Network-First with Cache Fallback，網路在線時即時獲取最新修正，案場無訊號（地下室、高樓）自動回退至本機快取。
   - **靜態資源 (Assets/CDN)**：Stale-While-Revalidate 與動態快取，自動緩存 Three.js 與 FontAwesome 等第三方相依庫。
3. **原生安裝引導與連線監控 (`js/pwa.js`)**：
   - 攔截 `beforeinstallprompt` 提供符合品牌色系與 ≥ 44×44px 觸控標準之「免費安裝」提示卡片。
   - 監聽 `online` / `offline` 事件，斷網時浮動顯示離線指示徽章，連線恢復時 Toast 提示自動同步。
   - 經 CDP 實機模擬斷網驗收，全站 22 頁完全離線可用率達 **22/22 頁 (100%)**。

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

### 13.7 個人資料保護與隱私權政策專頁 (`privacy.html`) 與房源預約帶參串接

1. **台灣個資法（PDPA）與租賃條例嚴格遵循**：
   - **特定目的法定代號完整宣告**：086 不動產服務業、069 契約、類似契約或其他法律關係事務、040 行銷、090 消費者、客戶管理與服務。
   - **法定個資類別透明揭露**：C001 辨識個人者（姓名、電話、LINE ID、地址）、C011 個人描述（性別、職業）、C038 職業、C091 資料主體所取得之財物或服務（租賃歷史、修繕紀錄）。
   - **純前端零上傳儲存透明化**：明確告知用戶全站工具（OCR、浮水印、身分證裁剪、檔案轉換、格局繪製、點交紀錄）皆在瀏覽器本機記憶體（Canvas / Blob / Web Workers / LocalStorage）中完成，絕不上傳第三方伺服器，保障房東與房客數位私隱。
   - **當事人五大權益（個資法第 3 條）**：明訂查詢/請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集處理或利用、請求刪除之行使管道。
2. **首頁表單與頁尾雙向連結閉環**：
   - 首頁預約表單核選框 (`#privacyConsent`) 直連 `privacy.html`，符合主管機關對於資料蒐集事前明確同意之規範。
   - 頁尾版權資訊欄全面整合隱私權專頁連結，杜絕死連結（Dead Links）。
3. **房源彈窗 (`#propertyModal`) LINE 帶參預約**：
   - 房源物件卡點擊「加 LINE 預約看房」時，自動依據物件名稱與月租金預填文字（`您好，我想預約看房：【房源名稱】（租金：XXXX元/月）`），強化預約轉換率與客服追蹤效益。

### 13.8 MarTech 行銷科技與關鍵轉換追蹤架構 (`js/tracking.js` ＋ GTM/GA4/Meta Pixel)

1. **依據標準**：嚴格落實 RFP §5.1 行銷與成效追蹤規範、§5.2 個資法合規及 §6.2 專案交付項目。
2. **中介層設計與雙向事件派送 (`js/tracking.js`)**：
   - 全站建立統一資料層中介 `window.dataLayer = window.dataLayer || [];` 與 `window.GanjuTracker`。
   - 具備 GTM DataLayer 推播、Google Analytics 4 (`gtag`) 及 Meta Pixel (`fbq`) 自動雙向事件映射。
   - 全域自動監聽全站所有外連 LINE（`href*="lin.ee"`）與電話點擊（`href^="tel:"`），透過 Capture 階段事件代理達成 0 遺漏監聽。
   - 支援離線 PWA 與廣告阻擋器平滑靜默容錯，案場斷網環境保證零例外報錯。
3. **關鍵轉換事件清單**：
   - `lead_form_submit`：首頁資產評估表單送出（主要轉換 / Meta: `Lead`）。
   - `line_consult_click`：全站 LINE 官方諮詢點擊（主要轉換 / Meta: `Contact`）。
   - `phone_call_click`：全站撥打經理電話點擊（主要轉換 / Meta: `Contact`）。
   - `property_line_book`：房源彈窗加 LINE 看房點擊（主要轉換 / Meta: `Schedule`）。
   - `property_view`：房源卡片詳情點擊（次要轉換 / Meta: `ViewContent`）。
   - `roi_calculator_use`：首頁 ROI 收益試算器互動（互動事件 / Meta: `CustomizeProduct`）。
   - `blog_article_view`：專欄文章彈窗閱讀（內容互動 / Meta: `ViewContent`）。
   - `blog_cta_click`：專欄文末專用工具轉換推薦點擊（漏斗推進）。
4. **專案交付規格書**：
   - 完整產出獨立交付文檔：[`output/GTM_GA4_事件追蹤設定規格說明書.md`](file:///home/ken-ubuntu/gdrive_folder/ai agent/Matt Pocock skills/output/GTM_GA4_事件追蹤設定規格說明書.md)，涵蓋 Data Layer 規格、GTM 代碼觸發程序設定、GA4 自訂維度與 Meta Pixel 受眾建立指南。

### 13.9 屋主口碑與客戶見證專區 (`#testimonials`) ＋ 結構化資料真實性把關

1. **依據標準**：落實 RFP §3.1 首頁架構「精選房源聯展與客戶好評」版位，同時嚴格遵循專案「結構化資料寧缺勿假」原則。
2. **四大法定與服務承諾指標 (Trust Stats)**：
   - 100% 法定特許合法合規（高市租登字第0012號・定型化契約）。
   - 1.5 萬元每屋每月法定免稅額（租賃專法第17條・必要費用減除60%）。
   - NT$ 0 元現場資產評估諮詢（免費現場會勘與節稅收益診斷）。
   - 100% 純本地零上傳隱私保護（合約與證件僅於本機瀏覽器運算）。
3. **真實性規範**：
   - 未取得客戶書面授權前，不刊登編造之客戶姓名或評價數字，亦不在 JSON-LD 中注入未經驗證之 `AggregateRating` 或 `Review`。待日後蒐集真實屋主／租客評價後再行補入。

### 13.10 房源已出租留存機制與 VR 看房 ＋ 品牌吉祥物（馬經理與羊管家）與實體據點導航

1. **依據標準**：嚴格落實 RFP §2.1 品牌視覺規範、§3 Table 1 關於我們與 §5.3 房源運營留存標準。
2. **房源已出租留存與長尾轉換機制 (RFP §5.3)**：
   - 支援 `item.status === 'rented'` 或 `item.is_rented` 資料契約。
   - 房源卡片套用灰階濾鏡防呆，標示「已圓滿出租」深藍灰色標章。
   - 物件詳情彈窗注入「🎉 本物件已圓滿出租成交」公告橫幅。
   - 行動按鈕智慧轉換為「加 LINE 諮詢同社區相似房源」，自動組裝帶入社區名稱詢問同區域最新釋出案源，化已結案流量為潛在客源。
   - 保留固定網址 `?listing=${id}` 與 SEO 錨點，嚴格禁止直接刪除產生 404 斷鏈。
3. **360° VR 虛擬實境看房語法支援 (RFP §5.3)**：
   - 支援 `item.vr_url` 語法，卡片標記藍色天光「360° VR」標章。
   - 彈窗以響應式安全 iframe 嵌入 Matterport 或 720 度全景導覽，提供沉浸式遠端看房體驗。
4. **品牌皮克斯風格吉祥物迎賓展示卡 (RFP §2.1, §3)**：
   - **馬經理 (Manager Horse / 駿馬)**：象徵陳俊銘經理領軍之策略開創與遠見，主理全包租資產配置、保證撥款與法規節稅診斷。
   - **羊管家 (Butler Sheep / 暖羊)**：象徵港居物業團隊之細膩守護與溫暖，主理嚴選外商優質租客、修繕瑕疵存證與點交簽章。
5. **實體門市據點與 Google Map 導航 (RFP §3)**：
   - 完整標註高雄小港中安路總部地址、預約制營業時間、經理人專線與捷運紅線交通指南。
   - 配置標準符合 $\ge 44\times 44$px 之一鍵開啟 Google 地圖導航按鈕。

### 13.11 分租水電費與公電分攤結算單產生器 (`utility-splitter.html`)

1. **法令依據**：遵循內政部 113 年 7 月 15 日正式生效之《住宅租賃定型化契約應記載及不得記載事項》第四點電費計收新制。
2. **2024 電費新制法定上限防呆引擎**：
   - 輸入台電帳單應繳總金額與當期總度數，即時計算「台電當期每度平均電價上限（元/度）」。
   - 支援「依台電當期每度平均電價計收（推薦・100% 合規）」與「依契約約定固定單價計收」雙模式；若約定單價高於當期平均電價或全棟收費總和超逾台電帳單總額，系統立即亮起紅色警示橫幅。
3. **多元公電與水費加權分攤引擎**：
   - 自動反推 `公共用電度數 = 台電總度數 - 各房獨立分表用電度數總和`。
   - 支援四種公電分攤模式：依「居住人數 × 入住天數」加權比例分攤、按戶平均分攤、依各房分表用電量比例分攤、房東自行吸收公電。
   - 同步整合自來水帳單與其他公共雜費分攤，並支援一鍵將「本期度數」結轉為下一期「上期度數」。
4. **三大高質感輸出**：
   - `@media print` A4 無痕列印《分租住宅水電費暨公共費用分攤結算公告總表》。
   - 各房專屬 LINE 催繳通知文字一鍵複製（含台電當期平均電價法定揭露）。
   - HTML5 Canvas 繪製 800×980px 高畫質單房專屬《水電費繳費通知單》PNG 圖卡下載。

### 13.12 退租押金結算與點交扣款明細單產生器 (`deposit-settlement.html`)

1. **法令依據**：遵循《租賃住宅市場發展及管理條例》第 11 條退租返還點交規範及內政部《住宅租賃定型化契約應記載事項》第 14 點提前終止租約違約金規定。
2. **提前解約違約金上限防呆引擎**：
   - 支援「期滿正常退租 / 雙方合意」、「承租人提前終止租約」與「出租人提前終止租約」三模式。
   - 若承租人提前終止租約之違約金超逾法定最高「1 個月租金」上限，立即亮起紅色警示並提供一鍵修正為法定上限按鈕。
3. **破日租金退補、最後一期水電結算与跨工具修繕匯入**：
   - 支援預繳未住滿天數按日退還租客（+）或延後退租按日補收（-）。
   - 整合最後一期電表度數結算、未結水費與瓦斯管理費。
   - 支援一鍵從本機 `repair-inspection.html`（屋況修繕點交神器）草稿匯入歸責於承租人之損壞修繕項目。
   - 自動轉換最終應退押金淨額為台灣法務正式中文大寫金額。
4. **雙畫布 Retina 2x 電子手寫親簽與三大輸出**：
   - 內建出租人／代管方與承租人雙畫布手寫簽章，即時同步至確認書。
   - 支援 `@media print` A4 無痕列印《住宅退租押金結算暨點交返還確認書》（含債權債務結清免責條款）、LINE 明細文字複製與 Canvas 820×1040px 含簽章 PNG 圖卡下載。

### 13.13 300 億中央擴大租金補貼資格自檢與實質月租試算器 (`rent-subsidy-checker.html`)

1. **法令依據**：遵循內政部國土管理署「300 億元中央擴大租金補貼專案」高雄市分級與加碼標準，以及《住宅法》第 15 條公益出租人與《租賃住宅市場發展及管理條例》第 17 條包租代管節稅規範。
2. **四大基本資格自檢與高雄市分級加碼試算引擎**：
   - 檢核年滿 18 歲、家庭無自有住宅、每人月均所得低於高雄市最低生活費 3 倍（43,257 元）與未重複領取其他補貼。
   - 依高雄市第一區（小港／前鎮／鳳山等都會核心區：第一級 $5,000、第二級 $4,000、第三級 $2,400）及第二區基準上限，擇優套用最高政策加碼倍數（單身青年 1.2 倍、新婚 1.3 倍、育兒 1.4~2.0 倍、經濟弱勢 1.4 倍、社會弱勢 1.2 倍）。
3. **房東公益出租人 vs 港居包租代管雙贏導流**：
   - 同步呈現房東每屋每月 1.5 萬免稅額、房屋稅 1.2% 與委託港居包租代管 60% 必要費用減除率優勢，串聯 `tax-calculator.html` 與精選房源。
4. **三大高質感輸出**：
   - `@media print` A4 無痕列印《租金補貼核定級距與實質月租診斷單》、LINE 試算摘要複製與 Canvas 800×940px PNG 圖卡下載。

### 13.14 租金電子收據與屋主代管月結對帳單產生器 (`rent-receipt.html`)

1. **雙模式架構**：
   - **模式一（租客繳租電子收據）**：整合本期房屋租金、社區管理費、水電公電分攤費、車位費與折讓扣抵，自動產出實收總額與繁體中文金融大寫金額。
   - **模式二（屋主代管月結匯款對帳單）**：精算「代收租金總額 － 代管服務費（預設 10%） － 代墊屋況修繕費 － 其他代扣 ＝ 本期實匯屋主淨額」。
2. **跨工具資料串聯**：
   - 支援從本機 `utility-splitter.html` 草稿一鍵匯入本期水電分攤費，並支援從 `repair-inspection.html` 草稿一鍵匯入歸屬「房東負擔」之代墊修繕金額。
3. **雙畫布 Retina 2x 電子簽章、數位收訖專用章與三大輸出**：
   - 內建收款方／經辦人與相對人雙畫布電子手寫簽章及紅色模擬認證印鑑，支援 LINE 通知文字複製、Canvas 840×1060px 高畫質 PNG 憑證圖卡下載與 A4 標準無痕列印。

### 13.15 591／社群招租文案與第 33 條法定揭露合成器 (`listing-post-generator.html`)

1. **法令依據**：遵循《租賃住宅市場發展及管理條例》第 33 條、第 36-1 條廣告應註明事項規範，以及 2024.07.15 住宅租賃定型化契約電費新制。
2. **三大平台文案引擎與第 33 條強制合規護欄**：
   - 支援「591 結構長文版」、「FB 租屋社團吸睛版」與「LINE 招租速報版」三平台格式切換。
   - 強制附加港居法定服務業名稱、`（113）高市租登字第0012號`、`(112) 登字第013739號` 與公會字號，並自動攔截「營業員證號」字眼。
3. **1080×1080 社群招租亮點首圖合成器**：
   - 支援上傳房源實景照片合成 1080×1080px 社群首圖（含 300 億租補金章、月租價格卡與底部第 33 條法定揭露浮水印條）。

### 13.16 欠租催告與終止租約「郵局存證信函」產生器 (`legal-notice-generator.html`)

1. **法令依據**：遵循《民法》第 440 條（遲付租金達二個月租額之催告與終止）、第 451 條（反對默示更新）及《租賃住宅市場發展及管理條例》第 10 條提前終止租約規範。
2. **四大法務範本與二個月欠租門檻防呆**：
   - 內建「積欠租金限期催告」、「催告期滿正式終止租約暨限期遷讓」、「違反住戶公約／擅自轉租催告」與「租期屆滿不續租通知」四大範本，並自動檢核欠租是否達二個月法定門檻。
3. **中華郵政標準 20×10 格線自動分頁與規費試算引擎**：
   - 自動將正文拆字填入每行 20 格、每頁 10 行之標準郵局存證信函格線，自動分頁並計算郵局存證規費（首頁 50 元、續頁每頁 30 元），支援 LINE 最後通牒複製、Canvas 920×1120px 預覽圖卡下載與 A4 標準列印。

### 13.17 物業投資實質淨投報率與房貸現金流精算器 (`property-roi-calculator.html`)

1. **財務模型與投資評估架構**：
   - 專為不動產包租代管屋主、改套投資人與老屋翻新資產配置打造。
   - 整合總購置裝潢成本 (CapEx)、銀行融資與房貸 (Debt Financing)、租金收益與營運開銷 (Income & OpEx)。
2. **五大核心專業財務指標**：
   - 毛投報率 (Gross Cap Rate = 全年毛租金 / 總投資成本)。
   - 淨營運收益率 (NOI Yield = 全年淨營運收益 / 總投資成本)。
   - 自備款現金殖利率 (Cash-on-Cash Return, CoC = 全年稅前淨現金流 / 實質自備款)。
   - 每月實質淨被動現金流 (扣除維護、稅費與銀行房貸本息攤還)。
   - 自備款回本年限 (Payback Period)。
3. **三大營運方案實質淨現金流對比與能量條**：
   - 自租自管 (DIY) vs. 港居代管 (10%服務費＋享租賃條例1.5萬免稅額＋60%費用減免) vs. 港居全包租保證收益 (0%空屋風險＋3~5年穩定撥款＋耗損由港居吸收)。
4. **三大高質感輸出**：
   - `@media print` A4 無痕列印《港居不動產・物業投資淨回報與房貸現金流評估診斷書》。
   - HTML5 Canvas 840×1080px 高畫質 PNG 診斷圖卡下載。
   - LINE 試算摘要一鍵複製與預約陳經理現場資產會勘。

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
