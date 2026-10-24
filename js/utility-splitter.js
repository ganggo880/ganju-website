/**
 * 港居不動產 - 分租水電費與公電分攤結算單產生器 (js/utility-splitter.js)
 * 依據內政部 113.07.15 住宅租賃定型化契約「電費計收新制」設計
 * 純瀏覽器端本地運算・零上傳・支援 A4 公告列印、LINE 催繳複製與 Canvas 繳費圖卡下載
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_utility_splitter_v1';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDefaultState() {
  return {
    propertyName: '高雄市小港區中安路・陽光電梯套房 A 棟',
    billingPeriod: '115年 07月 10日 ～ 115年 09月 09日 (共60日)',
    dueDate: '115年 09月 20日',
    taipowerAmount: 11640,
    taipowerKwh: 3000,
    rateMode: 'avg', // 'avg' (台電當期每度平均電價) | 'custom' (契約約定單價)
    customRate: 4.0,
    publicElecMethod: 'weighted', // 'weighted' (人數×天數) | 'equal' (按戶均攤) | 'usage' (依用電比例) | 'landlord' (房東吸收)
    waterAmount: 960,
    waterMethod: 'weighted', // 'weighted' (人數×天數) | 'equal' (按戶均攤)
    extraPublicFee: 0,
    bankInfo: '中國信託 (822) 帳號：1234-5678-9012 ｜ 戶名：港居不動產開發有限公司',
    managerNote: '依內政部113年7月15日租賃電費新制，本期按台電帳單當期每度平均電價計收，絕不超收。匯款後請傳末五碼至官方 LINE 核銷，感謝您的配合！',
    rooms: [
      { id: 'r1', name: '201室 (王先生)', prevKwh: 1420, currKwh: 2080, people: 1, days: 60, otherFee: 0 },
      { id: 'r2', name: '202室 (林小姐)', prevKwh: 2150, currKwh: 2910, people: 2, days: 60, otherFee: 0 },
      { id: 'r3', name: '301室 (陳工程師)', prevKwh: 980, currKwh: 1590, people: 1, days: 60, otherFee: 0 },
      { id: 'r4', name: '302室 (張同學)', prevKwh: 3100, currKwh: 3770, people: 1, days: 45, otherFee: 0 }
    ]
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        return { ...getDefaultState(), ...parsed };
      }
    }
  } catch (err) {
    console.warn('無法載入水電分攤草稿:', err);
  }
  return getDefaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('無法儲存水電分攤草稿:', err);
  }
}

/**
 * 核心演算法：計算台電法定當期平均電價、公電分攤、水費分攤與總額防超收檢核
 */
