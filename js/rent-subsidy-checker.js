/**
 * 港居不動產 - 300億中央擴大租金補貼資格自檢與實質月租試算器 (js/rent-subsidy-checker.js)
 * 依據內政部國土管理署「300億元中央擴大租金補貼專案」高雄市分級與加碼倍數設計
 * 純瀏覽器本地運算・支援5大情境快速切換、房東公益出租人節稅對照、LINE複製與Canvas圖卡下載
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_rent_subsidy_v1';

function getDefaultState() {
  return {
    districtZone: 'zone1', // 'zone1' (小港/前鎮/鳳山/市區) | 'zone2' (林園/大社/旗山等)
    districtName: '小港區 / 前鎮區 / 鳳山區',
    contractRent: 12500,
    householdMembers: 1, // 1 | 2 | 3 (3人以上)
    ageGroup: 'under40', // 'under40' (18~39歲) | '40to64' (40~64歲) | '65plus' (65歲以上)
    isNewlywed: false, // 結婚2年內
    childrenCount: 0, // 0, 1, 2, 3, 4
    econStatus: 'none', // 'none' | 'low' (低收入戶) | 'midlow' (中低收入戶)
    socialWeak: false, // 身心障礙/原住民/特殊境遇等
    chkAdult: true,
    chkNoHouse: true,
    chkIncomeOk: true,
    chkNoDup: true
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.contractRent === 'number') {
        return { ...getDefaultState(), ...parsed };
      }
    }
  } catch (err) {
    console.warn('無法讀取租金補貼試算草稿:', err);
  }
  return getDefaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('無法儲存租金補貼試算草稿:', err);
  }
}

/**
 * 核心演算法：判定資格、高雄市分級基準額（第一級/第二級/第三級）與最優加碼倍數
 */
function calculateSubsidy() {
  const isEligible = Boolean(state.chkAdult && state.chkNoHouse && state.chkIncomeOk && state.chkNoDup);
  const contractRent = Math.max(0, Number(state.contractRent) || 0);
  const members = Math.max(1, parseInt(state.householdMembers, 10) || 1);
  const children = Math.max(0, parseInt(state.childrenCount, 10) || 0);
  const effectiveMembers = Math.max(members, children > 0 ? children + 1 : 1);

  const isSocialWeak = Boolean(state.socialWeak || state.ageGroup === '65plus');
  const isEconWeak = state.econStatus === 'low' || state.econStatus === 'midlow';

  // 1. 判定分級 (第一級 / 第二級 / 第三級)
  let tier = 2;
  let tierName = '第二級';
  let tierReason = '家庭成員2人以上，或單身滿40歲／具弱勢身分';

  if (
    (effectiveMembers >= 2 && state.econStatus === 'low') ||
    (effectiveMembers >= 3 && state.econStatus === 'midlow')
  ) {
    tier = 1;
    tierName = '第一級';
    tierReason = '家庭成員2人以上具低收入戶，或3人以上具中低收入戶身分';
  } else if (
    effectiveMembers === 1 &&
    state.ageGroup === 'under40' &&
    !isEconWeak &&
    !isSocialWeak &&
    !state.isNewlywed &&
    children === 0
  ) {
    tier = 3;
    tierName = '第三級';
    tierReason = '家庭成員1人（單身未滿40歲）且未具經濟或社會弱勢身分';
  }

  // 2. 高雄市分區基準上限
  const zoneCaps = {
    zone1: { 1: 5000, 2: 4000, 3: 2400 },
    zone2: { 1: 3600, 2: 3200, 3: 2000 }
  };
  const caps = zoneCaps[state.districtZone] || zoneCaps.zone1;
  const baseCap = caps[tier];

  // 3. 計算所有適用之加碼倍數，並擇優取最高倍數
  const multipliers = [{ factor: 1.0, label: '基本額度 (無加碼 1.0倍)' }];

  if (effectiveMembers === 1 && state.ageGroup === 'under40') {
    multipliers.push({ factor: 1.2, label: '18～39歲單身青年加碼 (1.2倍)' });
  }
  if (state.isNewlywed) {
    multipliers.push({ factor: 1.3, label: '結婚2年內新婚家庭加碼 (1.3倍)' });
  }
  if (children > 0) {
    const childFactor = Number((1.2 + children * 0.2).toFixed(1));
    multipliers.push({ factor: childFactor, label: `育有未成年子女 ${children} 人加碼 (${childFactor}倍)` });
  }
  if (isEconWeak) {
    multipliers.push({ factor: 1.4, label: '經濟弱勢 (低收/中低收入戶) 加碼 (1.4倍)' });
  }
  if (isSocialWeak) {
    multipliers.push({ factor: 1.2, label: '社會弱勢 (65歲以上長者/身障/原住民等) 加碼 (1.2倍)' });
  }

  multipliers.sort((a, b) => b.factor - a.factor);
  const bestMultiplier = multipliers[0];

  const rawSubsidy = Math.round(baseCap * bestMultiplier.factor);
  const monthlySubsidy = isEligible ? Math.min(contractRent, rawSubsidy) : 0;
  const selfPayRent = Math.max(0, contractRent - monthlySubsidy);
  const annualSubsidy = monthlySubsidy * 12;

  const govRatio = contractRent > 0 ? Math.min(100, Math.round((monthlySubsidy / contractRent) * 100)) : 0;
  const selfRatio = Math.max(0, 100 - govRatio);

  return {
    isEligible,
    contractRent,
    effectiveMembers,
    tier,
    tierName,
    tierReason,
    baseCap,
    bestMultiplier,
    rawSubsidy,
    monthlySubsidy,
    selfPayRent,
    annualSubsidy,
    govRatio,
    selfRatio
  };
}

