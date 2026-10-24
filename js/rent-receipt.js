/**
 * 港居不動產開發有限公司 - 租金電子收據與屋主代管月結對帳單產生器 (js/rent-receipt.js)
 * 支援：
 *  1. 雙模式切換：「🧾 租客繳租電子收據」與「📊 屋主代管月結匯款對帳單」
 *  2. 繁體中文金融大寫金額自動轉換（壹、貳、參、肆、伍、陸、柒、捌、玖、拾、佰、仟、萬、億）
 *  3. 跨工具一鍵匯入：從「水電與公電分攤單 (utility-splitter.html)」匯入水電費、從「屋況修繕點交單 (repair-inspection.html)」匯入房東負擔修繕費
 *  4. 雙畫布 Retina 2x 電子手寫簽章與模擬「港居不動產・代管財務收訖章」
 *  5. 一鍵複製 LINE 通知文字、下載 840x1080 高畫質 PNG 電子憑證圖卡、A4 標準列印
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_rent_receipt_v1';
const UTILITY_STORAGE_KEY = 'ganju_utility_splitter_v1';
const REPAIR_STORAGE_KEY = 'ganju_repair_inspection_draft_v1';

// 預設三組快速範例
const PRESETS = {
  suiteReceipt: {
    mode: 'tenant',
    docNo: 'GJ-RCP-20261025-001',
    issueDate: '2026-10-25',
    propertyName: '小港中安路電梯陽光套房 302 室',
    tenantName: '林冠宇 先生',
    landlordName: '港居不動產開發有限公司（代管專戶）',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    nextDueDate: '2026-12-01',
    paymentMethod: '匯款轉帳',
    accountLast5: '66812',
    rentAmount: 9500,
    mgmtFee: 500,
    utilityFee: 860,
    parkingFee: 0,
    discountAmount: 0,
    serviceFeeRate: 10,
    repairDeduction: 0,
    otherDeduction: 0,
    note: '本期租金及 10 月份水電分攤費已全數核對收訖，感謝準時繳納！',
    showStamp: true,
    customItems: []
  },
  familyReceipt: {
    mode: 'tenant',
    docNo: 'GJ-RCP-20261025-002',
    issueDate: '2026-10-25',
    propertyName: '鳳山文山特區景觀三房平車 8F-A',
    tenantName: '陳雅婷 小姐',
    landlordName: '港居不動產開發有限公司（包租專案）',
    periodStart: '2026-11-01',
    periodEnd: '2026-11-30',
    nextDueDate: '2026-12-01',
    paymentMethod: '租金補貼＋匯款',
    accountLast5: '30945',
    rentAmount: 24500,
    mgmtFee: 2200,
    utilityFee: 0,
    parkingFee: 2500,
    discountAmount: 500,
    serviceFeeRate: 10,
    repairDeduction: 0,
    otherDeduction: 0,
    note: '含平面車位 B2-18 清潔費及大樓管理費，年繳準時優惠折讓 500 元。',
    showStamp: true,
    customItems: []
  },
  landlordStatement: {
    mode: 'landlord',
    docNo: 'GJ-STM-202610-088',
    issueDate: '2026-10-25',
    propertyName: '前鎮三多商圈溫馨兩房 6F-2',
    tenantName: '張家豪 先生（現住租客）',
    landlordName: '王志明 屋主先生',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    nextDueDate: '2026-11-05',
    paymentMethod: '月結匯款撥付',
    accountLast5: '88219（台灣銀行）',
    rentAmount: 21000,
    mgmtFee: 0,
    utilityFee: 0,
    parkingFee: 1500,
    discountAmount: 0,
    serviceFeeRate: 10,
    repairDeduction: 1200,
    otherDeduction: 0,
    note: '本期代收租金 21,000 元＋車位 1,500 元，扣除 10% 代管服務費 2,250 元及 10/14 浴室給水軟管換新代墊費 1,200 元，實匯淨額已撥入屋主指定帳戶。',
    showStamp: true,
    customItems: []
  }
};

// 狀態管理
let state = structuredClone(PRESETS.suiteReceipt);
let issuerSigDataUrl = '';
let counterpartySigDataUrl = '';

// 數字轉繁體中文大寫金額
export function toChineseCurrency(num) {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return '零元整';

  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '萬', '億', '兆'];

  let str = String(n);
  let result = '';
  let zeroFlag = false;
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const d = Number(str[i]);
    const pos = len - 1 - i;
    const unitIdx = pos % 4;
    const bigUnitIdx = Math.floor(pos / 4);

    if (d === 0) {
      zeroFlag = true;
    } else {
      if (zeroFlag) {
        result += '零';
        zeroFlag = false;
      }
      result += digits[d] + units[unitIdx];
    }

    if (unitIdx === 0 && bigUnitIdx > 0) {
      const groupStart = Math.max(0, len - (bigUnitIdx + 1) * 4);
      const groupEnd = len - bigUnitIdx * 4;
      const groupVal = Number(str.slice(groupStart, groupEnd));
      if (groupVal > 0) {
        result += bigUnits[bigUnitIdx];
      }
      zeroFlag = false;
    }
  }

  return `${num < 0 ? '負' : ''}${result}元整`;
}

function formatMoney(num) {
  const n = Math.round(Number(num) || 0);
  return n.toLocaleString('zh-TW');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 計算應收、應扣與最終金額
function calculateTotals() {
  const rent = Number(state.rentAmount) || 0;
  const mgmt = Number(state.mgmtFee) || 0;
  const utility = Number(state.utilityFee) || 0;
  const parking = Number(state.parkingFee) || 0;
  const discount = Number(state.discountAmount) || 0;

  let customAdd = 0;
  let customDeduct = 0;
  (state.customItems || []).forEach((item) => {
    const amt = Math.max(0, Number(item.amount) || 0);
    if (item.type === 'deduct') {
      customDeduct += amt;
    } else {
      customAdd += amt;
    }
  });

  if (state.mode === 'tenant') {
    const grossTotal = rent + mgmt + utility + parking + customAdd;
    const totalDeduction = discount + customDeduct;
    const finalAmount = Math.max(0, grossTotal - totalDeduction);
    return {
      grossTotal,
      serviceFeeAmount: 0,
      totalDeduction,
      finalAmount,
      chineseAmount: toChineseCurrency(finalAmount)
    };
  } else {
    // 屋主代管月結對帳單模式
    const grossTotal = rent + mgmt + utility + parking + customAdd;
    const rate = Math.max(0, Number(state.serviceFeeRate) || 0);
    const serviceFeeAmount = Math.round((rent + parking) * (rate / 100));
    const repair = Number(state.repairDeduction) || 0;
    const otherDed = Number(state.otherDeduction) || 0;
    const totalDeduction = serviceFeeAmount + repair + otherDed + discount + customDeduct;
    const finalAmount = grossTotal - totalDeduction;
    return {
      grossTotal,
      serviceFeeAmount,
      totalDeduction,
      finalAmount,
      chineseAmount: toChineseCurrency(finalAmount)
    };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // 忽略儲存限制
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      state = {
        ...structuredClone(PRESETS.suiteReceipt),
        ...parsed,
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems : []
      };
    }
  } catch (e) {
    // 忽略損壞快取
  }
}

// 同步表單輸入值與模式顯示
function syncFormFromState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  setVal('docNoInput', state.docNo);
  setVal('issueDateInput', state.issueDate);
  setVal('propertyNameInput', state.propertyName);
  setVal('tenantNameInput', state.tenantName);
  setVal('landlordNameInput', state.landlordName);
  setVal('periodStartInput', state.periodStart);
  setVal('periodEndInput', state.periodEnd);
  setVal('nextDueDateInput', state.nextDueDate);
  setVal('paymentMethodSelect', state.paymentMethod);
  setVal('accountLast5Input', state.accountLast5);
  setVal('rentAmountInput', state.rentAmount);
  setVal('mgmtFeeInput', state.mgmtFee);
  setVal('utilityFeeInput', state.utilityFee);
  setVal('parkingFeeInput', state.parkingFee);
  setVal('discountAmountInput', state.discountAmount);
  setVal('serviceFeeRateInput', state.serviceFeeRate);
  setVal('repairDeductionInput', state.repairDeduction);
  setVal('otherDeductionInput', state.otherDeduction);
  setVal('noteInput', state.note);

  const stampCheck = document.getElementById('showStampCheckbox');
  if (stampCheck) stampCheck.checked = Boolean(state.showStamp);

  // 模式按鈕點亮
  document.querySelectorAll('.mode-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
  });

  // 屋主模式專屬欄位顯隱
  const landlordOnlySection = document.getElementById('landlordDeductionSection');
  if (landlordOnlySection) {
    landlordOnlySection.style.display = state.mode === 'landlord' ? 'block' : 'none';
  }

  // 動態切換欄位標籤文案
  const nextDueLabel = document.getElementById('nextDueDateLabel');
  if (nextDueLabel) {
    nextDueLabel.textContent = state.mode === 'tenant' ? '下期應繳日期' : '預計匯款撥付日';
  }

  // 代管費率按鈕點亮
  document.querySelectorAll('.rate-chip').forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.rate) === Number(state.serviceFeeRate));
  });

  renderCustomItemsList();
  renderVoucherPreview();
}

function renderCustomItemsList() {
  const container = document.getElementById('customItemsList');
  if (!container) return;

  if (!state.customItems || state.customItems.length === 0) {
    container.innerHTML = `<p style="font-size:0.82rem;color:var(--text-muted);margin:4px 0;">目前無額外自訂項目，可點擊上方「＋ 新增明細項目」自由補充。</p>`;
    return;
  }

  container.innerHTML = state.customItems
    .map(
      (item, idx) => `
      <div class="custom-item-row" data-idx="${idx}">
        <select class="form-control custom-item-type" data-idx="${idx}" aria-label="項目加減類型">
          <option value="add" ${item.type === 'add' ? 'selected' : ''}>＋ 加收項目</option>
          <option value="deduct" ${item.type === 'deduct' ? 'selected' : ''}>－ 扣減項目</option>
        </select>
        <input type="text" class="form-control item-name-input custom-item-title" data-idx="${idx}" value="${escapeHtml(item.title)}" placeholder="請輸入項目名稱（如：遙控器押金、清潔折讓）" aria-label="自訂項目名稱">
        <input type="number" class="form-control custom-item-amount" data-idx="${idx}" value="${Number(item.amount) || 0}" min="0" step="100" aria-label="自訂項目金額">
        <button type="button" class="remove-item-btn" data-remove-idx="${idx}" aria-label="刪除此項目" title="刪除此項目">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `
    )
    .join('');
}

// 渲染右側正式憑證預覽
function renderVoucherPreview() {
  const totals = calculateTotals();
  const isTenantMode = state.mode === 'tenant';

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText(
    'bannerModeTag',
    isTenantMode ? '🧾 租客繳租電子收據 (Tenant Receipt)' : '📊 屋主代管月結對帳單 (Landlord Statement)'
  );
  setText('bannerDocNo', `單號：${state.docNo || 'GJ-RCP-2026'}`);
  setText('bannerMainLabel', isTenantMode ? '本期實收總金額 (NT$)' : '本期實匯屋主淨額 (NT$)');
  setText('bannerMainAmount', `NT$ ${formatMoney(totals.finalAmount)}`);
  setText('bannerChineseAmount', `新台幣 ${totals.chineseAmount}`);

  // 憑證紙張標題
  setText('paperTitle', isTenantMode ? '房屋租金暨費用繳納正式收據' : '包租代管屋主月結匯款對帳單');
  setText('paperDocNo', state.docNo || '-');
  setText('paperIssueDate', state.issueDate || '-');
  setText('paperProperty', state.propertyName || '-');
  setText('paperTenantLabel', isTenantMode ? '繳款租客姓名' : '承租房客姓名');
  setText('paperTenant', state.tenantName || '-');
  setText('paperLandlordLabel', isTenantMode ? '收款方／管理單位' : '受款屋主姓名');
  setText('paperLandlord', state.landlordName || '-');
  setText('paperPeriod', `${state.periodStart || '-'} ～ ${state.periodEnd || '-'}`);
  setText('paperPaymentMethod', `${state.paymentMethod || '-'}（末五碼：${state.accountLast5 || '-'}）`);
  setText('paperNextDueLabel', isTenantMode ? '下期應繳日期' : '預計撥款日期');
  setText('paperNextDue', state.nextDueDate || '-');

  // 建立明細表格列
  const rows = [];
  const rent = Number(state.rentAmount) || 0;
  const mgmt = Number(state.mgmtFee) || 0;
  const utility = Number(state.utilityFee) || 0;
  const parking = Number(state.parkingFee) || 0;
  const discount = Number(state.discountAmount) || 0;

  if (rent > 0) {
    rows.push({
      title: isTenantMode ? '本期房屋租金' : '代收本期房屋租金',
      desc: `${state.periodStart || ''} 至 ${state.periodEnd || ''}`,
      amount: `NT$ ${formatMoney(rent)}`,
      isDeduct: false
    });
  }
  if (mgmt > 0) {
    rows.push({
      title: '社區管理費／清潔維護費',
      desc: '依租約約定按月計收',
      amount: `NT$ ${formatMoney(mgmt)}`,
      isDeduct: false
    });
  }
  if (utility > 0) {
    rows.push({
      title: '水電瓦斯／公電分攤費',
      desc: '依實際分表度數與帳單結算',
      amount: `NT$ ${formatMoney(utility)}`,
      isDeduct: false
    });
  }
  if (parking > 0) {
    rows.push({
      title: '附屬車位租金／其他固定加項',
      desc: '附屬設施費用',
      amount: `NT$ ${formatMoney(parking)}`,
      isDeduct: false
    });
  }

  if (!isTenantMode) {
    // 屋主對帳單：顯示代管服務費與代墊修繕扣款
    if (totals.serviceFeeAmount > 0) {
      rows.push({
        title: `代管服務費 (${state.serviceFeeRate}%)`,
        desc: '港居專業租務管理與催收服務費',
        amount: `- NT$ ${formatMoney(totals.serviceFeeAmount)}`,
        isDeduct: true
      });
    }
    const repair = Number(state.repairDeduction) || 0;
    if (repair > 0) {
      rows.push({
        title: '本期代墊屋況修繕與耗材費',
        desc: '依租賃專法第11條屋主修繕責任代墊扣抵',
        amount: `- NT$ ${formatMoney(repair)}`,
        isDeduct: true
      });
    }
    const otherDed = Number(state.otherDeduction) || 0;
    if (otherDed > 0) {
      rows.push({
        title: '其他代繳費用／扣抵項目',
        desc: '代繳規費或雜支扣抵',
        amount: `- NT$ ${formatMoney(otherDed)}`,
        isDeduct: true
      });
    }
  }

  if (discount > 0) {
    rows.push({
      title: isTenantMode ? '本期租金折讓／代墊扣抵' : '房客租金折讓減項',
      desc: '雙方合意折抵金額',
      amount: `- NT$ ${formatMoney(discount)}`,
      isDeduct: true
    });
  }

  (state.customItems || []).forEach((item) => {
    const amt = Math.max(0, Number(item.amount) || 0);
    if (amt <= 0 && !item.title) return;
    const isDed = item.type === 'deduct';
    rows.push({
      title: item.title || (isDed ? '自訂扣減項目' : '自訂加收項目'),
      desc: isDed ? '扣減項目' : '加收項目',
      amount: `${isDed ? '- ' : ''}NT$ ${formatMoney(amt)}`,
      isDeduct: isDed
    });
  });

  const tbody = document.getElementById('voucherTableBody');
  if (tbody) {
    const rowsHtml = rows
      .map(
        (r) => `
        <tr class="${r.isDeduct ? 'deduct-row' : ''}">
          <td><strong>${escapeHtml(r.title)}</strong></td>
          <td>${escapeHtml(r.desc)}</td>
          <td class="amount-col">${escapeHtml(r.amount)}</td>
        </tr>
      `
      )
      .join('');

    const totalTitle = isTenantMode ? '本期實收總金額 (大寫：' : '本期實匯屋主淨額 (大寫：';
    tbody.innerHTML = `
      ${rowsHtml}
      <tr class="total-row">
        <td colspan="2">${totalTitle}${escapeHtml(totals.chineseAmount)}）</td>
        <td class="amount-col">NT$ ${formatMoney(totals.finalAmount)}</td>
      </tr>
    `;
  }

  setText('paperNote', state.note || '無額外備註事項。');
  setText('issuerSigSlotLabel', isTenantMode ? '收款方／管理人員簽章' : '港居代管財務經辦簽章');
  setText('counterpartySigSlotLabel', isTenantMode ? '繳款租客簽認（選填）' : '受款屋主確認簽章（選填）');

  const sealEl = document.getElementById('digitalSealStamp');
  if (sealEl) {
    sealEl.classList.toggle('hidden', !state.showStamp);
    const sealMid = document.getElementById('digitalSealMidText');
    if (sealMid) {
      sealMid.textContent = isTenantMode ? '租金收訖專用章' : '月結對帳核實章';
    }
  }
}

// 跨工具一鍵匯入：從 utility-splitter.html 匯入最新水電分攤金額
function importFromUtilitySplitter() {
  try {
    const raw = localStorage.getItem(UTILITY_STORAGE_KEY);
    if (!raw) {
      showToast('尚未偵測到「水電與公電分攤單」暫存紀錄，已先為您填入範例水電費 920 元！', 'info');
      state.utilityFee = 920;
      syncFormFromState();
      saveState();
      return;
    }
    const data = JSON.parse(raw);
    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    if (rooms.length === 0) {
      showToast('水電分攤單暫無房間資料', 'warning');
      return;
    }
    // 預設抓取第一間房或總分攤均值
    const firstRoom = rooms[0];
    const kwh = Math.max(0, (Number(firstRoom.currReading) || 0) - (Number(firstRoom.prevReading) || 0));
    const rate = Math.min(Number(data.chargedRate) || 5, 5.5);
    const estimatedAmt = Math.round(kwh * rate + (Number(data.waterTotal) || 0) / rooms.length);
    state.utilityFee = estimatedAmt > 0 ? estimatedAmt : 880;
    if (firstRoom.name && !state.propertyName.includes(firstRoom.name)) {
      state.note = `含 ${firstRoom.name} 本期獨立電表 ${kwh} 度與公電水費分攤共 NT$ ${formatMoney(state.utilityFee)} 元。`;
    }
    syncFormFromState();
    saveState();
    showToast(`已成功從「水電與公電分攤單」匯入 ${firstRoom.name || '第一房'} 水電費 NT$ ${formatMoney(state.utilityFee)}！`, 'success');
  } catch (e) {
    showToast('匯入水電紀錄失敗，請手動輸入金額', 'error');
  }
}

// 跨工具一鍵匯入：從 repair-inspection.html 匯入房東負擔修繕金額
function importFromRepairInspection() {
  try {
    const raw = localStorage.getItem(REPAIR_STORAGE_KEY);
    if (!raw) {
      showToast('尚未偵測到「屋況修繕點交單」暫存紀錄，已為您帶入範例修繕代墊費 1,500 元！', 'info');
      state.repairDeduction = 1500;
      syncFormFromState();
      saveState();
      return;
    }
    const data = JSON.parse(raw);
    const items = Array.isArray(data.items) ? data.items : [];
    const landlordItems = items.filter((it) => it.responsibility === 'landlord' && Number(it.cost) > 0);
    if (landlordItems.length === 0) {
      state.repairDeduction = 1200;
      syncFormFromState();
      saveState();
      showToast('點交單內無標記為「房東負擔」之付費項目，已先帶入預設修繕費 1,200 元', 'info');
      return;
    }
    const totalRepair = landlordItems.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
    const titles = landlordItems.map((it) => it.name || '設備修繕').join('、');
    state.repairDeduction = totalRepair;
    state.note = `本期代墊修繕項目（房東責任）：${titles}，合計 NT$ ${formatMoney(totalRepair)} 元。`;
    syncFormFromState();
    saveState();
    showToast(`已匯入 ${landlordItems.length} 筆房東負擔修繕費，共 NT$ ${formatMoney(totalRepair)}！`, 'success');
  } catch (e) {
    showToast('匯入修繕紀錄失敗，請手動輸入金額', 'error');
  }
}

// 初始化手寫簽章畫布
function initSignaturePad(canvasId, previewId, onUpdate) {
  const canvas = document.getElementById(canvasId);
  const preview = document.getElementById(previewId);
  if (!canvas) return { clear: () => {} };

  const ctx = canvas.getContext('2d');
  let drawing = false;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(240, rect.width) * dpr;
    canvas.height = Math.max(100, rect.height) * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1A365D';
  };

  resize();

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing) return;
    drawing = false;
    const dataUrl = canvas.toDataURL('image/png');
    if (preview) {
      preview.style.backgroundImage = `url("${dataUrl}")`;
    }
    onUpdate(dataUrl);
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);

  return {
    clear: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (preview) preview.style.backgroundImage = 'none';
      onUpdate('');
    }
  };
}

// 產生並複製 LINE 專屬通知文字
function copyLineSummary() {
  const totals = calculateTotals();
  const isTenant = state.mode === 'tenant';

  const lines = isTenant
    ? [
        `🧾【港居不動產｜租金暨費用電子收據】`,
        `━━━━━━━━━━━━━━`,
        `📌 收據單號：${state.docNo}`,
        `🏠 標的物名稱：${state.propertyName}`,
        `👤 繳款租客：${state.tenantName}`,
        `📅 計費期間：${state.periodStart} ～ ${state.periodEnd}`,
        `━━━━━━━━━━━━━━`,
        `💰 本期房屋租金：NT$ ${formatMoney(state.rentAmount)}`,
        Number(state.mgmtFee) > 0 ? `🏢 管理／清潔費：NT$ ${formatMoney(state.mgmtFee)}` : null,
        Number(state.utilityFee) > 0 ? `⚡ 水電／分攤費：NT$ ${formatMoney(state.utilityFee)}` : null,
        Number(state.parkingFee) > 0 ? `🚗 車位／其他費：NT$ ${formatMoney(state.parkingFee)}` : null,
        Number(state.discountAmount) > 0 ? `🎁 本期折讓扣抵：- NT$ ${formatMoney(state.discountAmount)}` : null,
        `━━━━━━━━━━━━━━`,
        `✅ 本期實收總額：NT$ ${formatMoney(totals.finalAmount)} 元整`,
        `（大寫：新台幣${totals.chineseAmount}）`,
        `💳 收款方式：${state.paymentMethod}（末五碼 ${state.accountLast5}）`,
        `📆 下期應繳日：${state.nextDueDate}`,
        `📝 備註：${state.note || '已核對收訖，感謝您的準時繳納！'}`,
        `━━━━━━━━━━━━━━`,
        `🛡️ 港居不動產開發有限公司 (113)高市租登字第0012號`,
        `📞 專員聯繫：0968-863-880 陳俊銘經理`
      ]
    : [
        `📊【港居不動產｜屋主代管月結匯款對帳單】`,
        `━━━━━━━━━━━━━━`,
        `📌 對帳單號：${state.docNo}`,
        `🏠 委託標的：${state.propertyName}`,
        `👑 受款屋主：${state.landlordName}`,
        `📅 結算期間：${state.periodStart} ～ ${state.periodEnd}`,
        `━━━━━━━━━━━━━━`,
        `➕ 代收本期租金：NT$ ${formatMoney(state.rentAmount)}`,
        Number(state.parkingFee) > 0 ? `➕ 代收車位費用：NT$ ${formatMoney(state.parkingFee)}` : null,
        `➖ 代管服務費 (${state.serviceFeeRate}%)：- NT$ ${formatMoney(totals.serviceFeeAmount)}`,
        Number(state.repairDeduction) > 0 ? `➖ 代墊修繕費用：- NT$ ${formatMoney(state.repairDeduction)}` : null,
        Number(state.otherDeduction) > 0 ? `➖ 其他代扣項目：- NT$ ${formatMoney(state.otherDeduction)}` : null,
        `━━━━━━━━━━━━━━`,
        `🏦 本期實匯屋主淨額：NT$ ${formatMoney(totals.finalAmount)} 元整`,
        `（大寫：新台幣${totals.chineseAmount}）`,
        `💳 撥款帳戶：${state.paymentMethod}（${state.accountLast5}）`,
        `📆 撥款日期：${state.nextDueDate}`,
        `📝 備註：${state.note || '款項已依約撥付，請您查收！'}`,
        `━━━━━━━━━━━━━━`,
        `🛡️ 港居不動產開發有限公司 (113)高市租登字第0012號`
      ];

  const text = lines.filter(Boolean).join('\n');
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast('已複製 LINE 專屬通知文字！可直接貼上傳送給租客或屋主', 'success');
    })
    .catch(() => {
      showToast('複製失敗，請手動選取內容複製', 'error');
    });
}

// 匯出高畫質 840x1060 PNG 電子收據／對帳單圖卡
function downloadPngCard() {
  const totals = calculateTotals();
  const isTenant = state.mode === 'tenant';

  const canvas = document.createElement('canvas');
  canvas.width = 840;
  canvas.height = 1060;
  const ctx = canvas.getContext('2d');

  // 背景與金色雙外框
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#1A365D';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // 頂部海軍藍橫幅
  ctx.fillStyle = '#1A365D';
  ctx.fillRect(26, 26, canvas.width - 52, 130);

  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司｜高優質住宅包租代管・合法登記 (113)高市租登字第0012號', 50, 68);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px "Noto Sans TC", sans-serif';
  ctx.fillText(isTenant ? '🧾 房屋租金暨費用繳納正式收據' : '📊 屋主委託代管月結匯款對帳單', 50, 115);

  ctx.fillStyle = '#F7FAFC';
  ctx.fillRect(46, 176, canvas.width - 92, 165);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 176, canvas.width - 92, 165);

  ctx.fillStyle = '#1A365D';
  ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
  ctx.fillText(`單據編號：${state.docNo}`, 64, 210);
  ctx.fillText(`開立日期：${state.issueDate}`, 470, 210);
  ctx.fillText(`標的物名稱：${state.propertyName}`, 64, 245);
  ctx.fillText(`${isTenant ? '繳款租客' : '承租房客'}：${state.tenantName}`, 64, 280);
  ctx.fillText(`${isTenant ? '收款單位' : '受款屋主'}：${state.landlordName}`, 470, 280);
  ctx.fillText(`計費期間：${state.periodStart} ～ ${state.periodEnd}`, 64, 315);
  ctx.fillText(`收付帳號：${state.paymentMethod} (${state.accountLast5})`, 470, 315);

  // 金額重點區塊
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(46, 360, canvas.width - 92, 128);
  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 360, canvas.width - 92, 128);

  ctx.fillStyle = '#4A5568';
  ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
  ctx.fillText(isTenant ? '本期實收總金額 (NT$)' : '本期實匯屋主淨額 (NT$)', 66, 396);

  ctx.fillStyle = '#1A365D';
  ctx.font = '900 40px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
  ctx.fillText(`NT$ ${formatMoney(totals.finalAmount)}`, 66, 444);

  ctx.fillStyle = '#B08C45';
  ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
  ctx.fillText(`大寫金額：新台幣 ${totals.chineseAmount}`, 66, 474);

  // 明細列表
  let y = 526;
  ctx.fillStyle = '#1A365D';
  ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
  ctx.fillText('項目明細', 60, y);
  ctx.fillText('金額 (NT$)', 680, y);
  y += 12;
  ctx.strokeStyle = '#1A365D';
  ctx.beginPath();
  ctx.moveTo(46, y);
  ctx.lineTo(canvas.width - 46, y);
  ctx.stroke();

  const drawItemRow = (label, amtText, isDeduct = false) => {
    y += 38;
    ctx.fillStyle = '#2D3748';
    ctx.font = '600 17px "Noto Sans TC", sans-serif';
    ctx.fillText(label, 60, y);
    ctx.fillStyle = isDeduct ? '#C53030' : '#1A365D';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(amtText, 680, y);
  };

  if (Number(state.rentAmount) > 0) {
    drawItemRow(isTenant ? '本期房屋租金' : '代收本期房屋租金', `NT$ ${formatMoney(state.rentAmount)}`);
  }
  if (Number(state.mgmtFee) > 0) {
    drawItemRow('社區管理費／清潔費', `NT$ ${formatMoney(state.mgmtFee)}`);
  }
  if (Number(state.utilityFee) > 0) {
    drawItemRow('水電瓦斯／公電分攤費', `NT$ ${formatMoney(state.utilityFee)}`);
  }
  if (Number(state.parkingFee) > 0) {
    drawItemRow('車位租金／其他固定加項', `NT$ ${formatMoney(state.parkingFee)}`);
  }
  if (!isTenant && totals.serviceFeeAmount > 0) {
    drawItemRow(`代管服務費 (${state.serviceFeeRate}%)`, `- NT$ ${formatMoney(totals.serviceFeeAmount)}`, true);
  }
  if (!isTenant && Number(state.repairDeduction) > 0) {
    drawItemRow('本期代墊修繕與耗材費', `- NT$ ${formatMoney(state.repairDeduction)}`, true);
  }
  if (!isTenant && Number(state.otherDeduction) > 0) {
    drawItemRow('其他代繳或扣抵項目', `- NT$ ${formatMoney(state.otherDeduction)}`, true);
  }
  if (Number(state.discountAmount) > 0) {
    drawItemRow('本期租金折讓／代墊扣抵', `- NT$ ${formatMoney(state.discountAmount)}`, true);
  }

  // 備註欄
  y = 835;
  ctx.fillStyle = '#4A5568';
  ctx.font = '16px "Noto Sans TC", sans-serif';
  const noteStr = `備註：${(state.note || '款項核對無誤。').slice(0, 62)}`;
  ctx.fillText(noteStr, 60, y);
  ctx.fillText(`${isTenant ? '下期應繳日期' : '預計撥款日期'}：${state.nextDueDate || '-'}`, 60, y + 30);

  // 模擬紅色收訖專用章
  if (state.showStamp) {
    ctx.save();
    ctx.translate(680, 915);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(197, 48, 48, 0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-65, -52, 130, 104);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-59, -46, 118, 92);
    ctx.fillStyle = 'rgba(197, 48, 48, 0.88)';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產(股)', 0, -22);
    ctx.font = '900 17px "Noto Sans TC", sans-serif';
    ctx.fillText(isTenant ? '租金收訖專用章' : '月結對帳核實章', 0, 5);
    ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
    ctx.fillText('統編 96797997', 0, 30);
    ctx.restore();
  }

  // 底部公司資訊
  ctx.fillStyle = '#718096';
  ctx.font = '14px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司｜高雄市小港區中安路825號｜電話：07-791-2288 / 0968-863-880', 60, 1008);

  const link = document.createElement('a');
  link.download = `${state.docNo || '港居電子憑證'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('已成功匯出高畫質 PNG 電子收據／對帳單圖卡！', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  const issuerPad = initSignaturePad('issuerSigCanvas', 'previewIssuerSig', (url) => {
    issuerSigDataUrl = url;
  });
  const counterpartyPad = initSignaturePad('counterpartySigCanvas', 'previewCounterpartySig', (url) => {
    counterpartySigDataUrl = url;
  });

  syncFormFromState();

  // 模式切換
  document.querySelectorAll('.mode-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode || 'tenant';
      if (state.mode === 'landlord' && state.docNo.startsWith('GJ-RCP-')) {
        state.docNo = state.docNo.replace('GJ-RCP-', 'GJ-STM-');
      } else if (state.mode === 'tenant' && state.docNo.startsWith('GJ-STM-')) {
        state.docNo = state.docNo.replace('GJ-STM-', 'GJ-RCP-');
      }
      syncFormFromState();
      saveState();
    });
  });

  // 範例快速切換
  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.preset;
      if (!PRESETS[key]) return;
      document.querySelectorAll('.preset-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state = structuredClone(PRESETS[key]);
      syncFormFromState();
      saveState();
      showToast(`已載入「${chip.textContent.trim()}」範例設定`, 'success');
    });
  });

  // 表單欄位雙向綁定
  const bindInput = (id, key, isNum = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = isNum ? Number(el.value) || 0 : el.value;
      renderVoucherPreview();
      saveState();
    });
  };

  bindInput('docNoInput', 'docNo');
  bindInput('issueDateInput', 'issueDate');
  bindInput('propertyNameInput', 'propertyName');
  bindInput('tenantNameInput', 'tenantName');
  bindInput('landlordNameInput', 'landlordName');
  bindInput('periodStartInput', 'periodStart');
  bindInput('periodEndInput', 'periodEnd');
  bindInput('nextDueDateInput', 'nextDueDate');
  bindInput('paymentMethodSelect', 'paymentMethod');
  bindInput('accountLast5Input', 'accountLast5');
  bindInput('rentAmountInput', 'rentAmount', true);
  bindInput('mgmtFeeInput', 'mgmtFee', true);
  bindInput('utilityFeeInput', 'utilityFee', true);
  bindInput('parkingFeeInput', 'parkingFee', true);
  bindInput('discountAmountInput', 'discountAmount', true);
  bindInput('serviceFeeRateInput', 'serviceFeeRate', true);
  bindInput('repairDeductionInput', 'repairDeduction', true);
  bindInput('otherDeductionInput', 'otherDeduction', true);
  bindInput('noteInput', 'note');

  // 代管服務費率快速按鈕
  document.querySelectorAll('.rate-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.serviceFeeRate = Number(chip.dataset.rate) || 0;
      syncFormFromState();
      saveState();
    });
  });

  // 公司收訖章開關
  const stampCheck = document.getElementById('showStampCheckbox');
  if (stampCheck) {
    stampCheck.addEventListener('change', () => {
      state.showStamp = stampCheck.checked;
      renderVoucherPreview();
      saveState();
    });
  }

  // 新增自訂加減項目
  const addCustomBtn = document.getElementById('addCustomItemBtn');
  if (addCustomBtn) {
    addCustomBtn.addEventListener('click', () => {
      state.customItems.push({
        type: 'add',
        title: '清潔維護／耗材補貼',
        amount: 300
      });
      renderCustomItemsList();
      renderVoucherPreview();
      saveState();
    });
  }

  // 自訂項目事件代理
  const customList = document.getElementById('customItemsList');
  if (customList) {
    customList.addEventListener('input', (e) => {
      const target = e.target;
      const idx = Number(target.dataset.idx);
      if (Number.isNaN(idx) || !state.customItems[idx]) return;

      if (target.classList.contains('custom-item-type')) {
        state.customItems[idx].type = target.value;
      } else if (target.classList.contains('custom-item-title')) {
        state.customItems[idx].title = target.value;
      } else if (target.classList.contains('custom-item-amount')) {
        state.customItems[idx].amount = Number(target.value) || 0;
      }
      renderVoucherPreview();
      saveState();
    });

    customList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.removeIdx);
      if (Number.isNaN(idx)) return;
      state.customItems.splice(idx, 1);
      renderCustomItemsList();
      renderVoucherPreview();
      saveState();
    });
  }

  // 跨工具一鍵匯入按鈕
  document.getElementById('importUtilityBtn')?.addEventListener('click', importFromUtilitySplitter);
  document.getElementById('importRepairBtn')?.addEventListener('click', importFromRepairInspection);

  // 清除簽名按鈕
  document.getElementById('clearIssuerSigBtn')?.addEventListener('click', () => issuerPad.clear());
  document.getElementById('clearCounterpartySigBtn')?.addEventListener('click', () => counterpartyPad.clear());

  // 匯出與列印按鈕
  document.getElementById('copyLineBtn')?.addEventListener('click', copyLineSummary);
  document.getElementById('downloadCardBtn')?.addEventListener('click', downloadPngCard);
  document.getElementById('printReceiptBtn')?.addEventListener('click', () => window.print());
});