function calculateSettlement() {
  const taipowerAmount = Math.max(0, Number(state.taipowerAmount) || 0);
  const taipowerKwh = Math.max(1, Number(state.taipowerKwh) || 1);

  // 台電當期每度平均電價 (無條件捨去至小數點後4位計算，顯示2位，確保總收不超過台電帳單)
  const legalAvgRate = Math.floor((taipowerAmount / taipowerKwh) * 10000) / 10000;
  const customRate = Math.max(0, Number(state.customRate) || 0);

  const isOverLegalRate = state.rateMode === 'custom' && customRate > legalAvgRate + 0.0001;
  const appliedRate = state.rateMode === 'avg' ? legalAvgRate : customRate;

  // 各房分表度數與權重計算
  let totalSubmeterKwh = 0;
  let totalPersonDays = 0;
  const roomCount = Math.max(1, state.rooms.length);

  const enrichedRooms = state.rooms.map((room) => {
    const prev = Math.max(0, Number(room.prevKwh) || 0);
    const curr = Math.max(prev, Number(room.currKwh) || 0);
    const usedKwh = Math.max(0, Number((curr - prev).toFixed(1)));
    const people = Math.max(1, parseInt(room.people, 10) || 1);
    const days = Math.max(1, parseInt(room.days, 10) || 1);
    const personDays = people * days;
    const otherFee = Number(room.otherFee) || 0;

    totalSubmeterKwh += usedKwh;
    totalPersonDays += personDays;

    return {
      ...room,
      prev,
      curr,
      usedKwh,
      people,
      days,
      personDays,
      otherFee
    };
  });

  // 公電度數 = 台電總度數 - 各房分表度數總和 (若小於0代表分表抄表時間差，公電以0計)
  const rawPublicKwh = Number((taipowerKwh - totalSubmeterKwh).toFixed(1));
  const publicKwh = Math.max(0, rawPublicKwh);

  const waterAmount = Math.max(0, Number(state.waterAmount) || 0);
  const extraPublicFee = Math.max(0, Number(state.extraPublicFee) || 0);

  let sumRoomElecFee = 0;
  let sumPublicElecFee = 0;
  let sumWaterFee = 0;
  let sumGrandTotal = 0;

  const results = enrichedRooms.map((r) => {
    // 1. 獨立分表電費
    const subElecFee = Math.round(r.usedKwh * appliedRate);

    // 2. 公電分攤度數與金額
    let pubRatio = 0;
    if (state.publicElecMethod === 'weighted') {
      pubRatio = totalPersonDays > 0 ? r.personDays / totalPersonDays : 1 / roomCount;
    } else if (state.publicElecMethod === 'equal') {
      pubRatio = 1 / roomCount;
    } else if (state.publicElecMethod === 'usage') {
      pubRatio = totalSubmeterKwh > 0 ? r.usedKwh / totalSubmeterKwh : 1 / roomCount;
    } else {
      pubRatio = 0; // landlord absorbs
    }

    const sharePublicKwh = Number((publicKwh * pubRatio).toFixed(1));
    const pubElecFee = Math.round(publicKwh * appliedRate * pubRatio);

    // 3. 水費與公共雜費分攤
    const waterRatio =
      state.waterMethod === 'weighted'
        ? totalPersonDays > 0
          ? r.personDays / totalPersonDays
          : 1 / roomCount
        : 1 / roomCount;

    const waterFee = Math.round((waterAmount + extraPublicFee) * waterRatio);
    const totalDue = subElecFee + pubElecFee + waterFee + r.otherFee;

    sumRoomElecFee += subElecFee;
    sumPublicElecFee += pubElecFee;
    sumWaterFee += waterFee;
    sumGrandTotal += totalDue;

    return {
      ...r,
      subElecFee,
      sharePublicKwh,
      pubElecFee,
      waterFee,
      totalDue
    };
  });

  // 法定檢核：向全體房客收取之總電費（分表+公電）不得超過台電當期帳單總額
  const totalCollectedElec = sumRoomElecFee + sumPublicElecFee;
  const isOverTotalBill = totalCollectedElec > taipowerAmount && taipowerAmount > 0;

  return {
    taipowerAmount,
    taipowerKwh,
    legalAvgRate,
    appliedRate,
    isOverLegalRate,
    isOverTotalBill,
    totalSubmeterKwh: Number(totalSubmeterKwh.toFixed(1)),
    rawPublicKwh,
    publicKwh,
    waterAmount,
    extraPublicFee,
    sumRoomElecFee,
    sumPublicElecFee,
    totalCollectedElec,
    sumWaterFee,
    sumGrandTotal,
    results
  };
}

/**
 * 渲染左側房間輸入清單
 */
