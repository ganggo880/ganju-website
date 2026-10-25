/**
 * 港居不動產 租客看屋必備：30 項屋況自檢與避坑評分表產生器
 * Viewing Checklist & Pitfall Guard Engine
 * 繁體中文（台灣）｜零後端純前端本地運算
 */

(function () {
  'use strict';

  // 30 項實戰檢核資料字典
  const CHECKLIST_SECTIONS = [
    {
      id: 'sec1',
      title: '採光通風與室內結構',
      icon: 'fa-solid fa-sun',
      items: [
        { id: 1, title: '對外窗與向光性', desc: '客廳或臥室具備採光良好的直接對外窗，非面向天井或陰暗暗房。' },
        { id: 2, title: '空氣對流與通風', desc: '開窗或抽風設備運轉能產生良好對流，室內乾燥清新無霉味。' },
        { id: 3, title: '室內隔間材質', desc: '為紅磚牆或雙層防焰隔音板，非薄木板、輕鋼架輕隔間。' },
        { id: 4, title: '梁柱結構無壓頂', desc: '床位或主要沙發起居區上方無大型橫樑壓頂，無嚴重壓迫感。' },
        { id: 5, title: '地坪平整度與傾斜', desc: '地面平整無下陷、磁磚無膨拱空心，實測彈珠無明顯滑動傾斜。' }
      ]
    },
    {
      id: 'sec2',
      title: '給水排水與衛浴設備',
      icon: 'fa-solid fa-faucet-drip',
      items: [
        { id: 6, title: '洗手台與蓮蓬頭水壓', desc: '水龍頭與蓮蓬頭水量充足穩定，出水清澈無紅褐鐵鏽黃水。' },
        { id: 7, title: '熱水穩定度與速度', desc: '開啟熱水能在 30~60 秒內持續穩定出熱水，無忽冷忽熱問題。' },
        { id: 8, title: '地面與臉盆排水暢通', desc: '臉盆蓄水後放水排水順暢，淋浴區地面落水孔排水迅速不積水。' },
        { id: 9, title: '排水孔防臭存水彎', desc: '落水孔具備防臭防蟲存水彎或防逆流閥，無水溝異味倒灌。' },
        { id: 10, title: '馬桶沖水與水箱補水', desc: '馬桶沖水吸力強勁，水箱進水順暢，止水後無暗漏細流。' }
      ]
    },
    {
      id: 'sec3',
      title: '滲漏水、壁癌與潮濕檢測',
      icon: 'fa-solid fa-cloud-showers-heavy',
      items: [
        { id: 11, title: '天花板水痕與黃斑', desc: '天花板四角與中央無水痕、黃斑、油漆剝落或滲水結露跡象。' },
        { id: 12, title: '窗框四角裂縫水密性', desc: '窗框四角與外牆接縫無斜向裂紋，大雨無水漬滲透痕跡。' },
        { id: 13, title: '踢腳板與木地板潮濕', desc: '踢腳板與木地板邊緣無發黑、受潮隆起變形或長黴斑。' },
        { id: 14, title: '浴室外側牆面壁癌', desc: '衛浴相鄰之外側房間牆面無起泡、粉化或壁癌結晶。' },
        { id: 15, title: '冷氣排水管洩水路徑', desc: '冷氣具備正式排水管接至排水孔，運轉時無室內滴水或回溢。' }
      ]
    },
    {
      id: 'sec4',
      title: '用電負載與居家消防安全',
      icon: 'fa-solid fa-shield-halved',
      items: [
        { id: 16, title: '配電盤與分路迴路標籤', desc: '總開關配電盤乾淨整齊，各無熔絲開關標籤清楚無焦黑異味。' },
        { id: 17, title: '標檢局合格獨立電表', desc: '各房具備經濟部標檢局檢驗合格之獨立分電表，指針正常。' },
        { id: 18, title: '插座數量與接地保護', desc: '主要電器區插座充足，廚房/衛浴插座具備三孔接地或漏電斷路。' },
        { id: 19, title: '住宅用火災警報器 (住警器)', desc: '天花板裝設合格有效之偵煙或偵熱住警器。（⚠️ 法定重要消防項目）', isCritical: true },
        { id: 20, title: '滅火器與熱水器通風排氣', desc: '公共區備有效滅火器；瓦斯熱水器裝設於通風處或強制排氣。（⚠️ 關鍵安全項目）', isCritical: true }
      ]
    },
    {
      id: 'sec5',
      title: '大樓物業管理與公共設施',
      icon: 'fa-solid fa-building-user',
      items: [
        { id: 21, title: '樓梯逃生動線無雜物', desc: '逃生走廊與安全梯通道暢通無阻，無堆置鞋櫃、雜物或瓦斯桶。' },
        { id: 22, title: '電梯定期安全檢查許可', desc: '電梯車廂內張貼有效期限內之建築物昇降設備使用許可證。' },
        { id: 23, title: '門禁防盜與監視器涵蓋', desc: '大門感應磁扣門禁運作正常，公共梯廳出入口設有監視器。' },
        { id: 24, title: '垃圾集中與資源回收處', desc: '社區設有乾淨合規之垃圾集中清運設施，免追垃圾車。' },
        { id: 25, title: '信件與網購包裹代收', desc: '管理室或專用信箱提供掛號信件與包裹安全代收服務。' }
      ]
    },
    {
      id: 'sec6',
      title: '生活機能與周邊環境噪音',
      icon: 'fa-solid fa-volume-xmark',
      items: [
        { id: 26, title: '氣密窗戶車流隔音性', desc: '關上對外窗後，主要幹道車流聲大幅減弱，室內安靜無噪音干擾。' },
        { id: 27, title: '上下樓層共振與腳步聲', desc: '現場安靜實測無明顯樓上拖拉家具聲、重踩腳步聲或水管沖水共振。' },
        { id: 28, title: '無周邊嫌惡設施影響', desc: '百米內無宮廟神壇、加油站、高壓電塔或油煙噪音熱炒餐飲業。' },
        { id: 29, title: '夜間照明與人行安全', desc: '從車站步行返家路線夜間路燈明亮，無治安死角或危險暗巷。' },
        { id: 30, title: '非違法頂加與產權合法', desc: '非頂樓鐵皮加蓋違建、無非自然死亡凶宅歷史，可合法報稅設籍。（⚠️ 權益保障項目）', isCritical: true }
      ]
    }
  ];

  // 狀態管理
  let state = {
    propertyName: '小港綠意雅築 (示範房源)',
    propertyRent: 16500,
    inspectionDate: new Date().toISOString().split('T')[0],
    itemStates: {} // id -> 'pass' | 'warn' | 'fail'
  };

  // 初始化所有項目狀態為 pass
  CHECKLIST_SECTIONS.forEach(sec => {
    sec.items.forEach(item => {
      state.itemStates[item.id] = 'pass';
    });
  });

  // DOM 元素快取
  const dom = {};

  function initElements() {
    dom.propertyName = document.getElementById('propertyName');
    dom.propertyRent = document.getElementById('propertyRent');
    dom.inspectionDate = document.getElementById('inspectionDate');
    dom.checklistContainer = document.getElementById('checklistContainer');

    // 看板
    dom.scoreNum = document.getElementById('scoreNum');
    dom.gradeTag = document.getElementById('gradeTag');
    dom.gradeVerdict = document.getElementById('gradeVerdict');
    dom.statPass = document.getElementById('statPass');
    dom.statWarn = document.getElementById('statWarn');
    dom.statFail = document.getElementById('statFail');
    dom.todoList = document.getElementById('todoList');
    dom.criticalAlert = document.getElementById('criticalAlert');

    // 按鈕
    dom.btnPrint = document.getElementById('btnPrint');
    dom.btnDownloadCard = document.getElementById('btnDownloadCard');
    dom.btnCopyLine = document.getElementById('btnCopyLine');
    dom.btnAllPass = document.getElementById('btnAllPass');
    dom.printDate = document.getElementById('printDate');
    dom.printParams = document.getElementById('printParams');
  }

  // 渲染 30 項檢核清單
  function renderChecklist() {
    if (!dom.checklistContainer) return;
    dom.checklistContainer.innerHTML = '';

    CHECKLIST_SECTIONS.forEach((sec, sIdx) => {
      const secCard = document.createElement('div');
      secCard.className = 'viewing-section active';
      secCard.id = sec.id;

      let itemsHtml = '';
      sec.items.forEach(item => {
        const current = state.itemStates[item.id] || 'pass';
        itemsHtml += `
          <div class="viewing-item" data-item-id="${item.id}">
            <div class="viewing-item-info">
              <div class="viewing-item-title">
                <span class="viewing-num">${item.id}</span>
                <span>${item.title}</span>
                ${item.isCritical ? '<span style="color:#e53e3e;font-size:0.75rem;border:1px solid #e53e3e;padding:1px 6px;border-radius:4px;">必查重點</span>' : ''}
              </div>
              <div class="viewing-item-desc">${item.desc}</div>
              <div class="viewing-print-status" style="display:none;color:${current === 'pass' ? '#38a169' : current === 'warn' ? '#dd6b20' : '#e53e3e'}">
                現況：${current === 'pass' ? '✓ 合格' : current === 'warn' ? '▲ 普通需改善' : '✗ 嚴重不合格'}
              </div>
            </div>
            <div class="viewing-choice-group">
              <button type="button" class="viewing-choice-btn pass ${current === 'pass' ? 'active' : ''}" data-choice="pass" data-id="${item.id}" title="合格優良">
                <i class="fa-solid fa-check"></i> 合格
              </button>
              <button type="button" class="viewing-choice-btn warn ${current === 'warn' ? 'active' : ''}" data-choice="warn" data-id="${item.id}" title="普通或需改善">
                <i class="fa-solid fa-triangle-exclamation"></i> 普通
              </button>
              <button type="button" class="viewing-choice-btn fail ${current === 'fail' ? 'active' : ''}" data-choice="fail" data-id="${item.id}" title="嚴重不合格/地雷">
                <i class="fa-solid fa-xmark"></i> 地雷
              </button>
            </div>
          </div>
        `;
      });

      secCard.innerHTML = `
        <div class="viewing-section-header">
          <div class="viewing-sec-title">
            <i class="${sec.icon}" style="color:var(--accent-gold);"></i>
            <span>${sec.title}</span>
          </div>
          <span class="viewing-sec-score" id="secScore_${sec.id}">分區滿分</span>
        </div>
        <div class="viewing-section-body">
          ${itemsHtml}
        </div>
      `;

      dom.checklistContainer.appendChild(secCard);
    });

    // 綁定選項點擊事件
    dom.checklistContainer.querySelectorAll('.viewing-choice-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = parseInt(this.dataset.id);
        const choice = this.dataset.choice;
        state.itemStates[id] = choice;

        const parent = this.closest('.viewing-choice-group');
        parent.querySelectorAll('.viewing-choice-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // 同步更新列印狀態文字
        const printText = this.closest('.viewing-item').querySelector('.viewing-print-status');
        if (printText) {
          printText.textContent = '現況：' + (choice === 'pass' ? '✓ 合格' : choice === 'warn' ? '▲ 普通需改善' : '✗ 嚴重不合格');
          printText.style.color = choice === 'pass' ? '#38a169' : choice === 'warn' ? '#dd6b20' : '#e53e3e';
        }

        recalculate();
      });
    });
  }

  // 核心計分與評級邏輯
  function recalculate() {
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    let totalScore = 0;
    const itemWeight = 100 / 30; // 3.3333 分

    const todos = [];
    let hasCriticalFail = false;

    CHECKLIST_SECTIONS.forEach(sec => {
      let secPass = 0;
      let secTotal = sec.items.length;

      sec.items.forEach(item => {
        const status = state.itemStates[item.id] || 'pass';
        if (status === 'pass') {
          passCount++;
          secPass++;
          totalScore += itemWeight;
        } else if (status === 'warn') {
          warnCount++;
          secPass += 0.5;
          totalScore += itemWeight * 0.5;
          todos.push({
            type: 'warn',
            id: item.id,
            title: item.title,
            desc: item.desc,
            sec: sec.title
          });
        } else if (status === 'fail') {
          failCount++;
          if (item.isCritical) {
            hasCriticalFail = true;
          }
          todos.push({
            type: 'fail',
            id: item.id,
            title: item.title,
            desc: item.desc,
            sec: sec.title,
            isCritical: item.isCritical
          });
        }
      });

      const secScoreEl = document.getElementById('secScore_' + sec.id);
      if (secScoreEl) {
        secScoreEl.textContent = `${Math.round((secPass / secTotal) * 100)}% 合格`;
      }
    });

    const finalScore = Math.min(100, Math.round(totalScore));

    // 評級判斷
    let gradeClass = 'grade-a';
    let gradeText = '🟢 極品優質・安心首選';
    let gradeDesc = '各項採光通風、給排水、電路及物業管理皆屬上乘，幾無明顯瑕疵，建議優先考慮並簽約！';

    if (finalScore >= 90) {
      gradeClass = 'grade-a';
      gradeText = '🟢 極品優質・安心首選';
      gradeDesc = '屋況健康度極佳，採光、防水與消防設備充足，可直接列為第一簽約首選！';
    } else if (finalScore >= 75) {
      gradeClass = 'grade-b';
      gradeText = '🔵 良好宜居・瑕疵可議';
      gradeDesc = '整體屋況良好，少數待改善項目建議在簽約前列入租賃契約「修繕點交清冊」由房東補強。';
    } else if (finalScore >= 60) {
      gradeClass = 'grade-c';
      gradeText = '🟡 普通妥協・謹慎評估';
      gradeDesc = '存在較多妥協點（如通風隔音稍差或管線老舊），若考慮承租應積極爭取租金折讓。';
    } else {
      gradeClass = 'grade-d';
      gradeText = '🔴 高風險地雷・強烈避坑';
      gradeDesc = '屋況有重大缺失、滲漏水壁癌或安全疑慮，居住體驗與健康風險極高，強烈建議放棄！';
    }

    if (hasCriticalFail) {
      gradeDesc += ' ⚠️ 注意：本物件有觸發【住警器/消防熱水器通風/違建凶宅】重大安全隱患，請務必嚴格把關！';
    }

    // 更新 DOM
    if (dom.scoreNum) dom.scoreNum.textContent = finalScore;
    if (dom.gradeTag) {
      dom.gradeTag.className = 'viewing-grade-tag ' + gradeClass;
      dom.gradeTag.textContent = gradeText;
    }
    if (dom.gradeVerdict) dom.gradeVerdict.textContent = gradeDesc;

    if (dom.statPass) dom.statPass.textContent = passCount;
    if (dom.statWarn) dom.statWarn.textContent = warnCount;
    if (dom.statFail) dom.statFail.textContent = failCount;

    // 更新待改善備忘清單
    if (dom.todoList) {
      if (todos.length === 0) {
        dom.todoList.innerHTML = '<li style="color:#38a169;padding:12px;text-align:center;">🎉 太棒了！30 項檢核全部合格，此房源屋況無任何扣分項目！</li>';
      } else {
        dom.todoList.innerHTML = todos.map(t => `
          <li class="viewing-todo-item ${t.type}">
            <div>
              <strong>[#${t.id} ${t.title}]</strong> (${t.sec})：${t.type === 'fail' ? '❌ 嚴重缺失' : '⚠️ 需改善'}
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">建議對策：簽約前要求房東載明於特約修繕或評估折減租金。</div>
            </div>
          </li>
        `).join('');
      }
    }

    // 更新列印參數
    if (dom.printDate) {
      dom.printDate.textContent = '評估日期：' + (dom.inspectionDate ? dom.inspectionDate.value : new Date().toLocaleDateString('zh-TW'));
    }
    if (dom.printParams) {
      dom.printParams.textContent = `評估標的：${dom.propertyName ? dom.propertyName.value : '示範房源'} ｜ 租金：${dom.propertyRent ? dom.propertyRent.value : '0'} 元/月 ｜ 綜合宜居指數：${finalScore} 分 (${gradeText}) ｜ 合格 ${passCount} 項・普通 ${warnCount} 項・地雷 ${failCount} 項`;
    }

    saveToLocalStorage();

    // 觸發 MarTech 追蹤
    if (window.GanjuTracker && typeof window.GanjuTracker.trackEvent === 'function') {
      window.GanjuTracker.trackEvent('viewing_checklist_calculate', {
        property_name: dom.propertyName ? dom.propertyName.value : '',
        score: finalScore,
        grade: gradeText,
        fail_count: failCount
      });
    }
  }

  // LocalStorage 保存與讀取
  function saveToLocalStorage() {
    try {
      state.propertyName = dom.propertyName ? dom.propertyName.value : state.propertyName;
      state.propertyRent = dom.propertyRent ? dom.propertyRent.value : state.propertyRent;
      state.inspectionDate = dom.inspectionDate ? dom.inspectionDate.value : state.inspectionDate;
      localStorage.setItem('ganju_viewing_checklist_v1', JSON.stringify(state));
    } catch (e) {
      // 容錯
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('ganju_viewing_checklist_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        state = Object.assign({}, state, parsed);
        if (dom.propertyName && state.propertyName) dom.propertyName.value = state.propertyName;
        if (dom.propertyRent && state.propertyRent) dom.propertyRent.value = state.propertyRent;
        if (dom.inspectionDate && state.inspectionDate) dom.inspectionDate.value = state.inspectionDate;
      }
    } catch (e) {
      // 容錯
    }
  }

  // 一鍵全部合格
  function setAllPass() {
    CHECKLIST_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        state.itemStates[item.id] = 'pass';
      });
    });
    renderChecklist();
    recalculate();
    showToast('已將全數 30 項檢核設為「合格優良」！');
  }

  // 複製 LINE 摘要文字
  function copyLineSummary() {
    const score = dom.scoreNum ? dom.scoreNum.textContent : '0';
    const grade = dom.gradeTag ? dom.gradeTag.textContent : '';
    const pass = dom.statPass ? dom.statPass.textContent : '0';
    const warn = dom.statWarn ? dom.statWarn.textContent : '0';
    const fail = dom.statFail ? dom.statFail.textContent : '0';

    const failItems = [];
    CHECKLIST_SECTIONS.forEach(sec => {
      sec.items.forEach(i => {
        if (state.itemStates[i.id] === 'fail') {
          failItems.push(`❌ #${i.id} ${i.title}`);
        } else if (state.itemStates[i.id] === 'warn') {
          failItems.push(`⚠️ #${i.id} ${i.title}`);
        }
      });
    });

    const text = [
      '【港居不動產｜租客看屋自檢與避坑評估診斷】',
      '🏠 評估房源：' + (dom.propertyName ? dom.propertyName.value : '待租物件'),
      '💰 房東開價租金：' + (dom.propertyRent ? dom.propertyRent.value : '0') + ' 元/月',
      '📅 現場看屋日期：' + (dom.inspectionDate ? dom.inspectionDate.value : ''),
      '----------------------------------------',
      '⭐ 綜合宜居評分指數：' + score + ' 分 / 100 分',
      '🏷️ 屋況總體評價：' + grade,
      '📊 檢核成果：✅ 合格 ' + pass + ' 項 ｜ ⚠️ 普通 ' + warn + ' 項 ｜ ❌ 地雷 ' + fail + ' 項',
      '----------------------------------------',
      '🚩 現場待釐清或修繕項目：',
      failItems.length > 0 ? failItems.slice(0, 6).join('\n') : '（全數 30 項標準檢核皆合格，無地雷項目）',
      '----------------------------------------',
      '💡 港居看屋避坑溫馨提醒：',
      '簽約前請務必確認《定型化契約應記載事項》、住宅用火災警報器、獨立分電表度數與水電管路！',
      '',
      '👉 在線 30 項看屋自檢神器：https://ganggo880.github.io/ganju-website/viewing-checklist.html',
      '📞 預約港居特許房源看房或租賃諮詢：0968-863-880 (陳俊銘 經理)'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製看屋評估摘要，可直接貼至 LINE 傳給家人討論！');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已複製看屋評估摘要！');
  }

  function showToast(msg) {
    if (window.GanjuUtils && typeof window.GanjuUtils.showToast === 'function') {
      window.GanjuUtils.showToast(msg);
      return;
    }
    alert(msg);
  }

  // HTML5 Canvas 840×1080px 圖卡繪製下載
  function downloadCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景漸層 (海軍藍)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    bgGrad.addColorStop(0, '#0F2341');
    bgGrad.addColorStop(1, '#1A365D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 840, 1080);

    // 金色外邊框
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 780, 1020);

    // 頂部品牌資訊
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司', 60, 85);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('特許租賃住宅服務業｜高市租登字第0012號｜管理證號：(112)登字第013739號', 60, 115);

    // 分隔線
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.3)';
    ctx.beginPath();
    ctx.moveTo(60, 135);
    ctx.lineTo(780, 135);
    ctx.stroke();

    // 主標題
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px "Noto Sans TC", sans-serif';
    ctx.fillText('租客現場看屋 30 項自檢與避坑評估診斷', 60, 185);

    // 房源基本資訊卡片
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.roundRect(60, 215, 720, 80, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillText('房源名稱：' + (dom.propertyName ? dom.propertyName.value : '待租物件'), 85, 250);
    ctx.fillText('月租金：' + (dom.propertyRent ? dom.propertyRent.value : '0') + ' 元/月 ｜ 評估日期：' + (dom.inspectionDate ? dom.inspectionDate.value : ''), 85, 280);

    // 核心評分圓環區域
    const score = dom.scoreNum ? dom.scoreNum.textContent : '0';
    const grade = dom.gradeTag ? dom.gradeTag.textContent : '';

    ctx.fillStyle = 'rgba(26, 54, 93, 0.8)';
    ctx.roundRect(60, 315, 720, 190, 12);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText('綜合宜居指數 (Livability Index)', 90, 355);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(score, 90, 430);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('/ 100 分', 210, 430);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText(grade, 90, 480);

    // 檢核統計條
    const pass = dom.statPass ? dom.statPass.textContent : '0';
    const warn = dom.statWarn ? dom.statWarn.textContent : '0';
    const fail = dom.statFail ? dom.statFail.textContent : '0';

    ctx.fillStyle = 'rgba(56, 161, 105, 0.2)';
    ctx.roundRect(480, 350, 260, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#68d391';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`✓ 合格優良：${pass} 項`, 500, 376);

    ctx.fillStyle = 'rgba(221, 107, 32, 0.2)';
    ctx.roundRect(480, 400, 260, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#f6ad55';
    ctx.fillText(`▲ 普通需改善：${warn} 項`, 500, 426);

    ctx.fillStyle = 'rgba(229, 62, 62, 0.2)';
    ctx.roundRect(480, 450, 260, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#fc8181';
    ctx.fillText(`✗ 嚴重不合格：${fail} 項`, 500, 476);

    // 六大分區檢核重點速覽
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.fillText('六大分區防地雷檢核清單涵蓋範圍', 60, 545);

    const secTitles = [
      '① 採光通風與結構平整', '② 給水排水與衛浴水壓',
      '③ 滲漏水與壁癌防潮', '④ 用電負載與居家消防',
      '⑤ 大樓物業與公共設施', '⑥ 生活機能與環境噪音'
    ];

    secTitles.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 60 + col * 370;
      const y = 575 + row * 60;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.roundRect(x, y, 350, 46, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.2)';
      ctx.stroke();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '15px "Noto Sans TC", sans-serif';
      ctx.fillText(t, x + 20, y + 29);
    });

    // 避坑備忘說明
    ctx.fillStyle = 'rgba(197, 160, 89, 0.08)';
    ctx.roundRect(60, 775, 720, 160, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('💡 港居特許專業提醒（簽約前必檢五件事）：', 85, 810);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('1. 確認出租方是否為合法產權人（查驗房屋權狀影本或租賃住宅服務業登記證）。', 85, 840);
    ctx.fillText('2. 簽約使用內政部定型化租賃契約，押金嚴格不得超逾 2 個月租金額度。', 85, 870);
    ctx.fillText('3. 現場拍照壓印時間浮水印，將既有瑕疵與水電瓦斯度數列入「起租點交清冊」。', 85, 900);

    // 底部版權與聯絡資訊
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(30, 955, 780, 95);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產｜守護每位租客安心成家 ｜ 免費租約諮詢專線：0968-863-880 (陳經理)', 60, 995);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText('高雄市小港區中安路825號 ｜ 官方 LINE：@ganggo880 ｜ 純前端零上傳本地運算安全認證', 60, 1025);

    const link = document.createElement('a');
    link.download = `港居不動產_看屋自檢評估卡_${dom.propertyName ? dom.propertyName.value : '房源'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已成功下載看屋自檢評估圖卡！');
  }

  // 事件綁定
  function bindEvents() {
    if (dom.propertyName) dom.propertyName.addEventListener('input', recalculate);
    if (dom.propertyRent) dom.propertyRent.addEventListener('input', recalculate);
    if (dom.inspectionDate) dom.inspectionDate.addEventListener('change', recalculate);

    if (dom.btnPrint) dom.btnPrint.addEventListener('click', () => window.print());
    if (dom.btnDownloadCard) dom.btnDownloadCard.addEventListener('click', downloadCardImage);
    if (dom.btnCopyLine) dom.btnCopyLine.addEventListener('click', copyLineSummary);
    if (dom.btnAllPass) dom.btnAllPass.addEventListener('click', setAllPass);

    // 行動端分頁切換
    const tabChecklist = document.getElementById('tabChecklist');
    const tabScore = document.getElementById('tabScore');
    const panelChecklist = document.getElementById('panelChecklist');
    const panelScore = document.getElementById('panelScore');

    if (tabChecklist && tabScore && panelChecklist && panelScore) {
      tabChecklist.addEventListener('click', function () {
        tabChecklist.classList.add('active');
        tabScore.classList.remove('active');
        panelChecklist.classList.remove('viewing-mobile-hidden');
        panelScore.classList.add('viewing-mobile-hidden');
      });

      tabScore.addEventListener('click', function () {
        tabScore.classList.add('active');
        tabChecklist.classList.remove('active');
        panelScore.classList.remove('viewing-mobile-hidden');
        panelChecklist.classList.add('viewing-mobile-hidden');
      });
    }
  }

  // 初始化入口
  document.addEventListener('DOMContentLoaded', function () {
    initElements();
    loadFromLocalStorage();
    renderChecklist();
    bindEvents();
    recalculate();
  });

})();
