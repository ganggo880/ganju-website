#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
港居不動產 全站 55 款線上工具依「日常使用頻率」重新排序與補齊腳本
1. 將最常用的核心工具（租約套印、委託契約、房東節稅、租金換算、分租水電、收據對帳、點交修繕、押金結算、300億租補、招租文案、定金收據、租客審查等）排在最前面。
2. 補齊 index.html #toolsHubGrid 完整 55 張工具卡片（38 款 landlord + 9 款 tenant + 8 款 utility = 55 款）。
3. 同步更新 output/clean_nav_and_footers.py 並套用至全站 58 個 HTML 頁面的頂部「線上工具」下拉選單與頁尾「房東法務專區」。
"""

import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 55 款工具依「日常使用頻率由高至低」排序清單
# 欄位：(href, nav_title, icon, icon_color, category, badge_text, card_title, card_desc, btn_text)
TOOLS_ORDERED = [
    # === 第一梯隊：日常最常用核心十大王牌工具（簽約、算錢、節稅、點交、招租） ===
    (
        "lease-contract.html",
        "租約與住戶公約套印",
        "fa-file-signature",
        "#c5a059",
        "landlord",
        "高頻首選",
        "租賃契約與住戶公約套印產生器",
        "內政部定型化契約架構，支援雙欄即時連動、中文大寫金額自動轉換、搬遷免租期、水電度數計費、凶宅防範300萬違約金與27項住戶公約A4套印。",
        "立即產製租賃契約"
    ),
    (
        "mandate-contract.html",
        "租賃委託管理/包租契約",
        "fa-handshake",
        "#c5a059",
        "landlord",
        "屋主委託",
        "住宅租賃委託管理（包租／代管）契約書",
        "符合內政部定型化契約規範，支援委託代管 10% 服務費與保證包租雙模式切換、六大受託管理權限、5,000元免報備快速修繕代墊與雙電子簽章。",
        "立即產製委託契約"
    ),
    (
        "tax-calculator.html",
        "房東節稅效益精算",
        "fa-calculator",
        "#ecc94b",
        "landlord",
        "節稅必備",
        "房東包租代管節稅效益試算神器",
        "精算《租賃專法》第17條每屋每月 1.5 萬免稅額、60% 必要費用率、囤房稅 2.0 減半至 1.2%，一鍵對比自租、代管與全包租三方案實質全年淨收益。",
        "立即試算節稅淨得"
    ),
    (
        "rent-calculator.html",
        "租金代管費換算",
        "fa-coins",
        "#f6ad55",
        "landlord",
        "日常必備",
        "租金與 10% 代管服務費精算拆分",
        "支援 30 日固定基準、當月實際天數與跨月破日區間計算，自動拆分 10% 代管服務費與屋主實收淨額，內建 LocalStorage 歷史紀錄。",
        "立即換算破日租金"
    ),
    (
        "utility-splitter.html",
        "分租水電公電分攤",
        "fa-bolt",
        "#f6e05e",
        "tenant",
        "電費新制",
        "分租水電費與公電分攤結算單產生器",
        "符合 2024.07.15 住宅租賃電費新制（台電當期每度平均電價上限防呆），支援各房獨立分表度數、公電水費加權分攤、一鍵結轉下期與 LINE 催繳圖卡。",
        "立即結算分租水電"
    ),
    (
        "rent-receipt.html",
        "租金收據與代管對帳",
        "fa-receipt",
        "#4fd1c5",
        "landlord",
        "月結必備",
        "租金電子收據與代管月結對帳單",
        "支援「租客繳租電子收據」與「屋主代管月結匯款對帳單（自動扣除10%服務費與代墊修繕）」雙模式，內建金融大寫轉換、港居收訖章與雙簽章。",
        "立即開立收據對帳"
    ),
    (
        "repair-inspection.html",
        "點交修繕瑕疵存證",
        "fa-clipboard-list",
        "#68d391",
        "tenant",
        "起退租必備",
        "租賃修繕點交與屋況瑕疵存證紀錄",
        "依據《租賃專法》第11條與《民法》第429/432條設計，支援起租交付、退租返還與修繕存證三模式、相機拍照自動壓印時間浮水印與雙畫布手寫簽章。",
        "立即點交拍照存證"
    ),
    (
        "deposit-settlement.html",
        "退租押金結算明細",
        "fa-hand-holding-dollar",
        "#48bb78",
        "tenant",
        "退租必備",
        "退租押金結算與點交扣款確認單",
        "依據定型化契約第14點設計，內建提前解約最高 1 個月違約金上限防呆、破日租金退補、水電結算、跨工具修繕扣款匯入與雙向親筆簽章。",
        "立即結算退租押金"
    ),
    (
        "rent-subsidy-checker.html",
        "300億租補資格精算",
        "fa-house-chimney-user",
        "#f687b3",
        "tenant",
        "招租熱點",
        "300億租金補貼資格自檢與實質月租",
        "依內政部國土署高雄市第一至三級基準額與單身 1.2 倍、新婚 1.3 倍、育兒 1.4~2.0 倍及弱勢加碼倍數，精算租客實付月租與公益出租人節稅效益。",
        "立即試算租補金額"
    ),
    (
        "listing-post-generator.html",
        "591/社群招租文案",
        "fa-bullhorn",
        "#ed8936",
        "landlord",
        "法規防呆",
        "591／社群招租文案與第33條合成器",
        "依據《租賃專法》第33條與電費新制設計，一鍵生成 591 長文、FB 社團吸睛版與 LINE 速報，強制帶入港居法定證號防受罰並合成 1080×1080 首圖。",
        "立即生成招租文案"
    ),
    (
        "holding-deposit-receipt.html",
        "租屋定金收據與切結",
        "fa-money-check-dollar",
        "#38b2ac",
        "landlord",
        "現場收定",
        "租屋定金收據與承租保留切結產生器",
        "依據《民法》第248及249條定金罰則規範，明定承租保留截止日時、簽約折抵租金或押金條款、繁體中文金融大寫金額防篡改與雙電子手寫簽章。",
        "立即開立定金收據"
    ),
    (
        "tenant-screening-checker.html",
        "租客審查與信用評分",
        "fa-user-check",
        "#63b3ed",
        "landlord",
        "過濾房客",
        "租客承租資格審查與租賃信用評分表",
        "依據 30% 房租所得比法則與租賃專法注意義務，整合所得負擔能力、職業穩定度、司法查驗、前房東照會與一票否決紅旗防呆，合格房客一鍵匯出至租約。",
        "立即審查租客信用"
    ),

    # === 第二梯隊：高頻現場看屋、遷入建檔、派工巡檢、空間規劃與拍照水印工具 ===
    (
        "tenant-check-in-form.html",
        "房客遷入登記與聯絡人卡",
        "fa-building-user",
        "#4299e1",
        "tenant",
        "入住建檔",
        "房客遷入登記與住戶緊急聯絡人資料卡",
        "依據《公寓大廈管理條例》第35條與《個資法》規範，整合同住人動態名冊、汽機車車牌車籍、雙組法定緊急聯絡人、寵物晶片登記與社區公約生活切結。",
        "立即填寫遷入登記"
    ),
    (
        "repair-work-order.html",
        "修繕派工與驗收單",
        "fa-screwdriver-wrench",
        "#f59e0b",
        "landlord",
        "工務派工",
        "住宅修繕通報派工與完工驗收證明單",
        "依據《民法》第429/430條設計，整合六大修繕分類、5,000元免報備緊急搶修代墊判定、動態工料明細、修繕前後照片存證與租客/廠商/港居三方簽章。",
        "立即開立派工驗收單"
    ),
    (
        "routine-inspection-report.html",
        "屋況定期巡檢維護報告",
        "fa-clipboard-check",
        "#10b981",
        "landlord",
        "代管巡檢",
        "住宅租賃屋況定期巡檢維護報告書",
        "依據《租賃專法》第28條受託巡檢規範，整合消防住警器、熱水器排氣、配電負載、給排水防漏、門窗五金與同住合規六大安全矩陣與相片存證。",
        "立即產製巡檢報告"
    ),
    (
        "viewing-checklist.html",
        "看屋30項自檢評分表",
        "fa-list-check",
        "#f687b3",
        "tenant",
        "看屋必備",
        "租客看屋 30 項自檢與避坑評分表",
        "涵蓋 6 大核心分區、30 項實戰屋況檢核、100 分綜合宜居指數、三大一級致命安全警示與待改善備忘錄，支援下載評估圖卡與 A4 診斷表。",
        "立即開啟看屋自檢"
    ),
    (
        "property-roi-calculator.html",
        "物業淨投報與房貸精算",
        "fa-chart-line",
        "#38b2ac",
        "landlord",
        "投資精算",
        "物業投資淨投報率與房貸現金流精算器",
        "精算表面投報率、實質淨投報率 (Cap Rate)、自備款現金殖利率 (CoC)、房貸本息均攤、空屋折減與自租/代管/包租三大方案月淨現金流 PK。",
        "立即精算投資報酬"
    ),
    (
        "key-custody-agreement.html",
        "鑰匙借出保管與切結",
        "fa-key",
        "#eab308",
        "landlord",
        "帶看管理",
        "現場看屋鑰匙借出保管與返還簽收切結",
        "依據《民法》第432條保管責任設計，明定嚴禁私打複製、逾期每日違約金 500 元、遺失全額賠償換鎖切結，支援借出親簽與返還點收雙階段簽章。",
        "立即產製鑰匙切結"
    ),
    (
        "space-planner.html",
        "2D/3D格局配置系統",
        "fa-compass-drafting",
        "#00e5ff",
        "utility",
        "空間規劃",
        "2D 平面格局配置與 3D 即時轉換系統",
        "支援底圖兩點比例尺校正、ANSI31 斜線剖面、玄關連動參數化隔間、11款標準 CAD 家具圖塊、85cm 動線防呆、60FPS 3D 娃娃屋漫遊與行銷海報出圖。",
        "立即開啟 2D/3D 規劃"
    ),
    (
        "id-card-watermark.html",
        "證件保護防偽水印",
        "fa-id-card",
        "#f56565",
        "utility",
        "個資防護",
        "身份證照裁剪與租賃用途防盜水印",
        "專為簽約證件影本打造，支援自由視角裁剪、自動壓印「僅供租賃契約／包租代管申辦使用，他用無效」防偽浮水印，純本地運算零上傳。",
        "立即加蓋證件水印"
    ),
    (
        "photo-time-location.html",
        "照片時間地點水印",
        "fa-location-dot",
        "#48bb78",
        "utility",
        "巡檢拍照",
        "照片時間與地點浮水印工具",
        "自動解析 EXIF 拍攝時間與 GPS 座標，或自訂巡檢時間與地址，提供三種專業樣式與五種位置合成，支援多張批次處理與 ZIP 一鍵打包下載。",
        "立即壓印時間地點"
    ),
    (
        "photo-watermark.html",
        "房源照片時間水印",
        "fa-camera-retro",
        "#ed8936",
        "utility",
        "批次水印",
        "房源照片 EXIF 拍攝時間戳記水印",
        "批次讀取房源照片 EXIF 資訊並壓印拍攝日期與港居品牌浮水印，常駐深色專業工作台，保護原創房源照片不被盜圖。",
        "立即批次壓印水印"
    ),
    (
        "ocr-translator.html",
        "照片 OCR 翻譯",
        "fa-language",
        "#667eea",
        "utility",
        "AI 雙引擎",
        "照片 OCR 文字辨識與多國語言翻譯",
        "支援合約、水電帳單、外籍租客居留證件之 ROI 區域框選、自適應去陰影、不動產智慧詞庫校對、多國語言對照翻譯與語音朗讀。",
        "立即辨識翻譯文字"
    ),
    (
        "file-converter.html",
        "線上多功能轉檔",
        "fa-file-export",
        "#805ad5",
        "utility",
        "本地轉檔",
        "線上多功能檔案轉換神器",
        "支援 PDF, DOCX, PNG, MP3, MP4, ZIP 純瀏覽器端本地加密轉檔，檔案不傳至第三方伺服器，零個資外洩風險。",
        "立即轉換線上檔案"
    ),
    (
        "image-converter.html",
        "圖像格式轉換",
        "fa-images",
        "#38b2ac",
        "utility",
        "批次壓縮",
        "圖像格式與尺寸轉換壓縮神器",
        "支援 JPG, PNG, WEBP, GIF, SVG, BMP 六大格式互轉，單次最多 20 張、大/中/小/原圖尺寸調控與 ZIP 打包匯出。",
        "立即批次轉換圖片"
    ),
    (
        "card-merger.html",
        "名片正反合成",
        "fa-address-card",
        "#d69e2e",
        "utility",
        "證件名片",
        "名片正反面／上下拼貼合成神器",
        "一鍵將名片或證件正反面進行上下或左右對齊拼貼，支援自訂留白邊距、背景色與高畫質 JPG 匯出。",
        "立即合成正反照片"
    ),

    # === 第三梯隊：續約、解約、保證人、合租、催繳通知與常見居住特約 ===
    (
        "lease-renewal-agreement.html",
        "租約續約協議書",
        "fa-file-pen",
        "#4299e1",
        "landlord",
        "期滿續約",
        "住宅租賃續約協議書與租金調幅產生器",
        "依據《民法》第451條防範默示更新為不定期租賃，內建主計總處房租 CPI 調幅試算、原押金結轉檢核、原約條款繼續拘束宣告與雙手寫簽章。",
        "立即產製續約協議"
    ),
    (
        "lease-termination-agreement.html",
        "租約提前終止協議書",
        "fa-file-contract",
        "#f56565",
        "landlord",
        "合意解約",
        "住宅租約提前終止協議與遷讓切結產生器",
        "依據《民法》第453/454條與《租賃專法》第10/11條，涵蓋四種終止模式與法定免責判定、鑰匙點交、押金淨額結算與債權債務兩清 Clean Break 條款。",
        "立即產製解約協議"
    ),
    (
        "guarantor-agreement.html",
        "租賃連帶保證人切結書",
        "fa-user-shield",
        "#805ad5",
        "landlord",
        "債權擔保",
        "租賃住宅連帶保證人保證書與履約切結",
        "依據《民法》第739~745條設計，內建六大欠繳債權擔保範圍、自願拋棄先訴抗辯權切結宣告、最高清償責任限額國字大寫轉換與雙電子簽章。",
        "立即產製保證書"
    ),
    (
        "roommate-agreement.html",
        "合租公約與承租協議",
        "fa-users",
        "#ec4899",
        "tenant",
        "合租必備",
        "住宅租賃合租公約與共同承租連帶責任協議",
        "依據《民法》第272/273/280條連帶債務規範，支援多人合租分攤精算、主約代表指派、對外出租人全額連帶保證、中途退租替補與生活公約。",
        "立即產製合租協議"
    ),
    (
        "proxy-authorization.html",
        "租賃代理授權委任書",
        "fa-signature",
        "#6366f1",
        "landlord",
        "授權委任",
        "租賃住宅授權委託代理人委任書產生器",
        "依據《民法》第103/167/528/534條特別委任規範，支援房東出租代理與租客承租代理雙模式、7大特別代理授權權限矩陣與證件防偽黏貼格。",
        "立即產製代理委任書"
    ),
    (
        "rent-arrears-notice.html",
        "租金催繳與欠租催告書",
        "fa-file-invoice-dollar",
        "#ef4444",
        "landlord",
        "欠租催繳",
        "住宅租賃租金催繳與欠租限期清償催告書",
        "依據《民法》第439/440條與年息 5% 法定遲延利息設計，整合三級催繳梯度、跨月多期積欠明細、代管受款專戶與附送達回執聯 A4 列印。",
        "立即開立催繳通知"
    ),
    (
        "rules-violation-notice.html",
        "住戶違規改善通知單",
        "fa-triangle-exclamation",
        "#f97316",
        "landlord",
        "社區管理",
        "住戶違規行為勸導限期改善通知單產生器",
        "依據《租賃專法》第10條與《公寓大廈管理條例》第16條，涵蓋梯間雜物、深夜噪音、室內吸菸、違規養寵、私自改裝與轉租六大情境及4格存證照片。",
        "立即開立違規通知"
    ),
    (
        "legal-notice-generator.html",
        "欠租催告存證信函",
        "fa-envelope-open-text",
        "#e53e3e",
        "landlord",
        "郵局格線",
        "欠租催告與終止租約「郵局存證信函」",
        "依據《民法》第440條欠租達二個月法定終止門檻防呆，內建四大法務範本，自動排版為中華郵政標準 20×10 格線格式並試算存證規費。",
        "立即產製存證信函"
    ),
    (
        "arrears-installment-agreement.html",
        "欠租分期清償和解協議",
        "fa-handshake-simple",
        "#14b8a6",
        "landlord",
        "債務協商",
        "住宅租賃積欠租金分期清償與和解協議",
        "依據《民法》第736/737條和解效力，整合欠租與代墊款清算、2~12期分期排程、一期未付全部視為到期之失權條款與自願強制執行切結。",
        "立即產製分期協議"
    ),
    (
        "depreciation-calculator.html",
        "設備折舊損耗殘值精算",
        "fa-chart-pie",
        "#9f7aea",
        "landlord",
        "賠償精算",
        "租賃設備折舊與損壞賠償殘值精算器",
        "依據行政院固定資產耐用年數表，以平均法直線折舊精算設備現值、法定殘值保底、修復費 vs 現值孰低原則與承租人過失比例分攤。",
        "立即精算折舊殘值"
    ),
    (
        "pet-addendum-agreement.html",
        "飼養寵物特約承諾書",
        "fa-paw",
        "#f59e0b",
        "landlord",
        "寵物友善",
        "住宅租賃飼養寵物特約承諾書產生器",
        "依據《民法》第432/190條與《動保法》，整合寵物身分晶片相片存證、退租全戶除蚤除臭清消約定、抓咬木作新品照價賠償與公設裝籠管束。",
        "立即產製寵物承諾書"
    ),
    (
        "parking-lease-agreement.html",
        "汽機車停車位租用協議",
        "fa-square-parking",
        "#3b82f6",
        "tenant",
        "車位管理",
        "住宅租賃汽機車停車位租用與管理協議書",
        "依據《民法》第421條與《公寓大廈管理條例》，整合隨屋附租/單租、平面與機械車位限高限重安全防呆、EV充電樁計費特約與車牌相片存證。",
        "立即產製車位協議"
    ),
    (
        "household-registration-agreement.html",
        "設籍約定暨遷出切結書",
        "fa-id-badge",
        "#3b82f6",
        "landlord",
        "戶籍管理",
        "住宅租賃設籍約定暨退租遷出切結書",
        "依據《戶籍法》第50條第1項與定型化契約規範，整合設籍名冊登錄、退租限期遷出、逾期每日違約金精算與授權屋主逕向戶政所申請暫遷戶所。",
        "立即產製設籍切結"
    ),
    (
        "smoke-free-agreement.html",
        "無菸住宅全面禁菸承諾書",
        "fa-ban-smoking",
        "#ef4444",
        "landlord",
        "無菸環境",
        "住宅租賃無菸住宅（全面禁菸）特約承諾書",
        "依據《菸害防制法》第18/19/20條與《民法》第432條，全面納管紙菸/電子煙/加熱菸，明定浴室管道間禁菸、三級違約罰金與臭氧除味粉刷賠償。",
        "立即產製禁菸承諾書"
    ),
    (
        "noise-prevention-agreement.html",
        "噪音防制生活安寧承諾書",
        "fa-volume-xmark",
        "#38bdf8",
        "landlord",
        "社區安寧",
        "住宅租賃噪音防制與生活安寧特約承諾書",
        "依據《民法》第793/432條與《社維法》第72條，規範 Quiet Hours 安寧時段、重低音與地板衝擊音防制、訪客連帶責任與三級違規處置。",
        "立即產製防噪承諾書"
    ),
    (
        "fire-safety-agreement.html",
        "用電用火安全切結協議",
        "fa-fire-extinguisher",
        "#ef4444",
        "landlord",
        "消防安全",
        "住宅租賃用電用火安全暨失火責任切結書",
        "依據《民法》第432/434條與《消防法》第6條，合意排除重大過失抗辯、列管 800W 高功率電器、嚴禁延長線串接與住警器維護義務。",
        "立即產製用火切結"
    ),
    (
        "mold-prevention-agreement.html",
        "防潮防黴環境維護承諾書",
        "fa-droplet-slash",
        "#0284c7",
        "landlord",
        "防潮保養",
        "室內防潮防黴與環境通風維護承諾書",
        "依據《民法》第423/430/432/437條，規範洗沐抽風、除濕晾衣、空調濾網每季清洗、漏水黃金48小時通報與結構滲水 vs 人為發黴責任判定。",
        "立即產製防黴承諾書"
    ),

    # === 第四梯隊：進階法務公證、轉租裝修與特殊情境切結書 ===
    (
        "lease-notarization-agreement.html",
        "租約公證暨強執約定書",
        "fa-stamp",
        "#c5a059",
        "landlord",
        "公證強執",
        "租約公證聲請暨逕受強制執行約定書",
        "依據《公證法》第13/109條與司法院公證費用標準，自動取總租金與課稅現值孰高核算規費、逕受強執 +50% 加成與四大強執條款核取。",
        "立即產製公證約定"
    ),
    (
        "renovation-consent-agreement.html",
        "室內裝修改裝同意切結",
        "fa-hammer",
        "#f59e0b",
        "tenant",
        "裝修約定",
        "住宅租賃室內裝修改裝同意暨回復原狀切結",
        "依據定型化契約第9點、《民法》第431條與《建築法》第77條之2，整合退租回復原狀/無償留歸屋主三模式、拋棄有益費用請求權與原況相片存證。",
        "立即產製裝修切結"
    ),
    (
        "sublease-consent-agreement.html",
        "承租人轉租同意與協議書",
        "fa-people-arrows",
        "#63b3ed",
        "landlord",
        "合法轉租",
        "住宅租賃承租人轉租同意書與管理協議",
        "依據《民法》第443/444條與《租賃專法》第9條，支援一部與全部轉租雙模式、次承租期不得逾原約防呆、轉租人連帶賠償責任與三方簽章。",
        "立即產製轉租同意書"
    ),
    (
        "business-registration-agreement.html",
        "設址營業與稅賦補償協議",
        "fa-file-invoice-dollar",
        "#c5a059",
        "landlord",
        "稅差精算",
        "住宅租賃設址營業與稅賦補償協議書",
        "依據《所得稅法》、《房屋稅條例》與《土地稅法》，支援許可設址稅差精算（房屋稅/地價稅/二代健保與扣繳差額）與嚴禁私設營登重罰雙模式。",
        "立即產製設址協議"
    ),
    (
        "ownership-change-notice.html",
        "買賣不破租賃與押金移轉通知",
        "fa-house-chimney-user",
        "#38b2ac",
        "landlord",
        "產權移轉",
        "買賣不破租賃通知與押金移轉確認書",
        "依據《民法》第425條買賣不破租賃原則，宣告原租約維持不變、原押金全額移交新屋主承受返還義務、新受款帳戶指定與原屋主/新屋主/房客三方簽章。",
        "立即產製移轉通知"
    ),
    (
        "abandoned-property-agreement.html",
        "承租人遺留物拋棄切結",
        "fa-box-open",
        "#a855f7",
        "landlord",
        "點交清運",
        "承租人遺留物處理授權與拋棄切結書",
        "依據《租賃專法》第12條與《民法》第445條，支援退租現場合意拋棄、簽約事前約定與失聯催告期滿處置三模式，動態造冊並自押金扣抵清運費。",
        "立即產製遺留物切結"
    ),
    (
        "emergency-entry-agreement.html",
        "緊急避難開門授權協議書",
        "fa-door-open",
        "#ef4444",
        "landlord",
        "急難阻卻",
        "住宅租賃緊急避難與緊急開門進入授權協議書",
        "依據《刑法》第24/306條與《民法》第150條，規範瓦斯外洩/火警/爆管/失聯六大緊急情境、會同里長員警第三方見證與全程錄影阻卻違法 SOP。",
        "立即產製緊急授權書"
    ),
    (
        "dispute-mediation-request.html",
        "租賃爭議調處與調解聲請",
        "fa-scale-unbalanced-flip",
        "#63b3ed",
        "landlord",
        "免規費調處",
        "住宅租賃爭議調處與調解聲請書產生器",
        "依據《租賃專法》第16條直轄市不動產糾紛調處免繳規費規定與《鄉鎮市調解條例》，內建五大爭端範本、證物附表與請求標的金額大寫精算。",
        "立即產製調處聲請書"
    ),
    (
        "fall-prevention-agreement.html",
        "陽台窗戶防墜安全切結書",
        "fa-person-falling-burst",
        "#14b8a6",
        "landlord",
        "內部特約",
        "陽台窗戶防墜安全與隱形鐵窗切結書",
        "依據《公寓大廈管理條例》第8條第2項與《兒少法》第51條，規範既有防墜保管與自費增設隱形鐵窗三模式、窗邊80cm禁擺攀爬家具與逃生鋼絲剪保管。",
        "立即產製防墜切結書"
    ),
    (
        "disaster-prevention-agreement.html",
        "防汛防颱緊急應變切結書",
        "fa-house-tsunami",
        "#0ea5e9",
        "landlord",
        "內部特約",
        "防汛防颱與緊急應變責任切結書",
        "依據《民法》第432/437條與《災害防救法》，規範三大防汛防颱模式、門窗緊閉與陽台落水頭清淤、災損黃金24小時拍照通報與木地板泡水賠償責任分界。",
        "立即產製防颱切結書"
    ),
    (
        "altar-worship-agreement.html",
        "祭祀焚香神明安奉承諾書",
        "fa-place-of-worship",
        "#f59e0b",
        "landlord",
        "內部特約",
        "祭祀焚香與神明祖先牌位安奉承諾書",
        "依據《民法》第432/434條與《消防法》，規範嚴禁焚香與許可安奉雙模式、耐燃防火隔熱板、LED電子香火、住警器維護與全室煙燻粉刷除垢賠償。",
        "立即產製祭祀承諾書"
    ),
    (
        "accessibility-agreement.html",
        "無障礙設備安全切結書",
        "fa-wheelchair",
        "#3b82f6",
        "landlord",
        "內部特約",
        "住宅租賃無障礙設備使用與安全切結書",
        "依據《民法》第431/432條與《身障權益保障法》第57條，規範無償留歸/自費拆除復原/押金代扣三模式、六大無障礙設施規格與施工防水安全保證。",
        "立即產製無障礙切結"
    ),
]


def build_tool_cards_html():
    cards = []
    for idx, (href, nav_title, icon, color, cat, badge, title, desc, btn_text) in enumerate(TOOLS_ORDERED, 1):
        card = f"""        <!-- {idx:02d}. {title} ({href}) -->
        <article class="tool-hub-card" data-category="{cat}">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: {color};">
              <i class="fa-solid {icon}"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> {badge}</span>
          </div>
          <div class="tool-hub-body">
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
          <a href="{href}" class="tool-hub-btn">
            <span>{btn_text}</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>"""
        cards.append(card)
    return "\n\n".join(cards)


def build_dropdown_items_html():
    lines = [
        '            <li><a href="index.html#tools" class="nav-link" style="color: var(--accent-gold); font-weight: 700;"><i class="fa-solid fa-table-cells"></i> 全部工具中心 (55)</a></li>',
        '            <li><a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a></li>',
    ]
    for href, nav_title, icon, color, *_ in TOOLS_ORDERED:
        lines.append(
            f'            <li><a href="{href}" class="nav-link"><i class="fa-solid {icon}" style="color: {color};"></i> {nav_title}</a></li>'
        )
    return "\n".join(lines)


def build_footer_landlord_html():
    # 取前 20 個最常用的房東/租務核心工具放入頁尾「房東法務專區」
    landlord_tools = [t for t in TOOLS_ORDERED if t[4] in ("landlord", "tenant")][:20]
    lines = []
    for href, nav_title, *_ in landlord_tools:
        lines.append(f'            <li><a href="{href}">{nav_title}</a></li>')
    return "\n".join(lines)


def main():
    assert len(TOOLS_ORDERED) == 55, f"Expected 55 tools, got {len(TOOLS_ORDERED)}"
    cat_counts = {}
    for t in TOOLS_ORDERED:
        cat_counts[t[4]] = cat_counts.get(t[4], 0) + 1
    print("分類統計:", cat_counts)

    # 1. 更新 index.html 的 #toolsHubGrid
    index_path = os.path.join(ROOT, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()

    pattern = re.compile(
        r'(<div class="tools-hub-grid" id="toolsHubGrid">)(.*?)(</div>\s*</div>\s*</section>)',
        re.DOTALL
    )
    m = pattern.search(index_content)
    if not m:
        raise RuntimeError("找不到 index.html 中的 #toolsHubGrid 區塊！")

    new_grid = f"{m.group(1)}\n{build_tool_cards_html()}\n      {m.group(3)}"
    index_content = index_content[:m.start()] + new_grid + index_content[m.end():]

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_content)
    print("✅ index.html: 已將 55 款工具卡片依日常使用頻率由高至低重新排序並補齊！")

    # 2. 更新 output/clean_nav_and_footers.py 並執行全站 58 頁同步
    clean_script_path = os.path.join(ROOT, "output", "clean_nav_and_footers.py")
    with open(clean_script_path, "r", encoding="utf-8") as f:
        cs = f.read()

    cs = re.sub(
        r'CANONICAL_DROPDOWN_ITEMS = """.*?"""',
        f'CANONICAL_DROPDOWN_ITEMS = """{build_dropdown_items_html()}"""',
        cs,
        flags=re.DOTALL
    )
    cs = re.sub(
        r'CANONICAL_FOOTER_LANDLORD = """.*?"""',
        f'CANONICAL_FOOTER_LANDLORD = """{build_footer_landlord_html()}"""',
        cs,
        flags=re.DOTALL
    )
    with open(clean_script_path, "w", encoding="utf-8") as f:
        f.write(cs)
    print("✅ output/clean_nav_and_footers.py: 已更新為高頻優先排序！")

    subprocess.run(["python3", clean_script_path], check=True)


if __name__ == "__main__":
    main()