/**
 * 渲染試算結果與畫面
 */
function renderSubsidyView(calc) {
  const eligBanner = document.getElementById('eligibilityBanner');
  if (eligBanner) {
    if (calc.isEligible) {
      eligBanner.classList.remove('ineligible');
      eligBanner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>✅ 恭喜！您符合「300億元中央擴大租金補貼」四大基本申請條件（高雄市每人每月平均所得門檻 ≤ 43,257 元）</span>`;
    } else {
      eligBanner.classList.add('ineligible');
      eligBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>⚠️ 您尚未勾選全部 4 項法定基本資格（需年滿18歲、家庭無自有住宅、每人月均所得低於43,257元、無重複補貼），請確認上方核選框</span>`;
    }
  }

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt(
    'sheetZoneMeta',
    `租屋地區：高雄市（${state.districtZone === 'zone1' ? '小港／前鎮／鳳山／都會核心區' : '林園／大社／旗山／一般區'}）`
  );

  setTxt('heroContractRent', `NT$ ${calc.contractRent.toLocaleString()}`);
  setTxt('heroMonthlySubsidy', `- NT$ ${calc.monthlySubsidy.toLocaleString()}`);
  setTxt('heroAnnualSubText', `全年補助 NT$ ${calc.annualSubsidy.toLocaleString()}`);
  setTxt('heroSelfPayRent', `NT$ ${calc.selfPayRent.toLocaleString()}`);
  setTxt('heroSelfRatioText', `相當於租金打 ${Math.max(1, ((calc.selfPayRent / Math.max(1, calc.contractRent)) * 10).toFixed(1))} 折`);

  const govBar = document.getElementById('rentBarGov');
  const selfBar = document.getElementById('rentBarSelf');
  if (govBar) govBar.style.width = `${calc.govRatio}%`;
  if (selfBar) selfBar.style.width = `${calc.selfRatio}%`;

  setTxt('barGovPctText', `政府補助佔比：${calc.govRatio}% ($${calc.monthlySubsidy.toLocaleString()}/月)`);
  setTxt('barSelfPctText', `租客實付佔比：${calc.selfRatio}% ($${calc.selfPayRent.toLocaleString()}/月)`);

  setTxt('detailTierBadge', `${calc.tierName}（基準額 NT$ ${calc.baseCap.toLocaleString()} / 月）`);
  setTxt('detailTierReason', calc.tierReason);
  setTxt('detailMultiplier', `${calc.bestMultiplier.label}`);
  setTxt('detailFormula', `NT$ ${calc.baseCap.toLocaleString()} × ${calc.bestMultiplier.factor} 倍 ＝ 每月 NT$ ${calc.monthlySubsidy.toLocaleString()} 元`);
  setTxt('detailAnnualTotal', `NT$ ${calc.annualSubsidy.toLocaleString()} 元 / 年`);
}

function initFormValues() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  const setChk = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setVal('districtZoneSelect', state.districtZone);
  setVal('contractRentInput', state.contractRent);
  setVal('householdMembersSelect', state.householdMembers);
  setVal('ageGroupSelect', state.ageGroup);
  setVal('childrenCountSelect', state.childrenCount);
  setVal('econStatusSelect', state.econStatus);

  setChk('newlywedCheck', state.isNewlywed);
  setChk('socialWeakCheck', state.socialWeak);
  setChk('chkAdult', state.chkAdult);
  setChk('chkNoHouse', state.chkNoHouse);
  setChk('chkIncomeOk', state.chkIncomeOk);
  setChk('chkNoDup', state.chkNoDup);
}

