/**
 * 港居不動產 - 租約續約協議書與租金調幅精算產生器
 * File: js/lease-renewal-agreement.js
 * 遵循: 民法第451條、土地法第100條防呆、租賃專法第7條押金上限規範
 */

(function () {
  'use strict';

  // 1. 狀態管理 State
  const state = {
    mode: 'cpi', // 'same', 'cpi', 'fixed', 'discount'
    landlordName: '陳俊銘 (港居代管特許代表人)',
    landlordId: 'E123456789',
    landlordPhone: '0968-863-880',
    tenantName: '王小明',
    tenantId: 'A123456789',
    tenantPhone: '0912-345-678',
    propertyAddress: '高雄市小港區中安路825號 8樓之2',
    origStartDate: '2025-11-01',
    origEndDate: '2026-10-31',
    renewalStartDate: '2026-11-01',
    renewalEndDate: '2027-10-31',
    renewalYears: 1,
    origRent: 22000,
    origDeposit: 44000,
    cpiRate: 2.0, // 2.0%
    fixedAdjAmount: 1000,
    discountAmount: 500,
    newRent: 22440,
    newDeposit: 44880,
    depositDiff: 880,
    annualDiff: 5280,
    payDay: 5,
    specialTerms: {
      origValid: true,
      cleanAircon: true,
      noSublease: true,
      depositRollover: true,
      jointSurety: false
    },
    customClause: '雙方同意原租約所載之附屬家具家電清單全數續用，正常折舊耗損由出租人負責。',
    landlordSigImg: null,
    tenantSigImg: null
  };

  // 2. 繁體中文金融大寫金額轉換函式
  function numberToChineseFinance(num) {
    if (isNaN(num) || num === 0) return '零元整';
    const absNum = Math.abs(Math.round(num));
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億'];

    let numStr = absNum.toString();
    let result = '';
    let zeroCount = 0;
    const len = numStr.length;

    for (let i = 0; i < len; i++) {
      const d = parseInt(numStr.charAt(i), 10);
      const pos = len - i - 1;
      const unitIndex = pos % 4;
      const bigUnitIndex = Math.floor(pos / 4);

      if (d === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          result += digits[0];
          zeroCount = 0;
        }
        result += digits[d] + units[unitIndex];
      }

      if (unitIndex === 0) {
        if (zeroCount < 4 && bigUnitIndex > 0) {
          result += bigUnits[bigUnitIndex];
        }
        zeroCount = 0;
      }
    }

    result = result.replace(/^壹拾/, '拾');
    const prefix = num < 0 ? '負新臺幣' : '新臺幣';
    return `${prefix}${result}元整`;
  }

  // 3. 租金與押金調幅試算核心邏輯
  function calculateRenewalFinance() {
    const origRent = parseInt(document.getElementById('input-orig-rent').value, 10) || 0;
    const origDeposit = parseInt(document.getElementById('input-orig-deposit').value, 10) || 0;
    const mode = state.mode;

    let newRent = origRent;

    if (mode === 'same') {
      newRent = origRent;
    } else if (mode === 'cpi') {
      const rate = parseFloat(document.getElementById('input-cpi-rate').value) || 0;
      // 以 100 元為單位四捨五入取整數，符合實務便利
      newRent = Math.round((origRent * (1 + rate / 100)) / 100) * 100;
    } else if (mode === 'fixed') {
      const fixedAmt = parseInt(document.getElementById('input-fixed-adj').value, 10) || 0;
      newRent = origRent + fixedAmt;
    } else if (mode === 'discount') {
      const discAmt = parseInt(document.getElementById('input-discount-amt').value, 10) || 0;
      newRent = Math.max(0, origRent - discAmt);
    }

    // 押金法定上限：依租賃專法第 7 條不得超過 2 個月新租金
    const maxLegalDeposit = newRent * 2;
    // 預設將押金調整至新月租金的 2 個月，若原本已足夠則結轉
    let newDeposit = Math.min(newRent * 2, Math.max(origDeposit, newRent * 2));
    let depositDiff = newDeposit - origDeposit;

    const annualDiff = (newRent - origRent) * 12;

    state.origRent = origRent;
    state.origDeposit = origDeposit;
    state.newRent = newRent;
    state.newDeposit = newDeposit;
    state.depositDiff = depositDiff;
    state.annualDiff = annualDiff;

    // 更新左側精算卡片數值
    document.getElementById('val-new-rent').textContent = `NT$ ${newRent.toLocaleString()}`;
    const diffEl = document.getElementById('val-rent-diff');
    const diffVal = newRent - origRent;
    if (diffVal > 0) {
      diffEl.textContent = `+NT$ ${diffVal.toLocaleString()}`;
      diffEl.className = 'summary-item-val highlight-gold';
    } else if (diffVal < 0) {
      diffEl.textContent = `-NT$ ${Math.abs(diffVal).toLocaleString()}`;
      diffEl.className = 'summary-item-val highlight-green';
    } else {
      diffEl.textContent = '持平 (0%)';
      diffEl.className = 'summary-item-val';
    }

    const depDiffEl = document.getElementById('val-deposit-diff');
    if (depositDiff > 0) {
      depDiffEl.textContent = `須補繳 NT$ ${depositDiff.toLocaleString()}`;
    } else if (depositDiff < 0) {
      depDiffEl.textContent = `應退還 NT$ ${Math.abs(depositDiff).toLocaleString()}`;
    } else {
      depDiffEl.textContent = '免補退 (原額結轉)';
    }

    const annDiffEl = document.getElementById('val-annual-diff');
    if (annualDiff > 0) {
      annDiffEl.textContent = `+NT$ ${annualDiff.toLocaleString()}`;
    } else if (annualDiff < 0) {
      annDiffEl.textContent = `-NT$ ${Math.abs(annualDiff).toLocaleString()}`;
    } else {
      annDiffEl.textContent = 'NT$ 0';
    }

    // 更新右側即時 A4 文件視窗
    renderA4Preview();
  }

  // 4. 右側 A4 即時預覽渲染
  function renderA4Preview() {
    const lName = document.getElementById('input-landlord-name').value || '__________';
    const lId = document.getElementById('input-landlord-id').value || '__________';
    const tName = document.getElementById('input-tenant-name').value || '__________';
    const tId = document.getElementById('input-tenant-id').value || '__________';
    const addr = document.getElementById('input-property-address').value || '______________________________';

    const origStart = document.getElementById('input-orig-start').value || '____-__-__';
    const origEnd = document.getElementById('input-orig-end').value || '____-__-__';
    const newStart = document.getElementById('input-renewal-start').value || '____-__-__';
    const newEnd = document.getElementById('input-renewal-end').value || '____-__-__';
    const payDay = document.getElementById('input-pay-day').value || '5';

    const newRent = state.newRent;
    const newDeposit = state.newDeposit;
    const origRent = state.origRent;
    const origDeposit = state.origDeposit;
    const depDiff = state.depositDiff;

    document.getElementById('doc-p-landlord').textContent = lName;
    document.getElementById('doc-p-landlord-id').textContent = lId;
    document.getElementById('doc-p-tenant').textContent = tName;
    document.getElementById('doc-p-tenant-id').textContent = tId;
    document.getElementById('doc-p-address').textContent = addr;

    document.getElementById('doc-p-orig-term').textContent = `${origStart} 至 ${origEnd}`;
    document.getElementById('doc-p-new-term').textContent = `${newStart} 至 ${newEnd}`;

    document.getElementById('doc-p-new-rent').textContent = `每月新臺幣 ${newRent.toLocaleString()} 元整（${numberToChineseFinance(newRent)}）`;
    document.getElementById('doc-p-pay-day').textContent = `每月 ${payDay} 日前`;

    // 押金條款
    let depDesc = '';
    if (depDiff > 0) {
      depDesc = `原契約押租保證金新臺幣 ${origDeposit.toLocaleString()} 元整全數結轉延用，承租人應於簽署本協議書時補足差額新臺幣 ${depDiff.toLocaleString()} 元整（${numberToChineseFinance(depDiff)}），累計押金總額為新臺幣 ${newDeposit.toLocaleString()} 元整（${numberToChineseFinance(newDeposit)}，符合租賃專法法定 2 個月租金上限）。`;
    } else {
      depDesc = `原契約押租保證金新臺幣 ${origDeposit.toLocaleString()} 元整（${numberToChineseFinance(origDeposit)}）全數結轉延用至續約期滿，雙方互毋庸補繳或退還押金差額。`;
    }
    document.getElementById('doc-p-deposit-clause').textContent = depDesc;

    // 特約條款清單動態拼裝
    const terms = [];
    if (document.getElementById('term-orig-valid').checked) {
      terms.push('除本協議書就租賃期間、每月租金及特別約定另有增修外，原租賃契約所載其他一切權利義務與條款內容均繼續適用並具有完全拘束力。');
    }
    if (document.getElementById('term-clean-aircon').checked) {
      terms.push('續約承諾：出租人同意於新約期開始 30 日內安排專業冷氣深層清洗及全室水電巡檢，費用全數由出租人負擔。');
    }
    if (document.getElementById('term-no-sublease').checked) {
      terms.push('嚴格禁止轉租：未經出租人書面同意，承租人不得將房屋之全部或一部轉租、出借或以其他方式供第三人使用。');
    }
    if (document.getElementById('term-deposit-rollover').checked) {
      terms.push('定期租賃確認：雙方特別聲明確認本續約為民法第 451 條之明確定期租約，絕無默示更新為不定期租賃之意思，續約期滿如未另訂書面契約，承租人應於期滿日遷讓交還房屋。');
    }

    const customTxt = document.getElementById('input-custom-clause').value.trim();
    if (customTxt) {
      terms.push(customTxt);
    }

    const termsListEl = document.getElementById('doc-p-terms-list');
    termsListEl.innerHTML = '';
    terms.forEach((t, idx) => {
      const li = document.createElement('li');
      li.textContent = `(${idx + 1}) ${t}`;
      termsListEl.appendChild(li);
    });

    // 雙方姓名與身分簽名區
    document.getElementById('doc-sig-landlord-name').textContent = lName;
    document.getElementById('doc-sig-landlord-id').textContent = lId;
    document.getElementById('doc-sig-tenant-name').textContent = tName;
    document.getElementById('doc-sig-tenant-id').textContent = tId;

    // 簽署日期
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const m = now.getMonth() + 1;
    const d = now.getDate();
    document.getElementById('doc-sig-date-txt').textContent = `中 華 民 國 ${rocYear} 年 ${m} 月 ${d} 日`;
  }

  // 5. 雙畫布 Retina 2x 電子手寫簽章系統
  function initSignatureCanvas(canvasId, clearBtnId, stateProp, previewImgId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0c1a30';
    }

    resize();
    window.addEventListener('resize', resize);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function start(e) {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function move(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stop() {
      if (!isDrawing) return;
      isDrawing = false;
      const dataUrl = canvas.toDataURL('image/png');
      state[stateProp] = dataUrl;
      const previewImg = document.getElementById(previewImgId);
      if (previewImg) {
        previewImg.src = dataUrl;
        previewImg.style.display = 'block';
      }
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', stop);

    document.getElementById(clearBtnId).addEventListener('click', function () {
      const dpr = window.devicePixelRatio || 2;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      state[stateProp] = null;
      const previewImg = document.getElementById(previewImgId);
      if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
      }
    });
  }

  // 6. 模式切換器 Event Listeners
  function initPresetModeButtons() {
    const buttons = document.querySelectorAll('.preset-btn');
    const cpiGroup = document.getElementById('group-cpi-rate');
    const fixedGroup = document.getElementById('group-fixed-adj');
    const discountGroup = document.getElementById('group-discount-amt');

    buttons.forEach((btn) => {
      btn.addEventListener('click', function () {
        buttons.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        const mode = this.dataset.mode;
        state.mode = mode;

        cpiGroup.style.display = mode === 'cpi' ? 'block' : 'none';
        fixedGroup.style.display = mode === 'fixed' ? 'block' : 'none';
        discountGroup.style.display = mode === 'discount' ? 'block' : 'none';

        calculateRenewalFinance();
      });
    });
  }

  // 7. LINE 續約協議通知文字複製
  function copyLineNotice() {
    const lName = document.getElementById('input-landlord-name').value || '房東';
    const tName = document.getElementById('input-tenant-name').value || '租客';
    const addr = document.getElementById('input-property-address').value || '租賃物件';
    const newStart = document.getElementById('input-renewal-start').value;
    const newEnd = document.getElementById('input-renewal-end').value;
    const newRent = state.newRent.toLocaleString();
    const depDiff = state.depositDiff;

    let depText = '押金全額結轉續用';
    if (depDiff > 0) {
      depText = `押金補繳差額 NT$ ${depDiff.toLocaleString()} 元`;
    }

    const text = `【港居不動產・住宅租賃續約協議通知】
親愛的 ${tName} 您好：
感謝您對房屋的悉心維護！我們已依約完成 ${addr} 之續約協議擬定，要點摘要如下：

📅 續約期間：${newStart} 至 ${newEnd}
💰 續約月租金：NT$ ${newRent} 元/月
🔒 押金處理：${depText}
📜 協議效力：確認為定期租賃，原租約條款除租期與租金外全數繼續有效適用。

雙方已完成線上協議書確認，隨附協議書電子檔備查。如有任何問題歡迎隨時聯繫港居不動產！
官方諮詢電話：0968-863-880（陳經理）
Line ID 諮詢：@ganju880`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已成功複製 LINE 續約通知摘要文字！');
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
    showToast('已成功複製 LINE 續約通知摘要文字！');
  }

  // 8. Canvas 840×1080px 高畫質協議圖卡繪製與下載
  function downloadCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景底色
    ctx.fillStyle = '#0c1a30';
    ctx.fillRect(0, 0, 840, 1080);

    // 金色裝飾邊框
    ctx.strokeStyle = '#c5a880';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 840 - 48, 1080 - 48);

    // 內層微框
    ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 840 - 64, 1080 - 64);

    // 頂部品牌
    ctx.fillStyle = '#c5a880';
    ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司・安心續約保障', 420, 75);

    // 主標題
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Noto Serif TC", serif';
    ctx.fillText('住宅租賃定期續約協議確認憑證', 420, 125);

    // 副標題
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('依民法第451條防範不定期租賃・依租賃專法第7條法定押金合規', 420, 155);

    // 橫線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(60, 175);
    ctx.lineTo(780, 175);
    ctx.stroke();

    // 白色資訊卡
    ctx.fillStyle = '#ffffff';
    ctx.roundRect ? ctx.roundRect(60, 195, 720, 480, 12) : ctx.fillRect(60, 195, 720, 480);
    ctx.fill();

    // 卡內資訊
    ctx.fillStyle = '#0c1a30';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('【租約展期與租金結算摘要】', 90, 240);

    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';

    const lName = document.getElementById('input-landlord-name').value || '出租人';
    const tName = document.getElementById('input-tenant-name').value || '承租人';
    const addr = document.getElementById('input-property-address').value || '租賃物標的地址';
    const newStart = document.getElementById('input-renewal-start').value;
    const newEnd = document.getElementById('input-renewal-end').value;

    const items = [
      `立合約人：出租人 ${lName} ／ 承租人 ${tName}`,
      `物件地址：${addr}`,
      `續約租期：${newStart} 至 ${newEnd}（明確定期租約）`,
      `新月租金：NT$ ${state.newRent.toLocaleString()} 元 / 月（${numberToChineseFinance(state.newRent)}）`,
      `原保證金：NT$ ${state.origDeposit.toLocaleString()} 元（${state.depositDiff > 0 ? `須補繳差額 NT$ ${state.depositDiff.toLocaleString()}` : '全額結轉延用'}）`,
      `租金支付：每月 ${document.getElementById('input-pay-day').value || '5'} 日前匯入指定帳戶`,
      `法規條款：除租期租金特別變更外，原租約條款全數繼續有效拘束`
    ];

    let startY = 285;
    items.forEach((item) => {
      ctx.fillText(item, 90, startY);
      startY += 36;
    });

    // 金融重點方塊
    ctx.fillStyle = '#f8fafc';
    ctx.roundRect ? ctx.roundRect(90, 550, 660, 95, 8) : ctx.fillRect(90, 550, 660, 95);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(90, 550, 660, 95);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('新期每月租金', 120, 580);
    ctx.fillText('年化總收增減', 340, 580);
    ctx.fillText('累計押金結轉總額', 540, 580);

    ctx.fillStyle = '#c5a880';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText(`NT$ ${state.newRent.toLocaleString()}`, 120, 618);

    ctx.fillStyle = state.annualDiff >= 0 ? '#16a34a' : '#2563eb';
    ctx.fillText(`${state.annualDiff >= 0 ? '+' : ''}${state.annualDiff.toLocaleString()}`, 340, 618);

    ctx.fillStyle = '#0c1a30';
    ctx.fillText(`NT$ ${state.newDeposit.toLocaleString()}`, 540, 618);

    // 簽名展示區
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect ? ctx.roundRect(60, 700, 720, 240, 12) : ctx.fillRect(60, 700, 720, 240);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`出租人簽名（甲方）：${lName}`, 90, 740);
    ctx.fillText(`承租人簽名（乙方）：${tName}`, 450, 740);

    // 若有簽名圖檔則繪製
    const lImg = document.getElementById('doc-sig-landlord-img');
    const tImg = document.getElementById('doc-sig-tenant-img');

    if (lImg && lImg.src && lImg.style.display !== 'none') {
      try {
        ctx.drawImage(lImg, 90, 760, 200, 80);
      } catch (e) {}
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 15px "Noto Sans TC", sans-serif';
      ctx.fillText('(出租人完成電子親簽)', 90, 800);
    }

    if (tImg && tImg.src && tImg.style.display !== 'none') {
      try {
        ctx.drawImage(tImg, 450, 760, 200, 80);
      } catch (e) {}
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 15px "Noto Sans TC", sans-serif';
      ctx.fillText('(承租人完成電子親簽)', 450, 800);
    }

    // 底部法定聲明
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司 (統編 96797997)・特許租賃住宅服務業登記證：(113)高市租登字第0012號', 420, 990);
    ctx.fillText('本圖卡由港居不動產線上工具集本地純前端運算生成・零資料上傳雲端・保障立約個資隱私', 420, 1015);

    // 轉出下載
    const link = document.createElement('a');
    link.download = `住宅租賃續約協議確認單_${addr.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已成功下載續約協議高畫質圖卡！');
  }

  // 9. 草稿儲存與讀取 LocalStorage
  const DRAFT_KEY = 'ganju_lease_renewal_draft_v1';

  function saveDraft() {
    const draft = {
      mode: state.mode,
      landlordName: document.getElementById('input-landlord-name').value,
      landlordId: document.getElementById('input-landlord-id').value,
      landlordPhone: document.getElementById('input-landlord-phone').value,
      tenantName: document.getElementById('input-tenant-name').value,
      tenantId: document.getElementById('input-tenant-id').value,
      tenantPhone: document.getElementById('input-tenant-phone').value,
      propertyAddress: document.getElementById('input-property-address').value,
      origStartDate: document.getElementById('input-orig-start').value,
      origEndDate: document.getElementById('input-orig-end').value,
      renewalStartDate: document.getElementById('input-renewal-start').value,
      renewalEndDate: document.getElementById('input-renewal-end').value,
      origRent: document.getElementById('input-orig-rent').value,
      origDeposit: document.getElementById('input-orig-deposit').value,
      cpiRate: document.getElementById('input-cpi-rate').value,
      fixedAdjAmount: document.getElementById('input-fixed-adj').value,
      discountAmount: document.getElementById('input-discount-amt').value,
      payDay: document.getElementById('input-pay-day').value,
      customClause: document.getElementById('input-custom-clause').value,
      terms: {
        origValid: document.getElementById('term-orig-valid').checked,
        cleanAircon: document.getElementById('term-clean-aircon').checked,
        noSublease: document.getElementById('term-no-sublease').checked,
        depositRollover: document.getElementById('term-deposit-rollover').checked
      }
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast('續約協議草稿已儲存於本機瀏覽器！');
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      showToast('本機尚無暫存之續約草稿');
      return;
    }
    try {
      const draft = JSON.parse(raw);
      if (draft.landlordName) document.getElementById('input-landlord-name').value = draft.landlordName;
      if (draft.landlordId) document.getElementById('input-landlord-id').value = draft.landlordId;
      if (draft.landlordPhone) document.getElementById('input-landlord-phone').value = draft.landlordPhone;
      if (draft.tenantName) document.getElementById('input-tenant-name').value = draft.tenantName;
      if (draft.tenantId) document.getElementById('input-tenant-id').value = draft.tenantId;
      if (draft.tenantPhone) document.getElementById('input-tenant-phone').value = draft.tenantPhone;
      if (draft.propertyAddress) document.getElementById('input-property-address').value = draft.propertyAddress;

      if (draft.origStartDate) document.getElementById('input-orig-start').value = draft.origStartDate;
      if (draft.origEndDate) document.getElementById('input-orig-end').value = draft.origEndDate;
      if (draft.renewalStartDate) document.getElementById('input-renewal-start').value = draft.renewalStartDate;
      if (draft.renewalEndDate) document.getElementById('input-renewal-end').value = draft.renewalEndDate;

      if (draft.origRent) document.getElementById('input-orig-rent').value = draft.origRent;
      if (draft.origDeposit) document.getElementById('input-orig-deposit').value = draft.origDeposit;
      if (draft.cpiRate) document.getElementById('input-cpi-rate').value = draft.cpiRate;
      if (draft.fixedAdjAmount) document.getElementById('input-fixed-adj').value = draft.fixedAdjAmount;
      if (draft.discountAmount) document.getElementById('input-discount-amt').value = draft.discountAmount;
      if (draft.payDay) document.getElementById('input-pay-day').value = draft.payDay;
      if (draft.customClause) document.getElementById('input-custom-clause').value = draft.customClause;

      if (draft.terms) {
        document.getElementById('term-orig-valid').checked = !!draft.terms.origValid;
        document.getElementById('term-clean-aircon').checked = !!draft.terms.cleanAircon;
        document.getElementById('term-no-sublease').checked = !!draft.terms.noSublease;
        document.getElementById('term-deposit-rollover').checked = !!draft.terms.depositRollover;
      }

      if (draft.mode) {
        state.mode = draft.mode;
        const btn = document.querySelector(`.preset-btn[data-mode="${draft.mode}"]`);
        if (btn) {
          document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        }
        document.getElementById('group-cpi-rate').style.display = draft.mode === 'cpi' ? 'block' : 'none';
        document.getElementById('group-fixed-adj').style.display = draft.mode === 'fixed' ? 'block' : 'none';
        document.getElementById('group-discount-amt').style.display = draft.mode === 'discount' ? 'block' : 'none';
      }

      calculateRenewalFinance();
      showToast('已成功讀取本機續約草稿！');
    } catch (e) {
      console.error(e);
      showToast('讀取草稿失敗');
    }
  }

  // 10. 跨工具匯入（從租約產生器或押金結算工具）
  function importFromOtherTools() {
    const contractDraft = localStorage.getItem('ganju_lease_contract_draft');
    const depositDraft = localStorage.getItem('ganju_deposit_draft');
    const receiptDraft = localStorage.getItem('ganju_rent_receipt_draft');

    let imported = false;

    if (contractDraft) {
      try {
        const d = JSON.parse(contractDraft);
        if (d.landlordName) document.getElementById('input-landlord-name').value = d.landlordName;
        if (d.tenantName) document.getElementById('input-tenant-name').value = d.tenantName;
        if (d.address) document.getElementById('input-property-address').value = d.address;
        if (d.rent) document.getElementById('input-orig-rent').value = d.rent;
        if (d.deposit) document.getElementById('input-orig-deposit').value = d.deposit;
        imported = true;
      } catch (e) {}
    } else if (depositDraft) {
      try {
        const d = JSON.parse(depositDraft);
        if (d.landlordName) document.getElementById('input-landlord-name').value = d.landlordName;
        if (d.tenantName) document.getElementById('input-tenant-name').value = d.tenantName;
        if (d.propertyAddress) document.getElementById('input-property-address').value = d.propertyAddress;
        if (d.origRent) document.getElementById('input-orig-rent').value = d.origRent;
        imported = true;
      } catch (e) {}
    } else if (receiptDraft) {
      try {
        const d = JSON.parse(receiptDraft);
        if (d.tenantName) document.getElementById('input-tenant-name').value = d.tenantName;
        if (d.propertyAddress) document.getElementById('input-property-address').value = d.propertyAddress;
        if (d.rentAmount) document.getElementById('input-orig-rent').value = d.rentAmount;
        imported = true;
      } catch (e) {}
    }

    if (imported) {
      calculateRenewalFinance();
      showToast('已成功由其他工具草稿匯入物件與立約人資訊！');
    } else {
      showToast('未找到其他租賃工具草稿，請直接手動填寫');
    }
  }

  // 11. Toast 提示小工具
  function showToast(msg) {
    let toast = document.getElementById('ganju-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ganju-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#0c1a30';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '30px';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      toast.style.zIndex = '9999';
      toast.style.fontSize = '0.95rem';
      toast.style.fontWeight = '600';
      toast.style.border = '1px solid #c5a880';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2500);
  }

  // 12. 總初始化 Entry Point
  function init() {
    initPresetModeButtons();

    // 監聽所有表單輸入變更
    const inputs = [
      'input-landlord-name', 'input-landlord-id', 'input-landlord-phone',
      'input-tenant-name', 'input-tenant-id', 'input-tenant-phone',
      'input-property-address', 'input-orig-start', 'input-orig-end',
      'input-renewal-start', 'input-renewal-end', 'input-orig-rent',
      'input-orig-deposit', 'input-cpi-rate', 'input-fixed-adj',
      'input-discount-amt', 'input-pay-day', 'input-custom-clause'
    ];

    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', calculateRenewalFinance);
      }
    });

    const checkboxes = [
      'term-orig-valid', 'term-clean-aircon', 'term-no-sublease', 'term-deposit-rollover'
    ];
    checkboxes.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', renderA4Preview);
      }
    });

    // 雙手寫簽名板初始化
    initSignatureCanvas('sig-canvas-landlord', 'btn-clear-sig-landlord', 'landlordSigImg', 'doc-sig-landlord-img');
    initSignatureCanvas('sig-canvas-tenant', 'btn-clear-sig-tenant', 'tenantSigImg', 'doc-sig-tenant-img');

    // 動作按鈕綁定
    document.getElementById('btn-print-agreement').addEventListener('click', () => window.print());
    document.getElementById('btn-download-card').addEventListener('click', downloadCardImage);
    document.getElementById('btn-copy-line').addEventListener('click', copyLineNotice);
    document.getElementById('btn-save-draft').addEventListener('click', saveDraft);
    document.getElementById('btn-load-draft').addEventListener('click', loadDraft);
    document.getElementById('btn-import-draft').addEventListener('click', importFromOtherTools);

    // 初始計算與渲染
    calculateRenewalFinance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
