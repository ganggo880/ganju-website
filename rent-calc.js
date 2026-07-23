// DOM Elements Cache
const monthlyRentInput = document.getElementById('monthlyRent');
const clearRentBtn = document.getElementById('clearRent');
const calcBasisRadios = document.querySelectorAll('input[name="calcBasis"]');
const customBasisWrapper = document.getElementById('customBasisWrapper');
const customBasisDaysInput = document.getElementById('customBasisDays');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const daysInput = document.getElementById('daysInput');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const dateCalcResult = document.getElementById('dateCalcResult');
const resultBasis = document.getElementById('resultBasis');
const dailyRentOutput = document.getElementById('dailyRent');
const totalRentOutput = document.getElementById('totalRent');
const formulaText = document.getElementById('formulaText');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const historyPlaceholder = document.getElementById('historyPlaceholder');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeToggleBtn = document.getElementById('themeToggle');
const roundingModeSelect = document.getElementById('roundingMode');
const currencySelect = document.getElementById('currencySelect');
const toast = document.getElementById('toast');

// Brand Specific DOM Cache
const enableFeeSplitCheckbox = document.getElementById('enableFeeSplit');
const feeSplitInputsWrapper = document.getElementById('feeSplitInputs');
const feeRateInput = document.getElementById('feeRate');
const ownerShareRateInput = document.getElementById('ownerShareRate');
const feeOwnerNetOutput = document.getElementById('feeOwnerNet');
const feeAgencyOutput = document.getElementById('feeAgency');

// Application State
let state = {
  monthlyRent: 0,
  calcBasis: '30', // '30', 'actual', 'custom'
  customBasisDays: 30,
  activeTab: 'tab-days', // 'tab-days', 'tab-dates'
  days: 0,
  startDate: '',
  endDate: '',
  roundingMode: 'round', // 'round', 'floor', 'ceil', 'keep-decimals'
  currency: 'TWD',
  currencySymbol: '$',
  enableFeeSplit: false,
  feeRate: 10,
  history: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadHistory();
  setDefaultDates();
  setupEventListeners();
  calculateRent();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('rent_calc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('rent_calc_theme', newTheme);
  showToast(newTheme === 'dark' ? '已切換至深色模式 🌙' : '已切換至淺色模式 ☀️');
});

// Setup Default Dates
function setDefaultDates() {
  const today = new Date();
  const format = (d) => d.toISOString().split('T')[0];
  
  startDateInput.value = format(today);
  
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + 9); // 10 days inclusive preview
  endDateInput.value = format(targetDate);
  
  state.startDate = startDateInput.value;
  state.endDate = endDateInput.value;
}

