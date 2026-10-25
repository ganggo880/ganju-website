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
- [x] 階段三十一：首頁法定與服務承諾指標專區 `#testimonials`（四大法定合規與零上傳隱私承諾指標、誠信原則不刊登未授權虛擬評價、移除未經驗證之 `AggregateRating`/`Review` 結構化資料，56組行動端0px溢出通過）
- [x] 階段三十二：房源已出租留存機制與 VR 看房支援 ＋ 品牌吉祥物（馬經理與羊管家）與實體門市導航整合（RFP §2.1、§3、§5.3 規範落地、已出租SEO流量長尾轉化、Matterport/720度VR語法相容、雙吉祥物迎賓卡、小港中安路Google Maps導航）
- [x] 階段三十三：專案全功能結案交付 ＋ 系統維護操作手冊 ＋ 一年期 SLA 保固與數位資產歸屬說明書（RFP §5.4、§5.5、§6.2 正式交付、《港居官網系統運營與房源維護操作手冊》與《數位資產權益歸屬與一年期SLA保固服務條款說明書》落地、三層備份與災難復原）
- [x] 階段三十四：全站個資隱私權政策 (`privacy.html`) 雙向閉環互通 ＋ 專案健康檢測引擎升級 ＋ 誠信資料校核（全站 15 頁頁尾全面補齊個資政策直連、全站 15/15 頁雙向互通度 100%、`verify_project_health.py` 綜合檢測評定 GRADE A+ 滿分、移除未經證實之評價/營業時間/PageSpeed 預填數據、補齊官方登記證號至藍圖）
- [x] 階段三十五：分租水電費與公電分攤結算單產生器 `utility-splitter.html`（依據 2024.07.15 住宅租賃定型化契約電費新制設計，內建台電當期每度平均電價上限防呆、各房獨立分表度數與公電/水費加權分攤、一鍵結轉本期度數至下期、各房專屬 LINE 催繳文字複製、Canvas 高畫質繳費通知圖卡下載與 A4 公告總表無痕列印，全站 16 頁 100% 互通與 PWA 離線可用）
- [x] 階段三十六：退租押金結算與點交扣款明細單產生器 `deposit-settlement.html`（依據租賃專法第 11 條與內政部定型化契約第 14 點設計，內建提前解約最高 1 個月違約金上限防呆、破日租金退補、最後一期水電結算、跨工具從 `repair-inspection.html` 匯入修繕扣款、中文大寫金額轉換、雙畫布手寫親簽、LINE 明細複製、Canvas 含簽章圖卡下載與 A4 返還確認書列印，全站 17 頁 100% 互通與 PWA 離線可用）
- [x] 階段三十七：300 億中央擴大租金補貼資格自檢與實質月租試算器 `rent-subsidy-checker.html`（依據內政部國土管理署高雄市第一至三級基準額與單身 1.2 倍、新婚 1.3 倍、育兒 1.4~2.0 倍、經濟/社會弱勢加碼倍數設計，內建 4 大資格自檢、5 大族群快速試算、租客實付月租比例條、房東公益出租人 vs 港居包租代管 60% 費用率雙贏導流、LINE 複製、Canvas 圖卡下載與 A4 診斷單列印，全站 18 頁 100% 互通與 PWA 離線可用）
- [x] 階段三十八：租金電子收據與屋主代管月結對帳單產生器 `rent-receipt.html`（支援「租客繳租電子收據」與「屋主代管月結匯款對帳單（自動扣除 10% 代管服務費與代墊修繕費）」雙模式切換，內建繁體中文金融大寫金額自動轉換、跨工具從 `utility-splitter.html` 匯入水電費與從 `repair-inspection.html` 匯入房東修繕費、雙畫布 Retina 2x 電子手寫簽章、港居紅色認證收訖章、LINE 通知文字複製、Canvas 高畫質電子憑證圖卡下載與 A4 正式憑證列印，全站 19 頁 100% 互通與 PWA 離線可用）
- [x] 階段三十九：591／社群招租文案與第 33 條法定揭露合成器 `listing-post-generator.html`（依據《租賃住宅市場發展及管理條例》第 33 條與 2024 電費新制設計，一鍵生成 591 長文、FB 社團吸睛版與 LINE 招租速報，強制自動帶入港居法定證號防漏寫受罰並攔截營業員證號混淆，同步合成含法定字號浮水印之 1080×1080 社群招租亮點首圖，全站 20 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十：欠租催告與終止租約「郵局存證信函」產生器 `legal-notice-generator.html`（依據《民法》第 440 條、第 451 條與《租賃專法》第 10 條設計，內建欠租限期催告、催告期滿正式終止租約暨限期遷讓、違反公約催告及期滿不續租四大法務範本，內建二個月欠租法定終止門檻防呆檢核，自動排版為中華郵政標準 20×10 格線格式並試算存證規費，支援 LINE 最後通牒複製、Canvas 存證信函圖卡下載與 A4 標準一式三份列印，全站 21 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十一：官網主頁「全方位不動產與租務線上工具中心 (`#tools`)」實體專區與 4 大分類篩選器整合（收錄全站 18 款高階數位工具、支援全部/房東/租客/空間神器即時動態過濾、GTM/GA4 點擊追蹤、下拉選單錨點直達、80 組行動端 0px 溢出通過）
- [x] 階段四十二：物業投資實質淨投報率與房貸現金流精算器 `property-roi-calculator.html`（精算 Cap Rate、自備款現金殖利率 CoC、房貸本息均攤、空屋折減與自租/代管/包租三大方案實質淨現金流 PK、LINE 複製、Canvas 圖卡下載與 A4 列印，全站 22 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十三：租客現場看屋 30 項屋況自檢與避坑評分表產生器 `viewing-checklist.html`（6 大核心分區、30 項實戰檢核、100 分綜合宜居指數、三大一級致命安全警示、待改善地雷備忘錄、LINE 複製、Canvas 840×1080px 圖卡下載與 A4 診斷表列印，全站 23 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十四：租賃住宅設備損耗折舊與賠償殘值精算器 `depreciation-calculator.html`（行政院固定資產耐用年數表、平均法直線折舊、法定殘值下限、修復費vs現值孰低原則、承租人過失比例分攤、LINE 複製、Canvas 840×1080px 圖卡下載與 A4 列印，全站 24 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十五：租約提前終止協議書與遷讓交還切結產生器 `lease-termination-agreement.html`（民法第453/454條與租賃專法第10/11條、四種終止模式與法定免責判定、鑰匙配件設備點交清單、押金淨額結算與跨工具匯入、債權債務清償消滅Clean Break條款、雙畫布Retina 2x簽章、A4無痕列印與Canvas圖卡下載，全站 25 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十六：租約續約協議書與租金調幅精算產生器 `lease-renewal-agreement.html`（依據民法第451條防範默示更新不定期租賃與土地法第100條限制，內建主計總處房租CPI調幅試算、原押金結轉與法定2個月上限檢核、原約條款繼續拘束宣告、雙畫布Retina 2x電子手寫簽章、A4無痕列印與高畫質圖卡下載，全站 26 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十七：租客承租資格審查與租賃信用評分表產生器 `tenant-screening-checker.html`（依據30%房租所得比法則與租賃專法注意義務，整合所得負擔能力、職業穩定度、司法裁判查驗、前房東照會履歷、一票否決紅旗防呆、A4診斷書列印出圖、合格房客一鍵匯出至租約，全站 27 頁 100% 互通與 PWA 離線可用）
- [x] 階段四十八：線上工具專屬授權驗證鎖定防護系統（`css/auth-guard.css` ＋ `js/auth-guard.js`、Zero FOUC 零閃爍防護、沉浸式毛玻璃鎖定遮罩、港居統編與專屬通行碼 SHA-256 驗證、網址免密帶入 `?auth=...` 自動解鎖、30 天記住裝置、頂部重新鎖定、首頁 `#tools` 內部授權提示橫幅、全站 26 頁 104 組極限 RWD 0px 溢出通過）
- [x] 階段四十九：住宅租賃委託管理（包租／代管）契約書線上產生器 `mandate-contract.html`（符合內政部定型化契約應記載不得記載事項規範，支援委託代管10%服務費與保證包租雙模式切換、六大受託管理權限授權清單、5,000元免報備快速修繕代墊條款、撥款銀行指定、金融繁體大寫轉換、雙畫布Retina 2x電子手寫簽章、A4無痕列印與高畫質圖卡下載，全站28頁100%互通、PWA 103項離線可用與108組行動端0px溢出通過）
- [x] 階段五十：租賃住宅連帶保證人保證書與履約切結書線上產生器 `guarantor-agreement.html`（依據《民法》第739~745條連帶保證規範設計，內建六大欠繳債權擔保範圍、明確自願拋棄先訴抗辯權切結宣告、最高清償責任限額國字大寫轉換、雙畫布Retina 2x電子手寫簽章、A4無痕列印出圖、Canvas 840×1080px圖卡下載與LINE摘要複製，全站29頁100%互通、PWA 106項資產離線秒開與112組行動端0px溢出通過）
- [x] 階段五十一：租賃住宅修繕通報派工與完工驗收證明單產生器 `repair-work-order.html`（依據《民法》第429/430條與租賃專法第11條規範，整合六大修繕分類與特急搶修等級、5,000元免報備緊急搶修代墊判定、動態材料工項明細與金融大寫國字金額轉換、修繕前後對比照片存證、租客/廠商/港居三方電子手寫簽章、A4無痕列印出圖、Canvas 840×1080px 圖卡下載與LINE通報文字複製，全站 30 頁 100% 互通、PWA 109 項資產離線秒開與 116 組行動端 0px 溢出通過）
- [x] 階段五十二：租屋定金收據與承租保留切結產生器 `holding-deposit-receipt.html`（依據《民法》第248條及第249條規範，明定定金契約推定成立、承租保留截止日時與定金折抵條款，支援繁體中文金融大寫金額轉換、雙畫布Retina 2x電子手寫簽章、A4標準無痕列印、Canvas 840×1080px圖卡下載與LINE存證複製，全站 31 頁 100% 互通、PWA 112 項資產離線秒開與 120 組行動端 0px 溢出通過）

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
├── utility-splitter.html            # 16. 分租水電費與公電分攤結算單產生器
├── deposit-settlement.html          # 17. 退租押金結算與點交扣款明細單產生器
├── rent-subsidy-checker.html        # 18. 300億租金補貼資格自檢與實質月租試算器
├── rent-receipt.html                # 19. 租金電子收據與屋主代管月結對帳單產生器
├── listing-post-generator.html      # 20. 591／社群招租文案與第33條法定揭露合成器
├── legal-notice-generator.html      # 21. 欠租催告與終止租約郵局存證信函產生器
├── property-roi-calculator.html     # 22. 物業投資實質淨投報率與房貸現金流精算器
├── viewing-checklist.html           # 23. 租客看屋 30 項自檢與避坑評分表產生器
├── depreciation-calculator.html     # 24. 租賃住宅設備折舊損耗與殘值賠償精算器
├── lease-termination-agreement.html # 25. 租約提前終止協議書與遷讓交還切結產生器
├── lease-renewal-agreement.html     # 26. 租約續約協議書與租金調幅精算產生器
├── tenant-screening-checker.html    # 27. 租客承租資格審查與租賃信用評分表產生器
├── mandate-contract.html            # 28. 住宅租賃委託管理（包租／代管）契約書線上產生器
├── guarantor-agreement.html         # 29. 租賃住宅連帶保證人保證書與履約切結書線上產生器
├── repair-work-order.html           # 30. 租賃住宅修繕通報派工與完工驗收證明單產生器
├── holding-deposit-receipt.html     # 31. 租屋定金收據與承租保留切結產生器
├── sitemap.xml                      # 全站 31 頁 SEO XML 網站地圖
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
│   ├── auth-guard.css               # 全站線上工具授權驗證防護樣式（毛玻璃、零閃爍防護、RWD）
│   ├── guarantor-agreement.css      # 租賃連帶保證人保證書專用樣式與 A4 排版引擎
│   ├── mandate-contract.css         # 住宅租賃委託管理與包租契約專用樣式與 A4 排版引擎
│   ├── repair-work-order.css        # 租賃修繕派工與完工驗收單專用樣式與 A4 排版引擎
│   ├── holding-deposit-receipt.css  # 租屋定金收據與承租保留切結專用樣式與 A4 排版引擎
│   ├── space-planner.css            # 2D/3D 空間格局配置系統樣式
│   ├── lease-contract.css           # 租賃契約與公約產生器樣式與 A4 列印引擎
│   ├── tax-calculator.css           # 房東節稅試算樣式與 A4 診斷書列印引擎
│   ├── repair-inspection.css        # 屋況修繕點交與瑕疵存證專屬樣式與 A4 排版引擎
│   ├── utility-splitter.css         # 分租水電費與公電分攤結算單專屬樣式與 A4 列印引擎
│   ├── deposit-settlement.css       # 退租押金結算與點交扣款明細單樣式與 A4 列印引擎
│   ├── rent-subsidy-checker.css     # 300億租金補貼資格自檢與實質月租試算樣式與 A4 列印引擎
│   ├── rent-receipt.css             # 租金電子收據與屋主代管月結對帳單樣式與 A4 列印引擎
│   ├── listing-post-generator.css   # 591／社群招租文案與第33條法定揭露合成器樣式
│   ├── legal-notice-generator.css   # 郵局存證信函 20×10 標準格線與 A4 列印引擎樣式
│   ├── privacy.css                  # 隱私權政策與個資保護專頁樣式
│   ├── ocr-translator.css           # 照片 OCR 文字辨識與翻譯專屬樣式
│   ├── converter.css                # 檔案轉換工具專屬樣式
│   ├── card-merger.css              # 名片合成工具樣式
│   ├── image-converter.css          # 圖像格式轉換工具樣式
│   ├── photo-time-location.css      # 照片時間地點浮水印工具樣式
│   └── id-card-watermark.css        # 身份證照裁剪工具樣式
├── js/
│   ├── auth-guard.js                # 全站線上工具專屬授權驗證防護系統核心（SHA-256、免密URL帶參、會話管理）
│   ├── guarantor-agreement.js       # 租賃連帶保證人完全責任、先訴抗辯權拋棄與手寫簽章引擎
│   ├── mandate-contract.js          # 住宅租賃委託管理與包租契約雙模式、修繕代墊授權與手寫簽章引擎
│   ├── repair-work-order.js         # 租賃修繕三方簽章、動態材料工項明細與 A4/Canvas/LINE 輸出引擎
│   ├── holding-deposit-receipt.js   # 租屋定金收據、民法249條罰則聲明、大寫轉換與雙簽章引擎
│   ├── tracking.js                  # 全站 MarTech 追蹤核心 (GTM / GA4 / Meta Pixel)
│   ├── utils.js                     # 千分位、日期差、Toast、主題切換
│   ├── navigation.js                # 導覽列與 Mobile Drawer（index.html 使用）
│   ├── layout.js                    # Active 點亮與跨頁 Layout 控制（工具頁使用）
│   ├── space-planner.js             # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── lease-contract.js            # 租賃契約雙向連動、中文大寫金額與 A4 排版引擎
│   ├── tax-calculator.js            # 房東節稅試算引擎、三方案 PK 與 LINE 深度帶參串接
│   ├── repair-inspection.js         # 租賃修繕點交、時間浮水印壓印與電子簽章核心引擎
│   ├── utility-splitter.js          # 分租水電費與公電分攤、2024電費新制防呆與圖卡匯出引擎
│   ├── deposit-settlement.js        # 退租押金結算、違約金防呆、雙向電子簽名與圖卡匯出引擎
│   ├── rent-subsidy-checker.js      # 300億租金補貼分級加碼試算、公益出租人導流與圖卡匯出引擎
│   ├── rent-receipt.js              # 租金電子收據與屋主代管月結對帳單雙模式、中文大寫與圖卡匯出引擎
│   ├── listing-post-generator.js    # 591/FB/LINE招租文案、第33條法定證號防呆與1080x1080首圖合成引擎
│   ├── legal-notice-generator.js    # 民法440條欠租催告與終止租約、中華郵政20x10存證信函格線排版引擎
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
| 租賃住宅服務業登記證 | `(113)高市租登字第0012號`（高雄市政府核發，見 `assets/certs/rental-license.jpg`） |
| 同業公會會員證號 | `高雄市租賃住宅證字第 115-046 號`（見 `assets/certs/association-member-cert.jpg`） |
| 租賃管理證號 | `(112) 登字第013739號`（見 `assets/certs/rental-manager-cert.jpg`） |
| 聯絡窗口 | 陳俊銘 經理 |
| 電話 | `0968-863-880` ／ 市話 `07-791-2288` |
| 信箱 | `ganggo880@gmail.com` |
| Line 官方（預約看房） | https://lin.ee/Q71pw2I（港居｜租屋看房預約） |
| 地址 | 高雄市小港區合作里中安路825號 |

🔴 不對外顯示營業員證號：港居不是不動產經紀業，營業員證號會被看成從事仲介的徵象（業主 2026-10-20 決定；依據見「出租物件自動刊登」專案 output/20261020_刊登業者資格與揭露查證_港居.md）

`data/listings.json`：首頁房源區的資料檔，由「出租物件自動刊登」系統（listing_auto）以 GitHub API 更新，**請勿手動編輯**；欄位契約見該專案 listing_auto/adapters/website.py
