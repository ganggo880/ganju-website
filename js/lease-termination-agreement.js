/**
 * 港居不動產 - 租約提前終止協議書與遷讓交還切結產生器 (lease-termination-agreement.js)
 * 符合民法第453/454條與租賃住宅市場發展及管理條例第10/11條
 * 純前端本地運算 ｜ LocalStorage 離線草稿 ｜ Retina 雙畫布簽章 ｜ Canvas 圖卡與 A4 列印
 */

(function () {
  'use strict';

  // 預設資料模型
  const DEFAULT_DATA = {
    serialNumber: 'GANJU-TRM-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
    agreementDate: new Date().toISOString().slice(0, 10),
    terminationDate: new Date().toISOString().slice(0, 10),
    moveoutTime: '18:00',
    propertyAddress: '高雄市小港區中安路825號5樓A室',
    leaseStartDate: '2025-11-01',
    leaseEndDate: '2026-10-31',
    monthlyRent: 16000,
    securityDeposit: 32000,
    
    // 出租人（甲方）
    landlordName: '港居不動產開發有限公司（特許包租代管方）',
    landlordId: '96797997',
    landlordPhone: '0968-863-880',
    landlordAddress: '高雄市小港區中安路825號',

    // 承租人（乙方）
    tenantName: '陳志明',
    tenantId: 'E123456789',
    tenantPhone: '0912-345-678',
    tenantAddress: '高雄市前鎮區中華五路100號',

    // 終止事由
    terminationReason: 'mutual_consent',
    compensationAmount: 0,
    specialAgreement: '雙方確認屋況點交良好，水電瓦斯費用已結清，無其他爭議。',

    // 押金結算
    totalDeposit: 32000,
    deductionTotal: 0,
    refundNet: 32000,
    refundMethod: 'bank_transfer', // 'cash' or 'bank_transfer'
    bankName: '台灣土地銀行 (005)',
    bankAccount: '0540-0512-3456',
    bankAccountName: '陳志明',

    // 鑰匙與配件清點
    keysMain: 2,
    keysRoom: 1,
    tokensAccess: 2,
    remotesAC: 1,
    remotesTV: 1,
    keysMailbox: 1,
    otherItems: '附屬家電說明書一份'
  };

  let state = Object.assign({}, DEFAULT_DATA);

  // Canvas 簽章狀態
  let landlordSigDrawn = false;
  let tenantSigDrawn = false;
  let isDrawingLandlord = false;
  let isDrawingTenant = false;

  let landlordCanvas, landlordCtx;
  let tenantCanvas, tenantCtx;

  // DOM 載入後初始化
  document.addEventListener('DOMContentLoaded', function () {
    loadDraft();
    initDOMReferences();
    initCanvasSignatures();
    bindEvents();
    renderAll();
  });

  // DOM 參考快取
  const dom = {};
  function initDOMReferences() {
    dom.serialNumber = document.getElementById('serialNumber');
    dom.agreementDate = document.getElementById('agreementDate');
    dom.terminationDate = document.getElementById('terminationDate');
    dom.moveoutTime = document.getElementById('moveoutTime');
    dom.propertyAddress = document.getElementById('propertyAddress');
    dom.leaseStartDate = document.getElementById('leaseStartDate');
    dom.leaseEndDate = document.getElementById('leaseEndDate');
    dom.monthlyRent = document.getElementById('monthlyRent');
    dom.securityDeposit = document.getElementById('securityDeposit');

    dom.landlordName = document.getElementById('landlordName');
    dom.landlordId = document.getElementById('landlordId');
    dom.landlordPhone = document.getElementById('landlordPhone');
    dom.landlordAddress = document.getElementById('landlordAddress');

    dom.tenantName = document.getElementById('tenantName');
    dom.tenantId = document.getElementById('tenantId');
    dom.tenantPhone = document.getElementById('tenantPhone');
    dom.tenantAddress = document.getElementById('tenantAddress');

    dom.compensationAmount = document.getElementById('compensationAmount');
    dom.specialAgreement = document.getElementById('specialAgreement');

    dom.totalDeposit = document.getElementById('totalDeposit');
    dom.deductionTotal = document.getElementById('deductionTotal');
    dom.refundNet = document.getElementById('refundNet');
    dom.refundMethod = document.getElementById('refundMethod');
    dom.bankName = document.getElementById('bankName');
    dom.bankAccount = document.getElementById('bankAccount');
    dom.bankAccountName = document.getElementById('bankAccountName');
    dom.bankGroup = document.getElementById('bankInfoGroup');

    dom.keysMain = document.getElementById('keysMain');
    dom.keysRoom = document.getElementById('keysRoom');
    dom.tokensAccess = document.getElementById('tokensAccess');
    dom.remotesAC = document.getElementById('remotesAC');
    dom.remotesTV = document.getElementById('remotesTV');
    dom.keysMailbox = document.getElementById('keysMailbox');
    dom.otherItems = document.getElementById('otherItems');

    // 預覽文件節點
    dom.previewPaper = document.getElementById('docPreviewPaper');
    dom.toast = document.getElementById('toast');
  }

  // 事件綁定
  function bindEvents() {
    // 輸入欄位連動更新
    const formInputs = document.querySelectorAll('.term-form-control, .term-num-input');
    formInputs.forEach(input => {
      input.addEventListener('input', function () {
        syncStateFromInputs();
        calculateFinancials();
        renderPreview();
        saveDraft();
      });
    });

    // 終止事由單選切換
    const reasonOptions = document.querySelectorAll('.term-reason-option');
    reasonOptions.forEach(opt => {
      opt.addEventListener('click', function () {
        reasonOptions.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        const radio = this.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        state.terminationReason = radio.value;
        updateReasonNotice();
        renderPreview();
        saveDraft();
      });
    });

    // 退款方式切換
    if (dom.refundMethod) {
      dom.refundMethod.addEventListener('change', function () {
        state.refundMethod = this.value;
        if (dom.bankGroup) {
          dom.bankGroup.style.display = (this.value === 'bank_transfer') ? 'block' : 'none';
        }
        renderPreview();
        saveDraft();
      });
    }

    // 跨工具匯入退租結算單按鈕
    const btnImport = document.getElementById('btnImportDeposit');
    if (btnImport) {
      btnImport.addEventListener('click', importFromDepositSettlement);
    }

    // 操作按鈕
    const btnPrint = document.getElementById('btnPrintAgreement');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    const btnDownloadCard = document.getElementById('btnDownloadCard');
    if (btnDownloadCard) btnDownloadCard.addEventListener('click', downloadCanvasCard);

    const btnCopyLine = document.getElementById('btnCopyLine');
    if (btnCopyLine) btnCopyLine.addEventListener('click', copyLineSummary);

    const btnReset = document.getElementById('btnResetForm');
    if (btnReset) btnReset.addEventListener('click', resetAll);
  }

  // 從輸入欄位同步狀態
  function syncStateFromInputs() {
    if (!dom.serialNumber) return;
    state.serialNumber = dom.serialNumber.value.trim();
    state.agreementDate = dom.agreementDate.value;
    state.terminationDate = dom.terminationDate.value;
    state.moveoutTime = dom.moveoutTime.value;
    state.propertyAddress = dom.propertyAddress.value.trim();
    state.leaseStartDate = dom.leaseStartDate.value;
    state.leaseEndDate = dom.leaseEndDate.value;
    state.monthlyRent = parseFloat(dom.monthlyRent.value) || 0;
    state.securityDeposit = parseFloat(dom.securityDeposit.value) || 0;

    state.landlordName = dom.landlordName.value.trim();
    state.landlordId = dom.landlordId.value.trim();
    state.landlordPhone = dom.landlordPhone.value.trim();
    state.landlordAddress = dom.landlordAddress.value.trim();

    state.tenantName = dom.tenantName.value.trim();
    state.tenantId = dom.tenantId.value.trim();
    state.tenantPhone = dom.tenantPhone.value.trim();
    state.tenantAddress = dom.tenantAddress.value.trim();

    state.compensationAmount = parseFloat(dom.compensationAmount.value) || 0;
    state.specialAgreement = dom.specialAgreement.value.trim();

    state.totalDeposit = parseFloat(dom.totalDeposit.value) || 0;
    state.deductionTotal = parseFloat(dom.deductionTotal.value) || 0;

    state.bankName = dom.bankName.value.trim();
    state.bankAccount = dom.bankAccount.value.trim();
    state.bankAccountName = dom.bankAccountName.value.trim();

    state.keysMain = parseInt(dom.keysMain.value) || 0;
    state.keysRoom = parseInt(dom.keysRoom.value) || 0;
    state.tokensAccess = parseInt(dom.tokensAccess.value) || 0;
    state.remotesAC = parseInt(dom.remotesAC.value) || 0;
    state.remotesTV = parseInt(dom.remotesTV.value) || 0;
    state.keysMailbox = parseInt(dom.keysMailbox.value) || 0;
    state.otherItems = dom.otherItems.value.trim();
  }

  // 計算金額淨額
  function calculateFinancials() {
    state.refundNet = Math.max(0, state.totalDeposit - state.deductionTotal);
    if (dom.refundNet) {
      dom.refundNet.value = state.refundNet;
    }
  }

  // 更新終止事由警示條
  function updateReasonNotice() {
    const noticeBox = document.getElementById('reasonNoticeBox');
    if (!noticeBox) return;

    if (state.terminationReason === 'mutual_consent') {
      noticeBox.className = 'term-alert-box success';
      noticeBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> <div><strong>雙方合意提前終止</strong>：立約雙方互相體諒合意解約，依約定辦理點交與退押，最平順安全。</div>';
    } else if (state.terminationReason === 'tenant_statutory') {
      noticeBox.className = 'term-alert-box info';
      noticeBox.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> <div><strong>承租人法定提前終止權（免責）</strong>：符合《租賃專法》第11條（傷病長期療養/未達居住目的修繕未果/第三人主張權利），<strong>依法出租人不得要求任何違約賠償金</strong>。</div>';
      if (dom.compensationAmount) {
        dom.compensationAmount.value = 0;
        state.compensationAmount = 0;
      }
    } else if (state.terminationReason === 'landlord_statutory') {
      noticeBox.className = 'term-alert-box info';
      noticeBox.innerHTML = '<i class="fa-solid fa-building-circle-exclamation"></i> <div><strong>出租人法定提前終止權</strong>：依《租賃專法》第10條收回重造、承租人毀損不修或積欠二個月租額催告不付之法定終止。</div>';
    } else if (state.terminationReason === 'notice_penalty') {
      noticeBox.className = 'term-alert-box warning';
      noticeBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <div><strong>單方提前一個月預告終止</strong>：依內政部定型化契約應記載第13點，終止方應提前一個月通知，約定違約補償金<strong>最高不得超過一個月租金（NT$ ' + formatCurrency(state.monthlyRent) + '）</strong>。</div>';
    }
  }

  // 一鍵從退租押金結算單匯入
  function importFromDepositSettlement() {
    try {
      const raw = localStorage.getItem('ganju_deposit_draft');
      if (!raw) {
        showToast('本機尚未發現退租押金結算紀錄，請先填寫退租押金結算工具。', 'warning');
        return;
      }
      const data = JSON.parse(raw);
      if (data.propertyAddress) state.propertyAddress = data.propertyAddress;
      if (data.tenantName) state.tenantName = data.tenantName;
      if (data.monthlyRent) state.monthlyRent = data.monthlyRent;
      if (data.depositOriginal) {
        state.securityDeposit = data.depositOriginal;
        state.totalDeposit = data.depositOriginal;
      }
      if (data.netRefundAmount !== undefined) {
        state.refundNet = Math.max(0, data.netRefundAmount);
        state.deductionTotal = Math.max(0, state.totalDeposit - state.refundNet);
      }
      if (data.settleDate) {
        state.terminationDate = data.settleDate;
        state.agreementDate = data.settleDate;
      }

      applyStateToDOM();
      renderPreview();
      saveDraft();
      showToast('🎉 已成功從「退租押金結算神器」匯入資料！', 'success');
    } catch (e) {
      showToast('匯入失敗：' + e.message, 'error');
    }
  }

  // 將狀態更新回表單介面
  function applyStateToDOM() {
    if (!dom.serialNumber) return;
    dom.serialNumber.value = state.serialNumber;
    dom.agreementDate.value = state.agreementDate;
    dom.terminationDate.value = state.terminationDate;
    dom.moveoutTime.value = state.moveoutTime;
    dom.propertyAddress.value = state.propertyAddress;
    dom.leaseStartDate.value = state.leaseStartDate;
    dom.leaseEndDate.value = state.leaseEndDate;
    dom.monthlyRent.value = state.monthlyRent;
    dom.securityDeposit.value = state.securityDeposit;

    dom.landlordName.value = state.landlordName;
    dom.landlordId.value = state.landlordId;
    dom.landlordPhone.value = state.landlordPhone;
    dom.landlordAddress.value = state.landlordAddress;

    dom.tenantName.value = state.tenantName;
    dom.tenantId.value = state.tenantId;
    dom.tenantPhone.value = state.tenantPhone;
    dom.tenantAddress.value = state.tenantAddress;

    dom.compensationAmount.value = state.compensationAmount;
    dom.specialAgreement.value = state.specialAgreement;

    dom.totalDeposit.value = state.totalDeposit;
    dom.deductionTotal.value = state.deductionTotal;
    dom.refundNet.value = state.refundNet;
    dom.refundMethod.value = state.refundMethod;
    if (dom.bankGroup) {
      dom.bankGroup.style.display = (state.refundMethod === 'bank_transfer') ? 'block' : 'none';
    }
    dom.bankName.value = state.bankName;
    dom.bankAccount.value = state.bankAccount;
    dom.bankAccountName.value = state.bankAccountName;

    dom.keysMain.value = state.keysMain;
    dom.keysRoom.value = state.keysRoom;
    dom.tokensAccess.value = state.tokensAccess;
    dom.remotesAC.value = state.remotesAC;
    dom.remotesTV.value = state.remotesTV;
    dom.keysMailbox.value = state.keysMailbox;
    dom.otherItems.value = state.otherItems;

    // 終止事由 Radio
    const radios = document.querySelectorAll('input[name="termReason"]');
    radios.forEach(r => {
      if (r.value === state.terminationReason) {
        r.checked = true;
        r.closest('.term-reason-option')?.classList.add('active');
      } else {
        r.closest('.term-reason-option')?.classList.remove('active');
      }
    });

    updateReasonNotice();
  }

  // 初始化雙畫布手寫簽名
  function initCanvasSignatures() {
    landlordCanvas = document.getElementById('canvasLandlord');
    tenantCanvas = document.getElementById('canvasTenant');
    if (!landlordCanvas || !tenantCanvas) return;

    setupCanvas(landlordCanvas, function (ctx) {
      landlordCtx = ctx;
    });
    setupCanvas(tenantCanvas, function (ctx) {
      tenantCtx = ctx;
    });

    bindCanvasDraw(landlordCanvas, () => landlordCtx, () => isDrawingLandlord, (v) => { isDrawingLandlord = v; }, () => {
      landlordSigDrawn = true;
      document.getElementById('landlordSigPlaceholder')?.style.setProperty('display', 'none');
      updateDocSignaturePreviews();
    });

    bindCanvasDraw(tenantCanvas, () => tenantCtx, () => isDrawingTenant, (v) => { isDrawingTenant = v; }, () => {
      tenantSigDrawn = true;
      document.getElementById('tenantSigPlaceholder')?.style.setProperty('display', 'none');
      updateDocSignaturePreviews();
    });

    // 清除按鈕
    document.getElementById('btnClearLandlordSig')?.addEventListener('click', function () {
      clearCanvas(landlordCanvas, landlordCtx);
      landlordSigDrawn = false;
      document.getElementById('landlordSigPlaceholder')?.style.setProperty('display', 'block');
      updateDocSignaturePreviews();
    });

    document.getElementById('btnClearTenantSig')?.addEventListener('click', function () {
      clearCanvas(tenantCanvas, tenantCtx);
      tenantSigDrawn = false;
      document.getElementById('tenantSigPlaceholder')?.style.setProperty('display', 'block');
      updateDocSignaturePreviews();
    });
  }

  function setupCanvas(canvas, setCtxCallback) {
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a365d';
    setCtxCallback(ctx);
  }

  function bindCanvasDraw(canvas, getCtx, getIsDrawing, setIsDrawing, onDrawn) {
    let lastX = 0, lastY = 0;

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return [clientX - rect.left, clientY - rect.top];
    }

    function startDraw(e) {
      e.preventDefault();
      setIsDrawing(true);
      [lastX, lastY] = getCoords(e);
    }

    function draw(e) {
      if (!getIsDrawing()) return;
      e.preventDefault();
      const [curX, curY] = getCoords(e);
      const ctx = getCtx();
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      [lastX, lastY] = getCoords(e);
      if (onDrawn) onDrawn();
    }

    function stopDraw(e) {
      if (getIsDrawing()) {
        setIsDrawing(false);
      }
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  function clearCanvas(canvas, ctx) {
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
  }

  // 同步簽章至右側紙張預覽
  function updateDocSignaturePreviews() {
    const pLandlord = document.getElementById('previewLandlordSig');
    const pTenant = document.getElementById('previewTenantSig');

    if (pLandlord && landlordCanvas && landlordSigDrawn) {
      pLandlord.innerHTML = '<img src="' + landlordCanvas.toDataURL() + '" alt="出租人簽名">';
    } else if (pLandlord) {
      pLandlord.innerHTML = '<span style="color:#a0aec0;font-style:italic;">（待出租人/代管方簽署）</span>';
    }

    if (pTenant && tenantCanvas && tenantSigDrawn) {
      pTenant.innerHTML = '<img src="' + tenantCanvas.toDataURL() + '" alt="承租人簽名">';
    } else if (pTenant) {
      pTenant.innerHTML = '<span style="color:#a0aec0;font-style:italic;">（待承租人簽署）</span>';
    }
  }

  // 渲染右側正式 A4 仿真協議書預覽
  function renderPreview() {
    if (!dom.previewPaper) return;

    let reasonText = '';
    let reasonDetail = '';
    if (state.terminationReason === 'mutual_consent') {
      reasonText = '雙方合意提前終止租約';
      reasonDetail = '立約雙方秉持誠信原則，互諒互讓，合意提前終止原租賃契約，雙方依本協議約定辦理房屋返還與保證金結算。';
    } else if (state.terminationReason === 'tenant_statutory') {
      reasonText = '承租人行使法定提前終止權（免責）';
      reasonDetail = '承租人依《租賃住宅市場發展及管理條例》第11條之法定事由（包括因疾病、意外需長期療養，或租賃住宅未合使用目的經催告未修繕，或非可歸責承租人之存證事故），合法行使終止權，出租人依法不得請求違約賠償金。';
    } else if (state.terminationReason === 'landlord_statutory') {
      reasonText = '出租人行使法定提前終止權';
      reasonDetail = '出租人依《租賃住宅市場發展及管理條例》第10條之法定事由（租賃住宅為重新建築必要、承租人積欠達二個月租金經催告仍不給付、或承租人有重大違約毀損），合法行使終止權。';
    } else if (state.terminationReason === 'notice_penalty') {
      reasonText = '單方提前一個月預告終止（給付約定補償金）';
      reasonDetail = '終止方依內政部《住宅租賃定型化契約應記載事項》第13點約定，已提前一個月完成通知，並約定由終止方支付相當於 ' + (state.compensationAmount > 0 ? ('NT$ ' + formatCurrency(state.compensationAmount)) : '約定金額') + ' 之補償金。';
    }

    let refundMethodHtml = '';
    if (state.refundMethod === 'cash') {
      refundMethodHtml = '點交當日以<strong>現金一次結清返還</strong>。';
    } else {
      refundMethodHtml = '於點交完成日起 3 個工作日內，全額匯入承租人指定帳戶（' + escapeHTML(state.bankName) + '，戶名：' + escapeHTML(state.bankAccountName) + '，帳號：' + escapeHTML(state.bankAccountAccount || state.bankAccount) + '）。';
    }

    const html = `
      <div class="term-doc-header">
        <div class="term-doc-badge">GANJU LEGAL AGREEMENT</div>
        <h2 class="term-doc-title">住宅租賃提前終止協議書暨遷讓交還切結書</h2>
        <div class="term-doc-serial">協議編號：${escapeHTML(state.serialNumber)} ｜ 簽署日期：中華民國 ${toRocDate(state.agreementDate)}</div>
      </div>

      <div class="term-doc-preamble">
        立協議書人：出租人 <strong>${escapeHTML(state.landlordName)}</strong>（以下簡稱甲方）與承租人 <strong>${escapeHTML(state.tenantName)}</strong>（以下簡稱乙方），雙方就坐落於 <strong>${escapeHTML(state.propertyAddress)}</strong> 之租賃住宅（原租約起訖：中華民國 ${toRocDate(state.leaseStartDate)} 至 ${toRocDate(state.leaseEndDate)} 止），經充分磋商與合意，茲就提前終止租約與騰空遷讓交還事宜，特訂立本協議書，恪遵下列各條款：
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第一條 【終止事由與生效日】</div>
        <div class="term-doc-art-content">
          一、本約終止事由：<strong>${escapeHTML(reasonText)}</strong>。<br>
          二、${escapeHTML(reasonDetail)}<br>
          三、原租賃契約訂於中華民國 <strong>${toRocDate(state.terminationDate)} ${escapeHTML(state.moveoutTime)}</strong> 正式終止失效。
        </div>
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第二條 【租賃物騰空遷讓與交還】</div>
        <div class="term-doc-art-content">
          一、乙方應於終止日當日或之前，將租賃住宅內之全部私人物品騰空遷出，並將房屋維持良好清潔狀態交還甲方。<br>
          二、遺留物拋棄宣告：除雙方另有書面協議外，乙方於交還房屋後若尚有任何動產遺留於標的物內，<strong>乙方同意無條件視同拋棄所有權</strong>，任由甲方全權處分清理，清理產生之必要清運費用得由押金內扣抵，乙方絕無異議。
        </div>
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第三條 【鑰匙門禁配件與設備點交】</div>
        <div class="term-doc-art-content">
          乙方於終止點交日，向甲方如數清點歸還下列鎖匙與附屬設備，經甲方核對無訛：
          <table class="term-doc-table">
            <thead>
              <tr>
                <th>項目</th>
                <th>交還數量</th>
                <th>項目</th>
                <th>交還數量</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>房屋大門鑰匙</td>
                <td><strong>${state.keysMain}</strong> 支</td>
                <td>房間門鎖鑰匙</td>
                <td><strong>${state.keysRoom}</strong> 支</td>
              </tr>
              <tr>
                <td>社區大樓門禁磁扣</td>
                <td><strong>${state.tokensAccess}</strong> 顆</td>
                <td>冷氣/電視遙控器</td>
                <td><strong>${state.remotesAC + state.remotesTV}</strong> 支（冷氣${state.remotesAC}/電視${state.remotesTV}）</td>
              </tr>
              <tr>
                <td>信箱鎖匙</td>
                <td><strong>${state.keysMailbox}</strong> 支</td>
                <td>其他配件/說明書</td>
                <td>${escapeHTML(state.otherItems || '無')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第四條 【費用結算與押金返還】</div>
        <div class="term-doc-art-content">
          一、原擔保金（押金）總額為新臺幣 <strong>${formatCurrency(state.totalDeposit)}</strong> 元。<br>
          二、經雙方核對最後一期水電瓦斯、租金折讓、修繕分攤或約定補償金後，共計扣除新臺幣 <strong>${formatCurrency(state.deductionTotal)}</strong> 元整。<br>
          三、甲方應返還乙方之擔保金（押金）淨額為新臺幣 <span class="term-doc-highlight">NT$ ${formatCurrency(state.refundNet)} 元整</span>（大寫：<strong>${toChineseFinanceAmount(state.refundNet)}</strong>）。<br>
          四、返還方式：${refundMethodHtml}
        </div>
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第五條 【債權債務結清暨權利拋棄（Clean Break）】</div>
        <div class="term-doc-art-content">
          立約雙方共同確認：自本協議簽署且房屋完成點交、押金依約履行返還後，<strong>雙方就原租賃契約所衍生之一切租金、押金、修繕、使用利益及損害賠償等權利義務關係，均已全數結清消滅</strong>。自此雙方互不相欠，並拋棄對他方之一切民事請求權與爭訟，任何一方均不得再事後主張任何權利或追加請求。
        </div>
      </div>

      <div class="term-doc-article">
        <div class="term-doc-art-title">第六條 【特約條款】</div>
        <div class="term-doc-art-content">
          ${escapeHTML(state.specialAgreement || '無特別約定條款。')}
        </div>
      </div>

      <div class="term-doc-sign-grid">
        <div class="term-doc-sign-col">
          <strong>出租人（甲方）：</strong>${escapeHTML(state.landlordName)}<br>
          <strong>代表人／經紀人：</strong>陳俊銘 (特許字號：112登字013739號)<br>
          <strong>統一編號／身分證：</strong>${escapeHTML(state.landlordId)}<br>
          <strong>聯絡電話：</strong>${escapeHTML(state.landlordPhone)}<br>
          <strong>簽署日期：</strong>中華民國 ${toRocDate(state.agreementDate)}<br>
          <div class="term-doc-sig-preview" id="previewLandlordSig">
            <span style="color:#a0aec0;font-style:italic;">（待出租人/代管方簽署）</span>
          </div>
        </div>

        <div class="term-doc-sign-col">
          <strong>承租人（乙方）：</strong>${escapeHTML(state.tenantName)}<br>
          <strong>身分證字號：</strong>${escapeHTML(state.tenantId)}<br>
          <strong>通訊地址：</strong>${escapeHTML(state.tenantAddress)}<br>
          <strong>聯絡電話：</strong>${escapeHTML(state.tenantPhone)}<br>
          <strong>簽署日期：</strong>中華民國 ${toRocDate(state.agreementDate)}<br>
          <div class="term-doc-sig-preview" id="previewTenantSig">
            <span style="color:#a0aec0;font-style:italic;">（待承租人簽署）</span>
          </div>
        </div>
      </div>

      <div class="term-doc-company-seal">
        <span>港居不動產</span>
        <span>合約確認章</span>
        <span style="font-size: 0.65rem;">高市租登0012號</span>
      </div>
    `;

    dom.previewPaper.innerHTML = html;
    updateDocSignaturePreviews();
  }

  // 匯出高畫質 Canvas 診斷圖卡 (840 x 1080px)
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 1. 底色海軍藍
    ctx.fillStyle = '#1A365D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 邊框裝飾金色
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // 內層微邊框
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    // 3. 頂部標題區
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GANJU REAL ESTATE ｜ 專業租賃點交法務', canvas.width / 2, 68);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('住宅租賃提前終止協議確認卡', canvas.width / 2, 110);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText(`協議編號: ${state.serialNumber} ｜ 簽署日: ${state.agreementDate}`, canvas.width / 2, 138);

    // 分隔線
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.5)';
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(canvas.width - 60, 160);
    ctx.stroke();

    // 4. 白色資訊主卡片
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 50, 180, 740, 740, 16);
    ctx.fill();

    // 卡片內文
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('【終止標的物與立約雙方】', 80, 225);

    ctx.fillStyle = '#4A5568';
    ctx.font = '16px sans-serif';
    ctx.fillText(`租賃標的：${state.propertyAddress}`, 80, 260);
    ctx.fillText(`出租人（甲方）：${state.landlordName}`, 80, 290);
    ctx.fillText(`承租人（乙方）：${state.tenantName}（電話：${state.tenantPhone}）`, 80, 320);

    // 終止事由與日期
    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('【提前終止與點交結算】', 80, 375);

    let reasonLabel = '雙方合意提前終止';
    if (state.terminationReason === 'tenant_statutory') reasonLabel = '承租人法定提前終止（免責無違約金）';
    if (state.terminationReason === 'landlord_statutory') reasonLabel = '出租人法定提前終止';
    if (state.terminationReason === 'notice_penalty') reasonLabel = '單方預告提前終止（約定補償金）';

    ctx.fillStyle = '#4A5568';
    ctx.font = '16px sans-serif';
    ctx.fillText(`終止事由：${reasonLabel}`, 80, 410);
    ctx.fillText(`正式終止交還日：${state.terminationDate} ${state.moveoutTime}`, 80, 440);
    ctx.fillText(`大門/房門鑰匙：${state.keysMain} 支 / ${state.keysRoom} 支 ｜ 門禁磁扣：${state.tokensAccess} 顆`, 80, 470);
    ctx.fillText(`遙控器點收：冷氣 ${state.remotesAC} 支 ｜ 電視 ${state.remotesTV} 支`, 80, 500);

    // 金額大卡
    ctx.fillStyle = 'rgba(26, 54, 93, 0.05)';
    roundRect(ctx, 80, 530, 680, 160, 12);
    ctx.fill();

    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`擔保押金總額：NT$ ${formatCurrency(state.totalDeposit)} 元`, 110, 565);
    ctx.fillText(`扣除費用明細：NT$ ${formatCurrency(state.deductionTotal)} 元（水電/雜費/折減）`, 110, 595);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('應退還押金淨額 (Net Refund)：', 110, 635);
    ctx.fillStyle = '#1A365D';
    ctx.font = '900 28px sans-serif';
    ctx.fillText(`NT$ ${formatCurrency(state.refundNet)} 元整`, 340, 638);

    ctx.fillStyle = '#718096';
    ctx.font = '14px sans-serif';
    ctx.fillText(`（中文大寫：${toChineseFinanceAmount(state.refundNet)}）`, 110, 668);

    // 法律拋棄宣告
    ctx.fillStyle = '#2D3748';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('【法律效力宣告】立約雙方確認點交與退押履行後，債權債務全數結清，', 80, 725);
    ctx.fillText('互不向對方主張任何民刑事損害賠償請求權（Clean Break Clause）。', 80, 750);

    // 簽章縮圖繪入
    if (landlordCanvas && landlordSigDrawn) {
      ctx.drawImage(landlordCanvas, 100, 780, 200, 100);
      ctx.fillStyle = '#718096';
      ctx.font = '12px sans-serif';
      ctx.fillText('出租人已親簽', 100, 895);
    }
    if (tenantCanvas && tenantSigDrawn) {
      ctx.drawImage(tenantCanvas, 440, 780, 200, 100);
      ctx.fillStyle = '#718096';
      ctx.font = '12px sans-serif';
      ctx.fillText('承租人已親簽', 440, 895);
    }

    // 5. 底部品牌認證與證照字號
    ctx.fillStyle = '#C5A059';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ 依法特許包租代管專業業者', canvas.width / 2, 960);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px sans-serif';
    ctx.fillText('高市租登字第0012號 ｜ (112)登字第013739號 ｜ 統編：96797997', canvas.width / 2, 985);
    ctx.fillText('專線：0968-863-880 ｜ 高雄市小港區中安路825號', canvas.width / 2, 1010);

    // 下載圖片
    const link = document.createElement('a');
    link.download = `住宅租賃提前終止協議_${state.tenantName}_${state.terminationDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('🎉 提前終止協議圖卡已成功匯出！', 'success');
  }

  // 圓角矩形輔助
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 一鍵複製 LINE 協議摘要
  function copyLineSummary() {
    let reasonLabel = '雙方合意提前終止';
    if (state.terminationReason === 'tenant_statutory') reasonLabel = '承租人法定提前終止（免責無違約金）';
    if (state.terminationReason === 'landlord_statutory') reasonLabel = '出租人法定提前終止';
    if (state.terminationReason === 'notice_penalty') reasonLabel = '單方預告提前終止（約定補償金）';

    const text = `【港居不動產｜住宅租賃提前終止協議通知】
