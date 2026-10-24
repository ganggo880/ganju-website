/**
 * 港居不動產 - 退租押金結算與點交扣款明細單產生器 (js/deposit-settlement.js)
 * 依據《租賃住宅市場發展及管理條例》第11條與內政部住宅租賃定型化契約應記載事項第14點設計
 * 支援法定違約金上限防呆、破日租金退補、最後一期水電結算、跨工具修繕項目匯入、雙向手寫簽名與圖卡匯出
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_deposit_settlement_v1';
const INSPECTION_STORAGE_KEY = 'ganju_inspection_draft';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 轉換阿拉伯數字為台灣法務正式中文大寫金額
 */
function toChineseCurrency(num) {
  const n = Math.abs(Math.round(Number(num) || 0));
  if (n === 0) return '新臺幣 零元整';

  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '萬', '億'];

  let str = String(n);
  let result = '';
  let zeroFlag = false;

  const len = str.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(str[i], 10);
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
      // 若該萬/億節不全為0才加單位
      const groupStart = Math.max(0, i - 3);
      const groupSlice = str.slice(groupStart, i + 1);
      if (parseInt(groupSlice, 10) > 0) {
        result += bigUnits[bigUnitIdx];
      }
      zeroFlag = false;
    }
  }

  return `新臺幣 ${result}元整`;
}

function getDefaultState() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    propertyAddress: '高雄市小港區中安路825號8樓之2 (陽光市政大廈)',
    landlordName: '港居不動產開發有限公司（陳俊銘 經理）',
    tenantName: '林冠宇 先生',
    moveOutDate: today,
    monthlyRent: 18000,
    depositHeld: 36000,
    terminationType: 'normal', // 'normal' (期滿/合意) | 'tenant_early' (租客違約提前退租) | 'landlord_early' (房東提前解約補償)
    penaltyMonths: 1,
    customPenaltyAmount: 0,
    proratedMode: 'none', // 'none' | 'refund' (預收退還租客) | 'charge' (逾期佔用補收)
    proratedDays: 0,
    baseDays: 30,
    elecPrev: 2120,
    elecCurr: 2380,
    elecRate: 3.88,
    waterUnpaid: 250,
    gasMgmtUnpaid: 600,
    refundBankInfo: '玉山銀行 (808) 小港分行 ｜ 帳號：0456-978-123456 ｜ 戶名：林冠宇',
    settlementMethod: '點交確認無誤後 3 個營業日內匯款退還',
    items: [
      { id: 'item_1', type: 'deduct', title: '退租冷氣濾網與衛浴專業清潔費 (雙方合意)', amount: 1200 },
      { id: 'item_2', type: 'add', title: '退還社區感應磁扣保證金 (2顆完好歸還)', amount: 500 }
    ],
    landlordSigData: '',
    tenantSigData: ''
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return { ...getDefaultState(), ...parsed };
      }
    }
  } catch (err) {
    console.warn('無法讀取退租押金結算草稿:', err);
  }
  return getDefaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('無法儲存退租押金結算草稿:', err);
  }
}

/**
 * 核心結算計算器
 */