/**
 * 產生 LINE 租金補貼試算分享與預約看房文字
 */
function buildLineText(calc) {
  return [
    `【🧮 高雄 300億租金補貼資格與實質月租試算】`,
    `📍 租屋區域：高雄市（${state.districtZone === 'zone1' ? '小港/前鎮/鳳山都會區' : '其他行政區'}）`,
    `🏠 契約月租金：NT$ ${calc.contractRent.toLocaleString()} / 月`,
    `──────────────────`,
    `✅ 核定補貼級距：${calc.tierName}（基準額 $${calc.baseCap.toLocaleString()}/月）`,
    `✨ 擇優加碼倍數：${calc.bestMultiplier.label}`,
    `💰 每月政府補貼：- NT$ ${calc.monthlySubsidy.toLocaleString()} 元/月（全年補助 $${calc.annualSubsidy.toLocaleString()}）`,
    `👉 補貼後實質自付月租：NT$ ${calc.selfPayRent.toLocaleString()} 元/月`,
    `──────────────────`,
    `📲 我想諮詢港居不動產「可申請租金補貼」之優質房源（或屋主委託節稅方案）！`
  ].join('\n');
}

/**
 * 下載 Canvas 800×940px《300億租金補貼試算暨實付月租小卡》PNG 圖卡
 */
