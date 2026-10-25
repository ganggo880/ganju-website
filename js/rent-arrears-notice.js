/**
 * js/rent-arrears-notice.js
 * 港居不動產 - 住宅租賃租金催繳與欠租限期清償催告書產生器核心腳本
 * 符合《民法》第439/440條、《租賃住宅市場發展及管理條例》第10條第1項第2款
 */

(function () {
  'use strict';

  // 催繳三階段範本資料庫
  const ESCALATION_TEMPLATES = {
    '1': {
      levelName: '一級・溫馨提醒',
      title: '租賃住宅租金入帳溫馨提醒通知',
      color: '#d97706',
      bgColor: '#fffbeb',
      facts: '截至本日止，本公司受託租賃住宅帳戶尚未接獲台端本期租金入帳紀錄。考量銀行跨行轉帳作業時程或帳號登錄疏忽，特此溫馨提醒。',
      action: '敬請台端於接獲本通知後 3 日內完成租金匯款，若已完成繳費請將匯款單據或帳號末五碼告知港居管理專員，以便即時為您銷帳。',
      consequence: '依雙方簽訂之定型化租賃契約約定，逾期超過 7 日將啟動違約金計罰；如有短暫資金調度需求，敬請儘速與本公司專員聯繫溝通。',
      statute: '《民法》第439條及定型化住宅租賃契約第4條「租金給付約定」'
    },
    '2': {
      levelName: '二級・正式限期催繳',
      title: '租賃住宅租金逾期未繳正式催繳通知函',
      color: '#ea580c',
      bgColor: '#fff7ed',
      facts: '承租人承租標的之租金已逾約定給付期限達 8 日以上，經通訊軟體及電話多次照會仍未見清償，依約已構成債務給付遲延責任。',
      action: '請於接獲本通知後 5 日內，將積欠之租金本金及約定違約金全額匯入指定受款帳戶，並將匯款憑單回傳確認。',
      consequence: '逾期仍未清償者，本公司將依租約約定每日加計千分之一遲延違約金，並同步以公文正式副知連帶保證人負連帶清償責任。',
      statute: '《民法》第229條第1項、第233條法定利息及租賃契約第12條約定'
    },
    '3': {
      levelName: '三級・法務催告警告',
      title: '欠繳租金限期清償催告暨終止租約預告書',
      color: '#dc2626',
      bgColor: '#fef2f2',
      facts: '承租人積欠租金及各項費用已累計相當期數，嚴重違反租賃契約與善良管理人注意義務，出租人特委由受託代管公司發出嚴正催告。',
      action: '限台端於接獲本通知後 7 日內立即全額清償積欠款項，或於期限內親赴港居代管公司簽立債務分期還款清償協議書。',
      consequence: '期限屆滿若仍不履行，出租人將依《民法》第440條及《租賃專法》第10條正式解除/終止租約，依法扣抵全額押金、聲請法院核發支付命令、查封財產並追究連帶保證人清償責任，另限期遷讓交還房屋。',
      statute: '《租賃住宅市場發展及管理條例》第10條第1項第2款、《民法》第440條第1項及第739條'
    }
  };

  // 數字轉繁體中文大寫金額
  function numberToChineseAmount(num) {
    if (isNaN(num) || num <= 0) return '零元整';
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億'];

    let numStr = Math.floor(num).toString();
    if (numStr.length > 12) return '金額過大';

    let result = '';
    let zeroCount = 0;
    const len = numStr.length;

    for (let i = 0; i < len; i++) {
      const n = parseInt(numStr[i]);
      const p = len - i - 1;
      const unit = units[p % 4];
      const bigUnit = p % 4 === 0 ? bigUnits[Math.floor(p / 4)] : '';

      if (n === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          result += digits[0];
          zeroCount = 0;
        }
        result += digits[n] + unit;
      }

      if (p % 4 === 0) {
        if (zeroCount < 4) {
          result += bigUnit;
        }
        zeroCount = 0;
      }
    }

    result = result.replace(/億萬/, '億');
    result = result.replace(/零+$/, '');
    return '新臺幣 ' + result + '元整';
  }

  // 預設狀態
  const state = {
    docNo: '',
    date: '',
    deadline: '',
    level: '2', // 預設二級正式催繳
    propertyAddress: '',
    tenantName: '',
    tenantPhone: '',
    guarantorName: '',
    landlordName: '港居不動產開發有限公司（受託代管公司）',
    agentName: '陳志峰（租賃住宅管理人員）',
    agentLicense: '(112)登字第013739號',
    bankName: '中國信託商業銀行 (代碼 822) 三多簡易分行',
    bankAccountName: '港居不動產開發有限公司',
    bankAccountNo: '822-123456789012',
    facts: '',
    action: '',
    consequence: '',
    items: [
      { period: '2026年10月份租金', rent: 22000, utility: 1500, penalty: 500 }
    ],
    agentSigned: false,
    tenantSigned: false
  };

  // 快取 DOM 元素
  const dom = {
    levelButtons: document.querySelectorAll('.escalation-btn'),
    docNoInput: document.getElementById('docNoInput'),
    dateInput: document.getElementById('dateInput'),
    deadlineInput: document.getElementById('deadlineInput'),
    propertyAddress: document.getElementById('propertyAddress'),
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),
    guarantorName: document.getElementById('guarantorName'),
    landlordName: document.getElementById('landlordName'),
    agentName: document.getElementById('agentName'),
    agentLicense: document.getElementById('agentLicense'),
    bankName: document.getElementById('bankName'),
    bankAccountName: document.getElementById('bankAccountName'),
    bankAccountNo: document.getElementById('bankAccountNo'),
    factsInput: document.getElementById('factsInput'),
    actionInput: document.getElementById('actionInput'),
    consequenceInput: document.getElementById('consequenceInput'),
    
    // 欠繳明細表
    itemsTbody: document.getElementById('itemsTbody'),
    btnAddRow: document.getElementById('btnAddRow'),
    calcTotalRent: document.getElementById('calcTotalRent'),
    calcTotalUtility: document.getElementById('calcTotalUtility'),
    calcTotalPenalty: document.getElementById('calcTotalPenalty'),
    calcGrandTotal: document.getElementById('calcGrandTotal'),
    calcTotalChinese: document.getElementById('calcTotalChinese'),

    // 按鈕
    btnDemoData: document.getElementById('btnDemoData'),
    btnClearForm: document.getElementById('btnClearForm'),
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),

    // A4 預覽元件
    previewDocNo: document.getElementById('previewDocNo'),
    previewDate: document.getElementById('previewDate'),
    previewDeadline: document.getElementById('previewDeadline'),
    previewTitle: document.getElementById('previewTitle'),
    previewAddress: document.getElementById('previewAddress'),
    previewTenant: document.getElementById('previewTenant'),
    previewGuarantor: document.getElementById('previewGuarantor'),
    previewLandlord: document.getElementById('previewLandlord'),
    previewStatute: document.getElementById('previewStatute'),
    previewFacts: document.getElementById('previewFacts'),
    previewAction: document.getElementById('previewAction'),
    previewConsequence: document.getElementById('previewConsequence'),
    previewArrearsTbody: document.getElementById('previewArrearsTbody'),
    previewTotalChinese: document.getElementById('previewTotalChinese'),
    previewGrandTotalNum: document.getElementById('previewGrandTotalNum'),
    previewBankDetails: document.getElementById('previewBankDetails'),
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
    state.docNo = `AN-${yyyy}${mm}${dd}-01`;

    // 期限預設為 5 天後 18:00
    const deadlineDate = new Date(today);
    deadlineDate.setDate(deadlineDate.getDate() + 5);
    const d_yyyy = deadlineDate.getFullYear();
    const d_mm = String(deadlineDate.getMonth() + 1).padStart(2, '0');
    const d_dd = String(deadlineDate.getDate()).padStart(2, '0');
    state.deadline = `${d_yyyy}-${d_mm}-${d_dd} 18:00 前`;

    if (dom.docNoInput) dom.docNoInput.value = state.docNo;
    if (dom.dateInput) dom.dateInput.value = state.date;
    if (dom.deadlineInput) dom.deadlineInput.value = state.deadline;
    if (dom.bankName) dom.bankName.value = state.bankName;
    if (dom.bankAccountName) dom.bankAccountName.value = state.bankAccountName;
    if (dom.bankAccountNo) dom.bankAccountNo.value = state.bankAccountNo;

    applyEscalationTemplate(state.level);
    renderItemsTable();
    renderA4Preview();
  }

  // 套用催告層級範本
  function applyEscalationTemplate(level) {
    const tmpl = ESCALATION_TEMPLATES[level] || ESCALATION_TEMPLATES['2'];
    state.level = level;
    state.facts = tmpl.facts;
    state.action = tmpl.action;
    state.consequence = tmpl.consequence;

    if (dom.factsInput) dom.factsInput.value = state.facts;
    if (dom.actionInput) dom.actionInput.value = state.action;
    if (dom.consequenceInput) dom.consequenceInput.value = state.consequence;
  }

  // 設定等級切換按鈕
  function setupLevelSelector() {
    dom.levelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.levelButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const lvl = btn.dataset.level;
        applyEscalationTemplate(lvl);
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
      { el: dom.guarantorName, key: 'guarantorName' },
      { el: dom.landlordName, key: 'landlordName' },
      { el: dom.agentName, key: 'agentName' },
      { el: dom.agentLicense, key: 'agentLicense' },
      { el: dom.bankName, key: 'bankName' },
      { el: dom.bankAccountName, key: 'bankAccountName' },
      { el: dom.bankAccountNo, key: 'bankAccountNo' },
      { el: dom.factsInput, key: 'facts' },
      { el: dom.actionInput, key: 'action' },
      { el: dom.consequenceInput, key: 'consequence' }
    ];

    fieldMap.forEach(item => {
      if (!item.el) return;
      item.el.addEventListener('input', e => {
        state[item.key] = e.target.value;
        renderA4Preview();
      });
    });
  }

  // 渲染動態欠繳表格
  function renderItemsTable() {
    if (!dom.itemsTbody) return;
    dom.itemsTbody.innerHTML = '';

    state.items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <input type="text" class="table-input item-period" value="${item.period}" placeholder="例：2026年10月份租金" data-idx="${idx}">
        </td>
        <td>
          <input type="number" class="table-input item-rent" value="${item.rent}" min="0" step="500" data-idx="${idx}">
        </td>
        <td>
          <input type="number" class="table-input item-utility" value="${item.utility}" min="0" step="100" data-idx="${idx}">
        </td>
        <td>
          <input type="number" class="table-input item-penalty" value="${item.penalty}" min="0" step="100" data-idx="${idx}">
        </td>
        <td style="font-weight: 700; color: #ea580c; text-align: right; padding-right: 10px;">
          NT$ ${(Number(item.rent) + Number(item.utility) + Number(item.penalty)).toLocaleString()}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-del-row" data-idx="${idx}" title="刪除此期" ${state.items.length <= 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;
      dom.itemsTbody.appendChild(tr);
    });

    // 監聽表格輸入
    dom.itemsTbody.querySelectorAll('.table-input').forEach(input => {
      input.addEventListener('input', e => {
        const idx = Number(e.target.dataset.idx);
        if (e.target.classList.contains('item-period')) {
          state.items[idx].period = e.target.value;
        } else if (e.target.classList.contains('item-rent')) {
          state.items[idx].rent = Number(e.target.value) || 0;
        } else if (e.target.classList.contains('item-utility')) {
          state.items[idx].utility = Number(e.target.value) || 0;
        } else if (e.target.classList.contains('item-penalty')) {
          state.items[idx].penalty = Number(e.target.value) || 0;
        }
        updateTotals();
        renderA4Preview();
      });
    });

    // 刪除列監聽
    dom.itemsTbody.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = Number(btn.dataset.idx);
        if (state.items.length > 1) {
          state.items.splice(idx, 1);
          renderItemsTable();
          updateTotals();
          renderA4Preview();
        }
      });
    });

    updateTotals();
  }

  // 新增欠繳期數列
  function setupAddRow() {
    if (!dom.btnAddRow) return;
    dom.btnAddRow.addEventListener('click', () => {
      const nextMonth = state.items.length + 1;
      state.items.push({
        period: `2026年${10 + state.items.length}月份租金`,
        rent: 22000,
        utility: 0,
        penalty: 0
      });
      renderItemsTable();
      updateTotals();
      renderA4Preview();
    });
  }

  // 計算並更新統計
  function updateTotals() {
    let totalRent = 0;
    let totalUtility = 0;
    let totalPenalty = 0;

    state.items.forEach(it => {
      totalRent += Number(it.rent) || 0;
      totalUtility += Number(it.utility) || 0;
      totalPenalty += Number(it.penalty) || 0;
    });

    const grandTotal = totalRent + totalUtility + totalPenalty;
    const chinese = numberToChineseAmount(grandTotal);

    if (dom.calcTotalRent) dom.calcTotalRent.textContent = `NT$ ${totalRent.toLocaleString()}`;
    if (dom.calcTotalUtility) dom.calcTotalUtility.textContent = `NT$ ${totalUtility.toLocaleString()}`;
    if (dom.calcTotalPenalty) dom.calcTotalPenalty.textContent = `NT$ ${totalPenalty.toLocaleString()}`;
    if (dom.calcGrandTotal) dom.calcGrandTotal.textContent = `NT$ ${grandTotal.toLocaleString()}`;
    if (dom.calcTotalChinese) dom.calcTotalChinese.textContent = chinese;
  }

  // 雙 Retina 2x 手寫簽名板
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

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

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

  // 渲染右側 Live A4 預覽公文
  function renderA4Preview() {
    const tmpl = ESCALATION_TEMPLATES[state.level] || ESCALATION_TEMPLATES['2'];

    if (dom.previewDocNo) dom.previewDocNo.textContent = state.docNo || 'AN-20261025-01';
    const stripDoc = document.getElementById('stripDocNo');
    if (stripDoc) stripDoc.textContent = state.docNo || 'AN-20261025-01';

    if (dom.previewDate) dom.previewDate.textContent = state.date || '2026-10-25';
    if (dom.previewDeadline) dom.previewDeadline.textContent = state.deadline || '2026-10-30 18:00 前';
    if (dom.previewTitle) dom.previewTitle.textContent = tmpl.title;

    if (dom.previewAddress) dom.previewAddress.textContent = state.propertyAddress || '高雄市前鎮區中華五路 1234 號 8 樓之 2（港居敦峰）';

    // 承租人
    if (dom.previewTenant) {
      const name = state.tenantName || '林家銘';
      const phone = state.tenantPhone ? ` 聯絡電話: ${state.tenantPhone}` : '';
      dom.previewTenant.textContent = `${name}${phone}`;
    }

    // 保證人
    if (dom.previewGuarantor) {
      dom.previewGuarantor.textContent = state.guarantorName || '林慶祥（父親・連帶保證人，已副知）';
    }

    // 代管單位
    if (dom.previewLandlord) {
      const lName = state.landlordName || '港居不動產開發有限公司（受託代管公司）';
      const agent = state.agentName ? ` 經辦人員: ${state.agentName}` : '';
      const lic = state.agentLicense ? ` 證號: ${state.agentLicense}` : '';
      dom.previewLandlord.textContent = `${lName}${agent}${lic}`;
    }

    if (dom.previewStatute) dom.previewStatute.textContent = tmpl.statute;
    if (dom.previewFacts) dom.previewFacts.textContent = state.facts || tmpl.facts;
    if (dom.previewAction) dom.previewAction.textContent = state.action || tmpl.action;
    if (dom.previewConsequence) dom.previewConsequence.textContent = state.consequence || tmpl.consequence;

    // 渲染 A4 欠繳明細表格
    if (dom.previewArrearsTbody) {
      dom.previewArrearsTbody.innerHTML = '';
      let totalRent = 0;
      let totalUtility = 0;
      let totalPenalty = 0;

      state.items.forEach((it, idx) => {
        const r = Number(it.rent) || 0;
        const u = Number(it.utility) || 0;
        const p = Number(it.penalty) || 0;
        const sub = r + u + p;

        totalRent += r;
        totalUtility += u;
        totalPenalty += p;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="text-align: center;">${idx + 1}</td>
          <td>${it.period || '當期租金'}</td>
          <td class="num">NT$ ${r.toLocaleString()}</td>
          <td class="num">NT$ ${u.toLocaleString()}</td>
          <td class="num">NT$ ${p.toLocaleString()}</td>
          <td class="num" style="font-weight: 700;">NT$ ${sub.toLocaleString()}</td>
        `;
        dom.previewArrearsTbody.appendChild(row);
      });

      const grandTotal = totalRent + totalUtility + totalPenalty;
      const totalRow = document.createElement('tr');
      totalRow.className = 'total-row';
      totalRow.innerHTML = `
        <td colspan="2" style="text-align: right; font-weight: 800;">應清償總金額合計：</td>
        <td class="num">NT$ ${totalRent.toLocaleString()}</td>
        <td class="num">NT$ ${totalUtility.toLocaleString()}</td>
        <td class="num">NT$ ${totalPenalty.toLocaleString()}</td>
        <td class="num" style="font-size: 10pt; font-weight: 800; color: #c2410c;">NT$ ${grandTotal.toLocaleString()}</td>
      `;
      dom.previewArrearsTbody.appendChild(totalRow);

      if (dom.previewGrandTotalNum) dom.previewGrandTotalNum.textContent = `NT$ ${grandTotal.toLocaleString()} 元整`;
      if (dom.previewTotalChinese) dom.previewTotalChinese.textContent = numberToChineseAmount(grandTotal);
    }

    // 匯款指定帳戶
    if (dom.previewBankDetails) {
      dom.previewBankDetails.innerHTML = `
        <div><strong>金融機構：</strong>${state.bankName || '中國信託商業銀行 (代碼 822) 三多簡易分行'}</div>
        <div><strong>戶　　名：</strong>${state.bankAccountName || '港居不動產開發有限公司'}</div>
        <div><strong>指定帳號：</strong><strong style="color: #c2410c; font-size: 10pt; letter-spacing: 0.05em;">${state.bankAccountNo || '822-123456789012'}</strong></div>
      `;
    }
  }

  // 示範資料
  function loadDemoData() {
    state.propertyAddress = '高雄市前鎮區中華五路 1234 號 8 樓之 2（港居敦峰社區）';
    state.tenantName = '林家銘';
    state.tenantPhone = '0912-345-678';
    state.guarantorName = '林慶祥（父親・連帶保證人，已發送副本通知）';
    state.items = [
      { period: '2026年09月份租金（餘額）', rent: 5000, utility: 1850, penalty: 500 },
      { period: '2026年10月份租金（全額）', rent: 22000, utility: 2150, penalty: 1000 }
    ];

    if (dom.propertyAddress) dom.propertyAddress.value = state.propertyAddress;
    if (dom.tenantName) dom.tenantName.value = state.tenantName;
    if (dom.tenantPhone) dom.tenantPhone.value = state.tenantPhone;
    if (dom.guarantorName) dom.guarantorName.value = state.guarantorName;

    renderItemsTable();
    updateTotals();
    renderA4Preview();
  }

  // 清空表單
  function clearForm() {
    if (!confirm('確定要清空所有填寫內容並重設嗎？')) return;
    state.propertyAddress = '';
    state.tenantName = '';
    state.tenantPhone = '';
    state.guarantorName = '';
    state.items = [
      { period: '2026年10月份租金', rent: 0, utility: 0, penalty: 0 }
    ];

    if (dom.propertyAddress) dom.propertyAddress.value = '';
    if (dom.tenantName) dom.tenantName.value = '';
    if (dom.tenantPhone) dom.tenantPhone.value = '';
    if (dom.guarantorName) dom.guarantorName.value = '';

    renderItemsTable();
    updateTotals();
    renderA4Preview();
  }

  // 下載 Canvas 存證圖卡 (840×1080px)
  function downloadCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 漸層背景
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#fff7ed');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部警示裝飾條
    ctx.fillStyle = state.level === '3' ? '#dc2626' : (state.level === '2' ? '#ea580c' : '#d97706');
    ctx.fillRect(0, 0, 840, 18);

    // 品牌 Header
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('港居不動產開發有限公司', 40, 65);

    ctx.fillStyle = state.level === '3' ? '#dc2626' : (state.level === '2' ? '#ea580c' : '#d97706');
    ctx.font = 'bold 24px sans-serif';
    const tmpl = ESCALATION_TEMPLATES[state.level] || ESCALATION_TEMPLATES['2'];
    ctx.fillText(tmpl.title, 40, 105);

    // 分隔線
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 125);
    ctx.lineTo(800, 125);
    ctx.stroke();

    // 單號與日期
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(`發文字號：${state.docNo || 'AN-20261025-01'}`, 40, 155);
    ctx.fillText(`發文日期：${state.date || '2026-10-25'}`, 320, 155);
    
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`限期清償截止：${state.deadline || '2026-10-30 18:00 前'}`, 540, 155);

    // 資訊白底圓角盒
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 175, 760, 130, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '15px sans-serif';
    ctx.fillText(`承租物地址：${state.propertyAddress || '高雄市前鎮區中華五路 1234 號 8 樓之 2'}`, 60, 208);
    ctx.fillText(`受催告人（承租人）：${state.tenantName || '林家銘'} (${state.tenantPhone || '未填'})`, 60, 238);
    ctx.fillText(`連帶保證人（副知）：${state.guarantorName || '已同步副知連帶保證人'}`, 60, 268);
    ctx.fillText(`受託代管公司：${state.landlordName || '港居不動產開發有限公司'}`, 60, 295);

    // 欠繳明細總表
    ctx.fillStyle = '#fff7ed';
    ctx.strokeStyle = '#fdba74';
    ctx.beginPath();
    ctx.roundRect(40, 325, 760, 240, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('積欠款項清單與明細', 60, 360);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    let y = 395;
    let grandTotal = 0;

    state.items.forEach((it, i) => {
      if (y > 480) return;
      const sub = (Number(it.rent) || 0) + (Number(it.utility) || 0) + (Number(it.penalty) || 0);
      grandTotal += sub;
      ctx.fillText(`${i + 1}. ${it.period}: 租金$${Number(it.rent).toLocaleString()} + 水電$${Number(it.utility).toLocaleString()} + 違約金$${Number(it.penalty).toLocaleString()} = 小計 NT$ ${sub.toLocaleString()}`, 60, y);
      y += 28;
    });

    // 總金額大字
    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`應繳總額：NT$ ${grandTotal.toLocaleString()} 元整`, 60, 520);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`（${numberToChineseAmount(grandTotal)}）`, 60, 545);

    // 匯款指定帳戶
    ctx.fillStyle = '#0a192f';
    ctx.beginPath();
    ctx.roundRect(40, 580, 760, 95, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`專用指定受款帳戶：${state.bankName}`, 60, 615);
    ctx.fillText(`戶名：${state.bankAccountName}  ｜  帳號：${state.bankAccountNo}`, 60, 645);

    // 事實與法律效力警告
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(40, 690, 760, 250, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('重要法務提示與限期處置宣告', 60, 725);

    ctx.fillStyle = '#334155';
    ctx.font = '14px sans-serif';
    ctx.fillText(`1. 法規依據：${tmpl.statute}`, 60, 760);
    ctx.fillText(`2. 改善要求：${state.action || tmpl.action}`, 60, 795, 720);
    ctx.fillText(`3. 逾期後果：${state.consequence || tmpl.consequence}`, 60, 835, 720);

    // 浮水印標記
    ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.font = 'bold 44px sans-serif';
    ctx.save();
    ctx.translate(220, 890);
    ctx.rotate(-0.15);
    ctx.fillText('港居代管 法務催告存證', 0, 0);
    ctx.restore();

    // 頁尾
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ 租賃住宅服務業 ｜ 服務電話：0968-863-880 ｜ 純前端運算存證', 40, 1045);

    // 下載
    const a = document.createElement('a');
    a.download = `租金催繳催告書_${state.tenantName || '租客'}_${state.docNo || '存證'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  // 複製 LINE 催繳訊息
  function copyLineText() {
    let grandTotal = 0;
    let itemsText = '';
    state.items.forEach((it, i) => {
      const sub = (Number(it.rent) || 0) + (Number(it.utility) || 0) + (Number(it.penalty) || 0);
      grandTotal += sub;
      itemsText += `  ▫️ ${it.period}：租金$${Number(it.rent).toLocaleString()} / 水電$${Number(it.utility).toLocaleString()} / 違約金$${Number(it.penalty).toLocaleString()} (小計 NT$ ${sub.toLocaleString()})\n`;
    });

    const tmpl = ESCALATION_TEMPLATES[state.level] || ESCALATION_TEMPLATES['2'];

    const text = `【港居不動產・${tmpl.title}】
發文字號：${state.docNo || 'AN-20261025-01'}
受通知人：${state.tenantName || '台端'} 您好
承租門牌：${state.propertyAddress || '承租標的'}

經查台端承租之上述住宅，截至本日止尚有租金款項未繳，明細如下：
${itemsText}
💰 應繳清償總額：NT$ ${grandTotal.toLocaleString()} 元整
（大寫：${numberToChineseAmount(grandTotal)}）

⚠️ 限期清償截止：${state.deadline || '請儘速完成匯款'}
指定受款金融帳號：
  ▪️ 銀行機構：${state.bankName}
  ▪️ 帳戶戶名：${state.bankAccountName}
  ▪️ 匯款帳號：${state.bankAccountNo}

📌 改善作為與法規提醒：
${state.action || tmpl.action}

※ 逾期責任：${state.consequence || tmpl.consequence}
完成匯款後請務必回傳單據或帳號後五碼，以便港居專員為您即時銷帳。感謝您的配合！

港居不動產開發有限公司 敬啟
服務專線：0968-863-880`;

    navigator.clipboard.writeText(text).then(() => {
      alert('✅ LINE 租金催繳通知文字已成功複製至剪貼簿！');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('✅ LINE 租金催繳通知文字已成功複製！');
    });
  }

  // 綁定操作按鈕
  function setupButtons() {
    if (dom.btnDemoData) dom.btnDemoData.addEventListener('click', loadDemoData);
    if (dom.btnClearForm) dom.btnClearForm.addEventListener('click', clearForm);
    if (dom.btnPrint) dom.btnPrint.addEventListener('click', () => window.print());
    if (dom.btnDownloadCard) dom.btnDownloadCard.addEventListener('click', downloadCard);
    if (dom.btnCopyLine) dom.btnCopyLine.addEventListener('click', copyLineText);
  }

  // 初始化
  function init() {
    initDefaults();
    setupLevelSelector();
    setupFormInputs();
    setupAddRow();
    setupSignaturePads();
    setupButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