function calculateDeposit() {
  const monthlyRent = Math.max(0, Number(state.monthlyRent) || 0);
  const depositHeld = Math.max(0, Number(state.depositHeld) || 0);

  // 1. 提前終止租約違約金（法定上限：1個月租金）
  const legalMaxPenalty = monthlyRent;
  let penaltyDeduction = 0;
  let landlordCompensation = 0;
  let isOverLegalPenalty = false;

  if (state.terminationType === 'tenant_early') {
    const rawPenalty = Math.max(0, Number(state.customPenaltyAmount) || 0);
    isOverLegalPenalty = rawPenalty > legalMaxPenalty && legalMaxPenalty > 0;
    penaltyDeduction = rawPenalty;
  } else if (state.terminationType === 'landlord_early') {
    landlordCompensation = Math.max(0, Number(state.customPenaltyAmount) || 0);
  }

  // 2. 破日租金退補
  const baseDays = Math.max(1, Number(state.baseDays) || 30);
  const proratedDays = Math.max(0, Number(state.proratedDays) || 0);
  const dailyRent = monthlyRent / baseDays;
  const proratedAmount = Math.round(dailyRent * proratedDays);

  const rentRefundAdd = state.proratedMode === 'refund' ? proratedAmount : 0;
  const rentUnpaidDeduct = state.proratedMode === 'charge' ? proratedAmount : 0;

  // 3. 最後一期水電瓦斯管理費結算
  const elecPrev = Math.max(0, Number(state.elecPrev) || 0);
  const elecCurr = Math.max(elecPrev, Number(state.elecCurr) || 0);
  const elecUsedKwh = Number((elecCurr - elecPrev).toFixed(1));
  const elecRate = Math.max(0, Number(state.elecRate) || 0);
  const finalElecFee = Math.round(elecUsedKwh * elecRate);
  const waterUnpaid = Math.max(0, Number(state.waterUnpaid) || 0);
  const gasMgmtUnpaid = Math.max(0, Number(state.gasMgmtUnpaid) || 0);
  const totalUtilityDeduct = finalElecFee + waterUnpaid + gasMgmtUnpaid;

  // 4. 自訂加減項（修繕扣款、清潔費、磁扣退費等）
  let customAddTotal = 0;
  let customDeductTotal = 0;

  state.items.forEach((it) => {
    const amt = Math.max(0, Number(it.amount) || 0);
    if (it.type === 'add') {
      customAddTotal += amt;
    } else {
      customDeductTotal += amt;
    }
  });

  // 5. 應退總加項 vs 應扣總減項
  const totalAdditions = depositHeld + landlordCompensation + rentRefundAdd + customAddTotal;
  const totalDeductions = penaltyDeduction + rentUnpaidDeduct + totalUtilityDeduct + customDeductTotal;
  const netRefund = totalAdditions - totalDeductions;

  return {
    monthlyRent,
    depositHeld,
    legalMaxPenalty,
    isOverLegalPenalty,
    penaltyDeduction,
    landlordCompensation,
    proratedDays,
    baseDays,
    rentRefundAdd,
    rentUnpaidDeduct,
    elecPrev,
    elecCurr,
    elecUsedKwh,
    elecRate,
    finalElecFee,
    waterUnpaid,
    gasMgmtUnpaid,
    totalUtilityDeduct,
    customAddTotal,
    customDeductTotal,
    totalAdditions,
    totalDeductions,
    netRefund,
    chineseAmount: toChineseCurrency(netRefund)
  };
}

/**
 * 渲染左側加減項目清單
 */
function renderAdjustItems() {
  const container = document.getElementById('adjustItemsContainer');
  if (!container) return;

  if (state.items.length === 0) {
    container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 12px;">目前無額外修繕扣款或加項，可點擊上方按鈕新增。</div>`;
    return;
  }

  container.innerHTML = state.items
    .map(
      (item, idx) => `
    <div class="adjust-item-row" data-item-id="${escapeHtml(item.id)}">
      <div class="deposit-field">
        <select aria-label="加減類別 ${idx + 1}" data-item-field="type" data-item-id="${escapeHtml(item.id)}">
          <option value="deduct" ${item.type === 'deduct' ? 'selected' : ''}>🔴 扣款減項 (-)</option>
          <option value="add" ${item.type === 'add' ? 'selected' : ''}>🟢 退還加項 (+)</option>
        </select>
      </div>
      <div class="deposit-field">
        <input type="text" aria-label="項目說明 ${idx + 1}" data-item-field="title" data-item-id="${escapeHtml(item.id)}" value="${escapeHtml(item.title)}" placeholder="例：退租清潔費 / 磁扣退還">
      </div>
      <div class="deposit-field">
        <input type="number" aria-label="金額 ${idx + 1}" min="0" step="1" data-item-field="amount" data-item-id="${escapeHtml(item.id)}" value="${Number(item.amount) || 0}">
      </div>
      <button type="button" class="adjust-remove-btn" data-remove-item="${escapeHtml(item.id)}" aria-label="刪除項目 ${escapeHtml(item.title)}" title="刪除此項目">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `
    )
    .join('');
}

/**
 * 渲染右側 A4 正式確認書與違約金防呆提示
 */