function downloadSubsidyCardImage(calc) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 940;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 800, 160);
  grad.addColorStop(0, '#0F2341');
  grad.addColorStop(1, '#1A365D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 160);

  ctx.fillStyle = '#C5A059';
  ctx.fillRect(0, 160, 800, 6);

  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold 19px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司 ｜ 高雄租屋政策補貼試算憑證', 44, 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "Noto Sans TC", sans-serif';
  ctx.fillText('300億中央擴大租金補貼・實質月租診斷單', 44, 98);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '18px "Noto Sans TC", sans-serif';
  ctx.fillText(`適用地區：高雄市（${state.districtZone === 'zone1' ? '小港/前鎮/鳳山都會核心區' : '一般行政區'}）`, 44, 136);

  // 白色內容卡片
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillRect(36, 190, 728, 700);
  ctx.strokeRect(36, 190, 728, 700);

  // 頂部三大金額對比框
  ctx.fillStyle = '#1A365D';
  ctx.fillRect(60, 216, 680, 110);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '17px "Noto Sans TC", sans-serif';
  ctx.fillText('原契約月租金', 88, 250);
  ctx.fillText('政府每月補貼', 318, 250);
  ctx.fillText('補貼後實質自付月租', 536, 250);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
  ctx.fillText(`NT$ ${calc.contractRent.toLocaleString()}`, 88, 294);

  ctx.fillStyle = '#68D391';
  ctx.fillText(`- NT$ ${calc.monthlySubsidy.toLocaleString()}`, 318, 294);

  ctx.fillStyle = '#FBD38D';
  ctx.font = 'bold 32px "Noto Sans TC", sans-serif';
  ctx.fillText(`NT$ ${calc.selfPayRent.toLocaleString()}`, 536, 294);

  // 明細列
  const drawRow = (y, label, val) => {
    ctx.fillStyle = '#475569';
    ctx.font = '19px "Noto Sans TC", sans-serif';
    ctx.fillText(label, 68, y);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 21px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, 730, y);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(64, y + 22);
    ctx.lineTo(736, y + 22);
    ctx.stroke();
  };

  drawRow(382, '1. 核定補助分級與基準額', `${calc.tierName}（每月基準上限 NT$ ${calc.baseCap.toLocaleString()}）`);
  drawRow(448, '2. 擇優適用政策加碼倍數', calc.bestMultiplier.label);
  drawRow(514, '3. 計算公式與每月補貼額', `$${calc.baseCap.toLocaleString()} × ${calc.bestMultiplier.factor} 倍 ＝ NT$ ${calc.monthlySubsidy.toLocaleString()} / 月`);
  drawRow(580, '4. 全年度 (12個月) 累計總補貼', `NT$ ${calc.annualSubsidy.toLocaleString()} 元 / 年`);

  // 房東雙贏說明盒
  ctx.fillStyle = '#FEFCE8';
  ctx.strokeStyle = '#FDE047';
  ctx.fillRect(60, 636, 680, 120);
  ctx.strokeRect(60, 636, 680, 120);

  ctx.fillStyle = '#854D0E';
  ctx.font = 'bold 19px "Noto Sans TC", sans-serif';
  ctx.fillText('🏛️ 房東同步享有《住宅法》公益出租人與《租賃專法》節稅優惠！', 80, 672);
  ctx.font = '16px "Noto Sans TC", sans-serif';
  ctx.fillText('• 房客申請租補，屋主自動享每屋每月 1.5 萬元免稅額 ＋ 房屋稅比照自住 1.2%', 80, 704);
  ctx.fillText('• 委託港居包租代管，超過 1.5 萬部分再享最高 60% 必要費用減除！', 80, 732);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px "Noto Sans TC", sans-serif';
  ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號 ｜ 電話：07-791-2288', 64, 855);

  const a = document.createElement('a');
  a.download = `高雄300億租金補貼試算單_月省${calc.monthlySubsidy}元.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('已下載《300億租金補貼試算單》PNG 圖卡！', 'success');
}

function syncAndRender() {
  saveState();
  const calc = calculateSubsidy();
  renderSubsidyView(calc);
}

function bindEvents() {
  const bindVal = (id, key, isNum = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = isNum ? Number(el.value) || 0 : el.value;
      syncAndRender();
    });
  };

  const bindChk = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      state[key] = el.checked;
      syncAndRender();
    });
  };

  bindVal('districtZoneSelect', 'districtZone');
  bindVal('contractRentInput', 'contractRent', true);
  bindVal('householdMembersSelect', 'householdMembers', true);
  bindVal('ageGroupSelect', 'ageGroup');
  bindVal('childrenCountSelect', 'childrenCount', true);
  bindVal('econStatusSelect', 'econStatus');

  bindChk('newlywedCheck', 'isNewlywed');
  bindChk('socialWeakCheck', 'socialWeak');
  bindChk('chkAdult', 'chkAdult');
  bindChk('chkNoHouse', 'chkNoHouse');
  bindChk('chkIncomeOk', 'chkIncomeOk');
  bindChk('chkNoDup', 'chkNoDup');

  // 5 大快速情境切換按鈕
  const presets = {
    singleYouth: {
      householdMembers: 1,
      ageGroup: 'under40',
      isNewlywed: false,
      childrenCount: 0,
      econStatus: 'none',
      socialWeak: false
    },
    newlywed: {
      householdMembers: 2,
      ageGroup: 'under40',
      isNewlywed: true,
      childrenCount: 0,
      econStatus: 'none',
      socialWeak: false
    },
    twoKids: {
      householdMembers: 3,
      ageGroup: 'under40',
      isNewlywed: false,
      childrenCount: 2,
      econStatus: 'none',
      socialWeak: false
    },
    seniorSocial: {
      householdMembers: 1,
      ageGroup: '65plus',
      isNewlywed: false,
      childrenCount: 0,
      econStatus: 'none',
      socialWeak: true
    },
    lowIncomeFamily: {
      householdMembers: 2,
      ageGroup: '40to64',
      isNewlywed: false,
      childrenCount: 0,
      econStatus: 'low',
      socialWeak: false
    }
  };

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-preset');
      const p = presets[key];
      if (!p) return;

      document.querySelectorAll('[data-preset]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      state = {
        ...state,
        ...p,
        chkAdult: true,
        chkNoHouse: true,
        chkIncomeOk: true,
        chkNoDup: true
      };
      initFormValues();
      syncAndRender();
      showToast(`已套用「${btn.textContent.trim()}」補貼試算條件！`, 'info');
    });
  });

  // 複製 LINE 試算文字
  const copyBtn = document.getElementById('copySubsidyLineBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const calc = calculateSubsidy();
      const text = buildLineText(calc);
      try {
        await navigator.clipboard.writeText(text);
        showToast('已複製租金補貼試算結果！可貼至 LINE 傳送。', 'success');
      } catch {
        showToast('已產生 LINE 試算摘要！', 'success');
      }
      if (window.GanjuTracker) {
        window.GanjuTracker.track('subsidy_line_copy', { monthly_subsidy: calc.monthlySubsidy });
      }
    });
  }

  // 下載 PNG 圖卡
  const dlBtn = document.getElementById('downloadSubsidyCardBtn');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const calc = calculateSubsidy();
      downloadSubsidyCardImage(calc);
      if (window.GanjuTracker) {
        window.GanjuTracker.track('subsidy_card_download', { monthly_subsidy: calc.monthlySubsidy });
      }
    });
  }

  // 列印 A4 報告
  const printBtn = document.getElementById('printSubsidySheetBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFormValues();
  const calc = calculateSubsidy();
  renderSubsidyView(calc);
  bindEvents();
});
