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
├── file-converter.html      # 3. 線上多功能檔案轉換神器 (PDF/DOCX/PNG/MP3/MP4/ZIP 本地轉檔)
├── photo-watermark.html     # 4. 房源照片 EXIF 拍攝時間戳記與水印生成器 (常駐深色工作台)
├── id-card-watermark.html   # 5. 身份證照裁剪與租賃用途水印工具 (常駐深色工作台)
├── image-converter.html     # 6. 圖像格式與尺寸轉換神器 (JPG/PNG/WEBP/GIF/SVG/BMP 互轉與壓縮)
├── card-merger.html         # 7. 名片正反面／上下拼貼合成神器 (留白與高畫質匯出)
├── photo-time-location.html # 8. 照片時間與地點浮水印工具 (EXIF GPS 自動解析、三樣式五位置)
├── ocr-translator.html      # 9. 照片 OCR 文字辨識與多國語言翻譯神器 (99%+ 雙引擎、ROI 框選、詞庫校正)
├── space-planner.html       # 10. 2D 平面格局配置與 3D 即時轉換系統 (底圖校正、玄關連動隔間、CAD家具、60FPS 3D)
├── island.html              # 11. 3D 智慧營運島 (數位孿生微縮世界)
├── lease-contract.html      # 12. 租賃契約與住戶公約線上套印產生器 (雙欄即時連動、中文大寫、凶宅公約、A4列印PDF)
├── tax-calculator.html      # 13. 房東包租代管節稅效益與實質收益試算神器 (租賃條例17條、囤房稅2.0、三方案PK、LINE諮詢)
├── repair-inspection.html   # 14. 租賃修繕點交與屋況瑕疵存證紀錄神器 (租賃條例11條、浮水印拍照、四級責任判定、電子簽章、A4列印)
├── privacy.html             # 15. 個人資料保護與隱私權政策專頁 (符合個資法特定目的086/069/040/090、純前端安全宣告)
├── utility-splitter.html    # 16. 分租水電費與公電分攤結算單產生器 (符合2024電費新制平均電價上限防呆、LINE催繳圖卡、A4公告總表)
├── deposit-settlement.html  # 17. 退租押金結算與點交扣款明細單產生器 (破日租金退補、水電預扣、違約金防呆、雙向電子簽章、A4確認書)
├── rent-subsidy-checker.html # 18. 300億租金補貼資格自檢與實質月租試算器 (高雄分級與加碼倍數、公益出租人與包租代管節稅導流、圖卡下載)
├── rent-receipt.html        # 19. 租金電子收據與屋主代管月結對帳單產生器 (雙模式切換、中文大寫、跨工具匯入、手寫簽章與圖卡匯出)
├── listing-post-generator.html # 20. 591／社群招租文案與第33條法定揭露合成器 (三平台文案、法定證號防漏、1080x1080首圖合成)
├── legal-notice-generator.html # 21. 欠租催告與終止租約郵局存證信函產生器 (民法440條防呆、四大範本、中華郵政20x10標準格線A4列印)
├── property-roi-calculator.html # 22. 物業投資實質淨投報率與房貸現金流精算器 (Cap Rate、CoC、房貸本息均攤、三方案淨流PK)
├── viewing-checklist.html       # 23. 租客看屋 30 項自檢與避坑評分表產生器 (6大分區、30項檢核、100分評分、地雷備忘錄、A4列印)
├── depreciation-calculator.html # 24. 租賃住宅設備折舊損耗與殘值賠償精算器 (耐用年數、直線折舊、法定殘值、孰低原則)
├── lease-termination-agreement.html # 25. 租約提前終止協議書與遷讓交還切結產生器 (民法453/454條、法定免責、配件清點、Clean Break)
├── lease-renewal-agreement.html     # 26. 租約續約協議書與租金調幅精算產生器 (民法451條、土地法100條防呆、CPI調幅、押金結轉)
├── tenant-screening-checker.html    # 27. 租客承租資格審查與租賃信用評分表產生器 (30%所得比法則、司法查核、一票否決防呆)
├── mandate-contract.html            # 28. 住宅租賃委託管理（包租／代管）契約書線上產生器 (租賃專法12/14條、緊急修繕代墊、Retina 2x簽章)
├── guarantor-agreement.html         # 29. 租賃住宅連帶保證人保證書與履約切結書線上產生器 (民法739~745條、拋棄先訴抗辯權、大寫限額)
├── repair-work-order.html           # 30. 租賃住宅修繕通報派工與完工驗收證明單產生器 (民法429/430條、5,000緊急代墊、三方手寫簽章)
├── holding-deposit-receipt.html     # 31. 租屋定金收據與承租保留切結產生器 (民法248/249條、保留截止期、大寫防篡改、雙簽章)
├── key-custody-agreement.html       # 32. 鑰匙借出保管與返還簽收切結產生器 (民法432條、嚴禁私打、換鎖全額賠償、雙階段點收)
├── tenant-check-in-form.html        # 33. 房客遷入登記與住戶緊急聯絡人卡產生器 (公寓大廈第35條、緊急聯絡名冊、公約切結)
├── routine-inspection-report.html   # 34. 住宅租賃屋況定期巡檢維護報告書產生器 (租賃專法第28條、六大安全檢驗、相片存證)
├── abandoned-property-agreement.html # 35. 租賃住宅承租人遺留物處理授權與拋棄切結書產生器 (租賃專法第12條、民法445條留置權、清運扣抵)
├── rules-violation-notice.html       # 36. 租賃住宅住戶違規行為勸導限期改善通知單產生器 (租賃專法第10條、公寓大廈16/47條、照片浮水印、送達回執)
├── rent-arrears-notice.html         # 37. 住宅租賃租金催繳與欠租限期清償催告書產生器 (民法439/440條、229/233條遲延利息、三級催繳、多期明細、雙簽章回執聯)
├── proxy-authorization.html         # 38. 租賃住宅授權委託代理人委任書產生器 (民法103/167/528/534條、雙模式、7大授權矩陣、雙簽章與身分證影本格)
├── roommate-agreement.html          # 39. 住宅租賃合租公約與共同承租連帶責任協議書產生器 (民法272/273/280條連帶責任、室友費用分攤防呆、生活公約與多方簽章)
├── pet-addendum-agreement.html      # 40. 住宅租賃飼養寵物特約承諾書產生器 (民法432/190條、動保法、寵物晶片存證、退租除蚤深清與抓咬新品賠償)
├── parking-lease-agreement.html     # 41. 住宅租賃汽機車停車位租用與管理協議書產生器 (民法421/432/443條、公寓大廈16條、機械車位限高限重防呆、電動車充電樁與雙簽章)
├── renovation-consent-agreement.html # 42. 住宅租賃室內裝修與設備改裝同意暨回復原狀切結書產生器 (定型化契約第9點、民法431條有益費用拋棄、建築法77條之2與雙簽章)
├── arrears-installment-agreement.html # 43. 住宅租賃積欠租金分期清償與和解協議書產生器 (民法736/737條和解、315條分期、期限利益喪失條款、自願強制執行與雙簽章)
├── dispute-mediation-request.html   # 44. 住宅租賃爭議調處與調解聲請書產生器 (租賃專法第16條免收規費、鄉鎮市調解條例、五大爭端快速套用、證物附表與手寫簽章)
├── ownership-change-notice.html     # 45. 住宅租賃買賣不破租賃通知與押金移轉確認書產生器 (民法425條買賣不破租賃、法定承繼宣告、押金大寫移轉簽收、新帳戶與三方簽章)
├── sublease-consent-agreement.html  # 46. 住宅租賃承租人轉租同意書與管理協議產生器 (民法443/444條轉租合意與連帶損害賠償、租賃專法第9條、一部/全部轉租雙模式、租期不得逾原約防呆、大寫轉換與三方簽章)
├── business-registration-agreement.html # 47. 住宅租賃設址營業與稅賦補償協議書產生器 (所得稅法、房屋稅條例、土地稅法、特約設址稅差精算、嚴禁設址重罰、限期遷離切結與雙方簽章)
├── fire-safety-agreement.html        # 48. 住宅租賃用電用火安全暨失火責任切結協議書產生器 (民法432/434條失火責任重大過失特約排除、消防法住警器維護、高耗能電器列管、雙簽章與A4無痕列印)
├── household-registration-agreement.html # 49. 住宅租賃設籍約定暨退租遷出切結書產生器 (戶籍法50條第1項、定型化契約規範、設籍名冊、限期遷出、違約金精算、授權逕遷戶所、雙簽章與A4無痕列印)
├── lease-notarization-agreement.html     # 50. 住宅租賃租約公證聲請暨逕受強制執行約定書產生器 (公證法13條、強制執行法4條、公證規費孰高精算、逕受強執特約、雙簽章與A4無痕列印)
├── sitemap.xml              # 全站 50 頁 SEO XML 網站地圖
├── robots.txt               # 搜尋引擎漫遊器規範檔
├── styles.css               # 主頁專屬區塊樣式
├── rent-calc.css            # 租金換算工具樣式
├── script.js                # 主頁互動邏輯 (ROI計算器, 房源條件篩選, Modal 彈窗)
├── rent-calc.js             # 租金換算計算邏輯、代管拆分與歷史紀錄
├── css/
│   ├── tokens.css           # 品牌設計 Token (海軍藍 #1A365D, 香檳金 #C5A059, 陰影, 圓角, 深淺模式)
│   ├── components.css       # 全站公用組件樣式 (TopBar, Navbar, Footer, Buttons, Toast)
│   ├── auth-guard.css       # 全站線上工具專屬授權驗證防護樣式（毛玻璃、零閃爍防護、RWD）
│   ├── space-planner.css    # 2D/3D 空間格局配置系統樣式
│   ├── lease-contract.css   # 租賃契約與公約產生器專用樣式與 A4 列印引擎
│   ├── tax-calculator.css   # 房東節稅試算樣式與 A4 診斷書列印引擎
│   ├── repair-inspection.css # 屋況修繕點交與瑕疵存證專用樣式與 A4 排版引擎
│   ├── utility-splitter.css # 分租水電費與公電分攤結算單樣式與 A4 列印引擎
│   ├── deposit-settlement.css # 退租押金結算與點交扣款明細單樣式與 A4 列印引擎
│   ├── rent-subsidy-checker.css # 300億租金補貼資格自檢與實質月租試算樣式與 A4 列印引擎
│   ├── rent-receipt.css     # 租金電子收據與屋主代管月結對帳單樣式與 A4 列印引擎
│   ├── listing-post-generator.css # 591／社群招租文案與第33條法定揭露合成器樣式
│   ├── legal-notice-generator.css # 郵局存證信函 20×10 標準格線與 A4 列印引擎樣式
│   ├── property-roi-calculator.css # 物業投資投報與房貸現金流樣式與 A4 評估書列印引擎
│   ├── viewing-checklist.css    # 租客看屋 30 項自檢與避坑評分表專用樣式與 A4 列印引擎
│   ├── depreciation-calculator.css # 租賃設備折舊與殘值賠償專用樣式與 A4 列印引擎
│   ├── lease-termination-agreement.css # 提前解約協議與遷讓交還切結專用樣式與 A4 列印引擎
│   ├── lease-renewal-agreement.css # 租約續約協議書與租金調幅專用樣式與 A4 列印引擎
│   ├── tenant-screening-checker.css # 租客承租資格審查與信用評分表專用樣式與 A4 列印引擎
│   ├── mandate-contract.css # 住宅租賃委託管理與包租契約專用樣式與 A4 列印引擎
│   ├── guarantor-agreement.css # 租賃連帶保證人保證書專用樣式與 A4 排版引擎
│   ├── repair-work-order.css # 租賃修繕派工與完工驗收單專用樣式與 A4 列印引擎
│   ├── holding-deposit-receipt.css # 租屋定金收據與承租保留切結專用樣式與 A4 排版引擎
│   ├── key-custody-agreement.css # 鑰匙借出保管與返還簽收切結專用樣式與 A4 排版引擎
│   ├── tenant-check-in-form.css # 房客遷入登記與住戶緊急聯絡人卡專用樣式與 A4 排版引擎
│   ├── routine-inspection-report.css # 住宅租賃屋況定期巡檢維護報告專用樣式與 A4 排版引擎
│   ├── abandoned-property-agreement.css # 租賃住宅承租人遺留物處理授權與拋棄切結專用樣式與 A4 排版引擎
│   ├── rent-arrears-notice.css  # 租金催繳與欠租限期清償催告書專用樣式與 A4 排版引擎
│   ├── proxy-authorization.css  # 租賃代理授權委任書專用樣式與 A4 排版引擎
│   ├── roommate-agreement.css   # 合租公約與共同承租協議專用樣式與 A4 排版引擎
│   ├── pet-addendum-agreement.css # 飼養寵物特約承諾書專用樣式與 A4 排版引擎
│   ├── parking-lease-agreement.css # 汽機車停車位租用與管理協議書專用樣式與 A4 排版引擎
│   ├── renovation-consent-agreement.css # 室內裝修改裝同意暨回復原狀切結書專用樣式與 A4 排版引擎
│   ├── arrears-installment-agreement.css # 住宅租賃積欠租金分期清償與和解協議書專用樣式與 A4 排版引擎
│   ├── dispute-mediation-request.css # 住宅租賃爭議調處與調解聲請書專用樣式與 A4 排版引擎
│   ├── ownership-change-notice.css  # 住宅租賃買賣不破租賃通知與押金移轉確認書專用樣式與 A4 排版引擎
│   ├── sublease-consent-agreement.css # 住宅租賃轉租同意書與管理協議專用樣式與 A4 排版引擎
│   ├── business-registration-agreement.css # 住宅租賃設址營業與稅賦補償協議專用樣式與 A4 排版引擎
│   ├── household-registration-agreement.css # 住宅租賃設籍約定暨遷出切結專用樣式與 A4 排版引擎
│   ├── lease-notarization-agreement.css # 租約公證暨強執約定專用樣式與 A4 排版引擎
│   ├── fire-safety-agreement.css    # 住宅租賃用電用火安全暨失火責任切結專用樣式與 A4 排版引擎
│   ├── privacy.css          # 隱私權政策與個資法遵循專用樣式
│   ├── ocr-translator.css   # 照片 OCR 翻譯專用樣式
│   ├── converter.css        # 檔案轉換工具專屬樣式
│   ├── image-converter.css  # 圖像轉換工具專屬樣式
│   ├── card-merger.css      # 名片合成工具專屬樣式
│   ├── photo-time-location.css # 照片時間地點浮水印樣式
│   └── id-card-watermark.css   # 身份證照裁剪工具樣式
├── js/
│   ├── auth-guard.js        # 全站線上工具專屬授權驗證防護系統核心（SHA-256、免密URL帶參、會話管理）
│   ├── guarantor-agreement.js # 租賃連帶保證人完全責任、先訴抗辯權拋棄與手寫簽章引擎
│   ├── mandate-contract.js  # 住宅租賃委託管理與包租契約雙模式、修繕代墊授權與手寫簽章引擎
│   ├── repair-work-order.js # 租賃修繕三方簽章、動態材料工項明細與 A4/Canvas/LINE 輸出引擎
│   ├── holding-deposit-receipt.js # 租屋定金收據、民法249條罰則、大寫防篡改與雙簽章引擎
│   ├── key-custody-agreement.js # 鑰匙借出切結、民法432條保管責任、雙階段簽章點收與輸出引擎
│   ├── tenant-check-in-form.js # 房客遷入登記、同住人名冊、雙緊急聯絡人與雙簽章引擎
│   ├── routine-inspection-report.js # 屋況定期巡檢、六大安全矩陣、縮圖存證與雙簽章引擎
│   ├── abandoned-property-agreement.js # 承租人遺留物拋棄、民法445條留置權、清運費用扣抵與雙簽章引擎
│   ├── rent-arrears-notice.js # 租金催繳與欠租限期清償催告書核心邏輯（三級催繳、動態欠繳試算、大寫轉換與雙簽章引擎）
│   ├── proxy-authorization.js # 租賃代理授權委任書核心邏輯（雙模式、7大授權清單、大寫轉換與雙簽章引擎）
│   ├── roommate-agreement.js  # 合租公約與共同承租協議核心邏輯（動態室友、加總防呆、生活公約、多方簽章與 A4/Canvas/LINE 輸出）
│   ├── pet-addendum-agreement.js # 飼養寵物特約承諾書核心邏輯（身分建檔、晶片登錄、清潔約定、雙簽章與圖卡輸出）
│   ├── parking-lease-agreement.js # 汽機車停車位租用與管理協議核心邏輯（機械車位限尺防呆、充電樁特約、車牌存證與雙簽章引擎）
│   ├── renovation-consent-agreement.js # 室內裝修改裝同意暨回復原狀切結核心邏輯（三模式、有益費用拋棄、原況相片存證與雙簽章引擎）
│   ├── arrears-installment-agreement.js # 欠租分期清償與和解協議核心邏輯（債務清算、2~12期排程、期限利益喪失條款與雙簽章引擎）
│   ├── dispute-mediation-request.js # 租賃爭議調處與調解核心邏輯（雙軌機關、五大爭端、證物附表與手寫簽章引擎）
│   ├── ownership-change-notice.js   # 買賣不破租賃通知與押金移轉核心邏輯（法定承受宣告、押金大寫、新帳戶與三方簽章引擎）
│   ├── sublease-consent-agreement.js # 承租人轉租同意書核心邏輯（一部/全部轉租雙模式、租期防呆、連帶責任與三方簽章引擎）
│   ├── business-registration-agreement.js # 設址營業稅差精算、限期遷址切結、金融大寫與雙方簽章引擎
│   ├── household-registration-agreement.js # 設籍約定切結、退租遷出期限、戶籍法50條逕遷授權、每日違約金與雙簽章引擎
│   ├── lease-notarization-agreement.js     # 租約公證暨強執約定核心邏輯（租金與現值孰高精算、強執加成、4大特約與雙簽章引擎）
│   ├── fire-safety-agreement.js     # 用電用火安全切結、民法434條排除宣告、高耗能電器登錄與雙簽章引擎
│   ├── tracking.js          # 全站 MarTech 追蹤核心 (GTM / GA4 / Meta Pixel)
│   ├── utils.js             # 公用工具函式 (千分位, 日期差, Toast 提示, escapeHTML, 主題切換)
│   ├── navigation.js        # 導覽列與 Mobile Drawer 控制器
│   ├── layout.js            # 版面 Active 點亮與跨頁面 Layout 控制器
│   ├── space-planner.js     # 2D CAD + 3D WebGL 空間格局配置核心引擎
│   ├── lease-contract.js    # 租賃契約雙向連動、中文大寫金額與 A4 排版引擎
│   ├── tax-calculator.js    # 房東節稅試算引擎、三方案 PK 與 LINE 深度帶參串接
│   ├── repair-inspection.js # 租賃修繕點交、時間浮水印壓印與電子簽章核心引擎
│   ├── utility-splitter.js  # 分租水電費與公電分攤、2024電費新制防呆與圖卡匯出引擎
│   ├── deposit-settlement.js # 退租押金結算、違約金防呆、雙向電子簽名與圖卡匯出引擎
│   ├── rent-subsidy-checker.js # 300億租金補貼分級加碼試算、公益出租人導流與圖卡匯出引擎
│   ├── rent-receipt.js      # 租金電子收據與屋主代管月結對帳單雙模式、中文大寫與圖卡匯出引擎
│   ├── listing-post-generator.js # 591/FB/LINE招租文案、第33條法定證號防呆與1080x1080首圖合成引擎
│   ├── legal-notice-generator.js # 民法440條欠租催告與終止租約、中華郵政20x10存證信函格線排版引擎
│   ├── property-roi-calculator.js # 物業投資投報、房貸本息均攤、自備款現金殖利率與圖卡匯出引擎
│   ├── viewing-checklist.js # 租客現場看屋 30 項自檢、100分宜居指數、致命安全警示與圖卡匯出引擎
│   ├── depreciation-calculator.js # 租賃設備折舊計算、法定殘值、修復費vs現值孰低與圖卡匯出引擎
│   ├── lease-termination-agreement.js # 提前解約協議、四模式判定、配件清點、雙畫布簽章與圖卡匯出引擎
│   ├── lease-renewal-agreement.js # 租約續約協議、物價CPI調幅、押金結轉與手寫簽章引擎
│   ├── tenant-screening-checker.js # 租客信用評分卡、RTI所得比、一票否決防呆與診斷書匯出引擎
│   ├── ocr-translator.js    # OCR 雙引擎核心與影像處理邏輯 (純前端自包含腳本)
│   ├── converter.js         # 檔案轉換核心邏輯 (Canvas/Blob 本地加密運算)
│   ├── image-converter.js   # 圖像格式與尺寸調控邏輯
│   ├── card-merger.js       # 名片正反面合成邏輯
│   ├── photo-time-location.js # 照片時間地點浮水印渲染邏輯
│   └── watermark-app.js     # EXIF 水印工具邏輯
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
  - 租賃住宅服務業登記證：`(113)高市租登字第0012號`（高雄市政府核發，見 `assets/certs/rental-license.jpg`）
  - 同業公會會員證號：`高雄市租賃住宅證字第 115-046 號`（見 `assets/certs/association-member-cert.jpg`）
  - 租賃管理證號：`(112) 登字第013739號`（見 `assets/certs/rental-manager-cert.jpg`）
- **聯絡窗口**：陳俊銘 經理（`0968-863-880` / 市話 `07-791-2288` / 信箱 `ganggo880@gmail.com`）
- **Line 官方短網址（預約看房）**：`https://lin.ee/Q71pw2I`（港居｜租屋看房預約）
- **公司地址**：高雄市小港區合作里中安路825號
- 🔴 不對外顯示營業員證號：港居不是不動產經紀業，營業員證號會被看成從事仲介的徵象（業主 2026-10-20 決定；依據見「出租物件自動刊登」專案 output/20261020_刊登業者資格與揭露查證_港居.md）
- `data/listings.json`：首頁房源區的資料檔，由「出租物件自動刊登」系統（listing_auto）以 GitHub API 更新，**請勿手動編輯**；欄位契約見該專案 listing_auto/adapters/website.py