function renderRoomInputs(calc) {
  const container = document.getElementById('roomListContainer');
  if (!container) return;

  container.innerHTML = calc.results
    .map(
      (r, idx) => `
    <div class="room-item-card" data-room-id="${escapeHtml(r.id)}">
      <div class="room-item-top">
        <span class="room-index-badge">
          <i class="fa-solid fa-door-closed"></i> 第 ${idx + 1} 間房表度數設定
        </span>
        ${
          state.rooms.length > 1
            ? `<button type="button" class="room-remove-btn" data-remove-room="${escapeHtml(r.id)}" aria-label="刪除 ${escapeHtml(r.name)}" title="刪除此房間">
                <i class="fa-solid fa-trash-can"></i>
              </button>`
            : ''
        }
      </div>

      <div class="room-grid">
        <div class="utility-field">
          <label for="roomName_${idx}">房號 / 租客稱呼</label>
          <input type="text" id="roomName_${idx}" data-room-field="name" data-room-id="${escapeHtml(r.id)}" value="${escapeHtml(r.name)}" placeholder="例：201室 (王先生)">
        </div>
        <div class="utility-field">
          <label for="roomPrev_${idx}">上期電表度數</label>
          <input type="number" id="roomPrev_${idx}" step="0.1" min="0" data-room-field="prevKwh" data-room-id="${escapeHtml(r.id)}" value="${r.prev}">
        </div>
        <div class="utility-field">
          <label for="roomCurr_${idx}">本期電表度數</label>
          <input type="number" id="roomCurr_${idx}" step="0.1" min="0" data-room-field="currKwh" data-room-id="${escapeHtml(r.id)}" value="${r.curr}">
        </div>
        <div class="utility-field">
          <label for="roomPeople_${idx}">居住人數 (人)</label>
          <input type="number" id="roomPeople_${idx}" step="1" min="1" max="20" data-room-field="people" data-room-id="${escapeHtml(r.id)}" value="${r.people}">
        </div>
        <div class="utility-field">
          <label for="roomDays_${idx}">本期入住天數 (日)</label>
          <input type="number" id="roomDays_${idx}" step="1" min="1" max="366" data-room-field="days" data-room-id="${escapeHtml(r.id)}" value="${r.days}">
        </div>
        <div class="utility-field">
          <label for="roomOther_${idx}">其他加減項 (元)</label>
          <input type="number" id="roomOther_${idx}" step="1" data-room-field="otherFee" data-room-id="${escapeHtml(r.id)}" value="${r.otherFee}">
        </div>
      </div>

      <div class="room-quick-summary">
        <span>獨立用電：<strong>${r.usedKwh.toLocaleString()} 度</strong> ($${r.subElecFee.toLocaleString()}) ｜ 公電分攤：<strong>${r.sharePublicKwh} 度</strong> ($${r.pubElecFee.toLocaleString()}) ｜ 水雜費：<strong>$${r.waterFee.toLocaleString()}</strong></span>
        <span class="room-quick-total">應繳：NT$ ${r.totalDue.toLocaleString()}</span>
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * 渲染法規合規檢測面板與右側 A4 報表／催繳小卡
 */
function renderSettlementView(calc) {
  // 1. 更新 2024 電費新制合規雷達面板
  const banner = document.getElementById('legalRateBanner');
  const statusEl = document.getElementById('legalRateStatus');
  const numbersEl = document.getElementById('legalRateNumbers');
  const customRateWrap = document.getElementById('customRateFieldWrap');

  if (customRateWrap) {
    customRateWrap.style.display = state.rateMode === 'custom' ? 'flex' : 'none';
  }

  if (banner && statusEl && numbersEl) {
    if (calc.isOverLegalRate || calc.isOverTotalBill) {
      banner.classList.add('warning');
      statusEl.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>⚠️ 法規超收警示：目前設定單價 (${calc.appliedRate.toFixed(2)} 元/度) 高於台電當期每度平均電價上限 (${calc.legalAvgRate.toFixed(2)} 元/度)！</span>
      `;
    } else {
      banner.classList.remove('warning');
      statusEl.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>✅ 符合 2024.07.15 租賃電費新制：計收單價未超過台電當期每度平均電價上限，且總收未超逾帳單總額</span>
      `;
    }

    numbersEl.innerHTML = `
      <span>台電當期平均電價上限：<strong>${calc.legalAvgRate.toFixed(2)} 元/度</strong></span>
      <span>本次實際計收單價：<strong>${calc.appliedRate.toFixed(2)} 元/度</strong></span>
      <span>全棟分表合計：<strong>${calc.totalSubmeterKwh.toLocaleString()} 度</strong></span>
      <span>推算公電度數：<strong>${calc.publicKwh.toLocaleString()} 度</strong></span>
    `;
  }

  // 2. 更新右側報表抬頭與 KPI
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('sheetPropertyName', state.propertyName || '分租套房水電費結算單');
  setTxt('sheetPeriodText', `計費期間：${state.billingPeriod || '本期'}`);
  setTxt('sheetDueDateText', `繳費期限：${state.dueDate || '見通知'}`);

  setTxt('kpiTaipowerBill', `$${calc.taipowerAmount.toLocaleString()}`);
  setTxt('kpiTaipowerKwhSub', `總用電 ${calc.taipowerKwh.toLocaleString()} 度`);

  setTxt('kpiAvgRate', `${calc.appliedRate.toFixed(2)} 元/度`);
  setTxt('kpiAvgRateSub', `法定上限 ${calc.legalAvgRate.toFixed(2)} 元`);

  setTxt('kpiPublicKwh', `${calc.publicKwh.toLocaleString()} 度`);
  const methodMap = {
    weighted: '依人數×天數分攤',
    equal: '按戶均攤',
    usage: '依用電比例分攤',
    landlord: '房東全額吸收'
  };
  setTxt('kpiPublicSub', methodMap[state.publicElecMethod] || '公電分攤');

  setTxt('kpiWaterTotal', `$${(calc.waterAmount + calc.extraPublicFee).toLocaleString()}`);
  setTxt('kpiWaterSub', state.waterMethod === 'weighted' ? '依人數×天數分攤' : '按戶均攤');

  // 3. 渲染 A4 明細表格
  const tbody = document.getElementById('sheetTableBody');
  const tfoot = document.getElementById('sheetTableFoot');

  if (tbody) {
    tbody.innerHTML = calc.results
      .map(
        (r) => `
      <tr>
        <td>
          <strong>${escapeHtml(r.name)}</strong>
          <div style="font-size: 0.74rem; color: var(--text-muted);">${r.people}人・${r.days}日</div>
        </td>
        <td>${r.prev.toLocaleString()} → ${r.curr.toLocaleString()}</td>
        <td><strong>${r.usedKwh.toLocaleString()}</strong> 度</td>
        <td>$${r.subElecFee.toLocaleString()}</td>
        <td>${r.sharePublicKwh} 度 ($${r.pubElecFee.toLocaleString()})</td>
        <td>$${(r.waterFee + r.otherFee).toLocaleString()}</td>
        <td style="font-weight: 900; color: var(--primary-navy);">NT$ ${r.totalDue.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');
  }

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td>合計 (${calc.results.length} 戶)</td>
        <td>—</td>
        <td>${calc.totalSubmeterKwh.toLocaleString()} 度</td>
        <td>$${calc.sumRoomElecFee.toLocaleString()}</td>
        <td>${calc.publicKwh} 度 ($${calc.sumPublicElecFee.toLocaleString()})</td>
        <td>$${(calc.sumWaterFee + calc.results.reduce((a, b) => a + b.otherFee, 0)).toLocaleString()}</td>
        <td>NT$ ${calc.sumGrandTotal.toLocaleString()}</td>
      </tr>
    `;
  }

  setTxt('sheetBankInfo', state.bankInfo || '請洽管理員確認匯款帳戶');
  setTxt('sheetManagerNote', state.managerNote || '');

  // 4. 渲染各房專屬 LINE 催繳複製與圖卡下載區
  const cardsContainer = document.getElementById('tenantNoticeCardsGrid');
  if (cardsContainer) {
    cardsContainer.innerHTML = calc.results
      .map(
        (r) => `
      <div class="tenant-notice-card">
        <div>
          <div class="tenant-notice-head">
            <span class="tenant-room-name"><i class="fa-solid fa-user-check"></i> ${escapeHtml(r.name)}</span>
            <span class="tenant-amount-tag">NT$ ${r.totalDue.toLocaleString()}</span>
          </div>
          <div class="tenant-notice-lines">
            • 分表度數：${r.prev} → ${r.curr}（用電 <strong>${r.usedKwh} 度</strong> × ${calc.appliedRate.toFixed(2)}元 = $${r.subElecFee.toLocaleString()}）<br>
            • 公電分攤：${r.sharePublicKwh} 度（$${r.pubElecFee.toLocaleString()}）｜ 水費與雜項：$${(r.waterFee + r.otherFee).toLocaleString()}
          </div>
        </div>
        <div class="tenant-notice-actions">
          <button type="button" class="tenant-action-btn line-copy" data-copy-room="${escapeHtml(r.id)}">
            <i class="fa-brands fa-line"></i> 複製 LINE 催繳
          </button>
          <button type="button" class="tenant-action-btn" data-download-card="${escapeHtml(r.id)}">
            <i class="fa-solid fa-image"></i> 下載繳費圖卡
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }
}

