/**
 * ==========================================================================
 * 港居不動產 房東節稅與包租代管實質淨收益試算神器核心模組
 * Landlord Tax & Net Yield Calculator Engine
 * 依據《租賃住宅市場發展及管理條例》第17條與囤房稅 2.0 新制精算法規公式
 * ==========================================================================
 */

import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 節點初始化
  const rentSlider = document.getElementById('rentSlider');
  const rentInput = document.getElementById('rentInput');
  const rentDisplay = document.getElementById('rentDisplay');
  const quickChips = document.querySelectorAll('.tax-chip');
  const rateBtns = document.querySelectorAll('.tax-rate-btn');
  const accordionToggle = document.getElementById('accordionToggle');
  const advancedPanel = document.getElementById('advancedPanel');

  // 高級參數輸入項
  const houseValueInput = document.getElementById('houseValueInput');
  const landValueInput = document.getElementById('landValueInput');
  const vacancySelect = document.getElementById('vacancySelect');
  const feeRateSelect = document.getElementById('feeRateSelect');
  const selfTaxRateSelect = document.getElementById('selfTaxRateSelect');

  // 試算結果呈現節點 (Banner)
  const grandTaxSavings = document.getElementById('grandTaxSavings');
  const bannerSubDetail = document.getElementById('bannerSubDetail');

  // 三大稅負減免卡片節點
  const incomeTaxSelf = document.getElementById('incomeTaxSelf');
  const incomeTaxManaged = document.getElementById('incomeTaxManaged');
  const incomeTaxSave = document.getElementById('incomeTaxSave');

  const houseTaxSelf = document.getElementById('houseTaxSelf');
  const houseTaxManaged = document.getElementById('houseTaxManaged');
  const houseTaxSave = document.getElementById('houseTaxSave');

  const landTaxSelf = document.getElementById('landTaxSelf');
  const landTaxManaged = document.getElementById('landTaxManaged');
  const landTaxSave = document.getElementById('landTaxSave');

  // 三方案 PK 卡片節點
  const netPlanSelf = document.getElementById('netPlanSelf');
  const netPlanManaged = document.getElementById('netPlanManaged');
  const netPlanMaster = document.getElementById('netPlanMaster');

  const diffPlanManaged = document.getElementById('diffPlanManaged');
  const diffPlanMaster = document.getElementById('diffPlanMaster');

  // 明細清單節點
  const breakdownSelfGross = document.getElementById('breakdownSelfGross');
  const breakdownSelfTax = document.getElementById('breakdownSelfTax');
  const breakdownSelfVacancy = document.getElementById('breakdownSelfVacancy');

  const breakdownManagedGross = document.getElementById('breakdownManagedGross');
  const breakdownManagedFee = document.getElementById('breakdownManagedFee');
  const breakdownManagedTax = document.getElementById('breakdownManagedTax');

  const breakdownMasterGross = document.getElementById('breakdownMasterGross');
  const breakdownMasterTax = document.getElementById('breakdownMasterTax');

  // 視覺能量條
  const barSelf = document.getElementById('barSelf');
  const barManaged = document.getElementById('barManaged');
  const barMaster = document.getElementById('barMaster');
  const barSelfLabel = document.getElementById('barSelfLabel');
  const barManagedLabel = document.getElementById('barManagedLabel');
  const barMasterLabel = document.getElementById('barMasterLabel');

  // 動作按鈕
  const btnLineConsult = document.getElementById('btnLineConsult');
  const btnPrintReport = document.getElementById('btnPrintReport');
  const btnCopyReport = document.getElementById('btnCopyReport');

  // 列印表頭即時日期與參數
  const printDate = document.getElementById('printDate');
  const printParams = document.getElementById('printParams');

  // 2. 核心狀態
  let currentRent = 28000;
  let currentTaxRate = 0.12; // 預設 12%
  let currentHouseValue = 600000;
  let currentLandValue = 350000;
  let currentVacancyMonths = 1.0;
  let currentFeeRate = 0.12; // 代管費 12%
  let currentMasterRate = 0.88; // 全包租折數 88%
  let currentSelfHouseRate = 0.024; // 自租囤房稅非自住 2.4%

  // 3. 貨幣格式化輔助函式
  const fmt = (num) => `NT$ ${Math.round(num).toLocaleString('zh-TW')}`;

  // 4. 核心算式引擎
  function updateCalculations() {
    // A. 個人綜合所得稅計算
    // 自租：全年租金收入 * (1 - 43%必要費用率) = 57% 租賃所得
    const selfAnnualRent = currentRent * Math.max(0, 12 - currentVacancyMonths);
    const selfTaxableRentalIncome = selfAnnualRent * (1 - 0.43);
    const taxSelfIncome = Math.round(selfTaxableRentalIncome * currentTaxRate);

    // 港居代管：每屋每月最高 15,000 元免稅；超過部分必要費用率 60%
    const monthlyExemption = 15000;
    const managedExcessMonthly = Math.max(0, currentRent - monthlyExemption);
    const managedTaxableMonthly = managedExcessMonthly * (1 - 0.60);
    const managedAnnualTaxable = managedTaxableMonthly * 12;
    const taxManagedIncome = Math.round(managedAnnualTaxable * currentTaxRate);

    const incomeTaxSavings = Math.max(0, taxSelfIncome - taxManagedIncome);

    // 全包租所得稅：以全包租實撥金額計算
    const masterMonthlyRent = currentRent * currentMasterRate;
    const masterExcessMonthly = Math.max(0, masterMonthlyRent - monthlyExemption);
    const masterTaxableMonthly = masterExcessMonthly * (1 - 0.60);
    const masterAnnualTaxable = masterTaxableMonthly * 12;
    const taxMasterIncome = Math.round(masterAnnualTaxable * currentTaxRate);

    // B. 房屋稅（囤房稅 2.0 新制）
    // 自租：適用非自住申報稅率（如 2.4%）
    const taxSelfHouse = Math.round(currentHouseValue * currentSelfHouseRate);
    // 包租代管：地方自治條例減徵比照自住稅率 1.2%
    const taxManagedHouse = Math.round(currentHouseValue * 0.012);
    const houseTaxSavings = Math.max(0, taxSelfHouse - taxManagedHouse);

    // C. 地價稅
    // 自租：適用一般用地基本稅率 10‰ (1.0%)
    const taxSelfLand = Math.round(currentLandValue * 0.010);
    // 包租代管：地方自治條例減徵比照自用住宅稅率 2‰ (0.2%)
    const taxManagedLand = Math.round(currentLandValue * 0.002);
    const landTaxSavings = Math.max(0, taxSelfLand - taxManagedLand);

    // D. 全年度總省稅額
    const totalTaxSavings = incomeTaxSavings + houseTaxSavings + landTaxSavings;

    // E. 三大方案實質年度淨收益 PK
    // 方案 1：房東自行出租
    // 實收租金 = 月租金 * (12 - 空置月數)
    // 扣除：自租所得稅 + 自租房屋稅 + 自租地價稅
    const totalSelfTaxes = taxSelfIncome + taxSelfHouse + taxSelfLand;
    const netCashSelf = Math.round(selfAnnualRent - totalSelfTaxes);

    // 方案 2：港居精緻代管
    // 全年滿租租金 = 月租金 * 12
    const managedGross = currentRent * 12;
    const managedServiceFee = Math.round(managedGross * currentFeeRate);
    const totalManagedTaxes = taxManagedIncome + taxManagedHouse + taxManagedLand;
    const netCashManaged = Math.round(managedGross - managedServiceFee - totalManagedTaxes);
    const diffManaged = netCashManaged - netCashSelf;

    // 方案 3：港居全包租（100% 零空置保證撥款）
    const masterGross = Math.round(currentRent * 12 * currentMasterRate);
    const totalMasterTaxes = taxMasterIncome + taxManagedHouse + taxManagedLand;
    const netCashMaster = Math.round(masterGross - totalMasterTaxes);
    const diffMaster = netCashMaster - netCashSelf;

    // 5. 渲染視圖更新
    // 租金顯示
    if (rentDisplay) rentDisplay.textContent = fmt(currentRent);

    // Banner 總省稅額
    if (grandTaxSavings) grandTaxSavings.textContent = fmt(totalTaxSavings);
    if (bannerSubDetail) {
      bannerSubDetail.textContent = `委託港居合法享有租賃專法 1.5 萬免稅額＋60% 費用率，比照自住房屋稅 1.2% 與地價稅 0.2%，每年實質多留下一筆可觀財富！`;
    }

    // 三大稅負減免卡片
    if (incomeTaxSelf) incomeTaxSelf.textContent = fmt(taxSelfIncome);
    if (incomeTaxManaged) incomeTaxManaged.textContent = fmt(taxManagedIncome);
    if (incomeTaxSave) incomeTaxSave.textContent = `省 ${fmt(incomeTaxSavings)}`;

    if (houseTaxSelf) houseTaxSelf.textContent = fmt(taxSelfHouse);
    if (houseTaxManaged) houseTaxManaged.textContent = fmt(taxManagedHouse);
    if (houseTaxSave) houseTaxSave.textContent = `省 ${fmt(houseTaxSavings)}`;

    if (landTaxSelf) landTaxSelf.textContent = fmt(taxSelfLand);
    if (landTaxManaged) landTaxManaged.textContent = fmt(taxManagedLand);
    if (landTaxSave) landTaxSave.textContent = `省 ${fmt(landTaxSavings)}`;

    // 三方案 PK
    if (netPlanSelf) netPlanSelf.textContent = fmt(netCashSelf);
    if (netPlanManaged) netPlanManaged.textContent = fmt(netCashManaged);
    if (netPlanMaster) netPlanMaster.textContent = fmt(netCashMaster);

    if (diffPlanManaged) {
      diffPlanManaged.textContent = diffManaged >= 0 ? `比自租多賺 ＋${fmt(diffManaged)}` : `差額 ${fmt(diffManaged)}`;
    }
    if (diffPlanMaster) {
      diffPlanMaster.textContent = diffMaster >= 0 ? `比自租多賺 ＋${fmt(diffMaster)}` : `差額 ${fmt(diffMaster)}`;
    }

    // 明細清單
    if (breakdownSelfGross) breakdownSelfGross.textContent = fmt(selfAnnualRent);
    if (breakdownSelfTax) breakdownSelfTax.textContent = `- ${fmt(totalSelfTaxes)}`;
    if (breakdownSelfVacancy) breakdownSelfVacancy.textContent = `自擔 (估${currentVacancyMonths}個月)`;

    if (breakdownManagedGross) breakdownManagedGross.textContent = fmt(managedGross);
    if (breakdownManagedFee) breakdownManagedFee.textContent = `- ${fmt(managedServiceFee)} (年費率 ${Math.round(currentFeeRate * 100)}%)`;
    if (breakdownManagedTax) breakdownManagedTax.textContent = `- ${fmt(totalManagedTaxes)}`;

    if (breakdownMasterGross) breakdownMasterGross.textContent = fmt(masterGross);
    if (breakdownMasterTax) breakdownMasterTax.textContent = `- ${fmt(totalMasterTaxes)}`;

    // 能量條比例動態調整
    const maxNet = Math.max(netCashSelf, netCashManaged, netCashMaster, 1);
    if (barSelf) barSelf.style.width = `${Math.max(15, (netCashSelf / maxNet) * 100)}%`;
    if (barManaged) barManaged.style.width = `${Math.max(15, (netCashManaged / maxNet) * 100)}%`;
    if (barMaster) barMaster.style.width = `${Math.max(15, (netCashMaster / maxNet) * 100)}%`;

    if (barSelfLabel) barSelfLabel.textContent = fmt(netCashSelf);
    if (barManagedLabel) barManagedLabel.textContent = fmt(netCashManaged);
    if (barMasterLabel) barMasterLabel.textContent = fmt(netCashMaster);

    // 動態更新 LINE 諮詢連結
    if (btnLineConsult) {
      const lineMsg = `您好！我在港居不動產官網試算了包租代管節稅效益：
• 預估月租金：${fmt(currentRent)}
• 適用綜所稅率：${Math.round(currentTaxRate * 100)}%
• 試算全年度可省稅額約：${fmt(totalTaxSavings)}
• 代管預估全年度實質淨得：${fmt(netCashManaged)}
我想進一步預約陳俊銘經理進行現場資產評估與節稅規劃，謝謝！`;
      btnLineConsult.href = `https://lin.ee/Q71pw2I?text=${encodeURIComponent(lineMsg)}`;
    }

    // 更新列印診斷資訊
    if (printDate) {
      const now = new Date();
      printDate.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    if (printParams) {
      printParams.textContent = `月租金 ${fmt(currentRent)} ｜ 綜所稅率 ${Math.round(currentTaxRate * 100)}% ｜ 房屋現值 ${fmt(currentHouseValue)} ｜ 申報地價 ${fmt(currentLandValue)}`;
    }
  }

  // 6. 事件綁定
  // 滑桿連動
  if (rentSlider && rentInput) {
    rentSlider.addEventListener('input', (e) => {
      currentRent = parseInt(e.target.value, 10);
      rentInput.value = currentRent;
      updateCalculations();
    });

    rentInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 5000) val = 5000;
      if (val > 200000) val = 200000;
      currentRent = val;
      rentSlider.value = val;
      rentInput.value = val;
      updateCalculations();
    });
  }

  // 快捷晶片
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = parseInt(chip.dataset.rent, 10);
      if (val) {
        currentRent = val;
        if (rentSlider) rentSlider.value = val;
        if (rentInput) rentInput.value = val;
        updateCalculations();
      }
    });
  });

  // 稅率切換按鈕
  rateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTaxRate = parseFloat(btn.dataset.rate);
      updateCalculations();
    });
  });

  // 高級參數手風琴
  if (accordionToggle && advancedPanel) {
    accordionToggle.addEventListener('click', () => {
      const isExpanded = accordionToggle.classList.toggle('expanded');
      advancedPanel.classList.toggle('show');
      accordionToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  // 高級參數輸入監聽
  if (houseValueInput) {
    houseValueInput.addEventListener('change', (e) => {
      currentHouseValue = Math.max(0, parseInt(e.target.value, 10) || 600000);
      updateCalculations();
    });
  }
  if (landValueInput) {
    landValueInput.addEventListener('change', (e) => {
      currentLandValue = Math.max(0, parseInt(e.target.value, 10) || 350000);
      updateCalculations();
    });
  }
  if (vacancySelect) {
    vacancySelect.addEventListener('change', (e) => {
      currentVacancyMonths = parseFloat(e.target.value) || 1.0;
      updateCalculations();
    });
  }
  if (feeRateSelect) {
    feeRateSelect.addEventListener('change', (e) => {
      currentFeeRate = parseFloat(e.target.value) || 0.12;
      updateCalculations();
    });
  }
  if (selfTaxRateSelect) {
    selfTaxRateSelect.addEventListener('change', (e) => {
      currentSelfHouseRate = parseFloat(e.target.value) || 0.024;
      updateCalculations();
    });
  }

  // 列印報告按鈕
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      window.print();
    });
  }

  // 複製試算報告按鈕
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', () => {
      const grandSaveText = grandTaxSavings ? grandTaxSavings.textContent : '';
      const netManagedText = netPlanManaged ? netPlanManaged.textContent : '';
      const netSelfText = netPlanSelf ? netPlanSelf.textContent : '';
      const netMasterText = netPlanMaster ? netPlanMaster.textContent : '';

      const summaryText = `【港居不動產｜房東節稅與包租代管實質淨收益試算報告】
• 評估標的月租金：${fmt(currentRent)}
• 房東個人綜所稅率：${Math.round(currentTaxRate * 100)}%
• 全年度三大稅負總節稅額：${grandSaveText}
------------------------------------
【三方案實質年度總淨得 PK】
1. 房東自租（扣除空置期與重稅）：${netSelfText}
2. 港居精緻代管（合法節稅＋收益極大化）：${netManagedText}
3. 港居全包租（零空置保證撥款）：${netMasterText}
------------------------------------
港居不動產開發有限公司（統編 96797997）
經理人：陳俊銘 (112)登字第013739號
服務專線：0968-863-880
官方諮詢 LINE：https://lin.ee/Q71pw2I`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText).then(() => {
          showToast('已成功複製節稅試算診斷摘要！可直接貼在 LINE 或筆記中留存。', 'success');
        }).catch(() => {
          fallbackCopyText(summaryText);
        });
      } else {
        fallbackCopyText(summaryText);
      }
    });
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('已成功複製節稅試算診斷摘要！', 'success');
    } catch {
      showToast('複製失敗，請手動選取文字複製', 'error');
    }
    document.body.removeChild(textArea);
  }

  // 初次執行計算
  updateCalculations();
});
