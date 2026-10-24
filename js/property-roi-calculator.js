/**
 * 港居不動產 物業投資實質淨投報率與房貸現金流精算器
 * Property ROI, Mortgage & Cash Flow Calculator Engine
 * 繁體中文（台灣）｜零後端純前端本地運算
 */

(function () {
  'use strict';

  // 預設參數狀態
  const defaultState = {
    purchasePrice: 1000,          // 房屋購買總價 (萬元)
    closingCosts: 200000,         // 契稅/代書/仲介費 (元)
    renovationCost: 80,           // 裝修工程款 (萬元)
    furnitureCost: 20,            // 家具家電 (萬元)
    ltv: 70,                      // 貸款成數 (%)
    loanTermYears: 30,            // 房貸年限 (年)
    loanRate: 2.185,              // 房貸年利率 (%)
    gracePeriodYears: 0,          // 寬限期 (年)
    monthlyRent: 38000,           // 每月總租金 (元)
    vacancyMonths: 0.8,           // 預估招租空窗 (月)
    propertyTax: 12000,           // 每年房屋稅+地價稅 (元)
    monthlyHoaFee: 2000,          // 每月大樓管理費 (元)
    maintenanceRate: 5,           // 年度修繕儲備率 (%)
    annualInsurance: 3000         // 火險與地震險 (元/年)
  };

  let state = Object.assign({}, defaultState);

  // DOM 元素快取
  const dom = {};

  function initElements() {
    dom.purchasePrice = document.getElementById('purchasePrice');
    dom.closingCosts = document.getElementById('closingCosts');
    dom.renovationCost = document.getElementById('renovationCost');
    dom.furnitureCost = document.getElementById('furnitureCost');
    dom.totalProjectCostDisplay = document.getElementById('totalProjectCostDisplay');

    dom.ltvSlider = document.getElementById('ltvSlider');
    dom.ltvDisplay = document.getElementById('ltvDisplay');
    dom.loanAmountDisplay = document.getElementById('loanAmountDisplay');
    dom.cashInvestedDisplay = document.getElementById('cashInvestedDisplay');
    dom.loanRate = document.getElementById('loanRate');

    dom.monthlyRent = document.getElementById('monthlyRent');
    dom.propertyTax = document.getElementById('propertyTax');
    dom.monthlyHoaFee = document.getElementById('monthlyHoaFee');
    dom.maintenanceRate = document.getElementById('maintenanceRate');
    dom.annualInsurance = document.getElementById('annualInsurance');

    // KPI 顯示
    dom.kpiGrossCap = document.getElementById('kpiGrossCap');
    dom.kpiNetCap = document.getElementById('kpiNetCap');
    dom.kpiCoC = document.getElementById('kpiCoC');
    dom.kpiMonthlyCashFlow = document.getElementById('kpiMonthlyCashFlow');
    dom.kpiMonthlyMortgage = document.getElementById('kpiMonthlyMortgage');
    dom.kpiPayback = document.getElementById('kpiPayback');

    // 金流瀑布細目
    dom.flowGrossRent = document.getElementById('flowGrossRent');
    dom.flowVacancyLoss = document.getElementById('flowVacancyLoss');
    dom.flowEGI = document.getElementById('flowEGI');
    dom.flowOpEx = document.getElementById('flowOpEx');
    dom.flowNOI = document.getElementById('flowNOI');
    dom.flowDebtService = document.getElementById('flowDebtService');
    dom.flowNetCashFlow = document.getElementById('flowNetCashFlow');

    // 方案 PK 顯示
    dom.pkSelfAmount = document.getElementById('pkSelfAmount');
    dom.pkManageAmount = document.getElementById('pkManageAmount');
    dom.pkMasterAmount = document.getElementById('pkMasterAmount');
    dom.barSelf = document.getElementById('barSelf');
    dom.barManage = document.getElementById('barManage');
    dom.barMaster = document.getElementById('barMaster');

    // 列印與行動
    dom.btnPrint = document.getElementById('btnPrint');
    dom.btnDownloadCard = document.getElementById('btnDownloadCard');
    dom.btnCopyLine = document.getElementById('btnCopyLine');
    dom.printDate = document.getElementById('printDate');
    dom.printParams = document.getElementById('printParams');
  }

  // 金額格式化 (千分位)
  function formatMoney(num) {
    if (isNaN(num)) return '0';
    return Math.round(num).toLocaleString('zh-TW');
  }

  // 萬元格式化
  function formatWan(num) {
    if (isNaN(num)) return '0';
    return (num / 10000).toFixed(1) + ' 萬';
  }

  // 房貸月付金計算公式 (PMT)
  function calculateMortgage(principal, annualRate, termYears, graceYears) {
    if (principal <= 0) {
      return { gracePayment: 0, amortPayment: 0, monthlyPayment: 0, annualDebt: 0 };
    }
    const r = (annualRate / 100) / 12;
    const totalMonths = termYears * 12;
    const graceMonths = graceYears * 12;

    // 寬限期內僅付利息
    const gracePayment = principal * r;

    // 寬限期後攤還月數
    const remMonths = totalMonths - graceMonths;
    let amortPayment = 0;
    if (remMonths > 0) {
      amortPayment = principal * (r * Math.pow(1 + r, remMonths)) / (Math.pow(1 + r, remMonths) - 1);
    } else {
      amortPayment = gracePayment;
    }

    const currentMonthly = graceYears > 0 ? gracePayment : amortPayment;
    const annualDebt = currentMonthly * 12;

    return {
      gracePayment: Math.round(gracePayment),
      amortPayment: Math.round(amortPayment),
      monthlyPayment: Math.round(currentMonthly),
      annualDebt: Math.round(annualDebt)
    };
  }

  // 核心運算
  function recalculate() {
    // 讀取輸入值
    state.purchasePrice = parseFloat(dom.purchasePrice.value) || 0;
    state.renovationCost = parseFloat(dom.renovationCost.value) || 0;
    state.furnitureCost = parseFloat(dom.furnitureCost.value) || 0;
    state.closingCosts = parseFloat(dom.closingCosts.value) || 0;

    state.ltv = parseFloat(dom.ltvSlider.value) || 70;
    state.loanRate = parseFloat(dom.loanRate.value) || 2.185;

    state.monthlyRent = parseFloat(dom.monthlyRent.value) || 0;
    state.propertyTax = parseFloat(dom.propertyTax.value) || 0;
    state.monthlyHoaFee = parseFloat(dom.monthlyHoaFee.value) || 0;
    state.maintenanceRate = parseFloat(dom.maintenanceRate.value) || 5;
    state.annualInsurance = parseFloat(dom.annualInsurance.value) || 0;

    // 1. 總投資成本 (Total Project Cost)
    const propertyPriceYuan = state.purchasePrice * 10000;
    const renoYuan = state.renovationCost * 10000;
    const furnYuan = state.furnitureCost * 10000;
    const totalCost = propertyPriceYuan + renoYuan + furnYuan + state.closingCosts;

    // 2. 貸款與自備款
    const loanAmount = Math.round(propertyPriceYuan * (state.ltv / 100));
    const cashInvested = Math.max(0, totalCost - loanAmount);

    // 3. 房貸月付金
    const mortgage = calculateMortgage(loanAmount, state.loanRate, state.loanTermYears, state.gracePeriodYears);

    // 4. 租金與營運開銷
    const grossPotentialRent = state.monthlyRent * 12;
    const vacancyLoss = Math.round(state.monthlyRent * state.vacancyMonths);
    const effectiveGrossIncome = Math.max(0, grossPotentialRent - vacancyLoss);

    // 營運支出 (OpEx)
    const annualHoa = state.monthlyHoaFee * 12;
    const annualMaint = Math.round(grossPotentialRent * (state.maintenanceRate / 100));
    const totalOpEx = state.propertyTax + annualHoa + annualMaint + state.annualInsurance;

    // 淨營運收益 (NOI)
    const noi = effectiveGrossIncome - totalOpEx;

    // 實質稅前淨現金流 (Net Cash Flow)
    const netCashFlow = noi - mortgage.annualDebt;
    const monthlyNetCashFlow = Math.round(netCashFlow / 12);

    // 5. 核心財務指標
    const grossCapRate = totalCost > 0 ? ((grossPotentialRent / totalCost) * 100) : 0;
    const netCapRate = totalCost > 0 ? ((noi / totalCost) * 100) : 0;
    const cocReturn = cashInvested > 0 ? ((netCashFlow / cashInvested) * 100) : 0;
    const paybackYears = netCashFlow > 0 ? (cashInvested / netCashFlow) : 0;

    // 6. 三大方案比較
    // 方案 A: 自租自管 (DIY)
    // 扣除空屋損失、全額 OpEx、約 6% 租金所得稅負擔
    const selfIncomeTax = Math.round(grossPotentialRent * 0.57 * 0.12); // 43%費用率，所得稅率約12%
    const selfNetYear = effectiveGrossIncome - totalOpEx - selfIncomeTax - mortgage.annualDebt;
    const selfMonthly = Math.round(selfNetYear / 12);

    // 方案 B: 港居代管 (10% 代管服務費，享專法1.5萬免稅+60%費用率減免，空屋縮短為 0.5 個月)
    const manageVacancyLoss = Math.round(state.monthlyRent * 0.5);
    const manageEGI = Math.max(0, grossPotentialRent - manageVacancyLoss);
    const manageFee = Math.round(manageEGI * 0.10);
    // 專法節稅: 18萬免稅，超過減60%
    const taxableRentManage = Math.max(0, grossPotentialRent - 180000) * 0.40;
    const manageIncomeTax = Math.round(taxableRentManage * 0.12);
    const manageNetYear = manageEGI - totalOpEx - manageFee - manageIncomeTax - mortgage.annualDebt;
    const manageMonthly = Math.round(manageNetYear / 12);

    // 方案 C: 港居全包租保證收益 (3~5年保證撥款，0% 空屋風險，免負擔維護修繕)
    const masterGrossRent = Math.round(grossPotentialRent * 0.88); // 88% 市場租金保證實付
    const masterOpEx = state.propertyTax + state.annualInsurance; // 大樓公費及修繕多由港居協調或吸收
    const taxableRentMaster = Math.max(0, masterGrossRent - 180000) * 0.40;
    const masterIncomeTax = Math.round(taxableRentMaster * 0.12);
    const masterNetYear = masterGrossRent - masterOpEx - masterIncomeTax - mortgage.annualDebt;
    const masterMonthly = Math.round(masterNetYear / 12);

    // ==========================================
    // DOM 更新
    // ==========================================
    if (dom.totalProjectCostDisplay) {
      dom.totalProjectCostDisplay.textContent = formatMoney(totalCost) + ' 元 (' + formatWan(totalCost) + ')';
    }
    if (dom.ltvDisplay) {
      dom.ltvDisplay.textContent = state.ltv + '%';
    }
    if (dom.loanAmountDisplay) {
      dom.loanAmountDisplay.textContent = formatMoney(loanAmount) + ' 元 (' + formatWan(loanAmount) + ')';
    }
    if (dom.cashInvestedDisplay) {
      dom.cashInvestedDisplay.textContent = formatMoney(cashInvested) + ' 元 (' + formatWan(cashInvested) + ')';
    }

    // KPI
    if (dom.kpiGrossCap) dom.kpiGrossCap.textContent = grossCapRate.toFixed(2) + '%';
    if (dom.kpiNetCap) dom.kpiNetCap.textContent = netCapRate.toFixed(2) + '%';
    if (dom.kpiCoC) dom.kpiCoC.textContent = cocReturn.toFixed(2) + '%';
    if (dom.kpiMonthlyCashFlow) {
      dom.kpiMonthlyCashFlow.textContent = (monthlyNetCashFlow >= 0 ? '+' : '') + formatMoney(monthlyNetCashFlow);
      dom.kpiMonthlyCashFlow.style.color = monthlyNetCashFlow >= 0 ? 'var(--accent-gold)' : '#fc8181';
    }
    if (dom.kpiMonthlyMortgage) {
      dom.kpiMonthlyMortgage.textContent = formatMoney(mortgage.monthlyPayment) + ' 元/月' +
        (state.gracePeriodYears > 0 ? ' (寬限期利息)' : ' (本息均攤)');
    }
    if (dom.kpiPayback) {
      dom.kpiPayback.textContent = paybackYears > 0 ? (paybackYears.toFixed(1) + ' 年回本') : '待評估 (現金流為負)';
    }

    // 金流瀑布細目
    if (dom.flowGrossRent) dom.flowGrossRent.textContent = '+' + formatMoney(grossPotentialRent) + ' 元';
    if (dom.flowVacancyLoss) dom.flowVacancyLoss.textContent = '-' + formatMoney(vacancyLoss) + ' 元';
    if (dom.flowEGI) dom.flowEGI.textContent = formatMoney(effectiveGrossIncome) + ' 元';
    if (dom.flowOpEx) dom.flowOpEx.textContent = '-' + formatMoney(totalOpEx) + ' 元';
    if (dom.flowNOI) dom.flowNOI.textContent = formatMoney(noi) + ' 元';
    if (dom.flowDebtService) dom.flowDebtService.textContent = '-' + formatMoney(mortgage.annualDebt) + ' 元';
    if (dom.flowNetCashFlow) {
      dom.flowNetCashFlow.textContent = (netCashFlow >= 0 ? '+' : '') + formatMoney(netCashFlow) + ' 元/年 (平均每月 ' + formatMoney(monthlyNetCashFlow) + ' 元)';
    }

    // 方案 PK
    if (dom.pkSelfAmount) dom.pkSelfAmount.textContent = formatMoney(selfMonthly) + ' 元/月';
    if (dom.pkManageAmount) dom.pkManageAmount.textContent = formatMoney(manageMonthly) + ' 元/月';
    if (dom.pkMasterAmount) dom.pkMasterAmount.textContent = formatMoney(masterMonthly) + ' 元/月';

    // 能量條
    const maxMonthly = Math.max(1, selfMonthly, manageMonthly, masterMonthly);
    if (dom.barSelf) dom.barSelf.style.width = Math.max(10, Math.min(100, (selfMonthly / maxMonthly) * 100)) + '%';
    if (dom.barManage) dom.barManage.style.width = Math.max(10, Math.min(100, (manageMonthly / maxMonthly) * 100)) + '%';
    if (dom.barMaster) dom.barMaster.style.width = Math.max(10, Math.min(100, (masterMonthly / maxMonthly) * 100)) + '%';

    // 列印資訊
    if (dom.printDate) {
      const now = new Date();
      dom.printDate.textContent = '評估日期：' + now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    }
    if (dom.printParams) {
      dom.printParams.textContent = '評估標的購置總價：' + state.purchasePrice + '萬元 ｜ 自備款：' + formatWan(cashInvested) +
        ' ｜ 貸款：' + state.ltv + '% (利率 ' + state.loanRate + '%) ｜ 預估月租：' + formatMoney(state.monthlyRent) + '元';
    }

    // 儲存至本地
    saveToLocalStorage();

    // 派送 MarTech 事件
    if (window.GanjuTracker && typeof window.GanjuTracker.trackEvent === 'function') {
      window.GanjuTracker.trackEvent('roi_calculator_calculate', {
        purchase_price: state.purchasePrice,
        monthly_rent: state.monthlyRent,
        gross_cap_rate: grossCapRate.toFixed(2),
        net_cash_flow: monthlyNetCashFlow
      });
    }
  }

  // LocalStorage 存取
  function saveToLocalStorage() {
    try {
      localStorage.setItem('ganju_roi_calculator_v1', JSON.stringify(state));
    } catch (e) {
      // 容錯
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('ganju_roi_calculator_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        state = Object.assign({}, defaultState, parsed);
        syncStateToInputs();
      }
    } catch (e) {
      // 容錯
    }
  }

  function syncStateToInputs() {
    if (dom.purchasePrice) dom.purchasePrice.value = state.purchasePrice;
    if (dom.renovationCost) dom.renovationCost.value = state.renovationCost;
    if (dom.furnitureCost) dom.furnitureCost.value = state.furnitureCost;
    if (dom.closingCosts) dom.closingCosts.value = state.closingCosts;

    if (dom.ltvSlider) dom.ltvSlider.value = state.ltv;
    if (dom.loanRate) dom.loanRate.value = state.loanRate;

    if (dom.monthlyRent) dom.monthlyRent.value = state.monthlyRent;
    if (dom.propertyTax) dom.propertyTax.value = state.propertyTax;
    if (dom.monthlyHoaFee) dom.monthlyHoaFee.value = state.monthlyHoaFee;
    if (dom.maintenanceRate) dom.maintenanceRate.value = state.maintenanceRate;
    if (dom.annualInsurance) dom.annualInsurance.value = state.annualInsurance;

    // 標籤樣式同步
    document.querySelectorAll('[data-loan-term]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.loanTerm) === state.loanTermYears);
    });
    document.querySelectorAll('[data-grace]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.grace) === state.gracePeriodYears);
    });
    document.querySelectorAll('[data-vacancy]').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.vacancy) === state.vacancyMonths);
    });
  }

  // 複製 LINE 試算摘要
  function copyLineSummary() {
    const text = [
      '【港居不動產｜物業投資實質投報與房貸現金流診斷】',
      '🏠 評估物業總價：' + state.purchasePrice + ' 萬元',
      '💰 實質自備款投入：' + (dom.cashInvestedDisplay ? dom.cashInvestedDisplay.textContent : ''),
      '🏦 銀行房貸條件：' + state.ltv + '% / ' + state.loanTermYears + '年期 / 利率 ' + state.loanRate + '%',
      '💵 預估月租金收入：' + formatMoney(state.monthlyRent) + ' 元/月',
      '----------------------------------------',
      '📊 專業投資財務指標：',
      '• 毛投報率 (Cap Rate)：' + (dom.kpiGrossCap ? dom.kpiGrossCap.textContent : ''),
      '• 淨營運收益率 (NOI Yield)：' + (dom.kpiNetCap ? dom.kpiNetCap.textContent : ''),
      '• 自備款現金殖利率 (CoC)：' + (dom.kpiCoC ? dom.kpiCoC.textContent : ''),
      '• 扣除房貸後每月淨現金流：' + (dom.kpiMonthlyCashFlow ? dom.kpiMonthlyCashFlow.textContent : '') + ' 元/月',
      '----------------------------------------',
      '✨ 港居包租代管三大優勢：',
      '1. 享《租賃條例》第17條每月1.5萬免稅額＋60%必要費用率',
      '2. 港居嚴選外商優質租客，降低空屋損失至最低',
      '3. 提供全包租保證收益，3~5年穩定撥款、0%空屋風險！',
      '',
      '👉 點此在線試算完整現金流：https://ganggo880.github.io/ganju-website/property-roi-calculator.html',
      '📞 預約陳俊銘經理現場資產會勘：0968-863-880 ｜ LINE ID：ganggo880'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製物業投報試算摘要，可直接貼上至 LINE 傳送！');
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
    showToast('已複製物業投報試算摘要！');
  }

  function showToast(msg) {
    if (window.GanjuUtils && typeof window.GanjuUtils.showToast === 'function') {
      window.GanjuUtils.showToast(msg);
      return;
    }
    alert(msg);
  }

  // 繪製並下載 Canvas 840×1080px 高畫質圖卡
  function downloadCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 底色背景 (奢華海軍藍漸層)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    bgGrad.addColorStop(0, '#0F2341');
    bgGrad.addColorStop(1, '#1A365D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 840, 1080);

    // 金色裝飾邊框
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 780, 1020);

    // 頂部品牌標題
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 26px "Noto Sans TC", sans-serif';
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
    ctx.font = 'bold 36px "Noto Sans TC", sans-serif';
    ctx.fillText('物業投資實質投報與現金流評估診斷', 60, 185);

    // 物業基本資訊方塊
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.roundRect(60, 215, 720, 100, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.2)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillText('房屋購置總價：' + state.purchasePrice + ' 萬元 ｜ 裝修軟裝：' + (state.renovationCost + state.furnitureCost) + ' 萬元', 85, 255);
    ctx.fillText('自備款：' + (dom.cashInvestedDisplay ? dom.cashInvestedDisplay.textContent : '') + ' ｜ 貸款：' + state.ltv + '% (利率 ' + state.loanRate + '%)', 85, 290);

    // 核心指標雙卡片
    // 卡片 1: 毛投報率
    ctx.fillStyle = 'rgba(26, 54, 93, 0.8)';
    ctx.roundRect(60, 340, 345, 150, 12);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('毛投報率 (Cap Rate)', 85, 375);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dom.kpiGrossCap ? dom.kpiGrossCap.textContent : '0%', 85, 435);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('全年毛租金 / 總物業投資成本', 85, 465);

    // 卡片 2: 自備款現金殖利率 (CoC)
    ctx.fillStyle = 'rgba(26, 54, 93, 0.8)';
    ctx.roundRect(435, 340, 345, 150, 12);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('自備款現金殖利率 (CoC)', 460, 375);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dom.kpiCoC ? dom.kpiCoC.textContent : '0%', 460, 435);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('扣除房貸後年淨流 / 實質自備款', 460, 465);

    // 每月實質淨現金流大橫幅
    ctx.fillStyle = 'linear-gradient(90deg, rgba(197, 160, 89, 0.2) 0%, rgba(26, 54, 93, 0.4) 100%)';
    ctx.roundRect(60, 515, 720, 110, 12);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText('每月實質被動現金流 (扣除房貸本息與營運開銷)：', 85, 555);
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 40px "Plus Jakarta Sans", sans-serif';
    ctx.fillText((dom.kpiMonthlyCashFlow ? dom.kpiMonthlyCashFlow.textContent : '0') + ' 元/月', 85, 605);

    // 方案對比速覽
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.fillText('三大營運方案月實質淨得對比', 60, 665);

    // 方案 A
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(60, 685, 225, 140, 8);
    ctx.fill();
    ctx.fillStyle = '#A0AEC0';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('房東自租自管', 80, 720);
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dom.pkSelfAmount ? dom.pkSelfAmount.textContent : '0', 80, 760);
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText('自擔空屋修繕、無租補節稅', 80, 795);

    // 方案 B
    ctx.fillStyle = 'rgba(66, 153, 225, 0.1)';
    ctx.roundRect(305, 685, 225, 140, 8);
    ctx.fill();
    ctx.fillStyle = '#63B3ED';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('委託港居代管', 325, 720);
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dom.pkManageAmount ? dom.pkManageAmount.textContent : '0', 325, 760);
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText('享1.5萬免稅+60%費用減免', 325, 795);

    // 方案 C
    ctx.fillStyle = 'rgba(197, 160, 89, 0.15)';
    ctx.roundRect(555, 685, 225, 140, 8);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('港居全包租保證', 575, 720);
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dom.pkMasterAmount ? dom.pkMasterAmount.textContent : '0', 575, 760);
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText('0%空屋風險・3~5年保證撥款', 575, 795);

    // 底部聯絡資訊
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(30, 950, 780, 100);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText('專屬物業資產規劃顧問：陳俊銘 經理', 60, 990);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('諮詢專線：0968-863-880 ｜ 高雄市小港區中安路825號 ｜ 港居線上工具集', 60, 1020);

    // 產生下載檔案
    const link = document.createElement('a');
    link.download = '港居不動產_物業投資投報與現金流診斷卡_' + state.purchasePrice + '萬.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已成功下載高畫質投資診斷圖卡！');
  }

  // 事件綁定
  function bindEvents() {
    // 輸入框即時連動
    const inputs = [
      dom.purchasePrice, dom.closingCosts, dom.renovationCost, dom.furnitureCost,
      dom.ltvSlider, dom.loanRate, dom.monthlyRent, dom.propertyTax,
      dom.monthlyHoaFee, dom.maintenanceRate, dom.annualInsurance
    ];

    inputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', recalculate);
      input.addEventListener('change', recalculate);
    });

    // 購置價格快速按鈕
    document.querySelectorAll('[data-price-val]').forEach(btn => {
      btn.addEventListener('click', function () {
        const val = parseFloat(this.dataset.priceVal);
        if (dom.purchasePrice) {
          dom.purchasePrice.value = val;
          // 自動以 2% 推估交易代書稅費
          if (dom.closingCosts) dom.closingCosts.value = Math.round(val * 10000 * 0.02);
          recalculate();
        }
      });
    });

    // 裝修款快速按鈕
    document.querySelectorAll('[data-reno-val]').forEach(btn => {
      btn.addEventListener('click', function () {
        if (dom.renovationCost) {
          dom.renovationCost.value = parseFloat(this.dataset.renoVal);
          recalculate();
        }
      });
    });

    // 房貸年限切換 (20/30/40年)
    document.querySelectorAll('[data-loan-term]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-loan-term]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.loanTermYears = parseInt(this.dataset.loanTerm);
        recalculate();
      });
    });

    // 寬限期切換 (0/1/2/3/5年)
    document.querySelectorAll('[data-grace]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-grace]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.gracePeriodYears = parseInt(this.dataset.grace);
        recalculate();
      });
    });

    // 招租空窗切換 (0/0.5/0.8/1/1.5個月)
    document.querySelectorAll('[data-vacancy]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-vacancy]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.vacancyMonths = parseFloat(this.dataset.vacancy);
        recalculate();
      });
    });

    // 行動端分頁切換
    const tabInputs = document.getElementById('tabInputs');
    const tabResults = document.getElementById('tabResults');
    const panelInputs = document.getElementById('panelInputs');
    const panelResults = document.getElementById('panelResults');

    if (tabInputs && tabResults && panelInputs && panelResults) {
      tabInputs.addEventListener('click', function () {
        tabInputs.classList.add('active');
        tabResults.classList.remove('active');
        panelInputs.classList.remove('roi-mobile-hidden');
        panelResults.classList.add('roi-mobile-hidden');
      });

      tabResults.addEventListener('click', function () {
        tabResults.classList.add('active');
        tabInputs.classList.remove('active');
        panelResults.classList.remove('roi-mobile-hidden');
        panelInputs.classList.add('roi-mobile-hidden');
      });
    }

    // 列印按鈕
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', function () {
        window.print();
      });
    }

    // 下載圖卡
    if (dom.btnDownloadCard) {
      dom.btnDownloadCard.addEventListener('click', downloadCardImage);
    }

    // 複製 LINE
    if (dom.btnCopyLine) {
      dom.btnCopyLine.addEventListener('click', copyLineSummary);
    }
  }

  // 初始化入口
  document.addEventListener('DOMContentLoaded', function () {
    initElements();
    bindEvents();
    loadFromLocalStorage();
    recalculate();
  });

})();
