// js/depreciation-calculator.js
// 港居不動產 租賃住宅設備損耗折舊與賠償殘值精算器
// 依據行政院財政部《固定資產耐用年數表》、民法第 213~216 條及法院常見判決標準（平均法折舊與孰低原則）

document.addEventListener('DOMContentLoaded', () => {
  // 1. 預設 10 大常見租屋設備耐用年數與參考成本矩陣
  const PRESETS = {
    ac: { name: '分離式冷氣空調', years: 5, price: 28000, desc: '依固定資產耐用年數表第2類第3項：空氣調節設備耐用年數為 5 年。' },
    tv: { name: '液晶電視機與影音', years: 5, price: 18000, desc: '依固定資產耐用年數表第2類第1項：電視音響設備耐用年數為 5 年。' },
    fridge: { name: '電冰箱', years: 5, price: 22000, desc: '依固定資產耐用年數表第2類第2項：電冰箱耐用年數為 5 年。' },
    washer: { name: '洗衣機 / 乾衣機', years: 5, price: 15000, desc: '依固定資產耐用年數表第2類第2項：洗衣設備耐用年數為 5 年。' },
    heater: { name: '瓦斯 / 電熱水器', years: 5, price: 13500, desc: '依固定資產耐用年數表第2類第4項：熱水給水設備耐用年數為 5 年。' },
    hood: { name: '抽油煙機與瓦斯爐', years: 5, price: 12000, desc: '依固定資產耐用年數表第2類第4項：排油煙機廚房器具耐用年數為 5 年。' },
    bed: { name: '雙人床架與床墊', years: 3, price: 16000, desc: '依固定資產耐用年數表第3類家具設備：一般木質床架、彈簧床墊耐用年數為 3 年。' },
    sofa: { name: '客廳皮質 / 布質沙發', years: 3, price: 20000, desc: '依固定資產耐用年數表第3類家具設備：皮布沙發座椅耐用年數為 3 年。' },
    floor: { name: '超耐磨木地板 / 地磚', years: 3, price: 25000, desc: '依固定資產耐用年數表：一般租賃面層木質地板耐用年數為 3 年。' },
    paint: { name: '室內油漆粉刷 / 壁紙', years: 2, price: 12000, desc: '依民法租賃習慣與判例：一般租賃內牆粉刷裝飾面層耐用年數約 2~3 年。' },
    custom: { name: '自訂其他設備', years: 5, price: 10000, desc: '可依發票或原廠保固書手動自訂耐用年數與購置金額。' }
  };

  // DOM 元素引用
  const elPresetBtns = document.querySelectorAll('.deprec-preset-btn');
  const elEquipName = document.getElementById('equipName');
  const elOrigPrice = document.getElementById('origPrice');
  const elUsefulYears = document.getElementById('usefulYears');
  const elInstallDate = document.getElementById('installDate');
  const elDamageDate = document.getElementById('damageDate');
  const elRepairCost = document.getElementById('repairCost');
  const elFaultRatio = document.getElementById('faultRatio');
  const elFaultRatioVal = document.getElementById('faultRatioVal');
  const elIsScrapped = document.getElementById('isScrapped');

  // 結果顯示 DOM
  const elFinalComp = document.getElementById('finalCompensation');
  const elLegalResidual = document.getElementById('legalResidual');
  const elDeprecPerYear = document.getElementById('deprecPerYear');
  const elElapsedMonths = document.getElementById('elapsedMonths');
  const elAccumDeprec = document.getElementById('accumDeprec');
  const elDeprecCurrentVal = document.getElementById('deprecCurrentVal');
  const elCompPrinciple = document.getElementById('compPrinciple');
  const elStatStatus = document.getElementById('statStatus');
  const elBarUsed = document.getElementById('barUsed');
  const elBarResidual = document.getElementById('barResidual');
  const elBarUsedPct = document.getElementById('barUsedPct');
  const elBarResidualPct = document.getElementById('barResidualPct');
  const elAlertOverdue = document.getElementById('alertOverdue');
  const elAlertWhicheverLower = document.getElementById('alertWhicheverLower');
  const elEquipDesc = document.getElementById('equipDesc');

  // 按鈕與操作
  const elBtnCopyLine = document.getElementById('btnCopyLine');
  const elBtnDownloadCard = document.getElementById('btnDownloadCard');
  const elBtnPrint = document.getElementById('btnPrint');

  // 列印表頭元素
  const elPrintDate = document.getElementById('printDate');
  const elPrintParams = document.getElementById('printParams');

  // 初始化預設日期 (購置日：3年前；損壞日：今日)
  const today = new Date();
  const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());

  elDamageDate.value = today.toISOString().split('T')[0];
  elInstallDate.value = threeYearsAgo.toISOString().split('T')[0];

  // 讀取 LocalStorage 草稿
  const DRAFT_KEY = 'ganju_deprec_calc_v1';
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.equipName) elEquipName.value = data.equipName;
      if (data.origPrice) elOrigPrice.value = data.origPrice;
      if (data.usefulYears) elUsefulYears.value = data.usefulYears;
      if (data.installDate) elInstallDate.value = data.installDate;
      if (data.damageDate) elDamageDate.value = data.damageDate;
      if (data.repairCost !== undefined) elRepairCost.value = data.repairCost;
      if (data.faultRatio !== undefined) elFaultRatio.value = data.faultRatio;
      if (data.isScrapped !== undefined) elIsScrapped.checked = data.isScrapped;
    }
  } catch (e) {
    console.warn('Draft load failed:', e);
  }

  // 核心計算引擎
  function calculate() {
    const origPrice = Math.max(0, parseFloat(elOrigPrice.value) || 0);
    const usefulYears = Math.max(1, parseFloat(elUsefulYears.value) || 5);
    const repairCost = Math.max(0, parseFloat(elRepairCost.value) || 0);
    const faultRatio = (parseFloat(elFaultRatio.value) || 100) / 100;
    const isScrapped = elIsScrapped.checked;

    elFaultRatioVal.textContent = Math.round(faultRatio * 100) + '%';

    // 計算使用月數
    const dInstall = new Date(elInstallDate.value || today);
    const dDamage = new Date(elDamageDate.value || today);
    let diffMonths = (dDamage.getFullYear() - dInstall.getFullYear()) * 12 + (dDamage.getMonth() - dInstall.getMonth());
    if (dDamage.getDate() < dInstall.getDate()) diffMonths -= 0.5;
    const elapsedMonths = Math.max(0, diffMonths);
    const usefulMonths = usefulYears * 12;

    // 1. 法定殘值 (平均法/直線折舊法：殘值 = 原價 / (n + 1))
    const legalResidualVal = Math.round(origPrice / (usefulYears + 1));

    // 2. 每年折舊額 = (原價 - 殘值) / n
    const annualDeprec = (origPrice - legalResidualVal) / usefulYears;
    const monthlyDeprec = annualDeprec / 12;

    // 3. 累計折舊
    let accumDeprec = Math.round(monthlyDeprec * elapsedMonths);
    if (accumDeprec > (origPrice - legalResidualVal)) {
      accumDeprec = origPrice - legalResidualVal;
    }

    // 4. 折舊後法定現值 = 原價 - 累計折舊 (最低不得低於法定殘值)
    const depreciatedCurrentVal = Math.max(legalResidualVal, Math.round(origPrice - accumDeprec));

    // 5. 判定是否已屆滿耐用年限
    const isExpired = elapsedMonths >= usefulMonths;

    // 6. 損害賠償認定（孰低原則：維修費 vs 現值）
    let baseCompensation = 0;
    let principleText = '';
    let hasWhicheverLower = false;

    if (isScrapped) {
      baseCompensation = depreciatedCurrentVal;
      principleText = `設備完全報廢不可修復，依【折舊後現值】為賠償基準上限`;
    } else {
      if (repairCost > 0) {
        if (repairCost < depreciatedCurrentVal) {
          baseCompensation = repairCost;
          principleText = `維修費 ($${repairCost.toLocaleString()}) 低於折舊現值 ($${depreciatedCurrentVal.toLocaleString()})，依【實際修復費用】賠償`;
        } else {
          baseCompensation = depreciatedCurrentVal;
          hasWhicheverLower = true;
          principleText = `維修費 ($${repairCost.toLocaleString()}) 超過折舊現值 ($${depreciatedCurrentVal.toLocaleString()})，依法院判例【以現值為賠償上限】防超額求償`;
        }
      } else {
        baseCompensation = depreciatedCurrentVal;
        principleText = `未填寫維修費，暫依【折舊後現值】為全損賠償基準`;
      }
    }

    // 7. 最終責任分攤後賠償額
    const finalCompensationVal = Math.round(baseCompensation * faultRatio);

    // 畫面更新
    elFinalComp.textContent = 'NT$ ' + finalCompensationVal.toLocaleString();
    elLegalResidual.textContent = 'NT$ ' + legalResidualVal.toLocaleString();
    elDeprecPerYear.textContent = 'NT$ ' + Math.round(annualDeprec).toLocaleString() + ' / 年';
    elElapsedMonths.textContent = `${elapsedMonths.toFixed(1)} 個月 (${(elapsedMonths / 12).toFixed(1)} 年)`;
    elAccumDeprec.textContent = 'NT$ ' + accumDeprec.toLocaleString();
    elDeprecCurrentVal.textContent = 'NT$ ' + depreciatedCurrentVal.toLocaleString();
    elCompPrinciple.textContent = principleText;

    // 狀態提示
    if (isExpired) {
      elStatStatus.innerHTML = `<span style="color: #E53E3E; font-weight: bold;"><i class="fa-solid fa-clock-rotate-left"></i> 已屆滿法定耐用年限 (${usefulYears}年)</span>`;
      elAlertOverdue.style.display = 'flex';
    } else {
      const remainingYears = ((usefulMonths - elapsedMonths) / 12).toFixed(1);
      elStatStatus.innerHTML = `<span style="color: #38A169; font-weight: bold;"><i class="fa-solid fa-shield-check"></i> 仍在耐用年限內 (尚餘約 ${remainingYears} 年)</span>`;
      elAlertOverdue.style.display = 'none';
    }

    elAlertWhicheverLower.style.display = hasWhicheverLower ? 'flex' : 'none';

    // 視覺進度條
    const usedPct = Math.min(100, Math.round((accumDeprec / (origPrice || 1)) * 100));
    const residualPct = 100 - usedPct;
    elBarUsed.style.width = usedPct + '%';
    elBarResidual.style.width = residualPct + '%';
    elBarUsedPct.textContent = `已折舊 ${usedPct}%`;
    elBarResidualPct.textContent = `剩餘價值 ${residualPct}%`;

    // 儲存草稿
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        equipName: elEquipName.value,
        origPrice: elOrigPrice.value,
        usefulYears: elUsefulYears.value,
        installDate: elInstallDate.value,
        damageDate: elDamageDate.value,
        repairCost: elRepairCost.value,
        faultRatio: elFaultRatio.value,
        isScrapped: elIsScrapped.checked
      }));
    } catch (e) {}

    return {
      equipName: elEquipName.value || '租賃設備',
      origPrice,
      usefulYears,
      elapsedMonths,
      legalResidualVal,
      annualDeprec,
      accumDeprec,
      depreciatedCurrentVal,
      repairCost,
      faultRatio,
      finalCompensationVal,
      isExpired,
      principleText
    };
  }

  // 綁定輸入即時重算
  [elEquipName, elOrigPrice, elUsefulYears, elInstallDate, elDamageDate, elRepairCost, elFaultRatio, elIsScrapped].forEach(el => {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });

  // 快選按鈕邏輯
  elPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.getAttribute('data-preset');
      const item = PRESETS[key];
      if (item) {
        elEquipName.value = item.name;
        elUsefulYears.value = item.years;
        elOrigPrice.value = item.price;
        if (elEquipDesc) elEquipDesc.textContent = item.desc;
        calculate();

        if (window.GanjuTracker) {
          window.GanjuTracker.trackEvent('deprec_preset_select', { preset_key: key, preset_name: item.name });
        }
      }
    });
  });

  // 1. 複製 LINE 試算摘要
  if (elBtnCopyLine) {
    elBtnCopyLine.addEventListener('click', () => {
      const res = calculate();
      const txt = `【港居不動產 設備折舊損耗與殘值賠償核定摘要】
━━━━━━━━━━━━━━━━━━
📌 評估設備：${res.equipName}
💰 原購置金額：NT$ ${res.origPrice.toLocaleString()}
📅 法定耐用年數：${res.usefulYears} 年 (依財政部標準)
⏳ 已使用期間：${res.elapsedMonths.toFixed(1)} 個月 (${(res.elapsedMonths / 12).toFixed(1)} 年)
📉 累計折舊額：NT$ ${res.accumDeprec.toLocaleString()}
🏛️ 法定殘值 (下限)：NT$ ${res.legalResidualVal.toLocaleString()}
📊 折舊後現值：NT$ ${res.depreciatedCurrentVal.toLocaleString()}
🔧 實際維修報價：${res.repairCost > 0 ? 'NT$ ' + res.repairCost.toLocaleString() : '報廢無法修復'}
⚖️ 承租人責任比例：${Math.round(res.faultRatio * 100)}%
━━━━━━━━━━━━━━━━━━
🎯 最終應負擔賠償額：NT$ ${res.finalCompensationVal.toLocaleString()}
💡 認定原則：${res.principleText}
━━━━━━━━━━━━━━━━━━
依據民法第213~216條損害賠償法則與孰低原則，拒絕不合理全新品求償！
🌐 線上核定系統：https://ganggo880.github.io/ganju-website/depreciation-calculator.html
🏢 港居不動產開發有限公司｜0968-863-880 (陳經理)`;

      navigator.clipboard.writeText(txt).then(() => {
        if (window.GanjuUtils && window.GanjuUtils.showToast) {
          window.GanjuUtils.showToast('✅ 設備折舊核定摘要已複製到剪貼簿！可直接傳送至 LINE');
        } else {
          alert('✅ 設備折舊核定摘要已複製！');
        }
        if (window.GanjuTracker) {
          window.GanjuTracker.trackEvent('deprec_copy_line', { equip_name: res.equipName, amount: res.finalCompensationVal });
        }
      }).catch(err => {
        alert('複製失敗，請手動複製');
      });
    });
  }

  // 2. 下載 Canvas 840×1080px 高畫質診斷圖卡
  if (elBtnDownloadCard) {
    elBtnDownloadCard.addEventListener('click', () => {
      const res = calculate();
      const canvas = document.createElement('canvas');
      canvas.width = 840;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // 背景底色
      ctx.fillStyle = '#0F2341';
      ctx.fillRect(0, 0, 840, 1080);

      // 裝飾光暈
      const grad = ctx.createLinearGradient(0, 0, 840, 1080);
      grad.addColorStop(0, 'rgba(197, 160, 89, 0.15)');
      grad.addColorStop(0.5, 'transparent');
      grad.addColorStop(1, 'rgba(26, 54, 93, 0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 840, 1080);

      // 外框金色細線
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 800, 1040);

      // 頂部標頭
      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司 GANJU REAL ESTATE', 45, 65);

      ctx.fillStyle = '#A0AEC0';
      ctx.font = '14px "Noto Sans TC", sans-serif';
      ctx.fillText('特許租賃住宅服務業｜高市租登字第0012號｜統編：96797997', 45, 92);

      // 大標題
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px "Noto Sans TC", sans-serif';
      ctx.fillText('租賃住宅設備折舊損耗與殘值賠償核定書', 45, 145);

      // 設備名稱卡片
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(45, 175, 750, 75, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E2BC72';
      ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
      ctx.fillText('標的設備', 65, 205);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
      ctx.fillText(res.equipName, 65, 238);

      ctx.fillStyle = '#CBD5E0';
      ctx.font = '15px "Noto Sans TC", sans-serif';
      ctx.fillText(`耐用年數：${res.usefulYears} 年 ｜ 已使用：${res.elapsedMonths.toFixed(1)} 個月 (${(res.elapsedMonths / 12).toFixed(1)}年)`, 420, 222);

      // 最終金額主視覺卡片
      ctx.fillStyle = 'rgba(26, 54, 93, 0.7)';
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(45, 275, 750, 165, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E2BC72';
      ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
      ctx.fillText('承租人最終應負擔賠償金額', 65, 315);

      ctx.fillStyle = '#FC8181';
      ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`NT$ ${res.finalCompensationVal.toLocaleString()}`, 65, 380);

      ctx.fillStyle = '#A0AEC0';
      ctx.font = '14px "Noto Sans TC", sans-serif';
      ctx.fillText(`責任比例：${Math.round(res.faultRatio * 100)}% ｜ ${res.principleText}`, 65, 420);

      // 明細表表格背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(45, 465, 750, 390, 12);
      ctx.fill();
      ctx.stroke();

      // 明細清單項目
      const items = [
        ['原購置成本 (重置成本)', `NT$ ${res.origPrice.toLocaleString()}`],
        ['法定耐用年數 (財政部)', `${res.usefulYears} 年 (${res.usefulYears * 12} 個月)`],
        ['實際使用月數', `${res.elapsedMonths.toFixed(1)} 個月`],
        ['每年平均折舊額', `NT$ ${Math.round(res.annualDeprec).toLocaleString()} / 年`],
        ['累計折舊金額', `NT$ ${res.accumDeprec.toLocaleString()}`],
        ['法定殘值 (賠償下限標準)', `NT$ ${res.legalResidualVal.toLocaleString()}`],
        ['折舊後法定現值', `NT$ ${res.depreciatedCurrentVal.toLocaleString()}`],
        ['實際修復報價費用', res.repairCost > 0 ? `NT$ ${res.repairCost.toLocaleString()}` : '無法修復 (報廢)']
      ];

      let rowY = 510;
      items.forEach((item, idx) => {
        ctx.fillStyle = '#CBD5E0';
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.fillText(item[0], 70, rowY);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item[1], 765, rowY);
        ctx.textAlign = 'left';

        if (idx < items.length - 1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.moveTo(70, rowY + 14);
          ctx.lineTo(765, rowY + 14);
          ctx.stroke();
        }
        rowY += 45;
      });

      // 法定免責與保障宣告
      ctx.fillStyle = 'rgba(197, 160, 89, 0.12)';
      ctx.beginPath();
      ctx.roundRect(45, 875, 750, 95, 10);
      ctx.fill();

      ctx.fillStyle = '#E2BC72';
      ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
      ctx.fillText('⚖️ 法律依據與仲裁法則宣告：', 65, 905);

      ctx.fillStyle = '#CBD5E0';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText('1. 依民法第213~216條損害賠償與不當得利禁止原則，逾耐用年限之設備賠償以法定殘值為上限。', 65, 930);
      ctx.fillText('2. 修理費用高於折舊現值時，適用「孰低原則」以折舊現值賠償，防範以舊換新不當求償。', 65, 955);

      // 頁尾資訊
      ctx.fillStyle = '#718096';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText(`核定日期：${today.toLocaleDateString('zh-TW')} ｜ 港居不動產全方位線上工具集 ｜ 諮詢專線：0968-863-880`, 45, 1010);

      // 匯出下載
      const link = document.createElement('a');
      link.download = `港居不動產_設備折舊賠償核定書_${res.equipName}_${today.toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (window.GanjuUtils && window.GanjuUtils.showToast) {
        window.GanjuUtils.showToast('✅ 設備折舊核定圖卡已成功下載！');
      }
      if (window.GanjuTracker) {
        window.GanjuTracker.trackEvent('deprec_download_card', { equip_name: res.equipName });
      }
    });
  }

  // 3. A4 列印
  if (elBtnPrint) {
    elBtnPrint.addEventListener('click', () => {
      const res = calculate();
      if (elPrintDate) {
        elPrintDate.textContent = `核定日期：${today.toLocaleDateString('zh-TW')}`;
      }
      if (elPrintParams) {
        elPrintParams.textContent = `評估設備：${res.equipName} ｜ 原購置金額：$${res.origPrice.toLocaleString()} ｜ 法定耐用年數：${res.usefulYears} 年 ｜ 已使用期間：${res.elapsedMonths.toFixed(1)} 個月`;
      }
      window.print();
      if (window.GanjuTracker) {
        window.GanjuTracker.trackEvent('deprec_print', { equip_name: res.equipName });
      }
    });
  }

  // 首次載入執行
  calculate();
});
