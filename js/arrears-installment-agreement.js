/**
 * 港居不動產 - 住宅租賃積欠租金分期清償與和解協議書產生器
 * File: js/arrears-installment-agreement.js
 * 依據《民法》第736條（和解）、第737條、第315條與租賃專法合規設計
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- 狀態庫 (State Store) ---
  const state = {
    // 1. 租賃契約與立約當事人
    propertyAddress: '高雄市小港區中安路 825 號 5 樓 A 室',
    leaseCode: 'GJ-202611-ST01',
    leaseStart: '2025-12-01',
    leaseEnd: '2026-11-30',
    landlordName: '港居不動產開發有限公司（受託代管）',
    landlordPhone: '07-791-2288',
    bankInfo: '高雄銀行（016）小港分行 帳號：218-102-888999 戶名：港居不動產開發有限公司',

    tenantName: '趙冠廷',
    tenantId: 'E127890123',
    tenantPhone: '0911-333-555',

    guarantorName: '趙振興',
    guarantorId: 'E101234567',
    guarantorPhone: '0922-666-888',

    // 2. 債權債務清算與結算
    rentArrears: 45000, // 積欠租金（3 個月）
    utilityArrears: 3800, // 代墊水電瓦斯公電
    managementFeeArrears: 2400, // 代墊管理費
    lateFeeWaiver: 3000, // 和解減免違約金/滯納金

    // 3. 分期排程設定
    installmentCount: 4,
    currentMonthlyRent: 15000,
    firstDueDate: '2026-11-15',
    installments: [],

    // 4. 和解安全與法務守則
    rules: {
      accelerationClause: true,
      immediateTermination: true,
      vacateClause: true,
      guarantorJointLiability: true,
      regularRentPayment: true,
      directExecution: true,
      cleanBreak: true
    },

    // 5. 雙方簽章
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

  // --- 債權計算 ---
  function calculateTotalDebt() {
    const gross = (Number(state.rentArrears) || 0) +
                  (Number(state.utilityArrears) || 0) +
                  (Number(state.managementFeeArrears) || 0);
    const waiver = Number(state.lateFeeWaiver) || 0;
    const netDebt = Math.max(0, gross - waiver);
    return { gross, waiver, netDebt };
  }

  // --- 自動生成分期排程 ---
  function generateInstallmentSchedule() {
    const { netDebt } = calculateTotalDebt();
    const count = Math.max(1, Math.min(12, Number(state.installmentCount) || 4));
    const baseAmount = Math.floor(netDebt / count);
    const remainder = netDebt - (baseAmount * count);

    const schedule = [];
    const startDate = new Date(state.firstDueDate || '2026-11-15');

    for (let i = 0; i < count; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      // 尾款補足餘額
      const instAmount = (i === count - 1) ? (baseAmount + remainder) : baseAmount;
      const rentAmount = Number(state.currentMonthlyRent) || 0;

      schedule.push({
        period: i + 1,
        dueDate: `${yyyy}-${mm}-${dd}`,
        instAmount: instAmount,
        rentAmount: rentAmount,
        totalDue: instAmount + rentAmount
      });
    }

    state.installments = schedule;
    renderInstallmentTable();
  }

  // --- 渲染編輯面板動態排程表格 ---
  function renderInstallmentTable() {
    const tbody = document.getElementById('installmentTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    state.installments.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; text-align: center;">第 ${item.period} 期</td>
        <td>
          <input type="date" value="${item.dueDate}" data-idx="${idx}" class="input-due-date" style="padding:8px 8px; font-size:13px; min-height:44px; box-sizing:border-box;">
        </td>
        <td>
          <input type="number" value="${item.instAmount}" data-idx="${idx}" class="input-inst-amount" style="padding:8px 8px; font-size:13px; min-height:44px; box-sizing:border-box;" min="0" step="500">
        </td>
        <td style="color:#64748b; font-size:12px;">+ NT$ ${item.rentAmount.toLocaleString()}</td>
        <td style="font-weight: 800; color:#1a365d; font-size:13px;">NT$ ${item.totalDue.toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });

    // 監聽排程即時微調
    tbody.querySelectorAll('.input-due-date').forEach(input => {
      input.addEventListener('change', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        if (state.installments[i]) {
          state.installments[i].dueDate = e.target.value;
          renderPreview();
        }
      });
    });

    tbody.querySelectorAll('.input-inst-amount').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        if (state.installments[i]) {
          const val = Number(e.target.value) || 0;
          state.installments[i].instAmount = val;
          state.installments[i].totalDue = val + state.installments[i].rentAmount;
          renderPreview();
        }
      });
    });
  }

  // --- 初始化手寫簽名板 ---
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
    setVal('inputBankInfo', state.bankInfo);

    setVal('inputTenantName', state.tenantName);
    setVal('inputTenantId', state.tenantId);
    setVal('inputTenantPhone', state.tenantPhone);

    setVal('inputGuarantorName', state.guarantorName);
    setVal('inputGuarantorId', state.guarantorId);
    setVal('inputGuarantorPhone', state.guarantorPhone);

    setVal('inputRentArrears', state.rentArrears);
    setVal('inputUtilityArrears', state.utilityArrears);
    setVal('inputManagementFeeArrears', state.managementFeeArrears);
    setVal('inputLateFeeWaiver', state.lateFeeWaiver);

    setVal('inputInstallmentCount', state.installmentCount);
    setVal('inputCurrentMonthlyRent', state.currentMonthlyRent);
    setVal('inputFirstDueDate', state.firstDueDate);

    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };
    setChk('chkRuleAcceleration', state.rules.accelerationClause);
    setChk('chkRuleImmediateTermination', state.rules.immediateTermination);
    setChk('chkRuleVacate', state.rules.vacateClause);
    setChk('chkRuleGuarantor', state.rules.guarantorJointLiability);
    setChk('chkRuleRegularRent', state.rules.regularRentPayment);
    setChk('chkRuleExecution', state.rules.directExecution);
    setChk('chkRuleCleanBreak', state.rules.cleanBreak);
  }

  // --- 渲染右側 A4 預覽與左側財務卡片 ---
  function renderPreview() {
    const { gross, waiver, netDebt } = calculateTotalDebt();

    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // 左側金額摘要更新
    setTxt('summaryGrossDebt', `NT$ ${gross.toLocaleString()}`);
    setTxt('summaryWaiver', `- NT$ ${waiver.toLocaleString()}`);
    setTxt('summaryNetDebt', `NT$ ${netDebt.toLocaleString()}`);
    setTxt('summaryNetDebtChinese', toChineseCurrency(netDebt));

    // A4 公文欄位更新
    setTxt('docLeaseCode', state.leaseCode || 'GJ-202611-ST01');
    setTxt('docPropertyAddress', state.propertyAddress);
    setTxt('docLeasePeriod', `${state.leaseStart} 起至 ${state.leaseEnd} 止`);
    setTxt('docLandlordInfo', `${state.landlordName}（電話：${state.landlordPhone}）`);
    setTxt('docTenantInfo', `${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}）`);
    setTxt('docGuarantorInfo', state.guarantorName ? `${state.guarantorName}（身分證：${state.guarantorId}｜電話：${state.guarantorPhone}）` : '無連帶保證人');
    setTxt('docBankInfo', state.bankInfo);

    // 債權明細與和解總金額
    setTxt('docRentArrears', `NT$ ${(Number(state.rentArrears) || 0).toLocaleString()} 元`);
    setTxt('docUtilityArrears', `NT$ ${(Number(state.utilityArrears) || 0).toLocaleString()} 元`);
    setTxt('docManagementArrears', `NT$ ${(Number(state.managementFeeArrears) || 0).toLocaleString()} 元`);
    setTxt('docLateFeeWaiver', waiver > 0 ? `減免 NT$ ${waiver.toLocaleString()} 元（和解讓步）` : '無減免');
    setTxt('docNetDebtTotal', `${toChineseCurrency(netDebt)} (NT$ ${netDebt.toLocaleString()})`);

    // A4 分期清償時程表
    const previewTbody = document.getElementById('docInstallmentScheduleBody');
    if (previewTbody) {
      previewTbody.innerHTML = '';
      state.installments.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; text-align: center;">第 ${item.period} 期</td>
          <td style="text-align: center;">${item.dueDate} 前</td>
          <td>NT$ ${item.instAmount.toLocaleString()}</td>
          <td>NT$ ${item.rentAmount.toLocaleString()}</td>
          <td style="font-weight: 800; color:#1a365d;">NT$ ${item.totalDue.toLocaleString()}</td>
        `;
        previewTbody.appendChild(tr);
      });
    }

    // 守則顯示控制
    const toggleRule = (id, show) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? 'list-item' : 'none';
    };
    toggleRule('docRuleAcceleration', state.rules.accelerationClause);
    toggleRule('docRuleImmediateTermination', state.rules.immediateTermination);
    toggleRule('docRuleVacate', state.rules.vacateClause);
    toggleRule('docRuleGuarantor', state.rules.guarantorJointLiability);
    toggleRule('docRuleRegularRent', state.rules.regularRentPayment);
    toggleRule('docRuleExecution', state.rules.directExecution);
    toggleRule('docRuleCleanBreak', state.rules.cleanBreak);

    // 簽章更新
    setTxt('docSigTenantName', state.tenantName);
    setTxt('docSigTenantId', state.tenantId);
    setTxt('docSigGuarantorName', state.guarantorName || '—');
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

  // --- 下載 HTML5 Canvas 840x1080px 高畫質和解存證圖卡 ---
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const { netDebt } = calculateTotalDebt();

    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍橫幅
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
    ctx.fillText('住宅租賃積欠租金分期清償與和解協議憑證', 40, 86);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`協議編號：${state.leaseCode} ｜ 租賃標的：${state.propertyAddress}`, 40, 116);

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

    // 區塊一：當事人與和解總金額
    drawBox(36, 160, 768, 165, '⚖️ 立約當事人與債務和解確認');
    ctx.fillStyle = '#1e293b';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`出租人/代管方：${state.landlordName}（服務電話：${state.landlordPhone}）`, 56, 200);
    ctx.fillText(`承租人兼債務人：${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}）`, 56, 230);
    ctx.fillText(`連帶保證人：${state.guarantorName || '無'}（身分證：${state.guarantorId || '—'}｜電話：${state.guarantorPhone || '—'}）`, 56, 260);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
    ctx.fillText(`結算確認和解總額：${toChineseCurrency(netDebt)} (NT$ ${netDebt.toLocaleString()})`, 56, 294);

    // 區塊二：分期清償排程明細
    drawBox(36, 340, 768, 220, '📅 分期清償排程與繳款期限');
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText(`專用受款帳戶：${state.bankInfo}`, 56, 376);

    // 繪製前 4 期排程摘要
    let py = 406;
    state.installments.slice(0, 4).forEach(item => {
      ctx.fillStyle = '#334155';
      ctx.font = '14px "Noto Sans TC", sans-serif';
      ctx.fillText(`• 第 ${item.period} 期（${item.dueDate} 前）：分期款 NT$ ${item.instAmount.toLocaleString()} ＋ 當月租金 NT$ ${item.rentAmount.toLocaleString()} ＝ 應繳 NT$ ${item.totalDue.toLocaleString()}`, 56, py);
      py += 26;
    });

    if (state.installments.length > 4) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(`...其餘 ${state.installments.length - 4} 期請參照正式 A4 協議書附表。`, 56, py);
    }

    // 區塊三：法務承諾與嚴厲條款
    drawBox(36, 575, 768, 215, '🚨 期限利益喪失與強制執行承諾');
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('• 期限利益喪失（民法第315條）：任一期遲延逾3日，全部未到期期數視為立即全部到期！', 56, 615);
    ctx.fillStyle = '#334155';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('• 立即終止租約：發生期限利益喪失時，出租人得不經催告立即終止租約，承租人無異議。', 56, 645);
    ctx.fillText('• 無條件遷讓交還：租約終止後3日內承租人同意無條件騰空交還房屋，自願接受強制執行。', 56, 675);
    ctx.fillText('• 連帶保證責任：連帶保證人自願拋棄先訴抗辯權（民法第745條），負全部連帶清償責任。', 56, 705);
    ctx.fillText('• 如期清償消滅：承租人若全數如期依約履行完畢，出租人同意免除其餘遲延利息與罰款。', 56, 735);
    ctx.fillText('• 正式契約效力：本和解協議依民法第737條具創設與消滅效力，雙方均受其拘束。', 56, 765);

    // 區塊四：簽章區
    drawBox(36, 805, 768, 200, '✍️ 立約雙方電子手寫簽章確認');
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(56, 860, 340, 120);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(`承租人兼債務人親簽：${state.tenantName}`, 66, 882);

    ctx.strokeRect(436, 860, 340, 120);
    ctx.fillText(`出租人/代管方簽署：${state.landlordName}`, 446, 882);

    const finalizeDownload = () => {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產線上工具中心產製 ｜ 純前端本地零上傳加密運算 ｜ 服務專線：0968-863-880', 140, 1045);

      const link = document.createElement('a');
      link.download = `港居欠租分期清償和解協議書_${state.leaseCode}_${state.tenantName}.png`;
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
    const { netDebt } = calculateTotalDebt();
    const lines = [
      '⚖️【港居不動產｜住宅租賃積欠租金分期清償與和解協議摘要】',
      `📄 協議編號：${state.leaseCode}`,
      `🏠 租賃標的：${state.propertyAddress}`,
      `👤 承租人：${state.tenantName}（電話：${state.tenantPhone}）`,
      `🛡️ 連帶保證人：${state.guarantorName || '無'}（電話：${state.guarantorPhone || '—'}）`,
      '------------------------',
      `💰 結算和解總額：${toChineseCurrency(netDebt)} (NT$ ${netDebt.toLocaleString()})`,
      `📅 分期期數：共 ${state.installmentCount} 期（每月與正常租金合併繳納）`,
      `🏦 受款帳戶：${state.bankInfo}`,
      '------------------------',
      '📋 前三期還款時程：'
    ];

    state.installments.slice(0, 3).forEach(item => {
      lines.push(`• 第 ${item.period} 期（${item.dueDate} 前）：分期 NT$ ${item.instAmount.toLocaleString()} ＋ 租金 NT$ ${item.rentAmount.toLocaleString()} ＝ 應繳 NT$ ${item.totalDue.toLocaleString()}`);
    });

    lines.push('------------------------');
    lines.push('🚨 重要提醒：本協議含「期限利益喪失條款」，任一期逾期未繳全部債務立即到期並終止租約騰空遷讓。');
    lines.push('📞 港居不動產代管中心：0968-863-880（陳經理）');

    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLine');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> 已複製 LINE 和解分期摘要！';
          setTimeout(() => { btn.innerHTML = orig; }, 2200);
        }
      });
    }
  }

  // --- 綁定表單互動事件 ---
  function bindFormEvents() {
    const bindInput = (id, key, isNum = false, onChangeCb = null) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        if (onChangeCb) onChangeCb();
        renderPreview();
      });
      el.addEventListener('change', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        if (onChangeCb) onChangeCb();
        renderPreview();
      });
    };

    bindInput('inputPropertyAddress', 'propertyAddress');
    bindInput('inputLeaseCode', 'leaseCode');
    bindInput('inputLeaseStart', 'leaseStart');
    bindInput('inputLeaseEnd', 'leaseEnd');
    bindInput('inputLandlordName', 'landlordName');
    bindInput('inputLandlordPhone', 'landlordPhone');
    bindInput('inputBankInfo', 'bankInfo');

    bindInput('inputTenantName', 'tenantName');
    bindInput('inputTenantId', 'tenantId');
    bindInput('inputTenantPhone', 'tenantPhone');

    bindInput('inputGuarantorName', 'guarantorName');
    bindInput('inputGuarantorId', 'guarantorId');
    bindInput('inputGuarantorPhone', 'guarantorPhone');

    bindInput('inputRentArrears', 'rentArrears', true, generateInstallmentSchedule);
    bindInput('inputUtilityArrears', 'utilityArrears', true, generateInstallmentSchedule);
    bindInput('inputManagementFeeArrears', 'managementFeeArrears', true, generateInstallmentSchedule);
    bindInput('inputLateFeeWaiver', 'lateFeeWaiver', true, generateInstallmentSchedule);

    bindInput('inputInstallmentCount', 'installmentCount', true, generateInstallmentSchedule);
    bindInput('inputCurrentMonthlyRent', 'currentMonthlyRent', true, generateInstallmentSchedule);
    bindInput('inputFirstDueDate', 'firstDueDate', false, generateInstallmentSchedule);

    const bindChk = (id, ruleKey) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        state.rules[ruleKey] = el.checked;
        renderPreview();
      });
    };
    bindChk('chkRuleAcceleration', 'accelerationClause');
    bindChk('chkRuleImmediateTermination', 'immediateTermination');
    bindChk('chkRuleVacate', 'vacateClause');
    bindChk('chkRuleGuarantor', 'guarantorJointLiability');
    bindChk('chkRuleRegularRent', 'regularRentPayment');
    bindChk('chkRuleExecution', 'directExecution');
    bindChk('chkRuleCleanBreak', 'cleanBreak');

    // 快速範本一：積欠 3 個月租金分 4 期和解
    const btnSample3Months = document.getElementById('btnSample3Months');
    if (btnSample3Months) {
      btnSample3Months.addEventListener('click', () => {
        Object.assign(state, {
          propertyAddress: '高雄市小港區中安路 825 號 5 樓 A 室',
          leaseCode: 'GJ-202611-ST01',
          tenantName: '趙冠廷',
          tenantId: 'E127890123',
          tenantPhone: '0911-333-555',
          guarantorName: '趙振興',
          guarantorId: 'E101234567',
          guarantorPhone: '0922-666-888',
          rentArrears: 45000,
          utilityArrears: 3800,
          managementFeeArrears: 2400,
          lateFeeWaiver: 3000,
          installmentCount: 4,
          currentMonthlyRent: 15000,
          firstDueDate: '2026-11-15'
        });
        syncInputsFromState();
        generateInstallmentSchedule();
        renderPreview();
      });
    }

    // 快速範本二：小額欠租分 2 期和解
    const btnSampleSmall = document.getElementById('btnSampleSmall');
    if (btnSampleSmall) {
      btnSampleSmall.addEventListener('click', () => {
        Object.assign(state, {
          propertyAddress: '高雄市前鎮區中華五路 988 號 12 樓 C 室',
          leaseCode: 'GJ-202611-ST02',
          tenantName: '林奕帆',
          tenantId: 'E128456789',
          tenantPhone: '0935-777-999',
          guarantorName: '',
          guarantorId: '',
          guarantorPhone: '',
          rentArrears: 18000,
          utilityArrears: 1200,
          managementFeeArrears: 0,
          lateFeeWaiver: 1200,
          installmentCount: 2,
          currentMonthlyRent: 18000,
          firstDueDate: '2026-11-10'
        });
        syncInputsFromState();
        generateInstallmentSchedule();
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
          guarantorName: '',
          guarantorId: '',
          guarantorPhone: '',
          rentArrears: 0,
          utilityArrears: 0,
          managementFeeArrears: 0,
          lateFeeWaiver: 0
        });
        if (padTenant) padTenant.clear();
        if (padLandlord) padLandlord.clear();
        syncInputsFromState();
        generateInstallmentSchedule();
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
  generateInstallmentSchedule();
  renderPreview();
});
