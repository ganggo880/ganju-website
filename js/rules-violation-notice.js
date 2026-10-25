/**
 * js/rules-violation-notice.js
 * 港居不動產 - 租賃住宅違規行為勸導限期改善通知單產生器核心腳本
 * 符合《租賃住宅市場發展及管理條例》第10條第1項第3款、《公寓大廈管理條例》第16/47條
 */

(function () {
  'use strict';

  // 六大常見違規情境資料庫
  const VIOLATION_TEMPLATES = {
    'hallway-clutter': {
      title: '公共梯間逃生走道堆放雜物',
      statute: '《公寓大廈管理條例》第16條第2項、第47條第2款及租賃契約公約第3條',
      facts: '承租人於本社區公共走廊、逃生梯間私設鞋櫃、鞋盒散落、堆放腳踏車及垃圾包，嚴重妨礙逃生動線，經大樓管委會正式開立違規勸導單並限期清除。',
      action: '請於接獲本通知後 3 日內，確實將堆置於公共走道與樓梯間之所有私人物品全數移入室內或清運完畢，徹底恢復公共逃生動線淨空。',
      consequence: '逾期未改善者，管委會將逕行造冊函報高雄市政府工務局依《公寓大廈管理條例》第47條裁處新臺幣4萬元以上20萬元以下罰鍰；港居代管亦將依約扣收清潔違約金NT$ 1,500元並代為清運處置，屢勸不聽者將依《租賃專法》第10條終止租約。'
    },
    'night-noise': {
      title: '深夜噪音喧嘩製造聲響妨害安寧',
      statute: '《噪音管制法》第6條、《社會秩序維護法》第72條第3款及住戶生活公約第5條',
      facts: '多次於夜間 22:00 至翌日清晨 07:00 期間大聲播放音樂重低音、深夜聚集喧嘩飲酒、重踏腳步聲響，嚴重干擾上下鄰居夜間安寧休息，經鄰舍多次抗議並報警處理。',
      action: '即日起全面落實夜間靜音，晚間 22:00 後請將影音音量降至最低，室內走動請穿著軟底拖鞋，嚴禁深夜高聲喧鬧與重擊地板。',
      consequence: '若再有深夜製造噪音妨害安寧之情事，除將請轄區派出所依《社會秩序維護法》開罰最高NT$ 6,000元外，本公司將依租約第12條第3款逕行發函終止租約並請求搬遷賠償。'
    },
    'indoor-smoking': {
      title: '室內或陽台違規吸菸致二手菸擴散',
      statute: '《菸害防制法》第18條及租賃契約第14條「全棟住宅全面禁菸」特別特約',
      facts: '承租人於室內客廳、浴廁或後陽台吸菸，二手菸味透過大樓共同管道間及窗戶縫隙滲透至鄰近住戶室內，引發家中有幼童與長輩之住戶強烈抗議。',
      action: '即日起全面停止於租賃室內、浴室抽風口、陽台及公共梯間吸菸，並請自主通風與清潔去除室內殘留焦油菸味。',
      consequence: '本租約明定全面禁菸，再次查獲者將依特約扣收深度清潔與空氣清淨除焦油費新臺幣 8,000 元整，並依法提前終止租賃契約。'
    },
    'pet-nuisance': {
      title: '違規飼養寵物與便溺異味妨害衛生',
      statute: '租賃契約第8條「未經書面許可嚴禁飼養寵物」約定及大樓規約',
      facts: '未經出租人事前書面許可，私自於室內飼養犬貓寵物，寵物持續吠叫擾鄰，且造成公共走道異味及毛髮堵塞排水孔衛生爭議。',
      action: '請於接獲通知後 5 日內，將寵物妥善安置於合法合格場所，並完成承租標的室內除臭消毒與清潔，拍照回傳港居確認。',
      consequence: '逾期仍未妥善移置寵物者，視同重大違約，出租人得扣收違約金NT$ 5,000元，並依《民法》第438條未依約定方法使用租賃物為由終止租約。'
    },
    'illegal-renovation': {
      title: '私自改裝施工與電路用電危險',
      statute: '《民法》第432條善良管理人責任及定型化契約第11條',
      facts: '未經出租人同意擅自敲打破壞室內牆面、私接大功率電熱線路、或擅自更換大門電子防盜門鎖未交付緊急備用鑰匙，嚴重影響建物安全與物管查核。',
      action: '請立即停止所有私自改裝施工行為，並於 3 日內將大門備用鑰匙送交港居代管，私接之高耗電線路限期拆除恢復原狀。',
      consequence: '如因私改電路引發公共危險或損害管線，承租人願負擔全部民刑事責任與損害賠償；逾期未改善者將逕行終止租約並追究毀損責任。'
    },
    'sublease-crowding': {
      title: '非登記同住人異常留宿或私自轉租',
      statute: '《租賃住宅市場發展及管理條例》第9條及租約「嚴禁未授權轉租出借」條款',
      facts: '承租人未向代管公司辦理同住人申報，長期容留多名身分不明人士夜宿出入，或疑似私自將房屋刊登轉租或當日租套房使用，危害社區門禁治安。',
      action: '請承租人於 3 日內親赴港居代管公司核實身分並補正同住人登記，非合約登載之非約定人員應即刻停止留宿搬離。',
      consequence: '依租賃專法與契約約定，私自轉租或留宿第三人者，出租人得不經催告立即終止租賃契約，沒收全額押金並追償商業營利不當得利。'
    }
  };

  // 狀態管理物件
  const state = {
    docNo: '',
    date: '',
    deadline: '',
    category: 'hallway-clutter',
    propertyAddress: '',
    tenantName: '',
    tenantPhone: '',
    tenantId: '',
    landlordName: '港居不動產開發有限公司（受託代管公司）',
    agentName: '陳志峰（租賃住宅管理人員）',
    agentLicense: '(112)登字第013739號',
    source: '社區大樓管委會正式反映',
    facts: '',
    action: '',
    consequence: '',
    penaltyFee: 1500,
    
    // 4 組存證照片 Base64
    photos: {
      photo1: null,
      photo2: null,
      photo3: null,
      photo4: null
    },
    
    // 簽章狀態
    agentSigned: false,
    tenantSigned: false
  };

  // DOM 元素快取
  const dom = {
    typeButtons: document.querySelectorAll('.violation-type-btn'),
    docNoInput: document.getElementById('docNoInput'),
    dateInput: document.getElementById('dateInput'),
    deadlineInput: document.getElementById('deadlineInput'),
    propertyAddress: document.getElementById('propertyAddress'),
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),
    tenantId: document.getElementById('tenantId'),
    landlordName: document.getElementById('landlordName'),
    agentName: document.getElementById('agentName'),
    agentLicense: document.getElementById('agentLicense'),
    sourceInput: document.getElementById('sourceInput'),
    factsInput: document.getElementById('factsInput'),
    actionInput: document.getElementById('actionInput'),
    consequenceInput: document.getElementById('consequenceInput'),
    penaltyFeeInput: document.getElementById('penaltyFeeInput'),
    
    btnDemoData: document.getElementById('btnDemoData'),
    btnClearForm: document.getElementById('btnClearForm'),
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    
    // A4 預覽元件
    previewDocNo: document.getElementById('previewDocNo'),
    previewDate: document.getElementById('previewDate'),
    previewDeadline: document.getElementById('previewDeadline'),
    previewAddress: document.getElementById('previewAddress'),
    previewTenant: document.getElementById('previewTenant'),
    previewLandlord: document.getElementById('previewLandlord'),
    previewSource: document.getElementById('previewSource'),
    previewStatute: document.getElementById('previewStatute'),
    previewFacts: document.getElementById('previewFacts'),
    previewAction: document.getElementById('previewAction'),
    previewConsequence: document.getElementById('previewConsequence'),
    previewPhotosGrid: document.getElementById('previewPhotosGrid'),
    previewAgentSigImg: document.getElementById('previewAgentSigImg'),
    previewTenantSigImg: document.getElementById('previewTenantSigImg'),
    
    // 簽名板
    agentCanvas: document.getElementById('agentSigCanvas'),
    tenantCanvas: document.getElementById('tenantSigCanvas'),
    btnClearAgentSig: document.getElementById('btnClearAgentSig'),
    btnClearTenantSig: document.getElementById('btnClearTenantSig')
  };

  // 初始化預設值
  function initDefaults() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    state.date = `${yyyy}-${mm}-${dd}`;
    state.docNo = `VN-${yyyy}${mm}${dd}-01`;

    // 改善期限預設為 3 天後 18:00
    const deadlineDate = new Date(today);
    deadlineDate.setDate(deadlineDate.getDate() + 3);
    const d_yyyy = deadlineDate.getFullYear();
    const d_mm = String(deadlineDate.getMonth() + 1).padStart(2, '0');
    const d_dd = String(deadlineDate.getDate()).padStart(2, '0');
    state.deadline = `${d_yyyy}-${d_mm}-${d_dd} 18:00`;

    if (dom.docNoInput) dom.docNoInput.value = state.docNo;
    if (dom.dateInput) dom.dateInput.value = state.date;
    if (dom.deadlineInput) dom.deadlineInput.value = state.deadline;
    if (dom.penaltyFeeInput) dom.penaltyFeeInput.value = state.penaltyFee;

    // 載入當前類別範本文本
    applyCategoryTemplate(state.category);
    renderA4Preview();
  }

  // 套用違規類別範本
  function applyCategoryTemplate(catKey) {
    const tmpl = VIOLATION_TEMPLATES[catKey] || VIOLATION_TEMPLATES['hallway-clutter'];
    state.category = catKey;
    state.facts = tmpl.facts;
    state.action = tmpl.action;
    state.consequence = tmpl.consequence;

    if (dom.factsInput) dom.factsInput.value = state.facts;
    if (dom.actionInput) dom.actionInput.value = state.action;
    if (dom.consequenceInput) dom.consequenceInput.value = state.consequence;
  }

  // 類別選擇按鈕切換
  function setupTypeSelector() {
    dom.typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.typeButtons.forEach(b => {
          b.classList.remove('active');
          const radio = b.querySelector('input[type="radio"]');
          if (radio) radio.checked = false;
        });
        btn.classList.add('active');
        const r = btn.querySelector('input[type="radio"]');
        if (r) r.checked = true;

        const cat = btn.dataset.category;
        applyCategoryTemplate(cat);
        renderA4Preview();
      });
    });
  }

  // 表單輸入連動
  function setupFormInputs() {
    const fieldMap = [
      { el: dom.docNoInput, key: 'docNo' },
      { el: dom.dateInput, key: 'date' },
      { el: dom.deadlineInput, key: 'deadline' },
      { el: dom.propertyAddress, key: 'propertyAddress' },
      { el: dom.tenantName, key: 'tenantName' },
      { el: dom.tenantPhone, key: 'tenantPhone' },
      { el: dom.tenantId, key: 'tenantId' },
      { el: dom.landlordName, key: 'landlordName' },
      { el: dom.agentName, key: 'agentName' },
      { el: dom.agentLicense, key: 'agentLicense' },
      { el: dom.sourceInput, key: 'source' },
      { el: dom.factsInput, key: 'facts' },
      { el: dom.actionInput, key: 'action' },
      { el: dom.consequenceInput, key: 'consequence' },
      { el: dom.penaltyFeeInput, key: 'penaltyFee' }
    ];

    fieldMap.forEach(item => {
      if (!item.el) return;
      item.el.addEventListener('input', e => {
        state[item.key] = e.target.value;
        renderA4Preview();
      });
    });
  }

  // 照片壓縮與處理
  function setupPhotoSlots() {
    ['photo1', 'photo2', 'photo3', 'photo4'].forEach(id => {
      const input = document.getElementById(`${id}Input`);
      const slot = document.getElementById(`${id}Slot`);
      const preview = document.getElementById(`${id}Preview`);
      const btnClear = document.getElementById(`${id}Clear`);

      if (!input || !slot) return;

      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scale = MAX_WIDTH / img.width;
            if (scale < 1) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scale;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 壓印違規查證標籤
            ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
            ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.fillText(`港居不動產 違規查證存證 ${state.date} ${state.docNo}`, 10, canvas.height - 7);

            const base64 = canvas.toDataURL('image/jpeg', 0.75);
            state.photos[id] = base64;
            preview.src = base64;
            slot.classList.add('has-image');
            renderA4Preview();
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });

      if (btnClear) {
        btnClear.addEventListener('click', e => {
          e.stopPropagation();
          state.photos[id] = null;
          input.value = '';
          preview.src = '';
          slot.classList.remove('has-image');
          renderA4Preview();
        });
      }
    });
  }

  // 雙 Retina 2x 手寫簽名板模組
  function setupSignaturePads() {
    function initPad(canvas, clearBtn, onSignCallback) {
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      let drawing = false;
      let hasDrawn = false;

      function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 2;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0a192f';
      }

      resize();
      window.addEventListener('resize', resize);

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function startDraw(e) {
        drawing = true;
        hasDrawn = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        canvas.parentElement.classList.add('signed');
      }

      function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      function stopDraw() {
        if (!drawing) return;
        drawing = false;
        if (hasDrawn && onSignCallback) {
          onSignCallback(canvas.toDataURL('image/png'));
        }
      }

      // 滑鼠事件
      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

      // 觸控事件
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDraw);

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasDrawn = false;
          canvas.parentElement.classList.remove('signed');
          if (onSignCallback) onSignCallback(null);
        });
      }
    }

    initPad(dom.agentCanvas, dom.btnClearAgentSig, dataUrl => {
      state.agentSigned = !!dataUrl;
      if (dom.previewAgentSigImg) {
        if (dataUrl) {
          dom.previewAgentSigImg.src = dataUrl;
          dom.previewAgentSigImg.style.display = 'block';
          const placeholder = document.getElementById('previewAgentSigPlaceholder');
          if (placeholder) placeholder.style.display = 'none';
        } else {
          dom.previewAgentSigImg.style.display = 'none';
          const placeholder = document.getElementById('previewAgentSigPlaceholder');
          if (placeholder) placeholder.style.display = 'flex';
        }
      }
    });

    initPad(dom.tenantCanvas, dom.btnClearTenantSig, dataUrl => {
      state.tenantSigned = !!dataUrl;
      if (dom.previewTenantSigImg) {
        if (dataUrl) {
          dom.previewTenantSigImg.src = dataUrl;
          dom.previewTenantSigImg.style.display = 'block';
          const placeholder = document.getElementById('previewTenantSigPlaceholder');
          if (placeholder) placeholder.style.display = 'none';
        } else {
          dom.previewTenantSigImg.style.display = 'none';
          const placeholder = document.getElementById('previewTenantSigPlaceholder');
          if (placeholder) placeholder.style.display = 'flex';
        }
      }
    });
  }

  // 渲染右側 Live A4 預覽
  function renderA4Preview() {
    const tmpl = VIOLATION_TEMPLATES[state.category] || VIOLATION_TEMPLATES['hallway-clutter'];

    if (dom.previewDocNo) dom.previewDocNo.textContent = state.docNo || 'VN-20261025-01';
    const stripDoc = document.getElementById('stripDocNo');
    if (stripDoc) stripDoc.textContent = state.docNo || 'VN-20261025-01';
    if (dom.previewDate) dom.previewDate.textContent = state.date || '2026-10-25';
    if (dom.previewDeadline) dom.previewDeadline.textContent = state.deadline || '2026-10-28 18:00 前';
    if (dom.previewAddress) dom.previewAddress.textContent = state.propertyAddress || '高雄市前鎮區中華五路 1234 號 8 樓之 2（港居敦峰）';

    // 承租人
    if (dom.previewTenant) {
      const name = state.tenantName || '張冠華';
      const id = state.tenantId ? ` (身分證: ${state.tenantId})` : '';
      const phone = state.tenantPhone ? ` 聯絡電話: ${state.tenantPhone}` : '';
      dom.previewTenant.textContent = `${name}${id}${phone}`;
    }

    // 代管公司與專員
    if (dom.previewLandlord) {
      const lName = state.landlordName || '港居不動產開發有限公司（受託代管公司）';
      const agent = state.agentName ? ` 經辦專員: ${state.agentName}` : '';
      const lic = state.agentLicense ? ` 證號: ${state.agentLicense}` : '';
      dom.previewLandlord.textContent = `${lName}${agent}${lic}`;
    }

    if (dom.previewSource) dom.previewSource.textContent = state.source || '社區大樓管委會正式反映';
    if (dom.previewStatute) dom.previewStatute.textContent = tmpl.statute;
    if (dom.previewFacts) dom.previewFacts.textContent = state.facts || tmpl.facts;
    if (dom.previewAction) dom.previewAction.textContent = state.action || tmpl.action;
    if (dom.previewConsequence) dom.previewConsequence.textContent = state.consequence || tmpl.consequence;

    // 渲染存證照片縮圖
    if (dom.previewPhotosGrid) {
      dom.previewPhotosGrid.innerHTML = '';
      const photoKeys = ['photo1', 'photo2', 'photo3', 'photo4'];
      const photoLabels = ['違規現場事證存證', '鄰近通道受阻現況', '管委會通報/警示單', '查核現況/改善對比'];

      photoKeys.forEach((key, idx) => {
        const box = document.createElement('div');
        box.className = 'doc-photo-box';
        const src = state.photos[key];
        if (src) {
          box.innerHTML = `
            <img src="${src}" class="doc-photo-img" alt="${photoLabels[idx]}" />
            <div class="doc-photo-caption">圖${idx + 1}. ${photoLabels[idx]}</div>
          `;
        } else {
          box.innerHTML = `
            <div class="doc-photo-img" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:7pt;">(未上傳照片)</div>
            <div class="doc-photo-caption">圖${idx + 1}. ${photoLabels[idx]}</div>
          `;
        }
        dom.previewPhotosGrid.appendChild(box);
      });
    }
  }

  // 示範資料載入
  function loadDemoData() {
    state.propertyAddress = '高雄市前鎮區中華五路 1234 號 8 樓之 2（港居敦峰社區）';
    state.tenantName = '張冠華';
    state.tenantPhone = '0928-765-432';
    state.tenantId = 'S123456789';
    state.source = '大樓管委會第 115-08 號住戶違規檢舉公文';
    state.penaltyFee = 1500;

    // 選擇走廊雜物
    const btn = document.querySelector('.violation-type-btn[data-category="hallway-clutter"]');
    if (btn) btn.click();

    if (dom.propertyAddress) dom.propertyAddress.value = state.propertyAddress;
    if (dom.tenantName) dom.tenantName.value = state.tenantName;
    if (dom.tenantPhone) dom.tenantPhone.value = state.tenantPhone;
    if (dom.tenantId) dom.tenantId.value = state.tenantId;
    if (dom.sourceInput) dom.sourceInput.value = state.source;
    if (dom.penaltyFeeInput) dom.penaltyFeeInput.value = state.penaltyFee;

    renderA4Preview();

    if (window.showToast) {
      window.showToast('已成功帶入常見梯間堆放雜物違規示範資料！');
    }
  }

  // 清空表單
  function clearForm() {
    if (!confirm('確定要清空所有已輸入資料與簽章嗎？')) return;

    state.propertyAddress = '';
    state.tenantName = '';
    state.tenantPhone = '';
    state.tenantId = '';
    state.source = '';
    state.facts = '';
    state.action = '';
    state.consequence = '';
    state.penaltyFee = 0;

    if (dom.propertyAddress) dom.propertyAddress.value = '';
    if (dom.tenantName) dom.tenantName.value = '';
    if (dom.tenantPhone) dom.tenantPhone.value = '';
    if (dom.tenantId) dom.tenantId.value = '';
    if (dom.sourceInput) dom.sourceInput.value = '';
    if (dom.factsInput) dom.factsInput.value = '';
    if (dom.actionInput) dom.actionInput.value = '';
    if (dom.consequenceInput) dom.consequenceInput.value = '';
    if (dom.penaltyFeeInput) dom.penaltyFeeInput.value = 0;

    if (dom.btnClearAgentSig) dom.btnClearAgentSig.click();
    if (dom.btnClearTenantSig) dom.btnClearTenantSig.click();

    renderA4Preview();
  }

  // 匯出圖卡 (Canvas 840 x 1080px)
  function downloadCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 頂部暗紅警示條
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, canvas.width, 100);

    // 金色細線
    ctx.fillStyle = '#c8a96d';
    ctx.fillRect(0, 100, canvas.width, 6);

    // 標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('港居不動產開發有限公司', 36, 48);

    ctx.fillStyle = '#fecdd3';
    ctx.font = '16px sans-serif';
    ctx.fillText('租賃住宅住戶違規行為限期改善通知單暨違約處置警告單', 36, 80);

    // 單號與日期
    ctx.fillStyle = '#fecaca';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`發文字號: ${state.docNo || 'VN-20261025-01'}`, canvas.width - 36, 50);
    ctx.fillText(`發文日期: ${state.date || '2026-10-25'}`, canvas.width - 36, 78);
    ctx.textAlign = 'left';

    // 紅色緊急期限醒目框
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(36, 126, canvas.width - 72, 70);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(36, 126, canvas.width - 72, 70);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('【限期改善截止期限】：', 54, 156);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(`${state.deadline || '請於接獲通知後 3 日內完成改善'}`, 230, 156);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText(`標的物門牌：${state.propertyAddress || '未填寫'}`, 54, 182);

    // 當事人基本資訊
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(36, 210, canvas.width - 72, 90);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(36, 210, canvas.width - 72, 90);

    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`受通知人（承租人）：${state.tenantName || '未載'} (電話: ${state.tenantPhone || '未載'})`, 54, 238);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`受託代管公司：${state.landlordName}`, 54, 264);
    ctx.fillText(`違規通報來源：${state.source || '管委會反映'} ｜ 經辦專員: ${state.agentName || '管理員'}`, 54, 288);

    // 違規事實區
    let curY = 320;
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 具體違規事實與現場狀況：', 36, curY);

    curY += 12;
    ctx.fillStyle = '#fff1f2';
    ctx.fillRect(36, curY, canvas.width - 72, 70);
    ctx.strokeStyle = '#fecdd3';
    ctx.strokeRect(36, curY, canvas.width - 72, 70);

    ctx.fillStyle = '#1f2937';
    ctx.font = '13px sans-serif';
    const factText = state.facts || '未輸入具體違規事實';
    const factLines = wrapText(ctx, factText, canvas.width - 110);
    let fY = curY + 24;
    factLines.slice(0, 3).forEach(line => {
      ctx.fillText(line, 54, fY);
      fY += 20;
    });

    // 改善命令
    curY += 88;
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 限期具體改善命令：', 36, curY);

    curY += 12;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(36, curY, canvas.width - 72, 60);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(36, curY, canvas.width - 72, 60);

    ctx.fillStyle = '#0f172a';
    ctx.font = '13px sans-serif';
    const actionText = state.action || '請即刻恢復原狀';
    const actionLines = wrapText(ctx, actionText, canvas.width - 110);
    let aY = curY + 24;
    actionLines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 54, aY);
      aY += 20;
    });

    // 逾期處置法律後果
    curY += 78;
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 逾期未改善之法律責任與違約處置：', 36, curY);

    curY += 12;
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(36, curY, canvas.width - 72, 60);
    ctx.strokeStyle = '#fca5a5';
    ctx.strokeRect(36, curY, canvas.width - 72, 60);

    ctx.fillStyle = '#991b1b';
    ctx.font = '12px sans-serif';
    const consText = state.consequence || '屆期仍未改善者將依法終止租約並通報工務局開罰。';
    const consLines = wrapText(ctx, consText, canvas.width - 110);
    let cY = curY + 22;
    consLines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 54, cY);
      cY += 18;
    });

    // 4 組存證照片縮圖
    curY += 76;
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 現場拍照存證照片紀錄', 36, curY);

    curY += 12;
    const photoWidth = 175;
    const photoHeight = 110;
    const photoKeys = ['photo1', 'photo2', 'photo3', 'photo4'];

    photoKeys.forEach((k, idx) => {
      const pX = 36 + idx * (photoWidth + 22);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pX, curY, photoWidth, photoHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(pX, curY, photoWidth, photoHeight);

      if (state.photos[k]) {
        const tempImg = new Image();
        tempImg.onload = () => {
          ctx.drawImage(tempImg, pX, curY, photoWidth, photoHeight);
        };
        tempImg.src = state.photos[k];
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`圖${idx + 1} 存證照片`, pX + photoWidth / 2, curY + photoHeight / 2);
        ctx.textAlign = 'left';
      }
    });

    // 簽章與送達區
    curY += photoHeight + 30;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(36, curY, canvas.width - 72, 1);

    curY += 18;
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('港居代管專員（發函簽章）：', 54, curY + 16);
    ctx.fillText('受送達承租人（簽收確認）：', 440, curY + 16);

    if (dom.previewAgentSigImg && dom.previewAgentSigImg.style.display !== 'none') {
      ctx.drawImage(dom.previewAgentSigImg, 54, curY + 26, 160, 50);
    } else {
      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(代管專員印章/簽章處)', 54, curY + 46);
    }

    if (dom.previewTenantSigImg && dom.previewTenantSigImg.style.display !== 'none') {
      ctx.drawImage(dom.previewTenantSigImg, 440, curY + 26, 160, 50);
    } else {
      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(承租人簽收/管理室代收章)', 440, curY + 46);
    }

    // 頁尾
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司｜高雄市小港區中安路488號1樓｜服務電話: 07-793-3997｜統編: 96797997', canvas.width / 2, canvas.height - 24);

    // 觸發下載
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `港居不動產_違規勸導改善通知單_${state.docNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (window.showToast) window.showToast('已成功匯出高清存證圖卡！');
    }, 200);
  }

  // 文字斷行輔助函式
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // 複製 LINE 通報文字
  function copyLineText() {
    const tmpl = VIOLATION_TEMPLATES[state.category] || VIOLATION_TEMPLATES['hallway-clutter'];

    const text = `⚠️【港居不動產】租賃住宅住戶違規行為勸導限期改善通知
