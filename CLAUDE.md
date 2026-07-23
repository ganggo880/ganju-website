# 港居不動產開發有限公司 專案指引 (CLAUDE.md)

## 1. 專案說明與三處同步對照表

本專案為「港居不動產開發有限公司」品牌官方網站、包租代管業務運作與 AI Agent 技能集之核心專案。

### 三處同步對照表
| 項目 | 路徑 / URL |
|---|---|
| **本地專案路徑** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills` |
| **GitHub 倉庫 URL** | `https://github.com/ganggo880/ganju-website.git` |
| **Obsidian 資料夾路徑** | `g:\我的雲端硬碟\ai agent\Matt Pocock skills\obsidian` |

---

## 2. 開發與運作指引

- **檔案歸檔規範**：所有新產出的檔案、講義或試卷，統一存放在 `output/` 資料夾中。
- **語言與語氣**：一律使用繁體中文（台灣），語氣親切專業。
- **UI/UX 設計規範**：網頁與視覺設計優先採用響應式設計（RWD），具備良好留白與清晰動線。
- **安全性**：敏感資訊（API 金鑰等）絕對不可 commit 進版本控制。

---

## 3. Obsidian 第二大腦結構 (Karpathy 三層式)

| 資料夾 | 用途 | 說明 / 存放內容 |
|---|---|---|
| `obsidian/Clippings/` | 輸入 | 透過 Web Clipper 剪藏的不動產文章、法規案例與參考資料 |
| `obsidian/知識庫/` | 消化 | AI 自動提煉與整理的結構化知識庫 (包含 `index.md` 與 `log.md`) |
| `obsidian/創作庫/` | 輸出 | 代管/包租業務合約範本、招租企劃、教材與管理報告 |
| `obsidian/每日筆記/` | 時間管理 | 每日工作紀錄、週計畫與每週知識重整週報 |
| `obsidian/Templates/` | 模板 | 各類筆記與週計畫標準格式 |

---

## 4. Agent Skills 技能架構說明

Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used
