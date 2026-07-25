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
├── file-converter.html      # 3. 線上多功能檔案轉換神器 (Aconvert 轉檔機制, PDF/DOCX/PNG/MP3/MP4)
├── photo-watermark.html     # 4. 房源照片 EXIF 拍攝時間戳記與水印生成器
├── styles.css               # 主頁區塊樣式
├── rent-calc.css            # 租金換算工具樣式
├── script.js                # 主頁互動邏輯 (ROI計算器, 房源條件篩選, Modal 彈窗)
├── rent-calc.js             # 租金換算計算邏輯、代管拆分與歷史紀錄
├── css/
│   ├── tokens.css           # 品牌設計 Token (海軍藍 #1A365D, 香檳金 #C5A059, 陰影, 圓角, 深淺模式)
│   ├── components.css       # 全站公用組件樣式 (TopBar, Navbar, Footer, Buttons, Toast)
│   └── converter.css        # 檔案轉換工具專屬樣式
├── js/
│   ├── utils.js             # 公用工具函式 (千分位, 日期差, Toast 提示, 主題切換)
│   ├── navigation.js        # 導覽列與 Mobile Drawer 控制器
│   ├── layout.js            # 版面 Active 點亮與跨頁面 Layout 控制器
│   └── converter.js         # 檔案轉換核心邏輯 (Canvas/Blob 本地加密運算)
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
  - 營業員證號：`(108) 登字第354198號`
  - 租賃管理證號：`(112) 登字第013739號`
- **聯絡窗口**：陳俊銘 經理（`0968-863-880` / 市話 `07-791-2288` / 信箱 `ganggo880@gmail.com`）
- **Line 官方短網址**：`https://lin.ee/NVFhBDE`
- **公司地址**：高雄市小港區合作里中安路825號
