/**
 * 港居不動產 - 住宅租賃室內裝修與設備改裝同意暨回復原狀切結書產生器
 * File: js/renovation-consent-agreement.js
 * 依據《住宅租賃定型化契約應記載事項》第9點、《民法》第431/432條與《建築法》第77條之2設計
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- 狀態庫 (State Store) ---
  const state = {
    // 1. 退租處置模式與主租約關聯
    dispositionMode: 'restore_full', // restore_full (無條件回復原狀), retain_free (免拆無償留歸屋主), hybrid_choice (由出租人擇一決定)
    propertyAddress: '高雄市小港區中安路 825 號 8 樓 B 室',
    leaseCode: 'GJ-202611-RN01',
    leaseStart: '2026-11-01',
    leaseEnd: '2028-10-31',
    landlordName: '港居不動產開發有限公司（受託代管）',
    landlordPhone: '07-791-2288',
    tenantName: '王品叡',
    tenantId: 'E126543210',
    tenantPhone: '0933-888-777',

    // 2. 申請改裝類別、施工期間與細項說明
    renoScope: 'drilling_mount', // drilling_mount, paint_floor, appliance_plumbing, light_partition
    workStartDate: '2026-11-05',
    workEndDate: '2026-11-07',
    workHours: '週一至週五 09:00~12:00、13:30~17:30（例假日全面禁工）',
    contractorInfo: '特力屋居家安裝團隊（李師傅 0918-222-333）',
    renoItemsDesc: '1. 客廳電視主牆鑽孔安裝 65 吋壁掛架（膨脹螺絲 4 孔）。\n2. 主臥室窗框上方安裝雙軌遮光窗簾架。\n3. 廚房流理台下方增設 3M 廚下型生飲淨水器（利用既有鵝頸孔，不破壞檯面）。',
    restoreSpecDesc: '退租返還前拆除電視壁掛架與淨水器，牆面孔洞以雙批土填平打磨，並刷塗得利百合白乳膠漆（色號 1501）回復無色差平整原狀；原鵝頸龍頭裝回並測試無漏水。',
    beforePhotoUrl: '',

    // 3. 工程預算與復原保證金
    estimatedBudget: 18000,
    restorationDeposit: 5000,
    hoaDeposit: 10000,

    // 4. 裝修安全與法務守則
    rules: {
      noStructuralDamage: true,
      waiveBeneficialExpense: true,
      hoaPermitHours: true,
      fireElectricalSafety: true,
      drillHoleRestore: true,
      thirdPartyLiability: true,
      wasteRemoval: true
    },

    // 5. 雙方電子簽章
    signatures: {
      tenant: null,
      landlord: null
    }
  };

  // --- 繁體中文金額大寫轉換 ---
  function toChineseCurrency(num) {
    if (isNaN(num) || num === null || num === undefined) return '新臺幣 零元整';
    num = Math.round(Number(num));
    if (num === 0) return '新臺幣 零元整';
    if (num < 0) return '負' + toChineseCurrency(Math.abs(num));

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟', '萬', '拾', '佰', '仟', '億'];
    let str = '';
    let n = num;
    let unitIdx = 0;

    while (n > 0 && unitIdx < units.length) {
      const digit = n % 10;
      if (digit > 0) {
        str = digits[digit] + units[unitIdx] + str;
      } else if (str.length > 0 && !str.startsWith('零')) {
        str = '零' + str;
      }
      n = Math.floor(n / 10);
      unitIdx++;
    }

    str = str.replace(/零+/g, '零').replace(/零萬/g, '萬').replace(/零+$/, '');
    return '新臺幣 ' + str + '元整';
  }

  // --- 對照字典 ---
  const DISPOSITION_LABELS = {
    restore_full: '退租前無條件拆除並回復原狀（定型化契約第9點原則）',
    retain_free: '退租免拆・無償留歸出租人所有（拋棄民法第431條有益費用請求權）',
    hybrid_choice: '租期屆滿前 30 日由出租人書面指定保留或限期拆除復原'
  };

  const RENO_SCOPE_LABELS = {
    drilling_mount: '鑽孔壁掛與五金安裝（電視架/窗簾/層板）',
    paint_floor: '牆面粉刷跳色與卡扣式木地板鋪設',
    appliance_plumbing: '廚下淨水器/洗碗機/電子門鎖增設',
    light_partition: '室內輕裝修/系統櫃體/軌道燈具改裝'
  };

  // --- 初始化 Retina 2x 手寫簽名板 ---
  class RetinaSignaturePad {
    constructor(canvasId, clearBtnId, onEnd) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.clearBtn = document.getElementById(clearBtnId);
      this.onEnd = onEnd;
      this.isDrawing = false;
      this.savedData = null;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.bindEvents();
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : 260;
      const height = rect.height > 0 ? rect.height : 120;
      const ratio = window.devicePixelRatio || 2;
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(ratio, ratio);
      this.ctx.lineWidth = 2.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#1a365d';

      if (this.savedData) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = this.savedData;
      }
    }

    getPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    bindEvents() {
      const start = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      };

      const end = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        this.savedData = this.canvas.toDataURL('image/png');
        if (this.onEnd) this.onEnd(this.savedData);
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      this.canvas.addEventListener('touchend', end);

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clear());
      }
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width || 300, rect.height || 150);
      this.savedData = null;
      if (this.onEnd) this.onEnd(null);
    }
  }

  let padTenant = null;
  let padLandlord = null;

  function initSignaturePads() {
    padTenant = new RetinaSignaturePad('sigCanvasTenant', 'btnClearSigTenant', (dataUrl) => {
      state.signatures.tenant = dataUrl;
      renderPreview();
    });

    padLandlord = new RetinaSignaturePad('sigCanvasLandlord', 'btnClearSigLandlord', (dataUrl) => {
      state.signatures.landlord = dataUrl;
      renderPreview();
    });
  }

  // --- 同步表單輸入 ---
  function syncInputsFromState() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('inputPropertyAddress', state.propertyAddress);
    setVal('inputLeaseCode', state.leaseCode);
    setVal('inputLeaseStart', state.leaseStart);
    setVal('inputLeaseEnd', state.leaseEnd);
    setVal('inputLandlordName', state.landlordName);
    setVal('inputLandlordPhone', state.landlordPhone);
    setVal('inputTenantName', state.tenantName);
    setVal('inputTenantId', state.tenantId);
    setVal('inputTenantPhone', state.tenantPhone);

    setVal('inputWorkStartDate', state.workStartDate);
    setVal('inputWorkEndDate', state.workEndDate);
    setVal('inputWorkHours', state.workHours);
    setVal('inputContractorInfo', state.contractorInfo);
    setVal('textareaRenoItems', state.renoItemsDesc);
    setVal('textareaRestoreSpec', state.restoreSpecDesc);

    setVal('inputEstimatedBudget', state.estimatedBudget);
    setVal('inputRestorationDeposit', state.restorationDeposit);
    setVal('inputHoaDeposit', state.hoaDeposit);

    document.querySelectorAll('[data-disposition-mode]').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-disposition-mode') === state.dispositionMode);
    });

    document.querySelectorAll('[data-reno-scope]').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-reno-scope') === state.renoScope);
    });

    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };
    setChk('chkRuleNoStructural', state.rules.noStructuralDamage);
    setChk('chkRuleWaiveExpense', state.rules.waiveBeneficialExpense);
    setChk('chkRuleHoaHours', state.rules.hoaPermitHours);
    setChk('chkRuleFireSafety', state.rules.fireElectricalSafety);
    setChk('chkRuleDrillRestore', state.rules.drillHoleRestore);
    setChk('chkRuleThirdParty', state.rules.thirdPartyLiability);
    setChk('chkRuleWasteRemoval', state.rules.wasteRemoval);
  }

  // --- 渲染右側 A4 預覽與財務摘要 ---
  function renderPreview() {
    const budget = Number(state.estimatedBudget) || 0;
    const deposit = Number(state.restorationDeposit) || 0;
    const hoaDep = Number(state.hoaDeposit) || 0;

    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // 左側金額摘要
    setTxt('summaryBudget', `NT$ ${budget.toLocaleString()}（承租人全額自費）`);
    setTxt('summaryHoaDeposit', `NT$ ${hoaDep.toLocaleString()}`);
    setTxt('summaryRestoreDeposit', `NT$ ${deposit.toLocaleString()}`);
    setTxt('summaryRestoreDepositChinese', toChineseCurrency(deposit));

    // A4 公文渲染
    setTxt('docLeaseCode', state.leaseCode || 'GJ-202611-RN01');
    setTxt('docDispositionMode', DISPOSITION_LABELS[state.dispositionMode] || DISPOSITION_LABELS.restore_full);
    setTxt('docPropertyAddress', state.propertyAddress);
    setTxt('docLeasePeriod', `${state.leaseStart} 起至 ${state.leaseEnd} 止`);
    setTxt('docLandlordInfo', `${state.landlordName}（電話：${state.landlordPhone}）`);
    setTxt('docTenantInfo', `${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}）`);

    // 施工資訊表
    setTxt('docRenoScope', RENO_SCOPE_LABELS[state.renoScope] || RENO_SCOPE_LABELS.drilling_mount);
    setTxt('docWorkSchedule', `${state.workStartDate} 至 ${state.workEndDate} ｜ ${state.workHours}`);
    setTxt('docContractorInfo', state.contractorInfo || '承租人委託合格技師施工');
    setTxt('docRenoItems', state.renoItemsDesc);
    setTxt('docRestoreSpec', state.restoreSpecDesc);

    // 改裝前照片預覽
    const docImg = document.getElementById('docBeforePhotoImg');
    const docHint = document.getElementById('docBeforePhotoEmptyHint');
    if (docImg && docHint) {
      if (state.beforePhotoUrl) {
        docImg.src = state.beforePhotoUrl;
        docImg.style.display = 'block';
        docHint.style.display = 'none';
      } else {
        docImg.style.display = 'none';
        docHint.style.display = 'inline';
      }
    }

    // 費用與復原保證金
    setTxt(
      'docFinancialSummary',
      `改裝預算 NT$ ${budget.toLocaleString()} 元由承租人全額自理（拋棄民法第431條有益費用償還請求權）｜ 復原履約保證金：${toChineseCurrency(deposit)} (NT$ ${deposit.toLocaleString()}) ｜ 管委會施工保證金：NT$ ${hoaDep.toLocaleString()} 元`
    );

    // 守則顯示控制
    const toggleRule = (id, show) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? 'list-item' : 'none';
    };
    toggleRule('docRuleNoStructural', state.rules.noStructuralDamage);
    toggleRule('docRuleWaiveExpense', state.rules.waiveBeneficialExpense);
    toggleRule('docRuleHoaHours', state.rules.hoaPermitHours);
    toggleRule('docRuleFireSafety', state.rules.fireElectricalSafety);
    toggleRule('docRuleDrillRestore', state.rules.drillHoleRestore);
    toggleRule('docRuleThirdParty', state.rules.thirdPartyLiability);
    toggleRule('docRuleWasteRemoval', state.rules.wasteRemoval);

    // 簽章更新
    setTxt('docSigTenantName', state.tenantName);
    setTxt('docSigTenantId', state.tenantId);
    setTxt('docSigLandlordName', state.landlordName);

    const sigTImg = document.getElementById('docSigTenantImg');
    const sigTHint = document.getElementById('docSigTenantHint');
    if (sigTImg && sigTHint) {
      if (state.signatures.tenant) {
        sigTImg.src = state.signatures.tenant;
        sigTImg.style.display = 'block';
        sigTHint.style.display = 'none';
      } else {
        sigTImg.style.display = 'none';
        sigTHint.style.display = 'inline';
      }
    }

    const sigLImg = document.getElementById('docSigLandlordImg');
    const sigLHint = document.getElementById('docSigLandlordHint');
    if (sigLImg && sigLHint) {
      if (state.signatures.landlord) {
        sigLImg.src = state.signatures.landlord;
        sigLImg.style.display = 'block';
        sigLHint.style.display = 'none';
      } else {
        sigLImg.style.display = 'none';
        sigLHint.style.display = 'inline';
      }
    }
  }

  // --- 改裝前原況相片上傳並壓印防偽浮水印 ---
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const barH = Math.max(32, Math.round(canvas.height * 0.1));
        ctx.fillStyle = 'rgba(26, 54, 93, 0.82)';
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        ctx.fillStyle = '#f6e05e';
        const fontSize = Math.max(12, Math.round(barH * 0.44));
        ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
        const today = new Date().toISOString().slice(0, 10);
        const stampText = `港居不動產 改裝前屋況原況存證｜${today}｜單號:${state.leaseCode}`;
        ctx.fillText(stampText, 12, canvas.height - Math.round(barH * 0.3));

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        state.beforePhotoUrl = dataUrl;

        const previewEl = document.getElementById('renoPhotoPreview');
        const hintEl = document.getElementById('renoPhotoUploadHint');
        if (previewEl) {
          previewEl.src = dataUrl;
          previewEl.style.display = 'block';
        }
        if (hintEl) {
          hintEl.textContent = '✅ 已壓印改裝前屋況防偽時間存證浮水印（點擊可更換相片）';
        }
        renderPreview();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- 下載 HTML5 Canvas 840x1080px 高畫質裝修同意存證圖卡 ---
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const deposit = Number(state.restorationDeposit) || 0;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 840, 1080);

    const grad = ctx.createLinearGradient(0, 0, 840, 135);
    grad.addColorStop(0, '#1a365d');
    grad.addColorStop(1, '#2a4365');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 840, 135);

    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 135, 840, 6);

    ctx.fillStyle = '#f6e05e';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號', 40, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
    ctx.fillText('住宅租賃室內裝修與設備改裝同意暨回復原狀切結憑證', 40, 86);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`切結編號：${state.leaseCode} ｜ 施工期間：${state.workStartDate} ～ ${state.workEndDate}`, 40, 116);

    const drawBox = (x, y, w, h, title) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1a365d';
      ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
      ctx.fillText(title, x + 20, y + 32);

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 44);
      ctx.lineTo(x + w - 20, y + 44);
      ctx.stroke();
    };

    drawBox(36, 160, 768, 160, '🏠 租賃標的與立約當事人');
    ctx.fillStyle = '#1e293b';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`租賃地址：${state.propertyAddress}`, 56, 198);
    ctx.fillText(`處置模式：${DISPOSITION_LABELS[state.dispositionMode]}`, 56, 228);
    ctx.fillText(`出租/代管方：${state.landlordName}（電話：${state.landlordPhone}）`, 56, 258);
    ctx.fillText(`申請承租人：${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}）`, 56, 288);

    drawBox(36, 335, 768, 220, '🛠️ 核准改裝範圍與回復原狀標準');
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`改裝類型：${RENO_SCOPE_LABELS[state.renoScope]}`, 56, 376);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText(`施工廠商與時段：${state.contractorInfo} ｜ ${state.workHours}`, 56, 404);
    const descLine = (state.renoItemsDesc || '').replace(/\n+/g, ' ').slice(0, 48);
    ctx.fillText(`核准項目：${descLine}...`, 56, 434);
    ctx.fillStyle = '#b45309';
    const restLine = (state.restoreSpecDesc || '').replace(/\n+/g, ' ').slice(0, 48);
    ctx.fillText(`復原標準：${restLine}...`, 56, 464);
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`復原履約保證金：${toChineseCurrency(deposit)} (NT$ ${deposit.toLocaleString()})`, 56, 500);
    ctx.fillStyle = '#475569';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText(`工程預算 NT$ ${(Number(state.estimatedBudget) || 0).toLocaleString()} 元由承租人自理，拋棄民法第 431 條有益費用請求權`, 56, 530);

    drawBox(36, 570, 768, 220, '⚖️ 法定建築安全與回復原狀核心切結');
    ctx.fillStyle = '#334155';
    ctx.font = '14.5px "Noto Sans TC", sans-serif';
    ctx.fillText('• 結構安全（建築法第77條之2）：嚴禁破壞梁柱、承重牆、剪力牆、防水層及消防管線。', 56, 615);
    ctx.fillText('• 費用自理（民法第431條特約）：改裝費由承租人全額負擔，退租絕不請求償還或頂讓費。', 56, 645);
    ctx.fillText('• 牆面鑽孔復原：退租前應自行拆除附件、批土填平打磨並以原色號乳膠漆粉刷無色差復原。', 56, 675);
    ctx.fillText('• 鄰損與職災全責：施工期間若致漏水鄰損、電梯公設刮傷或人員傷亡，由承租人負完全責任。', 56, 705);
    ctx.fillText('• 施工廢棄物清運：工程廢料與包裝紙箱須由施工廠商當日清運離場，嚴禁棄置社區垃圾室。', 56, 735);
    ctx.fillText('• 代履行扣抵：逾期未回復原狀者，授權出租人逕行雇工拆除修復，費用自保證金及押金扣抵。', 56, 765);

    drawBox(36, 805, 768, 200, '✍️ 立約雙方電子手寫簽章確認');
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(56, 860, 340, 120);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(`申請承租人親簽：${state.tenantName}`, 66, 882);

    ctx.strokeRect(436, 860, 340, 120);
    ctx.fillText(`出租/代管方核准簽章：${state.landlordName}`, 446, 882);

    const finalizeDownload = () => {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產線上工具中心產製 ｜ 純前端本地零上傳加密運算 ｜ 服務專線：0968-863-880', 140, 1045);

      const link = document.createElement('a');
      link.download = `港居室內裝修改裝同意切結書_${state.leaseCode}_${state.tenantName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    const drawSig = (dataUrl, x, y, w, h, cb) => {
      if (!dataUrl) {
        cb();
        return;
      }
      const sImg = new Image();
      sImg.onload = () => {
        ctx.drawImage(sImg, x, y, w, h);
        cb();
      };
      sImg.onerror = () => cb();
      sImg.src = dataUrl;
    };

    drawSig(state.signatures.tenant, 70, 890, 260, 80, () => {
      drawSig(state.signatures.landlord, 450, 890, 260, 80, finalizeDownload);
    });
  }

  // --- 一鍵複製 LINE 格式化摘要 ---
  function copyLineSummary() {
    const deposit = Number(state.restorationDeposit) || 0;
    const text = [
      '🛠️【港居不動產｜住宅租賃室內裝修與設備改裝同意暨回復原狀切結摘要】',
      `📄 切結編號：${state.leaseCode}`,
      `🏠 租賃標的：${state.propertyAddress}`,
      `👤 申請承租人：${state.tenantName}（電話：${state.tenantPhone}）`,
      '------------------------',
      `📌 處置模式：${DISPOSITION_LABELS[state.dispositionMode]}`,
      `🔨 改裝類別：${RENO_SCOPE_LABELS[state.renoScope]}`,
      `📅 核准工期：${state.workStartDate} 至 ${state.workEndDate}（${state.workHours}）`,
      `👷 施工團隊：${state.contractorInfo}`,
      `📋 核准細項：\n${state.renoItemsDesc}`,
      `🔄 復原標準：${state.restoreSpecDesc}`,
      '------------------------',
      `💰 復原履約保證金：NT$ ${deposit.toLocaleString()} 元（${toChineseCurrency(deposit)}）`,
      '⚖️ 法務承諾：嚴禁破壞梁柱承重牆與防水層、改裝費全額自理並拋棄民法第431條有益費用償還請求權、退租前無色差補土復原。',
      '📞 港居不動產代管中心：0968-863-880（陳經理）'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLine');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> 已複製 LINE 裝修切結摘要！';
          setTimeout(() => { btn.innerHTML = orig; }, 2200);
        }
      });
    }
  }

  // --- 綁定表單互動事件 ---
  function bindFormEvents() {
    const bindInput = (id, key, isNum = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        renderPreview();
      });
      el.addEventListener('change', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        renderPreview();
      });
    };

    bindInput('inputPropertyAddress', 'propertyAddress');
    bindInput('inputLeaseCode', 'leaseCode');
    bindInput('inputLeaseStart', 'leaseStart');
    bindInput('inputLeaseEnd', 'leaseEnd');
    bindInput('inputLandlordName', 'landlordName');
    bindInput('inputLandlordPhone', 'landlordPhone');
    bindInput('inputTenantName', 'tenantName');
    bindInput('inputTenantId', 'tenantId');
    bindInput('inputTenantPhone', 'tenantPhone');

    bindInput('inputWorkStartDate', 'workStartDate');
    bindInput('inputWorkEndDate', 'workEndDate');
    bindInput('inputWorkHours', 'workHours');
    bindInput('inputContractorInfo', 'contractorInfo');
    bindInput('textareaRenoItems', 'renoItemsDesc');
    bindInput('textareaRestoreSpec', 'restoreSpecDesc');

    bindInput('inputEstimatedBudget', 'estimatedBudget', true);
    bindInput('inputRestorationDeposit', 'restorationDeposit', true);
    bindInput('inputHoaDeposit', 'hoaDeposit', true);

    document.querySelectorAll('[data-disposition-mode]').forEach((card) => {
      card.addEventListener('click', () => {
        state.dispositionMode = card.getAttribute('data-disposition-mode');
        syncInputsFromState();
        renderPreview();
      });
    });

    document.querySelectorAll('[data-reno-scope]').forEach((card) => {
      card.addEventListener('click', () => {
        state.renoScope = card.getAttribute('data-reno-scope');
        syncInputsFromState();
        renderPreview();
      });
    });

    const bindChk = (id, ruleKey) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        state.rules[ruleKey] = el.checked;
        renderPreview();
      });
    };
    bindChk('chkRuleNoStructural', 'noStructuralDamage');
    bindChk('chkRuleWaiveExpense', 'waiveBeneficialExpense');
    bindChk('chkRuleHoaHours', 'hoaPermitHours');
    bindChk('chkRuleFireSafety', 'fireElectricalSafety');
    bindChk('chkRuleDrillRestore', 'drillHoleRestore');
    bindChk('chkRuleThirdParty', 'thirdPartyLiability');
    bindChk('chkRuleWasteRemoval', 'wasteRemoval');

    // 相片上傳
    const uploadBox = document.getElementById('renoPhotoUploadBox');
    const fileInput = document.getElementById('inputRenoPhoto');
    if (uploadBox && fileInput) {
      uploadBox.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handlePhotoUpload(e.target.files[0]);
        }
      });
    }

    // 快速範本一：鑽孔壁掛與廚下淨水器（退租回復原狀）
    const btnSampleDrill = document.getElementById('btnSampleDrill');
    if (btnSampleDrill) {
      btnSampleDrill.addEventListener('click', () => {
        Object.assign(state, {
          dispositionMode: 'restore_full',
          propertyAddress: '高雄市小港區中安路 825 號 8 樓 B 室',
          leaseCode: 'GJ-202611-RN01',
          tenantName: '王品叡',
          tenantId: 'E126543210',
          tenantPhone: '0933-888-777',
          renoScope: 'drilling_mount',
          workStartDate: '2026-11-05',
          workEndDate: '2026-11-07',
          workHours: '週一至週五 09:00~12:00、13:30~17:30（例假日全面禁工）',
          contractorInfo: '特力屋居家安裝團隊（李師傅 0918-222-333）',
          renoItemsDesc: '1. 客廳電視主牆鑽孔安裝 65 吋壁掛架（膨脹螺絲 4 孔）。\n2. 主臥室窗框上方安裝雙軌遮光窗簾架。\n3. 廚房流理台下方增設 3M 廚下型生飲淨水器（利用既有鵝頸孔，不破壞檯面）。',
          restoreSpecDesc: '退租返還前拆除電視壁掛架與淨水器，牆面孔洞以雙批土填平打磨，並刷塗得利百合白乳膠漆（色號 1501）回復無色差平整原狀；原鵝頸龍頭裝回並測試無漏水。',
          estimatedBudget: 18000,
          restorationDeposit: 5000,
          hoaDeposit: 10000
        });
        syncInputsFromState();
        renderPreview();
      });
    }

    // 快速範本二：鋪設卡扣式木地板與牆面跳色（退租免拆無償留歸屋主）
    const btnSampleFloor = document.getElementById('btnSampleFloor');
    if (btnSampleFloor) {
      btnSampleFloor.addEventListener('click', () => {
        Object.assign(state, {
          dispositionMode: 'retain_free',
          propertyAddress: '高雄市左營區博愛二路 366 號 14 樓 A 室',
          leaseCode: 'GJ-202611-SPC02',
          tenantName: '許哲瑋',
          tenantId: 'E129012345',
          tenantPhone: '0972-168-999',
          renoScope: 'paint_floor',
          workStartDate: '2026-11-10',
          workEndDate: '2026-11-12',
          workHours: '週一至週五 09:00~17:00（使用靜音裁切機具）',
          contractorInfo: '富美家認證木地板工程行（陳班長 0922-555-888）',
          renoItemsDesc: '1. 客廳及主臥室全室直鋪 SPC 卡扣式石塑超耐磨隔音木地板（不上膠、不打釘、底部鋪設 2mm IXPE 靜音防潮墊，完全保護原拋光石英磚）。\n2. 客廳沙發背牆塗刷得利竹炭無毒乳膠漆（莫蘭迪奶茶灰）。',
          restoreSpecDesc: '雙方合意：退租時若 SPC 卡扣式木地板維持完好無破損，得免予拆除並無償留歸出租人所有（承租人拋棄民法第 431 條有益費用償還請求權）；若局部嚴重刮傷則由承租人拆除清運回復原磁磚地面。',
          estimatedBudget: 45000,
          restorationDeposit: 6000,
          hoaDeposit: 10000
        });
        syncInputsFromState();
        renderPreview();
      });
    }

    const btnResetForm = document.getElementById('btnResetForm');
    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        Object.assign(state, {
          tenantName: '',
          tenantId: '',
          tenantPhone: '',
          contractorInfo: '',
          renoItemsDesc: '',
          restoreSpecDesc: '',
          beforePhotoUrl: ''
        });
        if (padTenant) padTenant.clear();
        if (padLandlord) padLandlord.clear();
        syncInputsFromState();
        renderPreview();
      });
    }

    // 三大輸出按鈕
    const btnPrint = document.getElementById('btnPrintDoc');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    const btnCanvas = document.getElementById('btnDownloadCanvas');
    if (btnCanvas) {
      btnCanvas.addEventListener('click', downloadCanvasCard);
    }

    const btnLine = document.getElementById('btnCopyLine');
    if (btnLine) {
      btnLine.addEventListener('click', copyLineSummary);
    }
  }

  // --- 啟動初始化 ---
  initSignaturePads();
  syncInputsFromState();
  bindFormEvents();
  renderPreview();
});
