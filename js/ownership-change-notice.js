/**
 * 港居不動產 - 住宅租賃買賣不破租賃通知與押金移轉確認書產生器
 * File: js/ownership-change-notice.js
 * 依據《民法》第425條（買賣不破租賃原則）與租賃定型化契約規範設計
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

  // 初始化狀態
  const defaultState = {
    docNo: 'GG-TR-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000 + 1000)),
    noticeDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    propertyAddress: '高雄市小港區中安路825號 5樓之2',
    leaseStart: '2026-01-01',
    leaseEnd: '2026-12-31',
    monthlyRent: 22000,
    depositAmount: 44000,
    // 原房東 (讓與人)
    sellerName: '王大明',
    sellerId: 'E123456789',
    sellerPhone: '0912-345-678',
    sellerAddress: '高雄市前鎮區中華五路789號',
    // 新房東 (受讓人)
    buyerName: '李美華',
    buyerId: 'S223456789',
    buyerPhone: '0988-765-432',
    buyerAddress: '高雄市小港區大業北路120號',
    // 承租人
    tenantName: '張志豪',
    tenantId: 'E198765432',
    tenantPhone: '0922-111-222',
    // 代管業者
    managerCompany: '港居不動產開發有限公司',
    managerTaxId: '96797997',
    managerLicence: '(113)高市租登字第0012號',
    managerPerson: '陳俊銘 經理 (112)登字第013739號',
    managerPhone: '0968-863-880',
    // 新指定受款帳戶
    bankName: '玉山銀行 (808)',
    bankBranch: '七賢分行',
    bankAccountNo: '0288-940-123456',
    bankAccountName: '李美華',
    firstPayMonth: '2026-11',
    specialTerms: '新所有權人承諾完全承認並承受原租賃契約所載權利義務，並已全額如數受領原出租人移交之押租保證金。'
  };

  let state = Object.assign({}, defaultState);

  // 簽章畫布實體與狀態
  const signatures = {
    seller: { canvas: null, ctx: null, drawing: false, hasDrawn: false },
    buyer: { canvas: null, ctx: null, drawing: false, hasDrawn: false },
    tenant: { canvas: null, ctx: null, drawing: false, hasDrawn: false }
  };

  function initSignatureCanvas(type) {
    const canvas = document.getElementById(`canvas-sig-${type}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    signatures[type].canvas = canvas;
    signatures[type].ctx = ctx;

    // Retina 2x 高解析適配
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
    // 1. 同步輸入框值
    const fields = [
      'docNo', 'noticeDate', 'effectiveDate', 'propertyAddress',
      'leaseStart', 'leaseEnd', 'monthlyRent', 'depositAmount',
      'sellerName', 'sellerId', 'sellerPhone', 'sellerAddress',
      'buyerName', 'buyerId', 'buyerPhone', 'buyerAddress',
      'tenantName', 'tenantId', 'tenantPhone',
      'managerCompany', 'managerTaxId', 'managerLicence', 'managerPerson', 'managerPhone',
      'bankName', 'bankBranch', 'bankAccountNo', 'bankAccountName',
      'firstPayMonth', 'specialTerms'
    ];

    fields.forEach(field => {
      const el = document.getElementById(`input-${field}`);
      if (el && document.activeElement !== el) {
        el.value = state[field];
      }
    });

    // 2. 押金大寫與中文提示
    const chineseDeposit = numberToChinese(state.depositAmount);
    const chineseDepositEl = document.getElementById('preview-deposit-chinese');
    if (chineseDepositEl) chineseDepositEl.textContent = chineseDeposit;

    const badgeDepositEl = document.getElementById('badge-deposit-amount');
    if (badgeDepositEl) badgeDepositEl.textContent = 'NT$ ' + formatMoney(state.depositAmount);

    // 3. 更新 A4 紙本預覽
    const textBinds = {
      'pv-doc-no': state.docNo,
      'pv-notice-date': state.noticeDate,
      'pv-effective-date': state.effectiveDate,
      'pv-property-address': state.propertyAddress,
      'pv-tenant-name': state.tenantName,
      'pv-seller-name': state.sellerName,
      'pv-seller-id': state.sellerId,
      'pv-seller-phone': state.sellerPhone,
      'pv-buyer-name': state.buyerName,
      'pv-buyer-id': state.buyerId,
      'pv-buyer-phone': state.buyerPhone,
      'pv-lease-period': `${state.leaseStart} 起至 ${state.leaseEnd} 止`,
      'pv-monthly-rent': `新臺幣 ${formatMoney(state.monthlyRent)} 元整 (${numberToChinese(state.monthlyRent)})`,
      'pv-deposit-amount': `新臺幣 ${formatMoney(state.depositAmount)} 元整 (${chineseDeposit})`,
      'pv-bank-info': `${state.bankName} ${state.bankBranch} / 帳號：${state.bankAccountNo} / 戶名：${state.bankAccountName}`,
      'pv-first-pay-month': state.firstPayMonth,
      'pv-manager-info': `${state.managerCompany}（統編：${state.managerTaxId}，登記證：${state.managerLicence}，經理人：${state.managerPerson}，電話：${state.managerPhone}）`,
      'pv-special-terms': state.specialTerms || '無特別約定事項。'
    };

    Object.keys(textBinds).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = textBinds[id];
    });
  }

  // 綁定輸入監聽
  function bindInputs() {
    const fields = [
      'docNo', 'noticeDate', 'effectiveDate', 'propertyAddress',
      'leaseStart', 'leaseEnd', 'monthlyRent', 'depositAmount',
      'sellerName', 'sellerId', 'sellerPhone', 'sellerAddress',
      'buyerName', 'buyerId', 'buyerPhone', 'buyerAddress',
      'tenantName', 'tenantId', 'tenantPhone',
      'managerCompany', 'managerTaxId', 'managerLicence', 'managerPerson', 'managerPhone',
      'bankName', 'bankBranch', 'bankAccountNo', 'bankAccountName',
      'firstPayMonth', 'specialTerms'
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

    // 簽名清除按鈕
    ['seller', 'buyer', 'tenant'].forEach(type => {
      const btn = document.getElementById(`btn-clear-${type}`);
      if (btn) {
        btn.addEventListener('click', () => clearSignature(type));
      }
    });

    // 快速載入示範資料按鈕
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

  // 複製 LINE 格式化摘要
  function copyLineSummary() {
    const text = `【港居不動產｜買賣不破租賃與押金移轉通知確認】
────────────────────
📋 文件編號：${state.docNo}
📅 生效日期：${state.effectiveDate}
🏠 標的地址：${state.propertyAddress}
👤 現承租人：${state.tenantName} 先生/小姐
────────────────────
⚖️ 依據《民法》第425條買賣不破租賃原則：
本租賃住宅產權已移轉登記，新所有權人依法概括承受原租賃契約全部權利義務，原租約條款、租金與租期繼續有效！

💰 押金移轉確認：
原出租人王大明先生已將承租人繳納之押租保證金【${numberToChinese(state.depositAmount)}（NT$ ${formatMoney(state.depositAmount)}）】全額移交新所有權人李美華女士簽收。租期屆滿時由新所有權人負返還責任。

🏦 新租金受款帳戶指定：
• 銀行代碼：${state.bankName}
• 分行名稱：${state.bankBranch}
• 帳戶號碼：${state.bankAccountNo}
• 帳戶戶名：${state.bankAccountName}
• 起始生效繳納年月：${state.firstPayMonth} 起

🏢 專業代管服務機構：
港居不動產開發有限公司（統編：96797997）
專案經理人：陳俊銘 (0968-863-880)
────────────────────
※ 本通知書已三方簽署存證，請安心續住。`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('LINE 通知摘要已複製至剪貼簿！');
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
      showToast('LINE 通知摘要已複製至剪貼簿！');
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
    ctx.fillText('住宅租賃買賣不破租賃通知與押金移轉確認書', 420, 108);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px sans-serif';
    ctx.fillText(`文件編號：${state.docNo} ｜ 生效日期：${state.effectiveDate}`, 420, 134);

    // 標的物卡片區塊
    ctx.fillStyle = '#f1f5f9';
    roundRect(ctx, 40, 154, 760, 90, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`🏠 租賃物標的：${state.propertyAddress}`, 60, 185);

    ctx.font = '500 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`租賃期間：${state.leaseStart} 至 ${state.leaseEnd} ｜ 月租金：NT$ ${formatMoney(state.monthlyRent)}`, 60, 218);

    // 買賣不破租賃法律核心說明卡 (藍底)
    ctx.fillStyle = '#eff6ff';
    roundRect(ctx, 40, 258, 760, 80, 8);
    ctx.fill();
    ctx.strokeStyle = '#bfdbfe';
    ctx.stroke();

    ctx.fillStyle = '#1e40af';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('⚖️ 法定買賣不破租賃原則（民法第425條）：', 60, 285);
    ctx.font = '500 12.5px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('產權移轉不影響租賃權利，新所有權人依法概括承受原租約，承租人權利不受影響。', 60, 314);

    // 押金移轉卡片 (綠底)
    ctx.fillStyle = '#f0fdf4';
    roundRect(ctx, 40, 352, 760, 84, 8);
    ctx.fill();
    ctx.strokeStyle = '#bbf7d0';
    ctx.stroke();

    ctx.fillStyle = '#166534';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('💰 押租保證金移轉交付確認：', 60, 380);
    ctx.font = '800 18px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`移轉金額：NT$ ${formatMoney(state.depositAmount)} 元整（${numberToChinese(state.depositAmount)}）`, 60, 412);

    // 新指定受款帳戶 (黃底)
    ctx.fillStyle = '#fefce8';
    roundRect(ctx, 40, 450, 760, 90, 8);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.fillStyle = '#854d0e';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('🏦 新租金指定匯款受款帳戶：', 60, 478);
    ctx.font = '600 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`${state.bankName} ${state.bankBranch} ｜ 帳號：${state.bankAccountNo} ｜ 戶名：${state.bankAccountName}`, 60, 506);
    ctx.font = '500 12.5px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`指定起始繳納期數：自 ${state.firstPayMonth} 起撥入新帳戶`, 60, 526);

    // 當事人基本資料清單
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 40, 554, 760, 160, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('三方立約與受通知人資料：', 60, 582);

    ctx.font = '500 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`• 原出租人（讓與人）：${state.sellerName} ｜ 身分證：${state.sellerId} ｜ 電話：${state.sellerPhone}`, 60, 612);
    ctx.fillText(`• 新所有權人（受讓人）：${state.buyerName} ｜ 身分證：${state.buyerId} ｜ 電話：${state.buyerPhone}`, 60, 640);
    ctx.fillText(`• 現承租人（受通知人）：${state.tenantName} ｜ 身分證：${state.tenantId} ｜ 電話：${state.tenantPhone}`, 60, 668);
    ctx.fillText(`• 受託包租代管業者：${state.managerCompany}（專案經理：${state.managerPerson} 0968-863-880）`, 60, 696);

    // 三方簽章欄位渲染
    const sigBoxWidth = 240;
    const sigY = 730;

    // 原房東簽章盒
    drawCanvasSigBox(ctx, 40, sigY, sigBoxWidth, 140, '原出租人（讓與人）簽署', signatures.seller);
    // 新房東簽章盒
    drawCanvasSigBox(ctx, 300, sigY, sigBoxWidth, 140, '新所有權人（受讓人）簽署', signatures.buyer);
    // 承租人簽收盒
    drawCanvasSigBox(ctx, 560, sigY, sigBoxWidth, 140, '現承租人（受通知人）簽收', signatures.tenant);

    // 底部浮水印與證照宣告
    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編 96797997 ｜ 特許執照 (113)高市租登字第0012號', 420, 1020);
    ctx.fillText('高雄市小港區中安路825號 ｜ 服務電話 07-791-2288 / 0968-863-880', 420, 1042);

    // 轉出並下載
    const a = document.createElement('a');
    a.download = `住宅租賃買賣不破租賃通知書_${state.docNo}.png`;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('存證確認圖卡已成功下載！');
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
    initSignatureCanvas('seller');
    initSignatureCanvas('buyer');
    initSignatureCanvas('tenant');
    render();

    // 視窗尺寸改變時微調畫布大小
    window.addEventListener('resize', () => {
      ['seller', 'buyer', 'tenant'].forEach(type => {
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