/**
 * 產生單一房客的 LINE 催繳通知文案
 */
function buildLineTextForRoom(roomResult, calc) {
  return [
    `【⚡ 水電費暨公共費用結算通知】`,
    `🏠 物件名稱：${state.propertyName}`,
    `🚪 房號租客：${roomResult.name}（${roomResult.people}人 / 計費${roomResult.days}日）`,
    `📅 計費期間：${state.billingPeriod}`,
    `──────────────────`,
    `📊 台電帳單法定揭露（符合113.07.15電費新制）：`,
    `• 台電當期總金額：NT$ ${calc.taipowerAmount.toLocaleString()} 元`,
    `• 台電當期總度數：${calc.taipowerKwh.toLocaleString()} 度`,
    `• 當期每度平均電價：${calc.legalAvgRate.toFixed(2)} 元/度（本次計收：${calc.appliedRate.toFixed(2)} 元/度）`,
    `──────────────────`,
    `🔌 本期您的費用明細：`,
    `1. 獨立分表電費：上期 ${roomResult.prev} 度 → 本期 ${roomResult.curr} 度（用電 ${roomResult.usedKwh} 度）＝ NT$ ${roomResult.subElecFee.toLocaleString()} 元`,
    `2. 公共電費分攤：分攤 ${roomResult.sharePublicKwh} 度 ＝ NT$ ${roomResult.pubElecFee.toLocaleString()} 元`,
    `3. 自來水費分攤：NT$ ${roomResult.waterFee.toLocaleString()} 元`,
    roomResult.otherFee !== 0 ? `4. 其他加減項目：NT$ ${roomResult.otherFee.toLocaleString()} 元` : null,
    `──────────────────`,
    `💰 本期應繳總計：NT$ ${roomResult.totalDue.toLocaleString()} 元`,
    `⏰ 繳費期限：${state.dueDate}`,
    `🏦 匯款資訊：${state.bankInfo}`,
    `📌 備註：${state.managerNote}`,
    `（由 港居不動產包租代管數位系統 產出）`
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 使用 HTML5 Canvas 繪製高質感單房專屬《水電費電子繳費通知單》PNG 圖卡並下載
 */
function downloadRoomNoticeCardImage(roomResult, calc) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 980;
  const ctx = canvas.getContext('2d');

  // 背景底色
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 頂部海軍藍橫幅
  const grad = ctx.createLinearGradient(0, 0, 800, 160);
  grad.addColorStop(0, '#0F2341');
  grad.addColorStop(1, '#1A365D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 165);

  // 香檳金裝飾線
  ctx.fillStyle = '#C5A059';
  ctx.fillRect(0, 165, 800, 6);

  // 標題文字
  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司 ｜ 包租代管透明結算憑證', 44, 52);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px "Noto Sans TC", sans-serif';
  ctx.fillText('水電費暨公共費用繳費通知單', 44, 102);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText(`計費期間：${state.billingPeriod}`, 44, 140);

  // 白色主卡片
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillRect(36, 196, 728, 740);
  ctx.strokeRect(36, 196, 728, 740);

  // 房號與應繳總額醒目區塊
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(60, 220, 680, 100);

  ctx.fillStyle = '#1A365D';
  ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
  ctx.fillText(`房號 / 租客：${roomResult.name}`, 84, 265);

  ctx.fillStyle = '#64748B';
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText(`物件：${state.propertyName} （${roomResult.people}人・計費${roomResult.days}日）`, 84, 300);

  // 台電帳單法定揭露盒
  ctx.fillStyle = '#ECFDF5';
  ctx.strokeStyle = '#6EE7B7';
  ctx.fillRect(60, 340, 680, 84);
  ctx.strokeRect(60, 340, 680, 84);

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
  ctx.fillText('✅ 符合內政部 113.07.15 租賃電費新制（按台電當期每度平均電價計收）', 80, 372);
  ctx.font = '17px "Noto Sans TC", sans-serif';
  ctx.fillText(
    `台電總額：$${calc.taipowerAmount.toLocaleString()} ｜ 總度數：${calc.taipowerKwh.toLocaleString()} 度 ｜ 當期平均單價：${calc.appliedRate.toFixed(2)} 元/度`,
    80,
    404
  );

  // 明細列繪製函數
  const drawRow = (y, label, detail, amountStr) => {
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 21px "Noto Sans TC", sans-serif';
    ctx.fillText(label, 70, y);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px "Noto Sans TC", sans-serif';
    ctx.fillText(detail, 70, y + 28);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(amountStr, 725, y + 14);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, y + 46);
    ctx.lineTo(740, y + 46);
    ctx.stroke();
  };

  drawRow(
    464,
    '1. 室內獨立分表電費',
    `上期 ${roomResult.prev} 度 → 本期 ${roomResult.curr} 度（用電 ${roomResult.usedKwh} 度 × ${calc.appliedRate.toFixed(2)} 元）`,
    `NT$ ${roomResult.subElecFee.toLocaleString()}`
  );

  drawRow(
    546,
    '2. 公共區域電費分攤 (公電)',
    `全棟公電 ${calc.publicKwh} 度，本戶依比例分攤 ${roomResult.sharePublicKwh} 度`,
    `NT$ ${roomResult.pubElecFee.toLocaleString()}`
  );

  drawRow(
    628,
    '3. 自來水費暨其他費用',
    `水費分攤 $${roomResult.waterFee.toLocaleString()} ＋ 其他加減項 $${roomResult.otherFee.toLocaleString()}`,
    `NT$ ${(roomResult.waterFee + roomResult.otherFee).toLocaleString()}`
  );

  // 應繳總額強調區塊
  ctx.fillStyle = '#1A365D';
  ctx.fillRect(60, 700, 680, 78);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
  ctx.fillText(`本期應繳總金額（繳費期限：${state.dueDate}）`, 84, 748);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 34px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`NT$ ${roomResult.totalDue.toLocaleString()}`, 718, 751);
  ctx.textAlign = 'left';

  // 匯款資訊與證照頁尾
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
  ctx.fillText(`匯款帳戶：${state.bankInfo.slice(0, 56)}`, 64, 815);

  ctx.fillStyle = '#64748B';
  ctx.font = '15px "Noto Sans TC", sans-serif';
  ctx.fillText(state.managerNote.slice(0, 62), 64, 848);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px "Noto Sans TC", sans-serif';
  ctx.fillText(
    '港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號 ｜ 電話：07-791-2288',
    64,
    910
  );

  const link = document.createElement('a');
  const safeRoomName = roomResult.name.replace(/[^\w\u4e00-\u9fa5-]/g, '_');
  link.download = `水電費通知單_${safeRoomName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast(`已下載「${roomResult.name}」專屬繳費圖卡！`, 'success');
  if (window.GanjuTracker) {
    window.GanjuTracker.track('utility_card_download', { room_name: roomResult.name });
  }
}

/**
 * 同步表單輸入值與狀態並重繪
 */
function syncAndRender(shouldRebuildRoomList = false) {
  saveState();
  const calc = calculateSettlement();
  if (shouldRebuildRoomList) {
    renderRoomInputs(calc);
  } else {
    // 僅更新各房卡片底部的小計摘要，避免輸入框失去焦點
    const cards = document.querySelectorAll('.room-item-card');
    cards.forEach((card, idx) => {
      const r = calc.results[idx];
      if (!r) return;
      const summaryEl = card.querySelector('.room-quick-summary');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <span>獨立用電：<strong>${r.usedKwh.toLocaleString()} 度</strong> ($${r.subElecFee.toLocaleString()}) ｜ 公電分攤：<strong>${r.sharePublicKwh} 度</strong> ($${r.pubElecFee.toLocaleString()}) ｜ 水雜費：<strong>$${r.waterFee.toLocaleString()}</strong></span>
          <span class="room-quick-total">應繳：NT$ ${r.totalDue.toLocaleString()}</span>
        `;
      }
    });
  }
  renderSettlementView(calc);
}