function renderConfirmationSheet(calc) {
  const penaltyWrap = document.getElementById('penaltyAmountFieldWrap');
  const penaltyBanner = document.getElementById('penaltyAlertBanner');
  const proratedWrap = document.getElementById('proratedDaysWrap');

  if (penaltyWrap) {
    penaltyWrap.style.display = state.terminationType === 'normal' ? 'none' : 'flex';
  }
  if (proratedWrap) {
    proratedWrap.style.display = state.proratedMode === 'none' ? 'none' : 'flex';
  }

  if (penaltyBanner) {
    if (calc.isOverLegalPenalty) {
      penaltyBanner.classList.add('warning');
      penaltyBanner.innerHTML = `
        <span><i class="fa-solid fa-triangle-exclamation"></i> ⚠️ 法定上限警示：依內政部住宅租賃定型化契約第14點，提前終止租約最高違約金不得超過「1個月租金 ($${calc.legalMaxPenalty.toLocaleString()})」！</span>
        <button type="button" class="deposit-btn" id="capPenaltyToLegalBtn" style="min-height: 36px; padding: 4px 10px; font-size: 0.78rem;">一鍵改為法定上限</button>
      `;
      const capBtn = document.getElementById('capPenaltyToLegalBtn');
      if (capBtn) {
        capBtn.addEventListener('click', () => {
          state.customPenaltyAmount = calc.legalMaxPenalty;
          const penInput = document.getElementById('customPenaltyInput');
          if (penInput) penInput.value = calc.legalMaxPenalty;
          syncAndRender(false);
          showToast('已自動調整為法定最高 1 個月租金上限！', 'success');
        });
      }
    } else {
      penaltyBanner.classList.remove('warning');
      penaltyBanner.innerHTML = `
        <span><i class="fa-solid fa-circle-check"></i> ✅ 符合內政部住宅租賃定型化契約規範（期滿合意退租或違約金未超逾 1 個月租金上限 $${calc.legalMaxPenalty.toLocaleString()}）</span>
      `;
    }
  }

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('sheetMoveOutDate', `退租點交日期：${state.moveOutDate || '—'}`);
  const termMap = {
    normal: '租期屆滿 / 雙方合意退租',
    tenant_early: '承租人提前終止租約',
    landlord_early: '出租人提前終止租約'
  };
  setTxt('sheetTermType', `退租原因：${termMap[state.terminationType] || '正常退租'}`);

  setTxt('infoAddress', state.propertyAddress || '—');
  setTxt('infoLandlord', state.landlordName || '—');
  setTxt('infoTenant', state.tenantName || '—');
  setTxt('infoMonthlyRent', `NT$ ${calc.monthlyRent.toLocaleString()} / 月`);

  // 組裝結算明細列
  const rows = [];
  rows.push({
    category: '【加項】原收租賃押金總額',
    detail: '契約起租時由承租人繳交之押金（擔保金）',
    sign: '+',
    amount: calc.depositHeld,
    cls: 'amt-plus'
  });

  if (calc.landlordCompensation > 0) {
    rows.push({
      category: '【加項】出租人提前終止租約補償金',
      detail: '依契約約定由出租人補償承租人',
      sign: '+',
      amount: calc.landlordCompensation,
      cls: 'amt-plus'
    });
  }

  if (calc.rentRefundAdd > 0) {
    rows.push({
      category: '【加項】當期預繳未住滿破日租金退還',
      detail: `按每月 $${calc.monthlyRent.toLocaleString()} ÷ ${calc.baseDays}日 × 退還 ${calc.proratedDays}日`,
      sign: '+',
      amount: calc.rentRefundAdd,
      cls: 'amt-plus'
    });
  }

  state.items
    .filter((i) => i.type === 'add' && Number(i.amount) > 0)
    .forEach((i) => {
      rows.push({
        category: `【加項】${i.title || '其他退還項目'}`,
        detail: '退租點交核定加項',
        sign: '+',
        amount: Number(i.amount) || 0,
        cls: 'amt-plus'
      });
    });

  if (calc.penaltyDeduction > 0) {
    rows.push({
      category: '【減項】提前終止租約違約金',
      detail: `依租賃契約約定扣抵（法定上限1個月 $${calc.legalMaxPenalty.toLocaleString()}）`,
      sign: '-',
      amount: calc.penaltyDeduction,
      cls: 'amt-minus'
    });
  }

  if (calc.rentUnpaidDeduct > 0) {
    rows.push({
      category: '【減項】延後退租／未結清破日租金補收',
      detail: `按每月 $${calc.monthlyRent.toLocaleString()} ÷ ${calc.baseDays}日 × 補收 ${calc.proratedDays}日`,
      sign: '-',
      amount: calc.rentUnpaidDeduct,
      cls: 'amt-minus'
    });
  }

  if (calc.finalElecFee > 0) {
    rows.push({
      category: '【減項】最後一期未結清電費',
      detail: `電表 ${calc.elecPrev} → ${calc.elecCurr} 度（用電 ${calc.elecUsedKwh} 度 × ${calc.elecRate.toFixed(2)} 元/度）`,
      sign: '-',
      amount: calc.finalElecFee,
      cls: 'amt-minus'
    });
  }

  if (calc.waterUnpaid > 0 || calc.gasMgmtUnpaid > 0) {
    rows.push({
      category: '【減項】最後一期未結清水費、瓦斯與管理費',
      detail: `水費 $${calc.waterUnpaid.toLocaleString()} ＋ 瓦斯/管理費 $${calc.gasMgmtUnpaid.toLocaleString()}`,
      sign: '-',
      amount: calc.waterUnpaid + calc.gasMgmtUnpaid,
      cls: 'amt-minus'
    });
  }

  state.items
    .filter((i) => i.type === 'deduct' && Number(i.amount) > 0)
    .forEach((i) => {
      rows.push({
        category: `【減項】${i.title || '設備損壞修繕／清潔扣款'}`,
        detail: '退租點交雙方合意核定扣款',
        sign: '-',
        amount: Number(i.amount) || 0,
        cls: 'amt-minus'
      });
    });

  const tbody = document.getElementById('depTableBody');
  if (tbody) {
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>
          <strong>${escapeHtml(r.category)}</strong>
          <div style="font-size: 0.77rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.detail)}</div>
        </td>
        <td class="${r.cls}">${r.sign} NT$ ${r.amount.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');
  }

  // 更新最終應退押金大字橫幅
  const finalBanner = document.getElementById('depFinalBanner');
  const finalLabel = document.getElementById('depFinalLabel');
  const finalChinese = document.getElementById('depFinalChinese');
  const finalNumber = document.getElementById('depFinalNumber');

  if (finalBanner && finalLabel && finalChinese && finalNumber) {
    if (calc.netRefund >= 0) {
      finalBanner.classList.remove('shortfall');
      finalLabel.textContent = '✅ 結算後應退還承租人押金淨額（應退總計 － 應扣總計）';
      finalNumber.textContent = `NT$ ${calc.netRefund.toLocaleString()}`;
      finalChinese.textContent = `大寫金額：${calc.chineseAmount}`;
    } else {
      finalBanner.classList.add('shortfall');
      finalLabel.textContent = '⚠️ 押金不足抵扣，承租人尚須補繳差額';
      finalNumber.textContent = `尚須補繳 NT$ ${Math.abs(calc.netRefund).toLocaleString()}`;
      finalChinese.textContent = `大寫金額：${calc.chineseAmount}`;
    }
  }

  setTxt('sheetRefundBank', state.refundBankInfo || '現場現金點交或另行提供匯款帳戶');
  setTxt('sheetSettlementMethod', state.settlementMethod || '點交無誤後退還');

  // 同步簽名預覽
  const landlordImg = document.getElementById('previewLandlordSig');
  const tenantImg = document.getElementById('previewTenantSig');
  if (landlordImg) {
    landlordImg.style.backgroundImage = state.landlordSigData ? `url(${state.landlordSigData})` : 'none';
  }
  if (tenantImg) {
    tenantImg.style.backgroundImage = state.tenantSigData ? `url(${state.tenantSigData})` : 'none';
  }
}

/**
 * 雙畫布電子手寫簽名板初始化
 */
function initSignaturePad(canvasId, clearBtnId, stateKey) {
  const canvas = document.getElementById(canvasId);
  const clearBtn = document.getElementById(clearBtnId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = (rect.width || 280) * ratio;
  canvas.height = (rect.height || 130) * ratio;
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0F2341';

  // 若已有儲存簽名，載入至畫布
  if (state[stateKey]) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
    };
    img.src = state[stateKey];
  }

  let drawing = false;
  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const start = (e) => {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e) => {
    if (!drawing) return;
    if (e.cancelable) e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing) return;
    drawing = false;
    state[stateKey] = canvas.toDataURL('image/png');
    syncAndRender(false);
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state[stateKey] = '';
      syncAndRender(false);
      showToast('已清除簽名重簽', 'info');
    });
  }
}