-----------------------------------
📄 協議編號：${state.serialNumber}
🏠 標的地址：${state.propertyAddress}
👤 出租人：${state.landlordName}
👤 承租人：${state.tenantName}
📅 正式終止交還日：${state.terminationDate} ${state.moveoutTime}
⚖️ 終止事由：${reasonLabel}
-----------------------------------
🔑 配件鑰匙歸還核對：
- 大門鑰匙 ${state.keysMain} 支、房間鑰匙 ${state.keysRoom} 支
- 門禁磁扣 ${state.tokensAccess} 顆、信箱鑰匙 ${state.keysMailbox} 支
- 遙控器：冷氣 ${state.remotesAC} 支、電視 ${state.remotesTV} 支
-----------------------------------
💰 押金結算明細：
- 原保證金總額：NT$ ${formatCurrency(state.totalDeposit)}
- 扣除費用（水電/雜費/扣抵）：NT$ ${formatCurrency(state.deductionTotal)}
- 應退還押金淨額：NT$ ${formatCurrency(state.refundNet)} 元整
  (${toChineseFinanceAmount(state.refundNet)})
- 退款方式：${state.refundMethod === 'cash' ? '現場現金結清' : ('匯入指定帳號 ' + state.bankName + ' ' + state.bankAccount)}
-----------------------------------
📌 雙方確認點交與退押完成後，原租賃關係債權債務全數消滅，互相拋棄其他民事請求權。
港居不動產開發有限公司 (高市租登字第0012號)
諮詢專線：0968-863-880`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 LINE 提前終止協議摘要已複製至剪貼簿！', 'success');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('📋 LINE 提前終止協議摘要已複製！', 'success');
    } catch (e) {
      showToast('複製失敗，請手動複製。', 'error');
    }
    document.body.removeChild(ta);
  }

  // 重置表單
  function resetAll() {
    if (confirm('確定要清空並重置為預設範本嗎？')) {
      localStorage.removeItem('ganju_lease_term_draft_v1');
      state = Object.assign({}, DEFAULT_DATA);
      state.serialNumber = 'GANJU-TRM-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01';
      state.agreementDate = new Date().toISOString().slice(0, 10);
      state.terminationDate = new Date().toISOString().slice(0, 10);
      applyStateToDOM();
      if (landlordCanvas && landlordCtx) clearCanvas(landlordCanvas, landlordCtx);
      if (tenantCanvas && tenantCtx) clearCanvas(tenantCanvas, tenantCtx);
      landlordSigDrawn = false;
      tenantSigDrawn = false;
      document.getElementById('landlordSigPlaceholder')?.style.setProperty('display', 'block');
      document.getElementById('tenantSigPlaceholder')?.style.setProperty('display', 'block');
      renderAll();
      showToast('已重置為標準協議書範本。', 'info');
    }
  }

  // LocalStorage 草稿保存與載入
  function saveDraft() {
    try {
      localStorage.setItem('ganju_lease_term_draft_v1', JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem('ganju_lease_term_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        state = Object.assign({}, DEFAULT_DATA, parsed);
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  function renderAll() {
    applyStateToDOM();
    calculateFinancials();
    renderPreview();
  }

  // 工具函式：千分位數字
  function formatCurrency(num) {
    if (isNaN(num)) return '0';
    return Math.round(num).toLocaleString('zh-TW');
  }

  // 工具函式：民國紀年轉換
  function toRocDate(dateStr) {
    if (!dateStr) return '年 月 日';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0]) - 1911;
    return `${year} 年 ${parseInt(parts[1])} 月 ${parseInt(parts[2])} 日`;
  }

  // 工具函式：繁體中文金融大寫金額轉換
  function toChineseFinanceAmount(amount) {
    amount = Math.round(Number(amount));
    if (isNaN(amount) || amount === 0) return '零元整';
    if (amount < 0) return '負' + toChineseFinanceAmount(Math.abs(amount));

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億', '兆'];

    let str = '';
    let numStr = String(amount);
    let len = numStr.length;
    let zeroCount = 0;

    for (let i = 0; i < len; i++) {
      let digit = parseInt(numStr[i]);
      let pos = len - 1 - i;
      let unit = pos % 4;
      let bigUnit = Math.floor(pos / 4);

      if (digit === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          str += '零';
          zeroCount = 0;
        }
        str += digits[digit] + units[unit];
      }

      if (unit === 0 && zeroCount < 4) {
        str += bigUnits[bigUnit];
        zeroCount = 0;
      }
    }

    return '新臺幣' + str + '元整';
  }

  // 工具函式：HTML 轉義
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toast 訊息提示
  function showToast(msg, type = 'info') {
    if (window.GanjuUtils && typeof window.GanjuUtils.showToast === 'function') {
      window.GanjuUtils.showToast(msg, type);
      return;
    }
    const t = dom.toast || document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => {
      t.className = 'toast';
    }, 3200);
  }

})();
