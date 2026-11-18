/**
 * ==========================================================================
 * 港居不動產 租金扣繳基本規則與即時試算指南核心引擎
 * Rent Withholding Tax & NHI Supplementary Premium Engine
 *
 * 法規基準：
 * - 《所得稅法》第14條、第88條、第89條、第92條、第94條之1、第114條、第123條
 *   （含 113.8.7 公布修正、114.1.1 施行扣繳義務人新制）
 * - 《各級公庫代理銀行代辦機構及代收稅款機構稅款解繳作業辦法》第5條（稅款角以下免收／無條件捨去）
 * - 《所得稅法施行細則》第83條第2項
 * - 《各類所得扣繳率標準》第2條第1項第5款、第3條第1項第5款、第13條、第13條之1
 * - 《全民健康保險法》第31條、第33條 ／ 《全民健康保險法施行細則》第52條（保費角以下四捨五入）
 * - 《全民健康保險扣取及繳納補充保險費辦法》第4條、第10條
 * - 《住宅法》第23條（51R） ／ 《租賃住宅市場發展及管理條例》第17條（51M）
 * ==========================================================================
 */

import { showToast, formatCommas } from './utils.js';

const NHI_RATE = 0.0211;
const NHI_THRESHOLD = 20000;
const NHI_SINGLE_CAP = 10000000;
const NHI_MAX_FEE = Math.floor(NHI_SINGLE_CAP * NHI_RATE); // 211,000
const TAX_EXEMPT_THRESHOLD = 2000;
const ANNUAL_REPORT_EXEMPT = 1000;