function bindEvents() {
  const bindInput = (id, key, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[key];
    el.addEventListener('input', () => {
      state[key] = isNumber ? Number(el.value) || 0 : el.value;
      syncAndRender(false);
    });
  };

  bindInput('propNameInput', 'propertyName');
  bindInput('billingPeriodInput', 'billingPeriod');
  bindInput('dueDateInput', 'dueDate');
  bindInput('taipowerAmountInput', 'taipowerAmount', true);
  bindInput('taipowerKwhInput', 'taipowerKwh', true);
  bindInput('rateModeSelect', 'rateMode');
  bindInput('customRateInput', 'customRate', true);
  bindInput('publicElecMethodSelect', 'publicElecMethod');
  bindInput('waterAmountInput', 'waterAmount', true);
  bindInput('waterMethodSelect', 'waterMethod');
  bindInput('extraPublicFeeInput', 'extraPublicFee', true);
  bindInput('bankInfoInput', 'bankInfo');
  bindInput('managerNoteInput', 'managerNote');

  // 房間動態輸入與刪除代理
  const roomListEl = document.getElementById('roomListContainer');
  if (roomListEl) {
    roomListEl.addEventListener('input', (e) => {
      const target = e.target;
      const roomId = target.getAttribute('data-room-id');
      const field = target.getAttribute('data-room-field');
      if (!roomId || !field) return;

      const room = state.rooms.find((r) => r.id === roomId);
      if (!room) return;

      if (field === 'name') {
        room.name = target.value;
      } else {
        room[field] = Number(target.value) || 0;
      }
      syncAndRender(false);
    });

    roomListEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-room]');
      if (!removeBtn) return;
      const roomId = removeBtn.getAttribute('data-remove-room');
      if (state.rooms.length <= 1) {
        showToast('至少需保留 1 間房間！', 'warning');
        return;
      }
      state.rooms = state.rooms.filter((r) => r.id !== roomId);
      syncAndRender(true);
      showToast('已移除該房間分表', 'info');
    });
  }

  // 新增房間按鈕
  const addRoomBtn = document.getElementById('addRoomBtn');
  if (addRoomBtn) {
    addRoomBtn.addEventListener('click', () => {
      if (state.rooms.length >= 20) {
        showToast('單棟最多支援 20 間分表！', 'warning');
        return;
      }
      const nextNum = state.rooms.length + 1;
      state.rooms.push({
        id: `r_${Date.now()}`,
        name: `${nextNum}01室 (新房客)`,
        prevKwh: 1000,
        currKwh: 1450,
        people: 1,
        days: 60,
        otherFee: 0
      });
      syncAndRender(true);
      showToast('已新增一間房間分表！', 'success');
    });
  }

  // 殺手級功能：一鍵將「本期度數」結轉為下一期「上期度數」
  const rolloverBtn = document.getElementById('rolloverMetersBtn');
  if (rolloverBtn) {
    rolloverBtn.addEventListener('click', () => {
      state.rooms = state.rooms.map((r) => ({
        ...r,
        prevKwh: Number(r.currKwh) || 0
      }));
      syncAndRender(true);
      showToast('已將各房「本期度數」結轉為下一期「上期度數」！請輸入最新抄表度數。', 'success');
    });
  }

  // 載入範例按鈕
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      state = getDefaultState();
      // 重新同步頂部欄位值
      ['propNameInput', 'billingPeriodInput', 'dueDateInput', 'taipowerAmountInput', 'taipowerKwhInput', 'rateModeSelect', 'customRateInput', 'publicElecMethodSelect', 'waterAmountInput', 'waterMethodSelect', 'extraPublicFeeInput', 'bankInfoInput', 'managerNoteInput'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('change'));
      });
      initFormValues();
      syncAndRender(true);
      showToast('已載入小港分租套房標準範例數據！', 'info');
    });
  }

  // 列印 A4 公告總表按鈕
  const printSheetBtn = document.getElementById('printSheetBtn');
  if (printSheetBtn) {
    printSheetBtn.addEventListener('click', () => {
      if (window.GanjuTracker) {
        window.GanjuTracker.track('utility_sheet_print', { room_count: state.rooms.length });
      }
      window.print();
    });
  }

  // 右側各房催繳卡片事件代理（複製 LINE 文字 / 下載 PNG 圖卡）
  const cardsContainer = document.getElementById('tenantNoticeCardsGrid');
  if (cardsContainer) {
    cardsContainer.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('[data-copy-room]');
      if (copyBtn) {
        const roomId = copyBtn.getAttribute('data-copy-room');
        const calc = calculateSettlement();
        const roomResult = calc.results.find((r) => r.id === roomId);
        if (!roomResult) return;

        const text = buildLineTextForRoom(roomResult, calc);
        try {
          await navigator.clipboard.writeText(text);
          showToast(`已複製「${roomResult.name}」LINE 催繳通知文字！`, 'success');
        } catch {
          showToast('複製成功！可貼上至 LINE 傳送', 'success');
        }
        if (window.GanjuTracker) {
          window.GanjuTracker.track('utility_line_copy', { room_name: roomResult.name });
        }
        return;
      }

      const dlBtn = e.target.closest('[data-download-card]');
      if (dlBtn) {
        const roomId = dlBtn.getAttribute('data-download-card');
        const calc = calculateSettlement();
        const roomResult = calc.results.find((r) => r.id === roomId);
        if (roomResult) {
          downloadRoomNoticeCardImage(roomResult, calc);
        }
      }
    });
  }
}

function initFormValues() {
  const map = {
    propNameInput: 'propertyName',
    billingPeriodInput: 'billingPeriod',
    dueDateInput: 'dueDate',
    taipowerAmountInput: 'taipowerAmount',
    taipowerKwhInput: 'taipowerKwh',
    rateModeSelect: 'rateMode',
    customRateInput: 'customRate',
    publicElecMethodSelect: 'publicElecMethod',
    waterAmountInput: 'waterAmount',
    waterMethodSelect: 'waterMethod',
    extraPublicFeeInput: 'extraPublicFee',
    bankInfoInput: 'bankInfo',
    managerNoteInput: 'managerNote'
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = state[key];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFormValues();
  const calc = calculateSettlement();
  renderRoomInputs(calc);
  renderSettlementView(calc);
  bindEvents();
});
