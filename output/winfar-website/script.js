/* ==========================================================================
   穩發漁業集團 WIN FAR FISHERY GROUP - 互動與邏輯指令腳本 (含新聞快照與船隊)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }

  // 2. Fleet Showcase Tabs Logic (Updated with Real Win Far Vessels)
  const fleetData = {
    purse: {
      title: "大型鰹鮪圍網漁船隊 (Purse Seiner Fleet - 穩發618號)",
      desc: "配備當代頂尖的衛星Sonar探魚系統與大型海上網具，專門作業於中太平洋與西太平洋海域，捕撈野生正鰹與黃鰭鮪。船身清晰標示『穩發618號 WIN FAR NO.618』，提供全球鮪魚加工與罐頭製造商最高品質之原料。",
      spec1: "平均總噸位: 1,200 ~ 1,800 噸",
      spec2: "冷凍能力: 海水冰溫急凍 (-20°C)",
      spec3: "主力捕撈海域: 中西太平洋 (WCPFC)",
      spec4: "作業魚種: 黃鰭鮪、野生正鰹",
      img: "assets/winfar_618_purse_seiner.jpg"
    },
    longline: {
      title: "超低溫鮪延繩釣船隊 (Ultra-Low Temp Longliners - 穩發161號)",
      desc: "穩發漁業集團核心精銳船隊（代表船號：穩發161號 WIN FAR NO.161）。船上配備 -60°C 極致超低溫冷凍設備。獲捕之黃鰭鮪、大目鮪及黑鮪，於幾分鐘內完成去鰓放血並進入零下60度超低溫急速凍結，完美鎖住日本刺身生食級水準之新鮮度與油脂質地。",
      spec1: "平均總噸位: 700 ~ 1,000 噸",
      spec2: "冷凍能力: 零下 -60°C 極致急凍",
      spec3: "主力捕撈海域: 印度洋、大西洋、太平洋",
      spec4: "作業魚種: 生食級大目鮪、黃鰭鮪",
      img: "assets/winfar_161_longliner.jpg"
    },
    squid: {
      title: "魷釣兼秋刀魚棒受網船隊 (Squid Jigger & Saury Fleet - 穩發626號)",
      desc: "靈活因應季節與海域切換作業模式（代表船號：穩發626號 WIN FAR NO.626）。每年夏季轉赴北太平洋捕撈油脂豐厚之秋刀魚；冬季遠赴西南大西洋阿根廷外海進行魷釣作業。以強光集魚燈與自動魷釣機精準作業，產量與品質譽滿國際。",
      spec1: "平均總噸位: 900 ~ 1,200 噸",
      spec2: "冷凍能力: 凍結平板 (-40°C)",
      spec3: "主力捕撈海域: 西南大西洋、北太平洋",
      spec4: "作業魚種: 阿根廷魷魚、秋刀魚",
      img: "assets/winfar_626_squid_jigger.jpg"
    },
    trans: {
      title: "專業超低溫漁獲運搬船隊 (Refrigerated Cargo Vessels - WIN FAR REEFER)",
      desc: "穩發擁有萬噸級自有運搬船隊（船體顯著漆寫『穩發漁業 WIN FAR REEFER』），扮演三大洋海上流動極鮮中樞。可提供海上零下60°C急凍轉載服務，無縫對接遠洋作業漁船與陸上穩大低溫物流園區，確保水產品鏈全程溫控不中斷。",
      spec1: "運搬載重噸位: 3,000 ~ 5,000 噸",
      spec2: "倉儲溫控: -60°C 與 -35°C 雙溫區",
      spec3: "航行版圖: 三大洋全球航線",
      spec4: "服務項目: 海上轉載、冷凍運搬、運補",
      img: "assets/winfar_reefer_transport.jpg"
    }
  };

  const fleetTabBtns = document.querySelectorAll('.fleet-tab-btn');
  const fleetTitle = document.getElementById('fleetTitle');
  const fleetDesc = document.getElementById('fleetDesc');
  const fleetSpec1 = document.getElementById('fleetSpec1');
  const fleetSpec2 = document.getElementById('fleetSpec2');
  const fleetSpec3 = document.getElementById('fleetSpec3');
  const fleetSpec4 = document.getElementById('fleetSpec4');
  const fleetImg = document.getElementById('fleetImg');

  fleetTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('media-tab-btn')) return;
      fleetTabBtns.forEach(b => { if (!b.classList.contains('media-tab-btn')) b.classList.remove('active'); });
      btn.classList.add('active');

      const target = btn.getAttribute('data-target');
      const data = fleetData[target];

      if (data && fleetTitle) {
        fleetTitle.textContent = data.title;
        fleetDesc.textContent = data.desc;
        fleetSpec1.textContent = data.spec1;
        fleetSpec2.textContent = data.spec2;
        fleetSpec3.textContent = data.spec3;
        fleetSpec4.textContent = data.spec4;
        fleetImg.src = data.img;
      }
    });
  });

  // 3. News Snapshot Modal & Data Logic
  const newsSnapshotData = {
    newsPioneer: {
      title: "創航先驅專傳：台灣魷魚大王謝有志創立穩發漁業半世紀企業傳奇",
      source: "官方網站 (01_histroy_pioneer.htm) / 遠洋漁業專刊",
      date: "官方權威快照 (01_histroy_pioneer.htm)",
      img: "assets/winfar_launch_ceremony_1784826158058.jpg",
      milestone: "📍 對應穩發大世紀：1972 創航先驅篇 (01_histroy_pioneer.htm)",
      mdPath: "穩發集團/新聞/06_台灣魷魚大王謝有志創立穩發漁業半世紀企業傳奇.md",
      content: `
        <div style="background: rgba(244, 162, 97, 0.15); border-left: 4px solid var(--primary-gold); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【官方創航先驅紀錄 (01_histroy_pioneer.htm)】</strong> 穩發漁業集團創始人<strong>謝有志先生</strong>（1940-2000）出生於澎湖縣西嶼鄉竹篙灣。白手起家創立穩發漁業，開創三大洋遠洋捕撈王國，尊稱為「台灣魷魚大王」。
        </div>
        <p><strong>創航五大革命性貢獻：</strong></p>
        <ul>
          <li><strong>首創海上運搬船一貫化體系：</strong> 引進台灣第一艘海上急凍轉載運搬船，實現公海第一時間急凍轉載。</li>
          <li><strong>率先導入直升機探魚與衛星通訊：</strong> 率先配備隨船直升探魚與遠洋無線電通訊網絡。</li>
          <li><strong>開闢阿根廷與福克蘭處女漁場：</strong> 遠赴南美洲西南大西洋開闢新漁場，開創台灣魷釣黃金時代。</li>
          <li><strong>建構垂直整合冷鏈物流量能：</strong> 創立「再發冷凍」、「和集海產」、「穩發漁業」、「西發漁業」、「穩大冷凍一廠/貳廠」及「高林冷凍」。</li>
          <li><strong>獲頒國家級雙重榮譽：</strong> 榮獲「台灣十大傑出漁民」及「台灣十大傑出農業專家」。</li>
        </ul>
        <p style="margin-top: 12px; font-style: italic; color: var(--primary-cyan);">
          「飲水思源、海洋尊嚴。謝有志創辦人長年關懷故鄉澎湖西嶼文教公益，其拓荒精神持續帶領穩發航向世界。」
        </p>
      `
    },
    newsProfile: {
      title: "官方集團概況：穩發漁業集團企業簡介與營運架構 Profile",
      source: "官方網站 (01_histroy_profile.htm)",
      date: "官方權威快照 (01_histroy_profile.htm)",
      img: "assets/winfar_kaohsiung_port_1784826148505.jpg",
      milestone: "📍 對應穩發大世紀：官方集團概況 (01_histroy_profile.htm)",
      mdPath: "穩發集團/新聞/02_穩發漁業集團簡介與經營概況_01_histroy_profile.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.12); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【官方集團概況紀錄 (01_histroy_profile.htm)】</strong> 穩發漁業集團總部位於高雄前鎮漁港（明道路115號），現任董事長為<strong>謝龍隱先生</strong>（兼任全國漁會理事長）。
        </div>
        <p><strong>集團旗下核心事業與組織架構：</strong></p>
        <ul>
          <li><strong>穩發漁業股份有限公司：</strong> 遠洋鮪延繩釣與大型鰹鮪圍網船隊營運（如穩發618號、穩發161號）。</li>
          <li><strong>西發漁業股份有限公司：</strong> 遠洋魷釣兼秋刀魚棒受網船隊營運（如穩發626號）。</li>
          <li><strong>和集企業股份有限公司：</strong> 水產食品加工、大宗貿易與全球外銷。</li>
          <li><strong>穩大冷凍股份有限公司（一廠、貳廠）：</strong> 前鎮與臨海工業區萬噸級-60°C與-25°C超低溫倉儲。</li>
          <li><strong>高林冷凍廠 / 新高林冷凍：</strong> 魚貨極速凍結保鮮與水產物流園區。</li>
        </ul>
        <p style="margin-top: 12px;"><strong>四大多元遠洋船隊：</strong> 大型鰹鮪圍網船隊、超低溫鮪延繩釣船隊、魷釣兼秋刀魚船隊、萬噸級專業超低溫運搬船隊（WIN FAR REEFER）。</p>
      `
    },
    news01: {
      title: "工研院攜手穩發漁業 導入AIoT低碳無人機探魚系統 顛覆傳統遠洋探魚模式",
      source: "經濟日報 / 中央社",
      date: "2023-11-15",
      img: "assets/winfar_ai_drone_scout_1784826139054.jpg",
      milestone: "📍 對應穩發大世紀：2023 智慧轉型（工研院 AIoT 無人探魚）",
      mdPath: "穩發集團/新聞/01_工研院與穩發漁業合作開發AIoT低碳無人機探魚系統.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 經濟部技術處支持工研院、金屬中心與國內遠洋漁業龍頭<strong>穩發漁業集團</strong>（董事長謝龍隱）合作，成功研發「低碳智慧漁搜無人機隊系統」。
        </div>
        <p><strong>技術亮點：</strong></p>
        <ul>
          <li>無人機具備抗 7 級強風能力，單次巡航里程高達 60 公里以上。</li>
          <li>搭載工研院 AIoT 智慧影像傳輸與即時演算法，四機聯網自動搜尋海面魚群跳躍與水花熱點。</li>
          <li>探魚效率提升 3 倍以上，每年為每艘圍網船節省數千萬元直升機租賃與耗油成本。</li>
        </ul>
        <p><strong>穩發漁業董事長謝龍隱表示：</strong></p>
        <blockquote style="margin: 12px 0; padding-left: 16px; border-left: 3px solid var(--primary-gold); color: #fff; font-style: italic;">
          「過去遠洋探魚極度依賴老漁撈長經驗與高風險直升機。透過與工研院合作的無人機 AI 探魚系統，我們成功將數十年海洋經驗數位化，作業更安全，更能大幅減少巡航耗油，邁向綠色永續漁業。」
        </blockquote>
      `
    },
    news02: {
      title: "穩發漁業董事長謝龍隱掌舵全國漁會 扮演產業與政府溝通橋樑",
      source: "聯合報 / 中時新聞網",
      date: "2021-04-12",
      img: "assets/winfar_kaohsiung_port_1784826148505.jpg",
      milestone: "📍 對應穩發大世紀：2021 領袖領航（謝龍隱掌舵全國漁會）",
      mdPath: "穩發集團/新聞/02_穩發漁業董事長謝龍隱接任全國漁會理事長推動產業永續.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 穩發漁業集團掌門人<strong>謝龍隱</strong>高票當選中華民國全國漁會理事長，並兼任高雄區漁會理事長。
        </div>
        <p><strong>四大推動願景：</strong></p>
        <ul>
          <li>保障漁民權益與外籍船員人道福祉。</li>
          <li>爭取高雄前鎮漁港多功能現代化升級建設。</li>
          <li>應對國際 Regional Fisheries Management Organizations (RFMOs) 減碳與捕撈配額規範。</li>
          <li>推動水產品履歷與國產精品水產品牌化外銷。</li>
        </ul>
      `
    },
    news03: {
      title: "歷時11個月談判斡旋 穩發161號遠洋漁船全員30人平安獲釋專題報導",
      source: "自由時報 / 中央社",
      date: "2010-03-05",
      img: "assets/winfar_161_longliner.jpg",
      milestone: "📍 對應穩發大世紀：2009-2010 危機考驗（穩發161號全員獲釋返港）",
      mdPath: "穩發集團/新聞/03_穩發161號印度洋海盜劫持事件全員平安獲釋始末.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 2009 年 4 月，穩發漁業旗下「穩發 161 號」鮪延繩釣漁船於印度洋遭索馬利亞海盜挾持。歷經謝龍隱董事長及國際團隊長達 11 個月談判，於 2010 年 3 月成功讓包括台籍船長、輪機長與外籍船員共 30 人全員平安獲釋。
        </div>
        <p><strong>危機處理與決策：</strong></p>
        <p>謝龍隱董事長第一時間成立應變小組，堅持「人命至上」原則，全盤負責溝通談判。該事件亦促使政府建立遠洋漁船武裝護衛與 VMS 衛星通報機制。</p>
      `
    },
    news04: {
      title: "前鎮漁港81億元改建爭議 穩發漁業謝龍隱重砲發聲：台灣不是只有一個台北",
      source: "三立新聞網 / 風傳媒",
      date: "2023-08-02",
      img: "assets/winfar_kaohsiung_port_1784826148505.jpg",
      milestone: "📍 對應穩發大世紀：2023 前鎮升級（謝龍隱重砲挺前鎮漁港改建）",
      mdPath: "穩發集團/新聞/04_前鎮漁港81億改造案引熱議_穩發漁業董事長謝龍隱出面力挺.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 高雄區漁會理事長兼穩發漁業董事長<strong>謝龍隱</strong>公開表示，前鎮漁港建港 50 年設施老舊失修，改建是為了讓台灣遠洋漁業符合日本與歐盟高標準衛檢，不應被政治化抹黑。
        </div>
        <blockquote style="margin: 12px 0; padding-left: 16px; border-left: 3px solid var(--primary-gold); color: #fff; font-style: italic;">
          「前鎮漁港是全台灣最大的遠洋漁業基地，每年創造數百億元產值。台灣不是只有一個台北，改善卸魚碼頭、船員休憩中心與冷鏈物流，是為了產業的永續競爭力。」
        </blockquote>
      `
    },
    news05: {
      title: "穩發漁業新添遠洋生力軍 「穩發618號」圍網漁船隆重舉行進水擲瓶典禮",
      source: "高雄區漁會週報 / 海洋資訊",
      date: "2020-07-18",
      img: "assets/winfar_618_purse_seiner.jpg",
      milestone: "📍 對應穩發大世紀：2020 旗艦生力軍（穩發618號進水典禮）",
      mdPath: "穩發集團/新聞/05_穩發618號大型遠洋鰹鮪圍網漁船舉行隆重進水典禮.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 穩發漁業於造船廠舉行旗艦圍網漁船「穩發 618 號」（WIN FAR NO.618）進水擲瓶典禮，祈求出航滿載歸來、航行平安。
        </div>
        <p>新船配備海水冰溫速凍設備與最新 AI 聲納魚探，展現穩發漁業持續推進船隊綠能智慧化之決心。</p>
      `
    },
    news06: {
      title: "創航先驅專傳：台灣魷魚大王謝有志創立穩發漁業半世紀企業傳奇",
      source: "官方網站 (01_histroy_pioneer.htm) / 遠洋漁業專刊",
      date: "2018-05-20 (官方權威快照)",
      img: "assets/winfar_launch_ceremony_1784826158058.jpg",
      milestone: "📍 對應穩發大世紀：1972 創航先驅 (01_histroy_pioneer.htm)",
      mdPath: "穩發集團/新聞/06_台灣魷魚大王謝有志創立穩發漁業半世紀企業傳奇.md",
      content: `
        <div style="background: rgba(244, 162, 97, 0.12); border-left: 4px solid var(--primary-gold); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【官方創航先驅紀錄 (01_histroy_pioneer.htm)】</strong> 穩發漁業集團創始人<strong>謝有志先生</strong>（1940-2000）出生於澎湖縣西嶼鄉竹篙灣。由高雄前鎮白手起家，開創三大洋遠洋捕撈王國，尊稱為「台灣魷魚大王」。
        </div>
        <p><strong>創航五大革命性貢獻：</strong></p>
        <ul>
          <li><strong>首創海上運搬船一貫化體系：</strong> 引進台灣第一艘海上急凍轉載運搬船，公海第一時間急凍轉載。</li>
          <li><strong>率先導入直升機探魚與衛星通訊：</strong> 率先配備隨船直升探魚與遠洋無線電通訊網絡。</li>
          <li><strong>開闢阿根廷與福克蘭處女漁場：</strong> 遠赴南美洲西南大西洋開闢新漁場，開創台灣魷釣黃金時代。</li>
          <li><strong>建構垂直整合冷鏈物流量能：</strong> 創立「再發冷凍」、「和集海產」、「穩發漁業」、「西發漁業」、「穩大冷凍一廠/貳廠」及「高林冷凍」。</li>
          <li><strong>獲頒國家級雙重榮譽：</strong> 榮獲「台灣十大傑出漁民」及「台灣十大傑出農業專家」。</li>
        </ul>
        <p style="margin-top: 12px; font-style: italic; color: var(--primary-cyan);">
          「飲水思源、海洋尊嚴。謝有志創辦人長年關懷故鄉澎湖西嶼文教公益，其拓荒精神持續帶領穩發航向世界。」
        </p>
      `
    },
    news07: {
      title: "穩發集團穩大冷凍園區擴建 打造前鎮最大-60°C極致急凍供應鏈",
      source: "物流與水產供應鏈專刊",
      date: "2022-09-10",
      img: "assets/winfar_ultra_cold_storage_1784826128511.jpg",
      milestone: "📍 對應穩發大世紀：1985-1987 極速保鮮（穩大冷凍廠-60°C保鮮庫）",
      mdPath: "穩發集團/新聞/07_穩大冷凍廠啟用超低溫零下60度智慧倉儲園區.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 穩發集團「穩大冷凍」完成前鎮港區與臨海園區升級，總庫容量達數萬噸，配備 ISO 22000 / HACCP 國際認證與 -60°C 急速冷凍。
        </div>
      `
    },
    news08: {
      title: "馳騁大西洋、太平洋與印度洋 穩發漁業全洋區彈性調度優勢分析",
      source: "商周水產專題",
      date: "2023-03-28",
      img: "assets/winfar_626_squid_jigger.jpg",
      milestone: "📍 對應穩發大世紀：1991-1999 拓荒遠洋（三大洋調度）",
      mdPath: "穩發集團/新聞/08_台灣遠洋漁業產值突破數百億_穩發集團三大洋佈局解析.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 解析穩發漁業如何同時調度圍網、延繩釣與魷秋兼營船隊，展現全球三大洋季節性捕撈與一貫化運搬優勢。
        </div>
      `
    },
    news09: {
      title: "維護海洋生物多樣性 穩發漁業全船隊落實綠色保育避鳥繩與避龜鉤",
      source: "海洋保育署新聞訊",
      date: "2023-05-18",
      img: "assets/winfar_161_longliner.jpg",
      milestone: "📍 對應穩發大世紀：2024 永續躍升（責任漁業與海鳥保育）",
      mdPath: "穩發集團/新聞/09_貫徹責任漁業與國際公約_穩發船隊導入海鳥保育與避龜裝置.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 穩發全船隊 100% 裝設避鳥繩（Tori lines）與圓形避龜鉤，獲國際永續漁業與綠色團體高度評價。
        </div>
      `
    },
    news10: {
      title: "高雄前鎮港多功能水產運銷中心啟用 穩發水產加速全球精品化佈局",
      source: "高雄市政府新聞稿",
      date: "2024-01-20",
      img: "assets/winfar_reefer_transport.jpg",
      milestone: "📍 對應穩發大世紀：2024 永續躍升（前鎮水產運銷中心啟用）",
      mdPath: "穩發集團/新聞/10_高雄前鎮漁港多功能水產運銷中心啟用_穩發深耕外銷市場.md",
      content: `
        <div style="background: rgba(20, 241, 149, 0.08); border-left: 4px solid var(--primary-cyan); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <strong>【新聞報導摘要】</strong> 前鎮港多功能運銷中心啟用，提供冷鏈不中斷卸魚設施，穩發漁業進一步擴大日本與歐美外銷市場。
        </div>
      `
    }
  };

  const newsSnapshotModal = document.getElementById('newsSnapshotModal');
  const newsSnapClose = document.getElementById('newsSnapClose');
  const newsSnapBtnClose = document.getElementById('newsSnapBtnClose');
  const newsSnapTitle = document.getElementById('newsSnapTitle');
  const newsSnapSource = document.getElementById('newsSnapSource');
  const newsSnapDate = document.getElementById('newsSnapDate');
  const newsSnapImg = document.getElementById('newsSnapImg');
  const newsSnapBody = document.getElementById('newsSnapBody');
  const newsSnapMilestone = document.getElementById('newsSnapMilestone');
  const newsSnapMdLink = document.getElementById('newsSnapMdLink');

  const openNewsModal = (newsId) => {
    const data = newsSnapshotData[newsId];
    if (!data) return;

    if (newsSnapTitle) newsSnapTitle.textContent = data.title;
    if (newsSnapSource) newsSnapSource.textContent = `出處：${data.source}`;
    if (newsSnapDate) newsSnapDate.textContent = `發布日期：${data.date}`;
    if (newsSnapImg) newsSnapImg.src = data.img;
    if (newsSnapBody) newsSnapBody.innerHTML = data.content;
    if (newsSnapMilestone) newsSnapMilestone.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${data.milestone}`;
    if (newsSnapMdLink) newsSnapMdLink.href = data.mdPath;

    if (newsSnapshotModal) newsSnapshotModal.classList.add('active');
  };

  document.querySelectorAll('.open-news-snapshot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const newsId = btn.getAttribute('data-news-id');
      openNewsModal(newsId);
    });
  });

  const closeNewsModal = () => {
    if (newsSnapshotModal) newsSnapshotModal.classList.remove('active');
  };

  if (newsSnapClose) newsSnapClose.addEventListener('click', closeNewsModal);
  if (newsSnapBtnClose) newsSnapBtnClose.addEventListener('click', closeNewsModal);
  if (newsSnapshotModal) {
    newsSnapshotModal.addEventListener('click', (e) => {
      if (e.target === newsSnapshotModal) closeNewsModal();
    });
  }

  // 4. Modal Inquiry Window Logic
  const modalOverlay = document.getElementById('inquiryModal');
  const modalClose = document.getElementById('modalClose');
  const openModalBtns = document.querySelectorAll('.open-inquiry-modal');
  const modalItemTitle = document.getElementById('modalItemTitle');
  const modalCategoryInput = document.getElementById('modalCategoryInput');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const itemName = btn.getAttribute('data-item') || '水產採購';
      if (modalItemTitle) modalItemTitle.textContent = `對接項目：${itemName}`;
      if (modalCategoryInput) modalCategoryInput.value = itemName;
      if (modalOverlay) modalOverlay.classList.add('active');
    });
  });

  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }

  // 5. Form Submit Handler
  const inquiryForm = document.getElementById('inquiryForm');
  const modalInquiryForm = document.getElementById('modalInquiryForm');

  const handleFormSubmit = (e, formName) => {
    e.preventDefault();
    alert(`感謝您的諮詢需求！穩發漁業集團 B2B 貿易團隊已收到您的採購意向，專員將於 24 小時內親自與您聯繫。`);
    e.target.reset();
    if (modalOverlay) modalOverlay.classList.remove('active');
  };

  if (inquiryForm) inquiryForm.addEventListener('submit', (e) => handleFormSubmit(e, '主表單'));
  if (modalInquiryForm) modalInquiryForm.addEventListener('submit', (e) => handleFormSubmit(e, '彈窗表單'));

  // 6. Number Counter Animation
  const counters = document.querySelectorAll('.stat-num');
  let animated = false;

  const animateCounters = () => {
    if (animated) return;
    const heroStats = document.querySelector('.hero-stats');
    if (!heroStats) return;

    const rect = heroStats.getBoundingClientRect();
    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const prefix = counter.getAttribute('data-prefix') || '';
        const suffix = counter.getAttribute('data-suffix') || '';
        let count = 0;
        const speed = target / 50;

        const updateCount = () => {
          count += speed;
          if (count < target) {
            counter.innerText = prefix + Math.ceil(count) + suffix;
            setTimeout(updateCount, 25);
          } else {
            counter.innerText = prefix + target + suffix;
          }
        };
        updateCount();
      });
      animated = true;
    }
  };

  // 7. Media Hub Tabs Switching Logic
  const mediaTabBtns = document.querySelectorAll('.media-tab-btn');
  mediaTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mediaTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetMedia = btn.getAttribute('data-media');
      const panels = ['photos', 'videos', 'news'];
      panels.forEach(p => {
        const panelEl = document.getElementById(`media-${p}`);
        if (panelEl) {
          if (p === targetMedia) {
            panelEl.style.display = 'block';
            panelEl.classList.add('active');
          } else {
            panelEl.style.display = 'none';
            panelEl.classList.remove('active');
          }
        }
      });
    });
  });


  // 8. Keyboard Accessibility (Close modals on Escape key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (newsSnapshotModal && newsSnapshotModal.classList.contains('active')) {
        newsSnapshotModal.classList.remove('active');
      }
      if (modalOverlay && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
      }
    }
  });

  window.addEventListener('scroll', animateCounters);
  animateCounters();
});
