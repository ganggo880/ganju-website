/**
 * 港居不動產 - 住宅租賃承租人轉租同意書與轉租管理協議產生器
 * File: js/sublease-consent-agreement.js
 * 依據《民法》第443/444條與《租賃住宅市場發展及管理條例》第9條合規設計
 */

(function () {
  'use strict';

  // 數字轉繁體中文金融大寫金額
  function numberToChinese(num) {
    if (isNaN(num) || num === null || num === undefined || num === '') return '零元整';
    num = Math.floor(Math.abs(Number(num)));
    if (num === 0) return '零元整';

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億'];

    let str = '';
    let unitIdx = 0;

    while (num > 0) {
      const section = num % 10000;
      if (section > 0) {
        let secStr = '';
        let zero = false;
        let s = section;
        for (let i = 0; i < 4; i++) {
          const d = s % 10;
          if (d === 0) {
            if (!zero && secStr.length > 0) {
              zero = true;
              secStr = digits[0] + secStr;
            }
          } else {
            zero = false;
            secStr = digits[d] + units[i] + secStr;
          }
          s = Math.floor(s / 10);
        }
        str = secStr + bigUnits[unitIdx] + str;
      } else if (str.length > 0 && !str.startsWith('零')) {
        str = digits[0] + str;
      }
      unitIdx++;
      num = Math.floor(num / 10000);
    }

    str = str.replace(/零+/g, '零').replace(/零$/, '');
    return '新臺幣 ' + str + '元整';
  }

  // 格式化千分位
  function formatMoney(num) {
    if (isNaN(num) || num === null || num === '') return '0';
    return Number(num).toLocaleString('zh-TW');
  }

  // 初始化預設狀態
  const defaultState = {
    docNo: 'GG-SL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000 + 1000)),
    consentDate: new Date().toISOString().split('T')[0],
    propertyAddress: '高雄市小港區中安路825號 6樓之1',
    // 原租賃契約條件
    originalLeaseStart: '2026-01-01',
    originalLeaseEnd: '2026-12-31',
    originalRent: 26000,
    // 轉租範圍與標的
    subleaseScope: 'partial', // partial | full
    subleaseScopeDesc: 'B室景觀獨立套房（含獨立衛浴設備及對外陽台，使用坪數約 6.5 坪）',
    // 轉租期間
    subleaseStart: '2026-03-01',
    subleaseEnd: '2026-12-31',
    // 轉租租金與押金
    subleaseRent: 9500,
    subleaseDeposit: 19000,
    // 原出租人 (同意人)
    landlordName: '陳美蓮',
    landlordId: 'E220192837',
    landlordPhone: '0911-234-567',
    landlordAddress: '高雄市小港區中平路88號',
    // 轉租人 (原承租人 / 二房東)
    sublessorName: '林建宏',
    sublessorId: 'S123456789',
    sublessorPhone: '0933-888-999',
    sublessorAddress: '高雄市小港區中安路825號 6樓之1',
    // 次承租人 (三房客)
    sublesseeName: '黃冠宇',
    sublesseeId: 'E192837465',
    sublesseePhone: '0955-666-777',
    sublesseeAddress: '高雄市前鎮區光華三路120號',
    // 受託包租代管業者
    managerCompany: '港居不動產開發有限公司',
    managerTaxId: '96797997',
    managerLicence: '(113)高市租登字第0012號',
    managerPerson: '陳俊銘 經理 (112)登字第013739號',
    managerPhone: '0968-863-880',
    // 特別條款
    specialTerms: '轉租人承諾每月準時向出租人全額給付原約定租金，如次承租人有違約欠繳或破壞毀損情事，轉租人負完全連帶賠償責任。'
  };

  let state = Object.assign({}, defaultState);

  // 三方簽名板實體與狀態
  const signatures = {
    landlord: { canvas: null, ctx: null, drawing: false, hasDrawn: false },
    sublessor: { canvas: null, ctx: null, drawing: false, hasDrawn: false },
    sublessee: { canvas: null, ctx: null, drawing: false, hasDrawn: false }
  };

  function initSignatureCanvas(type) {
    const canvas = document.getElementById(`canvas-sig-${type}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    signatures[type].canvas = canvas;
    signatures[type].ctx = ctx;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';

    function getCoords(e) {
      const r = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - r.left,
        y: clientY - r.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      signatures[type].drawing = true;
      const coords = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      const ph = document.getElementById(`ph-sig-${type}`);
      if (ph) ph.style.display = 'none';
    }

    function moveDraw(e) {
      if (!signatures[type].drawing) return;
      e.preventDefault();
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      signatures[type].hasDrawn = true;
      updatePreviewSignature(type);
    }

    function endDraw(e) {
      if (signatures[type].drawing) {
        signatures[type].drawing = false;
        updatePreviewSignature(type);
      }
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);
  }

  function clearSignature(type) {
    const sig = signatures[type];
    if (!sig.ctx || !sig.canvas) return;
    sig.ctx.clearRect(0, 0, sig.canvas.width, sig.canvas.height);
    sig.hasDrawn = false;
    const ph = document.getElementById(`ph-sig-${type}`);
    if (ph) ph.style.display = 'block';
    updatePreviewSignature(type);
  }

  function updatePreviewSignature(type) {
    const previewContainer = document.getElementById(`paper-sig-${type}`);
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    const sig = signatures[type];
    if (sig.hasDrawn && sig.canvas) {
      const img = document.createElement('img');
      img.src = sig.canvas.toDataURL('image/png');
      img.alt = `${type} 簽章`;
      previewContainer.appendChild(img);
    } else {
      previewContainer.innerHTML = '<span style="color:#94a3b8; font-size:12px;">（待親筆簽章）</span>';
    }
  }

  // 畫面更新引擎
  function render() {
    // 1. 同步輸入框
    const fields = [
      'docNo', 'consentDate', 'propertyAddress',
      'originalLeaseStart', 'originalLeaseEnd', 'originalRent',
      'subleaseScopeDesc', 'subleaseStart', 'subleaseEnd',
      'subleaseRent', 'subleaseDeposit',
      'landlordName', 'landlordId', 'landlordPhone', 'landlordAddress',
      'sublessorName', 'sublessorId', 'sublessorPhone', 'sublessorAddress',
      'sublesseeName', 'sublesseeId', 'sublesseePhone', 'sublesseeAddress',
      'specialTerms'
    ];

    fields.forEach(field => {
      const el = document.getElementById(`input-${field}`);
      if (el && document.activeElement !== el) {
        el.value = state[field];
      }
    });

    // 2. 轉租範圍單選框
    const scopeRadios = document.querySelectorAll('input[name="subleaseScope"]');
    scopeRadios.forEach(r => {
      r.checked = (r.value === state.subleaseScope);
    });

    // 3. 轉租租期超限檢核 (定型化契約強制規範：不得逾原契約迄日)
    const dateAlert = document.getElementById('dateAlertCard');
    const isExceeded = (state.subleaseEnd && state.originalLeaseEnd && state.subleaseEnd > state.originalLeaseEnd);
    if (dateAlert) {
      dateAlert.style.display = isExceeded ? 'block' : 'none';
      if (isExceeded) {
        dateAlert.innerHTML = `⚠️ <strong>違規警示</strong>：依《租賃住宅市場發展及管理條例》第 9 條規定，轉租期間（迄 ${state.subleaseEnd}）<strong>嚴禁逾越原租約迄日（${state.originalLeaseEnd}）</strong>！`;
      }
    }

    // 4. 金額大寫提示
    const chineseRent = numberToChinese(state.subleaseRent);
    const chineseDeposit = numberToChinese(state.subleaseDeposit);
    const badgeRentEl = document.getElementById('badge-sublease-rent');
    if (badgeRentEl) badgeRentEl.textContent = 'NT$ ' + formatMoney(state.subleaseRent) + ' /月';
    const chineseRentEl = document.getElementById('preview-sublease-rent-chinese');
    if (chineseRentEl) chineseRentEl.textContent = chineseRent;

    // 5. 更新 A4 紙本預覽
    const scopeLabel = state.subleaseScope === 'partial' ? '一部轉租（部分空間）' : '全部轉租（全戶住宅）';

    const textBinds = {
      'pv-doc-no': state.docNo,
      'pv-consent-date': state.consentDate,
      'pv-property-address': state.propertyAddress,
      'pv-original-period': `${state.originalLeaseStart} 起至 ${state.originalLeaseEnd} 止`,
      'pv-original-rent': `新臺幣 ${formatMoney(state.originalRent)} 元整 (${numberToChinese(state.originalRent)})`,
      'pv-sublease-scope': `${scopeLabel} — ${state.subleaseScopeDesc}`,
      'pv-sublease-period': `${state.subleaseStart} 起至 ${state.subleaseEnd} 止`,
      'pv-sublease-rent': `新臺幣 ${formatMoney(state.subleaseRent)} 元整 (${chineseRent})`,
      'pv-sublease-deposit': `新臺幣 ${formatMoney(state.subleaseDeposit)} 元整 (${chineseDeposit})`,
      'pv-landlord-name': state.landlordName,
      'pv-landlord-id': state.landlordId,
      'pv-landlord-phone': state.landlordPhone,
      'pv-sublessor-name': state.sublessorName,
      'pv-sublessor-id': state.sublessorId,
      'pv-sublessor-phone': state.sublessorPhone,
      'pv-sublessee-name': state.sublesseeName,
      'pv-sublessee-id': state.sublesseeId,
      'pv-sublessee-phone': state.sublesseePhone,
      'pv-special-terms': state.specialTerms || '無特別約定條款。'
    };

    Object.keys(textBinds).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = textBinds[id];
    });
  }

  // 綁定輸入與操作事件
  function bindInputs() {
    const fields = [
      'docNo', 'consentDate', 'propertyAddress',
      'originalLeaseStart', 'originalLeaseEnd', 'originalRent',
      'subleaseScopeDesc', 'subleaseStart', 'subleaseEnd',
      'subleaseRent', 'subleaseDeposit',
      'landlordName', 'landlordId', 'landlordPhone', 'landlordAddress',
      'sublessorName', 'sublessorId', 'sublessorPhone', 'sublessorAddress',
      'sublesseeName', 'sublesseeId', 'sublesseePhone', 'sublesseeAddress',
      'specialTerms'
    ];

    fields.forEach(field => {
      const el = document.getElementById(`input-${field}`);
      if (el) {
        el.addEventListener('input', (e) => {
          state[field] = e.target.value;
          render();
        });
      }
    });

    // 轉租範圍單選監聽
    const scopeRadios = document.querySelectorAll('input[name="subleaseScope"]');
    scopeRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        state.subleaseScope = e.target.value;
        if (state.subleaseScope === 'full' && state.subleaseScopeDesc.includes('B室')) {
          state.subleaseScopeDesc = '全戶住宅及附屬設備全數轉租';
        } else if (state.subleaseScope === 'partial' && state.subleaseScopeDesc.includes('全戶')) {
          state.subleaseScopeDesc = 'B室景觀獨立套房（含獨立衛浴設備及對外陽台，使用坪數約 6.5 坪）';
        }
        render();
      });
    });

    // 簽章清除按鈕
    ['landlord', 'sublessor', 'sublessee'].forEach(type => {
      const btn = document.getElementById(`btn-clear-${type}`);
      if (btn) {
        btn.addEventListener('click', () => clearSignature(type));
      }
    });

    // 快速示範資料載入
    const btnSample = document.getElementById('btn-load-sample');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        state = Object.assign({}, defaultState);
        render();
        showToast('已成功載入示範資料！');
      });
    }

    // 列印按鈕
    const btnPrint = document.getElementById('btn-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        if (state.subleaseEnd > state.originalLeaseEnd) {
          alert('【警示】轉租迄日逾越原租約迄日，違反租賃條例第9條規定，請校正後再行列印出圖！');
        }
        window.print();
      });
    }

    // LINE 摘要複製按鈕
    const btnCopyLine = document.getElementById('btn-copy-line');
    if (btnCopyLine) {
      btnCopyLine.addEventListener('click', copyLineSummary);
    }

    // 存證圖卡下載按鈕
    const btnDownloadCard = document.getElementById('btn-download-card');
    if (btnDownloadCard) {
      btnDownloadCard.addEventListener('click', downloadCanvasCard);
    }
  }

  // 複製 LINE 摘要
  function copyLineSummary() {
    const scopeLabel = state.subleaseScope === 'partial' ? '一部轉租（部分空間）' : '全部轉租（全戶住宅）';
    const text = `【港居不動產｜住宅租賃轉租同意與管理協議備忘】
────────────────────
📋 同意書號：${state.docNo}
📅 同意日期：${state.consentDate}
🏠 標的住宅：${state.propertyAddress}
📌 轉租範圍：${scopeLabel}（${state.subleaseScopeDesc}）
────────────────────
📅 轉租期間：${state.subleaseStart} 起至 ${state.subleaseEnd} 止（符合租約迄日之限制）
💰 轉租月租：新臺幣 ${formatMoney(state.subleaseRent)} 元整（${numberToChinese(state.subleaseRent)}）
🛡️ 轉租押金：新臺幣 ${formatMoney(state.subleaseDeposit)} 元整（${numberToChinese(state.subleaseDeposit)}）

👥 三方立約與切結當事人：
• 出租人（同意人）：${state.landlordName} (${state.landlordPhone})
• 轉租人（原承租人）：${state.sublessorName} (${state.sublessorPhone})
• 次承租人（被轉租人）：${state.sublesseeName} (${state.sublesseePhone})

⚖️ 核心法規遵行：
① 依《民法》第444條，轉租人對次承租人之違規與毀損負完全連帶損害賠償責任。
② 原租約如因故提前終止，次租賃契約當然終止，次承租人於3日內無條件騰空遷讓。
③ 本同意書業經三方手寫簽署存證。

🏢 專業包租代管督導機構：
港居不動產開發有限公司（統編：96797997）
電話：07-791-2288 / 0968-863-880`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('LINE 轉租協議摘要已複製至剪貼簿！');
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
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('LINE 轉租協議摘要已複製至剪貼簿！');
    } catch (e) {
      alert('複製失敗，請手動選取複製');
    }
    document.body.removeChild(ta);
  }

  // HTML5 Canvas 840×1080px 存證圖卡下載
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景漸層
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, 840, 24);

    // 金色細飾條
    ctx.fillStyle = '#c5a880';
    ctx.fillRect(0, 24, 840, 6);

    // 標題與公文號
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '600 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('港 居 不 動 產 開 發 有 限 公 司', 420, 68);

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 26px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('住宅租賃承租人轉租同意書與管理協議', 420, 108);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px sans-serif';
    ctx.fillText(`文件編號：${state.docNo} ｜ 同意日期：${state.consentDate}`, 420, 134);

    // 租賃標的住宅卡片
    ctx.fillStyle = '#f1f5f9';
    roundRect(ctx, 40, 154, 760, 92, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`🏠 租賃物標的：${state.propertyAddress}`, 60, 185);

    ctx.font = '500 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`原租約期間：${state.originalLeaseStart} 至 ${state.originalLeaseEnd} ｜ 原月租：NT$ ${formatMoney(state.originalRent)}`, 60, 218);

    // 轉租範圍與法規合規卡 (藍底)
    ctx.fillStyle = '#eff6ff';
    roundRect(ctx, 40, 260, 760, 84, 8);
    ctx.fill();
    ctx.strokeStyle = '#bfdbfe';
    ctx.stroke();

    const scopeLabel = state.subleaseScope === 'partial' ? '一部轉租（部分空間）' : '全部轉租（全戶住宅）';
    ctx.fillStyle = '#1e40af';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`📌 經出租人同意之轉租範圍：${scopeLabel}`, 60, 288);
    ctx.font = '500 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`${state.subleaseScopeDesc}`, 60, 318);

    // 轉租條件亮點卡 (綠底)
    ctx.fillStyle = '#f0fdf4';
    roundRect(ctx, 40, 358, 760, 90, 8);
    ctx.fill();
    ctx.strokeStyle = '#bbf7d0';
    ctx.stroke();

    ctx.fillStyle = '#166534';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`📅 轉租期間：${state.subleaseStart} 至 ${state.subleaseEnd}（未逾原約迄日）`, 60, 386);
    ctx.font = '800 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`💰 轉租月租：NT$ ${formatMoney(state.subleaseRent)} ｜ 押金：NT$ ${formatMoney(state.subleaseDeposit)}`, 60, 420);

    // 三方法定權益宣告 (黃底)
    ctx.fillStyle = '#fefce8';
    roundRect(ctx, 40, 462, 760, 85, 8);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.fillStyle = '#854d0e';
    ctx.font = '700 13.5px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('⚖️ 法定連帶責任與從屬終止約定：', 60, 488);
    ctx.font = '500 12.5px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('• 依民法第444條，轉租人對次承租人所生損害負連帶賠償責任。', 60, 512);
    ctx.fillText('• 原租約合法終止時，次租賃契約當然消滅，次承租人於3日內無條件騰空遷讓。', 60, 532);

    // 當事人資料清單
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 40, 560, 760, 155, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('三方立約與切結當事人資料：', 60, 588);

    ctx.font = '500 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`• 出租人（同意人）：${state.landlordName} ｜ 身分證：${state.landlordId} ｜ 電話：${state.landlordPhone}`, 60, 616);
    ctx.fillText(`• 轉租人（原承租人）：${state.sublessorName} ｜ 身分證：${state.sublessorId} ｜ 電話：${state.sublessorPhone}`, 60, 644);
    ctx.fillText(`• 次承租人（被轉租人）：${state.sublesseeName} ｜ 身分證：${state.sublesseeId} ｜ 電話：${state.sublesseePhone}`, 60, 672);
    ctx.fillText(`• 受託包租代管機構：${state.managerCompany}（專案經理：${state.managerPerson} 0968-863-880）`, 60, 700);

    // 三方簽章欄位
    const sigBoxWidth = 240;
    const sigY = 730;

    // 出租人簽章盒
    drawCanvasSigBox(ctx, 40, sigY, sigBoxWidth, 140, '出租人（同意人）簽署', signatures.landlord);
    // 轉租人簽章盒
    drawCanvasSigBox(ctx, 300, sigY, sigBoxWidth, 140, '轉租人（原承租人）簽署', signatures.sublessor);
    // 次承租人簽章盒
    drawCanvasSigBox(ctx, 560, sigY, sigBoxWidth, 140, '次承租人（被轉租人）簽署', signatures.sublessee);

    // 底部浮水印宣告
    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編 96797997 ｜ 特許執照 (113)高市租登字第0012號', 420, 1020);
    ctx.fillText('高雄市小港區中安路825號 ｜ 服務電話 07-791-2288 / 0968-863-880', 420, 1042);

    // 下載圖卡
    const a = document.createElement('a');
    a.download = `住宅租賃轉租同意書_${state.docNo}.png`;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('轉租存證確認圖卡已成功下載！');
  }

  function drawCanvasSigBox(ctx, x, y, w, h, title, sigObj) {
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 12.5px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y + 24);

    if (sigObj && sigObj.hasDrawn && sigObj.canvas) {
      try {
        ctx.drawImage(sigObj.canvas, x + 15, y + 35, w - 30, h - 45);
      } catch (e) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('（已數位手寫親簽）', x + w / 2, y + 80);
      }
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText('（待親筆簽章）', x + w / 2, y + 80);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function showToast(msg) {
    let toast = document.getElementById('notice-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'notice-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#1a365d';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '8px';
      toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
      toast.style.fontSize = '14px';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '999999';
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
    }, 2800);
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    bindInputs();
    initSignatureCanvas('landlord');
    initSignatureCanvas('sublessor');
    initSignatureCanvas('sublessee');
    render();

    window.addEventListener('resize', () => {
      ['landlord', 'sublessor', 'sublessee'].forEach(type => {
        const c = signatures[type].canvas;
        if (c && !signatures[type].hasDrawn) {
          const rect = c.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 2;
          c.width = rect.width * dpr;
          c.height = rect.height * dpr;
          const ctx = c.getContext('2d');
          ctx.scale(dpr, dpr);
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#0f172a';
        }
      });
    });
  });
})();