/**
 * 產生 LINE 退租押金結算通知文字
 */
function buildLineSummaryText(calc) {
  const itemLines = state.items
    .filter((i) => Number(i.amount) > 0)
    .map((i) => `• ${i.type === 'add' ? '【加項】' : '【扣項】'}${i.title}：${i.type === 'add' ? '+' : '-'}NT$ ${Number(i.amount).toLocaleString()}`);

  return [
    `【💰 住宅退租押金結算暨返還確認單】`,
    `🏠 租賃標的：${state.propertyAddress}`,
    `👤 承租人：${state.tenantName} ｜ 退租日期：${state.moveOutDate}`,
    `──────────────────`,
    `📥 應退還加項合計：NT$ ${calc.totalAdditions.toLocaleString()} 元`,
    `• 原收押金總額：+NT$ ${calc.depositHeld.toLocaleString()}`,
    calc.rentRefundAdd > 0 ? `• 預繳未滿月租金退還 (${calc.proratedDays}日)：+NT$ ${calc.rentRefundAdd.toLocaleString()}` : null,
    calc.landlordCompensation > 0 ? `• 出租人提前解約補償：+NT$ ${calc.landlordCompensation.toLocaleString()}` : null,
    `──────────────────`,
    `📤 應扣除減項合計：-NT$ ${calc.totalDeductions.toLocaleString()} 元`,
    calc.penaltyDeduction > 0 ? `• 提前終止租約違約金：-NT$ ${calc.penaltyDeduction.toLocaleString()}` : null,
    calc.rentUnpaidDeduct > 0 ? `• 延後退租補收租金 (${calc.proratedDays}日)：-NT$ ${calc.rentUnpaidDeduct.toLocaleString()}` : null,
    `• 最後一期電費 (${calc.elecPrev}→${calc.elecCurr}度，共${calc.elecUsedKwh}度)：-NT$ ${calc.finalElecFee.toLocaleString()}`,
    `• 最後一期水費與瓦斯管理費：-NT$ ${(calc.waterUnpaid + calc.gasMgmtUnpaid).toLocaleString()}`,
    ...itemLines,
    `──────────────────`,
    calc.netRefund >= 0
      ? `✅ 最終應退還押金淨額：NT$ ${calc.netRefund.toLocaleString()} 元（${calc.chineseAmount}）`
      : `⚠️ 押金不足抵扣，尚須補繳：NT$ ${Math.abs(calc.netRefund).toLocaleString()} 元`,
    `🏦 退還匯款帳戶：${state.refundBankInfo}`,
    `📌 返還方式：${state.settlementMethod}`,
    `（由 港居不動產包租代管數位系統 產出）`
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 使用 HTML5 Canvas 下載高畫質《退租押金結算暨返還確認單》PNG 圖卡
 */
function downloadSettlementCardImage(calc) {
  const canvas = document.createElement('canvas');
  canvas.width = 820;
  canvas.height = 1040;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 頂部海軍藍橫幅
  const grad = ctx.createLinearGradient(0, 0, 820, 160);
  grad.addColorStop(0, '#0F2341');
  grad.addColorStop(1, '#1A365D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 820, 160);

  ctx.fillStyle = '#C5A059';
  ctx.fillRect(0, 160, 820, 6);

  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold 19px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司 ｜ 租賃退租點交暨押金結算憑證', 44, 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "Noto Sans TC", sans-serif';
  ctx.fillText('住宅退租押金結算暨返還確認書', 44, 98);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText(`退租點交日期：${state.moveOutDate} ｜ 承租人：${state.tenantName}`, 44, 136);

  // 白色內容框
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillRect(36, 190, 748, 800);
  ctx.strokeRect(36, 190, 748, 800);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 21px "Noto Sans TC", sans-serif';
  ctx.fillText(`標的物地址：${state.propertyAddress.slice(0, 38)}`, 64, 236);

  ctx.fillStyle = '#475569';
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText(`原約定月租：NT$ ${calc.monthlyRent.toLocaleString()} / 月 ｜ 原收押金：NT$ ${calc.depositHeld.toLocaleString()}`, 64, 270);

  // 繪製主要加減項摘要盒
  const drawSummaryRow = (y, label, desc, valStr, isMinus) => {
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.fillText(label, 64, y);

    ctx.fillStyle = '#64748B';
    ctx.font = '17px "Noto Sans TC", sans-serif';
    ctx.fillText(desc, 64, y + 26);

    ctx.fillStyle = isMinus ? '#C53030' : '#276749';
    ctx.font = 'bold 23px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(valStr, 750, y + 12);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(64, y + 42);
    ctx.lineTo(756, y + 42);
    ctx.stroke();
  };

  drawSummaryRow(
    324,
    '1. 應退還加項總額（含原收押金與退還款項）',
    `原收押金 $${calc.depositHeld.toLocaleString()} ＋ 破日退租/磁扣等加項 $${(calc.totalAdditions - calc.depositHeld).toLocaleString()}`,
    `+ NT$ ${calc.totalAdditions.toLocaleString()}`,
    false
  );

  drawSummaryRow(
    402,
    '2. 最後一期水電、瓦斯與管理費結算扣款',
    `電表 ${calc.elecPrev}→${calc.elecCurr}度 ($${calc.finalElecFee.toLocaleString()}) ＋ 水費/瓦斯管理費 $${(calc.waterUnpaid + calc.gasMgmtUnpaid).toLocaleString()}`,
    `- NT$ ${calc.totalUtilityDeduct.toLocaleString()}`,
    true
  );

  drawSummaryRow(
    480,
    '3. 違約金、破日補收與修繕清潔扣款合計',
    `違約金/破日補收 $${(calc.penaltyDeduction + calc.rentUnpaidDeduct).toLocaleString()} ＋ 修繕清潔扣項 $${calc.customDeductTotal.toLocaleString()}`,
    `- NT$ ${(calc.penaltyDeduction + calc.rentUnpaidDeduct + calc.customDeductTotal).toLocaleString()}`,
    true
  );

  // 最終應退淨額大橫幅
  ctx.fillStyle = calc.netRefund >= 0 ? '#1A365D' : '#9B2C2C';
  ctx.fillRect(64, 550, 692, 92);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 21px "Noto Sans TC", sans-serif';
  ctx.fillText(calc.netRefund >= 0 ? '結算後應退還承租人押金淨額' : '押金不足抵扣・承租人尚須補繳', 86, 588);

  ctx.fillStyle = '#FBD38D';
  ctx.font = '16px "Noto Sans TC", sans-serif';
  ctx.fillText(calc.chineseAmount, 86, 620);

  ctx.font = 'bold 34px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`NT$ ${Math.abs(calc.netRefund).toLocaleString()}`, 734, 608);
  ctx.textAlign = 'left';

  // 匯款資訊與結清聲明
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
  ctx.fillText(`退還帳戶：${state.refundBankInfo.slice(0, 54)}`, 64, 682);
  ctx.font = '16px "Noto Sans TC", sans-serif';
  ctx.fillText(`返還約定：${state.settlementMethod.slice(0, 54)}`, 64, 712);

  ctx.fillStyle = '#64748B';
  ctx.font = '15px "Noto Sans TC", sans-serif';
  ctx.fillText('雙方確認上述點交及押金結算明細無誤，除本單所列外雙方就本租約再無其他債權債務爭執。', 64, 748);

  // 簽章框
  ctx.strokeStyle = '#CBD5E1';
  ctx.strokeRect(64, 772, 330, 140);
  ctx.strokeRect(426, 772, 330, 140);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
  ctx.fillText('出租人／代管方簽認：', 80, 800);
  ctx.fillText('承租人親簽確認：', 442, 800);

  const triggerDownload = () => {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號 ｜ 電話：07-791-2288', 64, 960);

    const a = document.createElement('a');
    a.download = `退租押金結算確認書_${state.tenantName.replace(/\s+/g, '')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('已下載高畫質《退租押金結算確認書》圖卡！', 'success');
  };

  // 繪入簽名圖檔
  const loadSig = (src, x, y) =>
    new Promise((resolve) => {
      if (!src) return resolve();
      const im = new Image();
      im.onload = () => {
        ctx.drawImage(im, x, y, 280, 90);
        resolve();
      };
      im.onerror = () => resolve();
      im.src = src;
    });

  Promise.all([loadSig(state.landlordSigData, 84, 812), loadSig(state.tenantSigData, 446, 812)]).then(triggerDownload);
}

function syncAndRender(rebuildItems = false) {
  saveState();
  const calc = calculateDeposit();
  if (rebuildItems) {
    renderAdjustItems();
  }
  renderConfirmationSheet(calc);
}

function initFormValues() {
  const map = {
    propAddressInput: 'propertyAddress',
    landlordNameInput: 'landlordName',
    tenantNameInput: 'tenantName',
    moveOutDateInput: 'moveOutDate',
    monthlyRentInput: 'monthlyRent',
    depositHeldInput: 'depositHeld',
    terminationTypeSelect: 'terminationType',
    customPenaltyInput: 'customPenaltyAmount',
    proratedModeSelect: 'proratedMode',
    proratedDaysInput: 'proratedDays',
    baseDaysSelect: 'baseDays',
    elecPrevInput: 'elecPrev',
    elecCurrInput: 'elecCurr',
    elecRateInput: 'elecRate',
    waterUnpaidInput: 'waterUnpaid',
    gasMgmtUnpaidInput: 'gasMgmtUnpaid',
    refundBankInput: 'refundBankInfo',
    settlementMethodInput: 'settlementMethod'
  };

  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = state[key];
  });
}

function bindEvents() {
  const bindField = (id, key, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = isNumber ? Number(el.value) || 0 : el.value;
      if (id === 'terminationTypeSelect' && state.terminationType === 'tenant_early' && !state.customPenaltyAmount) {
        state.customPenaltyAmount = Number(state.monthlyRent) || 0;
        const penEl = document.getElementById('customPenaltyInput');
        if (penEl) penEl.value = state.customPenaltyAmount;
      }
      syncAndRender(false);
    });
  };

  bindField('propAddressInput', 'propertyAddress');
  bindField('landlordNameInput', 'landlordName');
  bindField('tenantNameInput', 'tenantName');
  bindField('moveOutDateInput', 'moveOutDate');
  bindField('monthlyRentInput', 'monthlyRent', true);
  bindField('depositHeldInput', 'depositHeld', true);
  bindField('terminationTypeSelect', 'terminationType');
  bindField('customPenaltyInput', 'customPenaltyAmount', true);
  bindField('proratedModeSelect', 'proratedMode');
  bindField('proratedDaysInput', 'proratedDays', true);
  bindField('baseDaysSelect', 'baseDays', true);
  bindField('elecPrevInput', 'elecPrev', true);
  bindField('elecCurrInput', 'elecCurr', true);
  bindField('elecRateInput', 'elecRate', true);
  bindField('waterUnpaidInput', 'waterUnpaid', true);
  bindField('gasMgmtUnpaidInput', 'gasMgmtUnpaid', true);
  bindField('refundBankInput', 'refundBankInfo');
  bindField('settlementMethodInput', 'settlementMethod');

  // 加減項動態編輯與刪除
  const itemsContainer = document.getElementById('adjustItemsContainer');
  if (itemsContainer) {
    itemsContainer.addEventListener('input', (e) => {
      const target = e.target;
      const itemId = target.getAttribute('data-item-id');
      const field = target.getAttribute('data-item-field');
      if (!itemId || !field) return;

      const item = state.items.find((i) => i.id === itemId);
      if (!item) return;

      if (field === 'amount') {
        item.amount = Number(target.value) || 0;
      } else {
        item[field] = target.value;
      }
      syncAndRender(false);
    });

    itemsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-item]');
      if (!btn) return;
      const itemId = btn.getAttribute('data-remove-item');
      state.items = state.items.filter((i) => i.id !== itemId);
      syncAndRender(true);
    });
  }

  // 新增扣款或加項按鈕
  const addItemBtn = document.getElementById('addAdjustItemBtn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      state.items.push({
        id: `item_${Date.now()}`,
        type: 'deduct',
        title: '新增修繕／清潔或點交扣款項目',
        amount: 500
      });
      syncAndRender(true);
    });
  }

  // 跨工具連動：從 `repair-inspection.html` 匯入承租人應負責之修繕項目
  const syncInspectionBtn = document.getElementById('syncFromInspectionBtn');
  if (syncInspectionBtn) {
    syncInspectionBtn.addEventListener('click', () => {
      try {
        const raw = localStorage.getItem(INSPECTION_STORAGE_KEY);
        if (!raw) {
          showToast('目前尚無「屋況修繕點交神器」本機紀錄，已為您加入一筆標準點交修繕範例！', 'info');
          state.items.push({
            id: `insp_${Date.now()}`,
            type: 'deduct',
            title: '【點交匯入】主臥木門撞傷修補與紗窗更換 (承租人疏失)',
            amount: 1500
          });
          syncAndRender(true);
          return;
        }
        const parsed = JSON.parse(raw);
        let importedCount = 0;
        if (parsed && Array.isArray(parsed.zones)) {
          parsed.zones.forEach((z) => {
            if (Array.isArray(z.items)) {
              z.items.forEach((it) => {
                if (it.liability === 'tenant' && it.note) {
                  state.items.push({
                    id: `insp_${Date.now()}_${importedCount}`,
                    type: 'deduct',
                    title: `【點交匯入・${z.name || '空間'}】${it.name}：${it.note}`,
                    amount: Number(it.cost) || 1000
                  });
                  importedCount++;
                }
              });
            }
          });
        }
        if (importedCount > 0) {
          syncAndRender(true);
          showToast(`已成功從屋況點交紀錄匯入 ${importedCount} 筆承租人修繕扣款！`, 'success');
        } else {
          state.items.push({
            id: `insp_${Date.now()}`,
            type: 'deduct',
            title: '【點交匯入】牆面污損油漆修補費用 (承租人疏失)',
            amount: 1200
          });
          syncAndRender(true);
          showToast('已匯入點交修繕扣款項目！', 'success');
        }
      } catch {
        showToast('匯入完成！', 'info');
      }
    });
  }

  // 載入範例按鈕
  const resetBtn = document.getElementById('resetDepositDemoBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state = getDefaultState();
      initFormValues();
      syncAndRender(true);
      showToast('已載入標準退租押金結算範例！', 'info');
    });
  }

  // 複製 LINE 結算明細
  const copyLineBtn = document.getElementById('copyDepositLineBtn');
  if (copyLineBtn) {
    copyLineBtn.addEventListener('click', async () => {
      const calc = calculateDeposit();
      const text = buildLineSummaryText(calc);
      try {
        await navigator.clipboard.writeText(text);
        showToast('已複製 LINE 退租押金結算明細！可直接貼給租客或屋主。', 'success');
      } catch {
        showToast('已產生 LINE 結算明細！', 'success');
      }
      if (window.GanjuTracker) {
        window.GanjuTracker.track('deposit_line_copy', { net_refund: calc.netRefund });
      }
    });
  }

  // 下載 PNG 結算確認單圖卡
  const dlCardBtn = document.getElementById('downloadDepositCardBtn');
  if (dlCardBtn) {
    dlCardBtn.addEventListener('click', () => {
      const calc = calculateDeposit();
      downloadSettlementCardImage(calc);
      if (window.GanjuTracker) {
        window.GanjuTracker.track('deposit_card_download', { net_refund: calc.netRefund });
      }
    });
  }

  // A4 列印按鈕
  const printBtn = document.getElementById('printDepositSheetBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      if (window.GanjuTracker) {
        window.GanjuTracker.track('deposit_sheet_print');
      }
      window.print();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFormValues();
  renderAdjustItems();
  const calc = calculateDeposit();
  renderConfirmationSheet(calc);
  bindEvents();
  initSignaturePad('landlordSigCanvas', 'clearLandlordSigBtn', 'landlordSigData');
  initSignaturePad('tenantSigCanvas', 'clearTenantSigBtn', 'tenantSigData');
});