──────────────────────
📋 發文字號：${state.docNo}
📅 發文日期：${state.date}
🏠 標的門牌：${state.propertyAddress || '未填寫'}
👤 受通知人：${state.tenantName || '承租人'} (${state.tenantPhone || '未填寫電話'})
🏢 受託代管：港居不動產開發（電話 07-793-3997）
📌 違規類別：${tmpl.title}

🚨【具體違規情節】：
${state.facts || tmpl.facts}

⏰【限期改善截止期限】：
➔ ${state.deadline || '請於接獲通知 3 日內完成改善恢復原狀'}

🛠️【具體改善要求】：
${state.action || tmpl.action}

⚖️【法規依據與後續法律處置】：
${state.consequence || tmpl.consequence}

（本通知已依《租賃專法》第10條完成送達存證登錄，屆期未改善將正式啟動法律程序）`;

    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) {
        window.showToast('已複製 LINE 正式勸導通知文字至剪貼簿！');
      } else {
        alert('已複製 LINE 正式勸導通知文字！');
      }
    }).catch(err => {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動複製。');
    });
  }

  // DOM 載入後初始化
  document.addEventListener('DOMContentLoaded', () => {
    initDefaults();
    setupTypeSelector();
    setupFormInputs();
    setupPhotoSlots();
    setupSignaturePads();

    if (dom.btnDemoData) dom.btnDemoData.addEventListener('click', loadDemoData);
    if (dom.btnClearForm) dom.btnClearForm.addEventListener('click', clearForm);
    if (dom.btnPrint) dom.btnPrint.addEventListener('click', () => window.print());
    if (dom.btnDownloadCard) dom.btnDownloadCard.addEventListener('click', downloadCard);
    if (dom.btnCopyLine) dom.btnCopyLine.addEventListener('click', copyLineText);
  });
})();