// Event Listeners Configuration
function setupEventListeners() {
  // Monthly Rent Input & Comma Formatting
  monthlyRentInput.addEventListener('input', (e) => {
    let rawValue = e.target.value.replace(/,/g, '').replace(/\D/g, '');
    
    if (rawValue === '') {
      state.monthlyRent = 0;
      e.target.value = '';
      clearRentBtn.style.display = 'none';
    } else {
      state.monthlyRent = parseInt(rawValue, 10);
      e.target.value = formatNumberWithCommas(state.monthlyRent);
      clearRentBtn.style.display = 'block';
    }
    calculateRent();
  });

  clearRentBtn.addEventListener('click', () => {
    monthlyRentInput.value = '';
    state.monthlyRent = 0;
    clearRentBtn.style.display = 'none';
    calculateRent();
    monthlyRentInput.focus();
  });

  // Calculation Basis Toggle
  document.querySelectorAll('input[name="calcBasis"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.calcBasis = e.target.value;
      if (state.calcBasis === 'custom') {
        customBasisWrapper.classList.add('expanded');
        if (!customBasisDaysInput.value) {
          customBasisDaysInput.value = '30';
        }
        state.customBasisDays = parseFloat(customBasisDaysInput.value) || 30;
      } else {
        customBasisWrapper.classList.remove('expanded');
      }
      calculateRent();
    });
  });

  customBasisDaysInput.addEventListener('input', (e) => {
    state.customBasisDays = parseFloat(e.target.value) || 30;
    calculateRent();
  });

  // Tabs switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      state.activeTab = tabId;
      calculateRent();
    });
  });

  // Days direct input
  daysInput.addEventListener('input', (e) => {
    state.days = parseFloat(e.target.value) || 0;
    calculateRent();
  });

  // Date picker inputs
  startDateInput.addEventListener('change', (e) => {
    state.startDate = e.target.value;
    calculateRent();
  });

  endDateInput.addEventListener('change', (e) => {
    state.endDate = e.target.value;
    calculateRent();
  });

  // Calculation settings dropdowns
  roundingModeSelect.addEventListener('change', (e) => {
    state.roundingMode = e.target.value;
    calculateRent();
  });

  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    const selectedOption = currencySelect.options[currencySelect.selectedIndex];
    state.currencySymbol = selectedOption.getAttribute('data-symbol');
    
    document.querySelector('label[for="monthlyRent"]').innerText = `每月租金 (${state.currency})`;
    
    calculateRent();
  });

  // Brand Specific - Management Fee Split Event Listeners
  enableFeeSplitCheckbox.addEventListener('change', (e) => {
    state.enableFeeSplit = e.target.checked;
    if (state.enableFeeSplit) {
      feeSplitInputsWrapper.classList.add('expanded');
    } else {
      feeSplitInputsWrapper.classList.remove('expanded');
    }
    calculateRent();
  });

  feeRateInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0) {
      state.feeRate = 0;
    } else if (val > 100) {
      state.feeRate = 100;
      e.target.value = 100;
    } else {
      state.feeRate = val;
    }
    ownerShareRateInput.value = (100 - state.feeRate).toFixed(e.target.value.includes('.') ? e.target.value.split('.')[1].length : 0);
    calculateRent();
  });

  // Copy Action
  copyBtn.addEventListener('click', copyReceiptToClipboard);

  // Save Action
  saveBtn.addEventListener('click', saveToHistory);

  // Clear History
  clearHistoryBtn.addEventListener('click', clearAllHistory);
}

// Formatting Helper
function formatNumberWithCommas(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get Days In a Month (helper)
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Date Range Math: calculates inclusive day difference
function calculateDateDiff(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (end < start) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
  return diffDays;
}

// Format date nicely (e.g. 2026/06/27)
function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '/');
}