document.addEventListener('DOMContentLoaded', () => {
  // 1. 狀態與 DOM 元素綁定
  const state = {
    payer: 'entity',          // 'entity' | 'individual'
    landlord: 'resident',     // 'resident' | 'non_resident' | 'corp_invoice' | 'corp_small'
    pricing: 'gross',         // 'gross' | 'net'
    bearNHI: true,            // 實拿模式下是否同時負擔 2.11% 二代健保
    nonResidentHasNHI: false, // 非居住者若實質領有健保卡且為保險對象
    masterLeaseType: 'none',  // 'none' | 'social' (15,000) | 'general' (6,000)
    unitRent: 25000,
    mergeCount: 1
  };

  const els = {
    payerBtns: document.querySelectorAll('[data-payer]'),
    pricingBtns: document.querySelectorAll('[data-pricing]'),
    landlordSelect: document.getElementById('rwrLandlordSelect'),
    masterLeaseGroup: document.getElementById('rwrMasterLeaseGroup'),
    masterLeaseSelect: document.getElementById('rwrMasterLeaseSelect'),
    bearNhiBox: document.getElementById('rwrBearNhiBox'),
    bearNhiCheck: document.getElementById('rwrBearNhiCheck'),
    nonResidentNhiBox: document.getElementById('rwrNonResidentNhiBox'),
    nonResidentNhiCheck: document.getElementById('rwrNonResidentNhiCheck'),
    payerOnlyHideTargets: document.querySelectorAll('.rwr-entity-only'),
    amountInput: document.getElementById('rwrAmountInput'),
    amountRange: document.getElementById('rwrAmountRange'),
    amountLabelText: document.getElementById('rwrAmountLabelText'),
    mergeCountInput: document.getElementById('rwrMergeCount'),
    mergeHint: document.getElementById('rwrMergeHint'),
    quickChips: document.querySelectorAll('[data-preset-amount]'),

    // 結果呈現節點
    verdictBanner: document.getElementById('rwrVerdictBanner'),
    verdictBadge: document.getElementById('rwrVerdictBadge'),
    verdictHeadline: document.getElementById('rwrVerdictHeadline'),
    verdictSub: document.getElementById('rwrVerdictSub'),
    kpiGross: document.getElementById('rwrKpiGross'),
    kpiGrossMeta: document.getElementById('rwrKpiGrossMeta'),
    kpiTax: document.getElementById('rwrKpiTax'),
    kpiTaxMeta: document.getElementById('rwrKpiTaxMeta'),
    kpiNhi: document.getElementById('rwrKpiNhi'),
    kpiNhiMeta: document.getElementById('rwrKpiNhiMeta'),
    kpiNet: document.getElementById('rwrKpiNet'),
    kpiNetMeta: document.getElementById('rwrKpiNetMeta'),
    deadlineList: document.getElementById('rwrDeadlineList'),

    btnCopySummary: document.getElementById('rwrBtnCopySummary'),
    btnPrint: document.getElementById('rwrBtnPrint'),
    printDate: document.getElementById('rwrPrintDate'),
    printParams: document.getElementById('rwrPrintParams')
  };

  let latestSummaryText = '';

  function fmtNT(num) {
    return `NT$ ${formatCommas(Math.round(num))}`;
  }

  /**
   * 給定給付毛額 gross，計算所得稅（角以下無條件捨去）與二代健保補充保費（角以下四捨五入）
   */
  function evaluateFromGross(gross, cfg) {
    const taxableBase = Math.max(0, gross - cfg.exemptPerUnit * cfg.mergeCount);
    const taxPct = Math.round(cfg.taxRate * 100);
    const rawTax = Math.floor((taxableBase * taxPct) / 100);
    const tax = (cfg.hasThreshold2000 && rawTax <= TAX_EXEMPT_THRESHOLD) ? 0 : rawTax;

    const nhiBase = Math.min(gross, NHI_SINGLE_CAP);
    // 依《全民健康保險法施行細則》第52條，保險費以元為單位，角以下四捨五入（整數運算防浮點誤差）
    const nhi = (cfg.nhiEligible && gross >= NHI_THRESHOLD)
      ? Math.floor((nhiBase * 211 + 5000) / 10000)
      : 0;

    return {
      gross,
      taxableBase,
      tax,
      nhi,
      netAfterAll: gross - tax - nhi,
      netAfterTaxOnly: gross - tax
    };
  }

  /**
   * 微調 gross（所得稅角以下捨去、二代健保角以下四捨五入），尋找滿足實拿目標的最小整數毛額
   */
  function refineGrossForTarget(approxGross, netTarget, cfg, matchTaxOnly) {
    let best = evaluateFromGross(Math.max(netTarget, approxGross), cfg);
    const getNet = (r) => (matchTaxOnly ? r.netAfterTaxOnly : r.netAfterAll);
    for (let delta = -3; delta <= 3; delta++) {
      const candidate = Math.max(netTarget, approxGross + delta);
      const r = evaluateFromGross(candidate, cfg);
      if (getNet(r) === netTarget) {
        return r;
      }
      if (getNet(r) > netTarget && (getNet(best) < netTarget || r.gross < best.gross)) {
        best = r;
      }
    }
    return best;
  }

  /**
   * 由房東約定實拿金額 netTarget 反推法定給付總額 (Gross-up)
   */
  function solveGrossFromNet(netTarget, cfg) {
    const exemptTotal = cfg.exemptPerUnit * cfg.mergeCount;
    const baseEval = evaluateFromGross(netTarget, cfg);

    // 情境 1：承租方僅負擔所得稅扣繳（或不需負擔健保）
    if (!cfg.bearNHI || !cfg.nhiEligible) {
      if (baseEval.tax === 0) {
        return baseEval;
      }
      const gTaxOnly = Math.round((netTarget - cfg.taxRate * exemptTotal) / (1 - cfg.taxRate));
      const res = refineGrossForTarget(gTaxOnly, netTarget, cfg, true);
      return res.tax > 0 ? res : baseEval;
    }

    // 情境 2：承租方全額負擔「扣繳稅款 ＋ 2.11% 二代健保補充保費」
    if (baseEval.tax === 0 && baseEval.nhi === 0) {
      return baseEval;
    }

    // 嘗試 A：僅觸發二代健保（未達所得稅 2,000 元扣繳門檻，例如社宅包租減除免稅額後）
    const gNhiOnly = netTarget <= (NHI_SINGLE_CAP - NHI_MAX_FEE)
      ? Math.round(netTarget / (1 - NHI_RATE))
      : netTarget + NHI_MAX_FEE;
    const evalNhiOnly = refineGrossForTarget(gNhiOnly, netTarget, cfg, false);
    if (evalNhiOnly.tax === 0 && evalNhiOnly.nhi > 0) {
      return evalNhiOnly;
    }

    // 嘗試 B：同時觸發所得稅與二代健保（含 1,000 萬元健保上限判定）
    const denom = 1 - cfg.taxRate - NHI_RATE;
    let gBoth = Math.round((netTarget - cfg.taxRate * exemptTotal) / denom);
    if (gBoth > NHI_SINGLE_CAP) {
      gBoth = Math.round((netTarget + NHI_MAX_FEE - cfg.taxRate * exemptTotal) / (1 - cfg.taxRate));
    }
    const evalBoth = refineGrossForTarget(gBoth, netTarget, cfg, false);
    if (evalBoth.tax > 0) {
      return evalBoth;
    }

    return evalNhiOnly;
  }

  function getScenarioConfig() {
    if (state.payer === 'individual') {
      return {
        taxRate: 0,
        hasThreshold2000: false,
        nhiEligible: false,
        exemptPerUnit: 0,
        bearNHI: false,
        mergeCount: state.mergeCount
      };
    }

    let exemptPerUnit = 0;
    if (state.landlord === 'resident') {
      if (state.masterLeaseType === 'social') exemptPerUnit = 15000;
      else if (state.masterLeaseType === 'general') exemptPerUnit = 6000;
    }

    switch (state.landlord) {
      case 'resident':
        return {
          taxRate: 0.10,
          hasThreshold2000: true,
          nhiEligible: true,
          exemptPerUnit,
          bearNHI: state.bearNHI,
          mergeCount: state.mergeCount
        };
      case 'non_resident':
        return {
          taxRate: 0.20,
          hasThreshold2000: false,
          nhiEligible: state.nonResidentHasNHI,
          exemptPerUnit: 0,
          bearNHI: state.bearNHI,
          mergeCount: state.mergeCount
        };
      case 'corp_invoice':
        return {
          taxRate: 0,
          hasThreshold2000: false,
          nhiEligible: false,
          exemptPerUnit: 0,
          bearNHI: false,
          mergeCount: state.mergeCount
        };
      case 'corp_small':
      default:
        return {
          taxRate: 0.10,
          hasThreshold2000: true,
          nhiEligible: false,
          exemptPerUnit: 0,
          bearNHI: false,
          mergeCount: state.mergeCount
        };
    }
  }

  function updateVisibility() {
    const isEntity = state.payer === 'entity';
    els.payerOnlyHideTargets.forEach((node) => {
      node.hidden = !isEntity;
    });

    if (els.masterLeaseGroup) {
      els.masterLeaseGroup.hidden = !(isEntity && state.landlord === 'resident');
    }

    if (els.nonResidentNhiBox) {
      els.nonResidentNhiBox.hidden = !(isEntity && state.landlord === 'non_resident');
    }

    if (els.bearNhiBox) {
      const showBearNhi = isEntity && state.pricing === 'net' &&
        (state.landlord === 'resident' || (state.landlord === 'non_resident' && state.nonResidentHasNHI));
      els.bearNhiBox.hidden = !showBearNhi;
    }

    if (els.amountLabelText) {
      els.amountLabelText.textContent = (isEntity && state.pricing === 'net')
        ? '約定房東實拿淨額（單筆/月）'
        : '單筆／每月租金金額';
    }

    if (els.mergeHint) {
      const totalInput = state.unitRent * state.mergeCount;
      if (state.mergeCount > 1) {
        els.mergeHint.textContent = `同日合併 ${state.mergeCount} 筆給付，合計金額基準：${fmtNT(totalInput)}`;
        els.mergeHint.hidden = false;
      } else {
        els.mergeHint.hidden = true;
      }
    }
  }

  function buildDeadlines(res, cfg) {
    const items = [];
    if (state.payer === 'individual') {
      items.push('無須向國稅局繳納扣繳稅款，亦無須申報各類所得憑單。');
      items.push('無須代扣或向健保署繳納二代健保補充保險費。');
      return items;
    }

    if (state.landlord === 'corp_invoice') {
      items.push('房東依法開立統一發票者，依《所得稅法施行細則》第 83 條第 2 項免扣繳，且免依《所得稅法》第 89 條第 3 項辦理年度列單申報。');
      items.push('請妥善保存房東開立之統一發票作為營業稅與營所稅入帳憑證。');
      return items;
    }

    if (state.landlord === 'non_resident') {
      items.push('【單次繳納與申報】自代扣稅款之日起 10 日內，將扣繳稅款向國庫繳清並開具憑單申報核驗後填發（遇連續 3 日以上國定假日得延長 5 日，依《所得稅法》第 92 條第 2 項）。');
      if (res.nhi > 0) {
        items.push('【二代健保】給付日之次月底前向健保署繳納補充保費，次年 1 月底前彙報扣費明細（連假延至 2/5）。');
      }
      return items;
    }

    // 境內個人 或 小規模營利事業
    if (res.tax > 0) {
      items.push('【所得稅扣繳稅款】給付日之次月 10 日前，將上月所扣稅款向國庫繳清（《所得稅法》第 92 條第 1 項）。');
    } else {
      items.push('【所得稅免扣繳提示】本次應扣繳稅額未超過 2,000 元，給付時免扣繳稅款。');
    }

    if (res.gross * 12 > ANNUAL_REPORT_EXEMPT || res.gross > ANNUAL_REPORT_EXEMPT) {
      items.push('【年度憑單彙報】每年 1 月底前向國稅局彙報扣繳／免扣繳憑單（1 月遇連續 3 日以上國定假日延至 2 月 5 日）；同一所得人全年給付 ≤ 1,000 元才免列單（《各類所得扣繳率標準》第 13 條第 3 項）。');
      items.push('【憑單填發納稅人】每年 2 月 10 日前填發（遇 1 月連假延至 2 月 15 日）；符合《所得稅法》第 94 條之 1 納入查詢服務且所得人無索取時得免寄紙本。');
    }

    if (cfg.nhiEligible) {
      if (res.nhi > 0) {
        items.push('【二代健保繳納】給付日之次月底前向健保署繳納 2.11% 補充保險費；次年 1 月底前申報上一年度扣費明細（繳納時已電子申報明細者得免重複彙報）。');
      } else {
        items.push('【二代健保免扣】單次給付未達 20,000 元起扣點，本次免代扣 2.11% 補充保費。');
      }
    }

    return items;
  }

  function renderCalculation() {
    updateVisibility();

    const inputTotal = Math.max(0, Math.round(state.unitRent)) * state.mergeCount;
    const cfg = getScenarioConfig();

    let res;
    if (state.payer === 'individual' || state.landlord === 'corp_invoice') {
      res = { gross: inputTotal, taxableBase: 0, tax: 0, nhi: 0, netAfterAll: inputTotal, netAfterTaxOnly: inputTotal };
    } else if (state.pricing === 'gross') {
      res = evaluateFromGross(inputTotal, cfg);
    } else {
      res = solveGrossFromNet(inputTotal, cfg);
    }

    // 判斷結論狀態
    els.verdictBanner.classList.remove('is-exempt', 'is-nhi-only');
    let badgeText = '';
    let headline = '';
    let subText = '';

    if (state.payer === 'individual') {
      els.verdictBanner.classList.add('is-exempt');
      badgeText = '免扣繳・免申報';
      headline = '一般自然人房客無須辦理扣繳或二代健保代扣';
      subText = '個人房客非《所得稅法》第 89 條之扣繳義務人，亦非《全民健康保險法》第 31 條之扣費義務人。';
    } else if (state.landlord === 'corp_invoice') {
      els.verdictBanner.classList.add('is-exempt');
      badgeText = '開立統一發票・雙免';
      headline = '房東依法開立統一發票：免予扣繳且免列單申報';
      subText = '依《所得稅法施行細則》第 83 條第 2 項免扣繳，並免依第 89 條第 3 項申報憑單；營利事業亦無健保補充保費。';
    } else if (res.tax > 0 && res.nhi > 0) {
      badgeText = '應雙扣所得稅 ＋ 二代健保';
      headline = `本次應代扣所得稅 ${fmtNT(res.tax)} ＋ 二代健保 ${fmtNT(res.nhi)}`;
      subText = state.pricing === 'net'
        ? `契約約定實拿，已依規定還原給付總額為 ${fmtNT(res.gross)}（應向國稅局與健保署申報之憑單毛額）。`
        : `房東實際領取 ${fmtNT(res.netAfterAll)}；扣繳義務主體為承租事業／組織本身（114 年起新制）。`;
    } else if (res.tax === 0 && res.nhi > 0) {
      els.verdictBanner.classList.add('is-nhi-only');
      badgeText = '所得稅免扣・僅扣二代健保';
      headline = `所得稅免扣繳，但應代扣二代健保補充保費 ${fmtNT(res.nhi)}`;
      subText = `單次給付已達健保 20,000 元起扣點須扣 2.11%；應扣所得稅額未超過 2,000 元故免予扣繳（仍須於次年 1 月底前辦理年度列單申報）。`;
    } else if (res.tax > 0 && res.nhi === 0) {
      badgeText = '應扣繳所得稅・無健保補充保費';
      headline = `本次應代扣所得稅 ${fmtNT(res.tax)}（免扣二代健保）`;
      subText = state.landlord === 'non_resident'
        ? '非境內居住者適用 20% 扣繳率且無 2,000 元免扣繳門檻，須於代扣日起 10 日內繳納並申報憑單。'
        : '營利事業或單次給付未達 20,000 元無二代健保補充保費，但仍須依限繳納所扣稅款並申報憑單。';
    } else {
      els.verdictBanner.classList.add('is-exempt');
      badgeText = '未達雙項起扣點・免扣款';
      headline = '本次給付所得稅與二代健保均免予扣取';
      subText = '單次應扣所得稅 ≤ 2,000 元且未達健保 20,000 元起扣點；請留意全年累計給付 > 1,000 元時，仍須於次年 1 月底前辦理免扣繳憑單列單申報。';
    }

    els.verdictBadge.textContent = badgeText;
    els.verdictHeadline.textContent = headline;
    els.verdictSub.textContent = subText;

    // 4 大 KPI 數值更新
    els.kpiGross.textContent = fmtNT(res.gross);
    if (cfg.exemptPerUnit > 0 && state.payer === 'entity' && state.landlord === 'resident') {
      const totalExempt = cfg.exemptPerUnit * state.mergeCount;
      els.kpiGrossMeta.textContent = `含免稅額 ${fmtNT(totalExempt)}，扣繳應稅基數為 ${fmtNT(res.taxableBase)}`;
    } else {
      els.kpiGrossMeta.textContent = state.pricing === 'net' && res.gross > inputTotal
        ? `由實拿 ${fmtNT(inputTotal)} 還原為給付總額（含代付稅費）`
        : '法定扣（免）繳憑單與健保費基認定總額';
    }

    els.kpiTax.textContent = fmtNT(res.tax);
    if (state.payer === 'individual' || state.landlord === 'corp_invoice') {
      els.kpiTaxMeta.textContent = '無扣繳稅額';
    } else {
      const pctText = `${Math.round(cfg.taxRate * 100)}%`;
      els.kpiTaxMeta.textContent = res.tax > 0
        ? `稅率 ${pctText}（角以下捨去）；次月 10 日前繳庫（非居住者 10 日內）`
        : `試算稅額 ${fmtNT(Math.floor(res.taxableBase * cfg.taxRate))} ≤ 2,000 元免扣`;
    }

    els.kpiNhi.textContent = fmtNT(res.nhi);
    if (!cfg.nhiEligible) {
      els.kpiNhiMeta.textContent = state.landlord === 'corp_invoice' || state.landlord === 'corp_small'
        ? '房東為營利事業（非自然人健保對象）免扣'
        : '本次身分不適用或免扣取';
    } else if (res.nhi > 0) {
      els.kpiNhiMeta.textContent = res.gross > NHI_SINGLE_CAP
        ? '已達單次 1,000 萬元上限，以 1,000 萬元 × 2.11% 計收'
        : '費率 2.11%（角以下四捨五入）；給付日次月底前繳納';
    } else {
      els.kpiNhiMeta.textContent = '單次給付未達 20,000 元起扣門檻';
    }

    const landlordReceived = res.netAfterAll;
    els.kpiNet.textContent = fmtNT(landlordReceived);
    els.kpiNetMeta.textContent = state.pricing === 'net' && res.gross > inputTotal
      ? `承租方含稅費實際總支出為 ${fmtNT(res.gross)}`
      : `給付總額扣除代扣稅款與補充保費後之實領淨額`;

    // 法定期限條列（使用 textContent 安全建立 li）
    const deadlines = buildDeadlines(res, cfg);
    const liNodes = deadlines.map((txt) => {
      const li = document.createElement('li');
      li.textContent = txt;
      return li;
    });
    els.deadlineList.replaceChildren(...liNodes);

    // 更新列印標頭日期與參數
    const nowStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (els.printDate) els.printDate.textContent = `試算基準日：${nowStr}`;
    const landlordText = els.landlordSelect ? els.landlordSelect.options[els.landlordSelect.selectedIndex].text : '';
    const payerText = state.payer === 'entity' ? '法人／公司／機關團體' : '一般自然人房客';
    if (els.printParams) {
      els.printParams.textContent = `承租方：${payerText} ｜ 房東身分：${landlordText} ｜ 計價：${state.pricing === 'net' ? '房東實拿(未稅還原)' : '含稅總額'} ｜ 給付總額：${fmtNT(res.gross)}`;
    }

    // 準備 LINE 複製摘要
    latestSummaryText = [
      '【港居不動產｜租金扣繳與二代健保試算明細】',
      `• 承租方身分：${payerText}`,
      ...(state.payer === 'entity' ? [`• 房東身分別：${landlordText}`] : []),
      `• 契約計價模式：${state.pricing === 'net' ? '房東實拿淨額 (Gross-up 還原)' : '含稅給付總額'}`,
      ...(state.mergeCount > 1 ? [`• 同日合併筆數：${state.mergeCount} 筆（單筆 ${fmtNT(state.unitRent)}）`] : []),
      `------------------------------`,
      `• 給付總額（憑單毛額）：${fmtNT(res.gross)}`,
      `• 代扣所得稅：${fmtNT(res.tax)}`,
      `• 代扣二代健保 (2.11%)：${fmtNT(res.nhi)}`,
      `• 房東實領淨額：${fmtNT(landlordReceived)}`,
      `------------------------------`,
      `結論：${headline}`,
      '※ 本試算依現行稅法與健保署公告費率（2.11%）編製，實際申報請依貴司記帳士或國稅局核定為準。'
    ].join('\n');
  }

  // 2. 事件監聽綁定
  els.payerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.payer = btn.dataset.payer;
      els.payerBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderCalculation();
    });
  });

  els.pricingBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pricing = btn.dataset.pricing;
      els.pricingBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderCalculation();
    });
  });

  if (els.landlordSelect) {
    els.landlordSelect.addEventListener('change', () => {
      state.landlord = els.landlordSelect.value;
      renderCalculation();
    });
  }

  if (els.masterLeaseSelect) {
    els.masterLeaseSelect.addEventListener('change', () => {
      state.masterLeaseType = els.masterLeaseSelect.value;
      renderCalculation();
    });
  }

  if (els.bearNhiCheck) {
    els.bearNhiCheck.addEventListener('change', () => {
      state.bearNHI = els.bearNhiCheck.checked;
      renderCalculation();
    });
  }

  if (els.nonResidentNhiCheck) {
    els.nonResidentNhiCheck.addEventListener('change', () => {
      state.nonResidentHasNHI = els.nonResidentNhiCheck.checked;
      renderCalculation();
    });
  }

  if (els.amountInput) {
    els.amountInput.addEventListener('input', () => {
      const val = Number(els.amountInput.value);
      state.unitRent = Number.isFinite(val) && val >= 0 ? val : 0;
      if (els.amountRange) {
        els.amountRange.value = Math.min(Number(els.amountRange.max), state.unitRent);
      }
      renderCalculation();
    });
  }

  if (els.amountRange) {
    els.amountRange.addEventListener('input', () => {
      const val = Number(els.amountRange.value);
      state.unitRent = val;
      if (els.amountInput) els.amountInput.value = val;
      renderCalculation();
    });
  }

  if (els.mergeCountInput) {
    els.mergeCountInput.addEventListener('input', () => {
      const val = Math.max(1, Math.min(50, Math.round(Number(els.mergeCountInput.value) || 1)));
      state.mergeCount = val;
      renderCalculation();
    });
  }

  els.quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const amt = Number(chip.dataset.presetAmount);
      const pricing = chip.dataset.presetPricing;
      if (pricing) {
        state.pricing = pricing;
        els.pricingBtns.forEach((b) => b.classList.toggle('active', b.dataset.pricing === pricing));
      }
      if (state.payer !== 'entity') {
        state.payer = 'entity';
        els.payerBtns.forEach((b) => b.classList.toggle('active', b.dataset.payer === 'entity'));
      }
      state.mergeCount = 1;
      if (els.mergeCountInput) els.mergeCountInput.value = 1;
      state.unitRent = amt;
      if (els.amountInput) els.amountInput.value = amt;
      if (els.amountRange) els.amountRange.value = Math.min(Number(els.amountRange.max), amt);
      renderCalculation();
      showToast(`已套用試算情境：${fmtNT(amt)}`);
    });
  });

  if (els.btnCopySummary) {
    els.btnCopySummary.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(latestSummaryText);
        } else {
          const ta = document.createElement('textarea');
          ta.value = latestSummaryText;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast('已複製租金扣繳試算明細（可直接貼上 LINE）');
        if (window.GanjuTracker) {
          window.GanjuTracker.track('withholding_copy_summary', { payer: state.payer, landlord: state.landlord });
        }
      } catch (err) {
        showToast('複製失敗，請手動選取內容複製');
      }
    });
  }

  if (els.btnPrint) {
    els.btnPrint.addEventListener('click', () => {
      if (window.GanjuTracker) {
        window.GanjuTracker.track('withholding_print_guide', { payer: state.payer, landlord: state.landlord });
      }
      window.print();
    });
  }

  // 初次渲染
  renderCalculation();
});