// Core Calculations
function calculateRent() {
  let dailyRent = 0;
  let totalRent = 0;
  let rentDays = 0;
  let calculationDetailsText = '';
  let basisLabel = '';

  // 1. Determine Days to Calculate
  if (state.activeTab === 'tab-days') {
    rentDays = state.days;
    dateCalcResult.innerText = '';
  } else {
    rentDays = calculateDateDiff(state.startDate, state.endDate);
    if (!state.startDate || !state.endDate) {
      dateCalcResult.innerHTML = `<span style="color: var(--text-muted);">請選擇起迄日期</span>`;
    } else if (state.endDate < state.startDate) {
      dateCalcResult.innerHTML = `<span style="color: #ef4444; font-weight: 500;">錯誤：截止日期小於起算日期</span>`;
      rentDays = 0;
    } else {
      dateCalcResult.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--accent-secondary);"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        起迄區間共 <strong>${rentDays}</strong> 天 (包含首尾日)
      `;
    }
  }

  // 2. Perform Math based on Rent and Calculation Basis
  if (state.monthlyRent > 0 && rentDays > 0) {
    if (state.calcBasis === '30') {
      basisLabel = '固定 30 日/月';
      resultBasis.innerText = '30 日 / 月';
      
      const rate = state.monthlyRent / 30;
      dailyRent = rate;
      totalRent = rate * rentDays;
      
      calculationDetailsText = `${formatNumberWithCommas(state.monthlyRent)} ÷ 30 × ${rentDays} = ${formatNumberWithCommas(formatRounding(totalRent))}`;
    } 
    else if (state.calcBasis === 'custom') {
      const basis = state.customBasisDays > 0 ? state.customBasisDays : 30;
      basisLabel = `自訂基準 (${basis}天)`;
      resultBasis.innerText = `${basis} 日 / 月`;
      
      const rate = state.monthlyRent / basis;
      dailyRent = rate;
      totalRent = rate * rentDays;
      
      calculationDetailsText = `${formatNumberWithCommas(state.monthlyRent)} ÷ ${basis} × ${rentDays} = ${formatNumberWithCommas(formatRounding(totalRent))}`;
    } 
    else if (state.calcBasis === 'actual') {
      resultBasis.innerText = '當月實際天數';
      
      if (state.activeTab === 'tab-days') {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
        const monthName = today.toLocaleDateString('zh-TW', { month: 'long' });
        
        basisLabel = `當月實際 (${monthName} ${daysInCurrentMonth}天)`;
        resultBasis.innerText = `${daysInCurrentMonth} 日 / 月 (當前月份)`;
        
        const rate = state.monthlyRent / daysInCurrentMonth;
        dailyRent = rate;
        totalRent = rate * rentDays;
        
        calculationDetailsText = `${formatNumberWithCommas(state.monthlyRent)} ÷ ${daysInCurrentMonth} (${monthName}實際天數) × ${rentDays} = ${formatNumberWithCommas(formatRounding(totalRent))}`;
      } 
      else {
        const start = new Date(state.startDate);
        const end = new Date(state.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        let current = new Date(start);
        let accumulatedRent = 0;
        let monthBreakdown = {};
        
        while (current <= end) {
          const year = current.getFullYear();
          const month = current.getMonth();
          const daysInMonth = getDaysInMonth(year, month);
          
          accumulatedRent += state.monthlyRent / daysInMonth;
          
          const key = `${year}/${String(month + 1).padStart(2, '0')}`;
          if (!monthBreakdown[key]) {
            monthBreakdown[key] = { days: 0, daysInMonth: daysInMonth };
          }
          monthBreakdown[key].days++;
          
          current.setDate(current.getDate() + 1);
        }
        
        totalRent = accumulatedRent;
        dailyRent = totalRent / rentDays;
        basisLabel = '當月實際天數 (按日按月比例)';
        
        const breakdownKeys = Object.keys(monthBreakdown);
        if (breakdownKeys.length === 1) {
          const key = breakdownKeys[0];
          const item = monthBreakdown[key];
          calculationDetailsText = `${formatNumberWithCommas(state.monthlyRent)} ÷ ${item.daysInMonth} (${key} 天數) × ${item.days} = ${formatNumberWithCommas(formatRounding(totalRent))}`;
        } else {
          let parts = breakdownKeys.map(k => {
            const item = monthBreakdown[k];
            const partialVal = (state.monthlyRent / item.daysInMonth) * item.days;
            return `${k} (${item.days}天): ${formatNumberWithCommas(formatRounding(partialVal))}`;
          });
          calculationDetailsText = `跨月比例計算：\n` + parts.join('\n') + `\n合計應付：${formatNumberWithCommas(formatRounding(totalRent))}`;
        }
      }
    }
  }

  // 2b. Calculate Brand specific management fee split
  let agencyFeeVal = 0;
  let ownerNetRentVal = 0;
  
  if (state.monthlyRent > 0 && rentDays > 0) {
    agencyFeeVal = totalRent * (state.feeRate / 100);
    const roundedAgency = formatRounding(agencyFeeVal);
    const roundedTotal = formatRounding(totalRent);
    
    if (state.roundingMode === 'keep-decimals') {
      ownerNetRentVal = roundedTotal - roundedAgency;
    } else {
      ownerNetRentVal = Math.round(roundedTotal - roundedAgency);
    }
  }

  // 3. Render outputs to UI
  if (state.monthlyRent === 0 || rentDays === 0) {
    dailyRentOutput.innerText = '0';
    totalRentOutput.innerText = '0';
    formulaText.innerText = '請輸入金額和天數開始計算';
    
    feeOwnerNetOutput.innerText = '0';
    feeAgencyOutput.innerText = '0';
  } else {
    const formattedDaily = formatRounding(dailyRent);
    const formattedTotal = formatRounding(totalRent);
    
    dailyRentOutput.innerText = typeof formattedDaily === 'number' ? formatNumberWithCommas(formattedDaily) : formattedDaily;
    totalRentOutput.innerText = typeof formattedTotal === 'number' ? formatNumberWithCommas(formattedTotal) : formattedTotal;
    formulaText.innerText = calculationDetailsText;
    
    const roundedAgency = formatRounding(agencyFeeVal);
    const roundedOwnerNet = ownerNetRentVal;
    
    feeAgencyOutput.innerText = typeof roundedAgency === 'number' ? formatNumberWithCommas(roundedAgency) : roundedAgency;
    feeOwnerNetOutput.innerText = typeof roundedOwnerNet === 'number' ? formatNumberWithCommas(roundedOwnerNet) : roundedOwnerNet;
  }
}

// Math Rounding Engine based on setting
function formatRounding(value) {
  if (state.roundingMode === 'keep-decimals') {
    return parseFloat(value.toFixed(2));
  } else if (state.roundingMode === 'floor') {
    return Math.floor(value);
  } else if (state.roundingMode === 'ceil') {
    return Math.ceil(value);
  } else {
    return Math.round(value);
  }
}

// Generate formatted text details for clipboard or log
function generateReceiptText() {
  const rentDays = state.activeTab === 'tab-days' 
    ? state.days 
    : calculateDateDiff(state.startDate, state.endDate);
    
  if (state.monthlyRent === 0 || rentDays === 0) return null;
  
  const dailyText = dailyRentOutput.innerText;
  const totalText = totalRentOutput.innerText;
  
  let dateSpanText = '';
  if (state.activeTab === 'tab-dates' && state.startDate && state.endDate) {
    dateSpanText = ` (${formatDateFriendly(state.startDate)} ～ ${formatDateFriendly(state.endDate)})`;
  }
  
  const basisText = resultBasis.innerText;
  
  const now = new Date();
  const timeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  let roundingName = '';
  switch(state.roundingMode) {
    case 'floor': roundingName = '無條件捨去至整數'; break;
    case 'ceil': roundingName = '無條件進位至整數'; break;
    case 'keep-decimals': roundingName = '保留小數兩位'; break;
    default: roundingName = '四捨五入至整數';
  }

  let feeSplitSectionText = '';
  if (state.enableFeeSplit) {
    const ownerShare = (100 - state.feeRate).toString();
    feeSplitSectionText = `
- 屋主實收 (${ownerShare}%)：${state.currencySymbol}${feeOwnerNetOutput.innerText} 元
- 港居服務費 (${state.feeRate}%)：${state.currencySymbol}${feeAgencyOutput.innerText} 元`;
  }

  return `【租金換算明細】
------------------------------
公司品牌：港居不動產開發有限公司
每月租金：${state.currencySymbol}${formatNumberWithCommas(state.monthlyRent)} ${state.currency}
計算天數：${rentDays} 天${dateSpanText}
計算基準：${basisText}
日租金(均)：${state.currencySymbol}${dailyText} 元
小數處理：${roundingName}
------------------------------
應付總額：${state.currencySymbol}${totalText} 元${feeSplitSectionText}

計算公式：
${formulaText.innerText}

(由港居不動產換算工具於 ${timeString} 生成)`.trim();
}

// Copy to Clipboard
function copyReceiptToClipboard() {
  const receipt = generateReceiptText();
  if (!receipt) {
    showToast('❌ 請先輸入完整的月租金與天數！');
    return;
  }
  
  navigator.clipboard.writeText(receipt).then(() => {
    showToast('📋 明細已複製到剪貼簿！');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showToast('❌ 複製失敗，請手動選取複製');
  });
}

// Toast Popups
function showToast(message) {
  toast.innerText = message;
  toast.classList.add('show');
  
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// LocalStorage History Operations
function saveToHistory() {
  const rentDays = state.activeTab === 'tab-days' 
    ? state.days 
    : calculateDateDiff(state.startDate, state.endDate);
    
  if (state.monthlyRent === 0 || rentDays === 0) {
    showToast('❌ 請先完成計算後再儲存！');
    return;
  }

  const now = new Date();
  const timeString = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newItem = {
    id: Date.now().toString(),
    timestamp: timeString,
    monthlyRent: state.monthlyRent,
    currencySymbol: state.currencySymbol,
    currency: state.currency,
    days: rentDays,
    basisText: resultBasis.innerText,
    dailyRent: dailyRentOutput.innerText,
    totalRent: totalRentOutput.innerText,
    activeTab: state.activeTab,
    startDate: state.startDate,
    endDate: state.endDate,
    calcBasis: state.calcBasis,
    customBasisDays: state.customBasisDays,
    roundingMode: state.roundingMode,
    enableFeeSplit: state.enableFeeSplit,
    feeRate: state.feeRate
  };

  state.history.unshift(newItem);
  
  if (state.history.length > 15) {
    state.history.pop();
  }

  localStorage.setItem('rent_calc_history', JSON.stringify(state.history));
  renderHistory();
  showToast('💾 紀錄已成功儲存！');
}

function loadHistory() {
  const saved = localStorage.getItem('rent_calc_history');
  if (saved) {
    try {
      state.history = JSON.parse(saved);
    } catch(e) {
      state.history = [];
    }
  }
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    historyPlaceholder.style.display = 'flex';
    historyList.style.display = 'none';
    clearHistoryBtn.style.display = 'none';
    return;
  }

  historyPlaceholder.style.display = 'none';
  historyList.style.display = 'flex';
  clearHistoryBtn.style.display = 'block';
  
  historyList.innerHTML = '';
  
  state.history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.setAttribute('data-id', item.id);
    
    let subTitle = `${item.days}天 (${item.basisText})`;
    if (item.activeTab === 'tab-dates' && item.startDate && item.endDate) {
      subTitle = `${item.days}天 | ${formatDateFriendly(item.startDate).slice(5)}~${formatDateFriendly(item.endDate).slice(5)}`;
    }

    div.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-title">月租 ${item.currencySymbol}${formatNumberWithCommas(item.monthlyRent)}</span>
        <span class="history-item-date">${item.timestamp}</span>
      </div>
      <div class="history-item-details">
        <span>${subTitle}</span>
        <span class="history-item-rent">${item.currencySymbol}${item.totalRent}</span>
      </div>
      <button class="delete-item-btn" aria-label="刪除此紀錄" data-delete-id="${item.id}">&times;</button>
    `;
    
    div.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-item-btn') || e.target.closest('.delete-item-btn')) {
        return;
      }
      restoreHistoryItem(item);
    });

    const deleteBtn = div.querySelector('.delete-item-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(item.id);
    });

    historyList.appendChild(div);
  });
}

function deleteHistoryItem(id) {
  state.history = state.history.filter(item => item.id !== id);
  localStorage.setItem('rent_calc_history', JSON.stringify(state.history));
  renderHistory();
  showToast('🗑️ 紀錄已刪除');
}

function clearAllHistory() {
  if (confirm('確定要清除所有歷史計算紀錄嗎？')) {
    state.history = [];
    localStorage.removeItem('rent_calc_history');
    renderHistory();
    showToast('🗑️ 歷史紀錄已全部清除');
  }
}

function restoreHistoryItem(item) {
  state.monthlyRent = item.monthlyRent;
  state.calcBasis = item.calcBasis;
  state.customBasisDays = item.customBasisDays || 30;
  state.activeTab = item.activeTab;
  
  if (item.activeTab === 'tab-days') {
    state.days = item.days;
    daysInput.value = item.days;
  } else {
    state.startDate = item.startDate;
    state.endDate = item.endDate;
    startDateInput.value = item.startDate;
    endDateInput.value = item.endDate;
  }
  
  state.roundingMode = item.roundingMode || 'round';
  state.currency = item.currency || 'TWD';
  state.currencySymbol = item.currencySymbol || '$';
  state.enableFeeSplit = item.enableFeeSplit || false;
  state.feeRate = item.feeRate !== undefined ? item.feeRate : 10;

  monthlyRentInput.value = formatNumberWithCommas(item.monthlyRent);
  clearRentBtn.style.display = item.monthlyRent > 0 ? 'block' : 'none';
  
  document.getElementById(`basis${item.calcBasis.charAt(0).toUpperCase() + item.calcBasis.slice(1)}`).checked = true;
  if (item.calcBasis === 'custom') {
    customBasisWrapper.classList.add('expanded');
    customBasisDaysInput.value = item.customBasisDays;
  } else {
    customBasisWrapper.classList.remove('expanded');
  }

  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === item.activeTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  tabPanels.forEach(panel => {
    if (panel.id === item.activeTab) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  roundingModeSelect.value = state.roundingMode;
  currencySelect.value = state.currency;
  document.querySelector('label[for="monthlyRent"]').innerText = `每月租金 (${state.currency})`;

  enableFeeSplitCheckbox.checked = state.enableFeeSplit;
  feeRateInput.value = state.feeRate;
  ownerShareRateInput.value = (100 - state.feeRate).toFixed(0);
  if (state.enableFeeSplit) {
    feeSplitInputsWrapper.classList.add('expanded');
  } else {
    feeSplitInputsWrapper.classList.remove('expanded');
  }

  calculateRent();
  showToast('🔄 已載入歷史計算狀態');
}
