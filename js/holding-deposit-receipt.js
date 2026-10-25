/**
 * 港居不動產 - 租屋定金收據與承租保留切結產生器 (holding-deposit-receipt.js)
 * 遵循《民法》第 248/249 條規範、中文金融大寫轉換、雙簽章與 Canvas/LINE 輸出
 */

(function () {
  'use strict';

  // 數字轉繁體中文金融大寫
  function toChineseCapital(n) {
    if (isNaN(n) || n === null || n === '') return '零元整';
    n = Math.floor(Math.abs(Number(n)));
    if (n === 0) return '零元整';

    var digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    var units = ['', '拾', '佰', '仟'];
    var bigUnits = ['', '萬', '億'];

    var str = '';
    var unitIdx = 0;

    while (n > 0 && unitIdx < bigUnits.length) {
      var section = n % 10000;
      if (section > 0) {
        var secStr = '';
        var zero = false;
        for (var i = 0; i < 4; i++) {
          var d = section % 10;
          if (d === 0) {
            if (secStr !== '' && !zero) {
              zero = true;
              secStr = digits[0] + secStr;
            }
          } else {
            zero = false;
            secStr = digits[d] + units[i] + secStr;
          }
          section = Math.floor(section / 10);
        }
        str = secStr + bigUnits[unitIdx] + str;
      }
      unitIdx++;
      n = Math.floor(n / 10000);
    }

    return '新臺幣 ' + str.replace(/零+/g, '零').replace(/零$/, '') + '元整';
  }

  function formatMoney(n) {
    var val = parseFloat(n) || 0;
    return val.toLocaleString('en-US');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // DOM 元素引用快取
  var elements = {
    // 基本資訊
    receiptNo: document.getElementById('receiptNo'),
    receiptDate: document.getElementById('receiptDate'),
    holdDeadline: document.getElementById('holdDeadline'),
    paymentMethod: document.getElementById('paymentMethod'),

    // 租賃物業標的與當事人
    propertyAddress: document.getElementById('propertyAddress'),
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),
    tenantIdCard: document.getElementById('tenantIdCard'),
    landlordName: document.getElementById('landlordName'),
    managerPhone: document.getElementById('managerPhone'),

    // 約定租賃條件
    agreedRent: document.getElementById('agreedRent'),
    agreedDeposit: document.getElementById('agreedDeposit'),
    agreedLeaseStart: document.getElementById('agreedLeaseStart'),
    agreedSignDeadline: document.getElementById('agreedSignDeadline'),

    // 定金金額與折抵
    depositAmount: document.getElementById('depositAmount'),
    depositOffsetMode: document.getElementById('depositOffsetMode'),
    specialTerms: document.getElementById('specialTerms'),

    // 金額展示
    capitalAmountDisplay: document.getElementById('capitalAmountDisplay'),
    numberAmountDisplay: document.getElementById('numberAmountDisplay'),

    // 簽章畫布
    canvasManager: document.getElementById('canvasManager'),
    canvasTenant: document.getElementById('canvasTenant'),
    btnClearManager: document.getElementById('btnClearManager'),
    btnClearTenant: document.getElementById('btnClearTenant'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽紙張標籤
    prevReceiptNo: document.getElementById('prevReceiptNo'),
    prevReceiptDate: document.getElementById('prevReceiptDate'),
    prevHoldDeadline: document.getElementById('prevHoldDeadline'),
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevTenantInfo: document.getElementById('prevTenantInfo'),
    prevLandlordInfo: document.getElementById('prevLandlordInfo'),
    prevAgreedConditions: document.getElementById('prevAgreedConditions'),
    prevDepositAmountBanner: document.getElementById('prevDepositAmountBanner'),
    prevOffsetModeText: document.getElementById('prevOffsetModeText'),
    prevSpecialTermsText: document.getElementById('prevSpecialTermsText')
  };

  // 預設範本資料
  var sampleData = {
    receiptNo: 'HD-20261025-01',
    receiptDate: '2026-10-25',
    holdDeadline: '2026-10-28T18:00',
    paymentMethod: 'bank_transfer',
    propertyAddress: '高雄市小港區宏治街128號4樓之1',
    tenantName: '林志豪',
    tenantPhone: '0912-345-678',
    tenantIdCard: 'E123456789',
    landlordName: '港居不動產開發有限公司（受託代管方）',
    managerPhone: '0929-880-880',
    agreedRent: 18000,
    agreedDeposit: 36000,
    agreedLeaseStart: '2026-11-01',
    agreedSignDeadline: '2026-10-28',
    depositAmount: 5000,
    depositOffsetMode: 'offset_rent',
    specialTerms: '雙方約定於 2026/10/28 前完成租約簽署。附贈全新防蟎保潔墊，屋內禁止抽煙與嚼食檳榔。'
  };

  // 初始化簽章畫布 (Retina 2x)
  function initSignaturePad(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var isDrawing = false;
    var hasSigned = false;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var width = rect.width || 300;
      var height = rect.height || 120;
      var dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#1a365d';
    }

    resize();
    window.addEventListener('resize', function () {
      // 保留原有筆跡
      var tempImg = new Image();
      tempImg.src = canvas.toDataURL();
      tempImg.onload = function () {
        resize();
        var dpr = window.devicePixelRatio || 1;
        ctx.drawImage(tempImg, 0, 0, canvas.width / dpr, canvas.height / dpr);
      };
    });

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    function start(e) {
      e.preventDefault();
      isDrawing = true;
      hasSigned = true;
      var p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }

    function move(e) {
      if (!isDrawing) return;
      e.preventDefault();
      var p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    function end() {
      isDrawing = false;
      renderPreviewSignatures();
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);

    return {
      clear: function () {
        var dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        hasSigned = false;
        renderPreviewSignatures();
      },
      hasSigned: function () {
        return hasSigned;
      },
      toDataURL: function () {
        return hasSigned ? canvas.toDataURL('image/png') : null;
      }
    };
  }

  var padManager = null;
  var padTenant = null;

  function renderPreviewSignatures() {
    var imgManager = document.getElementById('prevSigImgManager');
    var placeholderManager = document.getElementById('prevStampBoxManager');
    if (padManager && padManager.hasSigned()) {
      if (imgManager) {
        imgManager.src = padManager.toDataURL();
        imgManager.style.display = 'block';
      }
      if (placeholderManager) placeholderManager.style.display = 'none';
    } else {
      if (imgManager) imgManager.style.display = 'none';
      if (placeholderManager) placeholderManager.style.display = 'flex';
    }

    var imgTenant = document.getElementById('prevSigImgTenant');
    var placeholderTenant = document.getElementById('prevStampBoxTenant');
    if (padTenant && padTenant.hasSigned()) {
      if (imgTenant) {
        imgTenant.src = padTenant.toDataURL();
        imgTenant.style.display = 'block';
      }
      if (placeholderTenant) placeholderTenant.style.display = 'none';
    } else {
      if (imgTenant) imgTenant.style.display = 'none';
      if (placeholderTenant) placeholderTenant.style.display = 'flex';
    }
  }

  // 取得抵扣模式文字說明
  function getOffsetModeText(val) {
    switch (val) {
      case 'offset_rent':
        return '於正式簽訂租約時，本定金全額抵充【首期租金】之一部。';
      case 'offset_deposit':
        return '於正式簽訂租約時，本定金全額抵充【租賃押金（擔保金）】之一部。';
      case 'refund_on_sign':
        return '於正式簽訂租約繳清押租金後，本定金【全額無息退還承租人】。';
      default:
        return '依雙方簽約時協議辦理抵扣或退還。';
    }
  }

  // 取得支付方式標籤
  function getPaymentMethodText(val) {
    switch (val) {
      case 'cash': return '現金給付';
      case 'bank_transfer': return '銀行/ATM 匯款';
      case 'linepay': return '行動支付 / LINE Pay 轉帳';
      default: return '現金給付';
    }
  }

  function formatDateTime(dtStr) {
    if (!dtStr) return '—';
    var d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + ' 年 ' + m + ' 月 ' + day + ' 日 ' + h + ':' + min;
  }

  // 渲染右側 A4 紙張預覽
  function renderPreview() {
    var depVal = parseFloat(elements.depositAmount.value) || 0;
    var capStr = toChineseCapital(depVal);

    if (elements.capitalAmountDisplay) elements.capitalAmountDisplay.textContent = capStr;
    if (elements.numberAmountDisplay) elements.numberAmountDisplay.textContent = formatMoney(depVal);

    if (elements.prevReceiptNo) elements.prevReceiptNo.textContent = '收據編號：' + (elements.receiptNo.value || 'HD-20261025-01');
    if (elements.prevReceiptDate) elements.prevReceiptDate.textContent = '收款日期：' + (elements.receiptDate.value || '2026-10-25');
    if (elements.prevHoldDeadline) elements.prevHoldDeadline.textContent = '保留截止：' + formatDateTime(elements.holdDeadline.value);

    if (elements.prevPropertyAddress) elements.prevPropertyAddress.textContent = elements.propertyAddress.value || '（未輸入地址）';

    var tName = elements.tenantName.value || '（未具名）';
    var tPhone = elements.tenantPhone.value || '—';
    var tId = elements.tenantIdCard.value || '—';
    if (elements.prevTenantInfo) {
      elements.prevTenantInfo.innerHTML = '<strong>' + escapeHtml(tName) + '</strong> ｜ 電話：' + escapeHtml(tPhone) + ' ｜ 身分證：' + escapeHtml(tId);
    }

    var lName = elements.landlordName.value || '港居不動產開發有限公司';
    var lPhone = elements.managerPhone.value || '0929-880-880';
    var pMethod = getPaymentMethodText(elements.paymentMethod.value);
    if (elements.prevLandlordInfo) {
      elements.prevLandlordInfo.innerHTML = '<strong>' + escapeHtml(lName) + '</strong> ｜ 聯絡電話：' + escapeHtml(lPhone) + '<br><span style="color: #718096; font-size: 0.8rem;">支付方式：' + pMethod + '</span>';
    }

    var rentVal = parseFloat(elements.agreedRent.value) || 0;
    var secDep = parseFloat(elements.agreedDeposit.value) || 0;
    var startD = elements.agreedLeaseStart.value || '—';
    var signD = elements.agreedSignDeadline.value || '—';

    if (elements.prevAgreedConditions) {
      elements.prevAgreedConditions.innerHTML =
        '約定每月租金：<strong>NT$ ' + formatMoney(rentVal) + '</strong> 元 ｜ 約定押金：<strong>NT$ ' + formatMoney(secDep) + '</strong> 元<br>' +
        '約定最遲簽約日：<span style="color: #c5a059; font-weight: 700;">' + escapeHtml(signD) + '</span> ｜ 預計起租日：' + escapeHtml(startD);
    }

    if (elements.prevDepositAmountBanner) {
      elements.prevDepositAmountBanner.innerHTML =
        '<div class="paper-amount-title">定金收受金額實收：</div>' +
        '<div class="paper-amount-val">NT$ ' + formatMoney(depVal) + '</div>' +
        '<div class="paper-amount-cap">' + capStr + '</div>';
    }

    if (elements.prevOffsetModeText) {
      elements.prevOffsetModeText.textContent = getOffsetModeText(elements.depositOffsetMode.value);
    }

    var customNote = elements.specialTerms.value.trim();
    if (elements.prevSpecialTermsText) {
      if (customNote) {
        elements.prevSpecialTermsText.textContent = customNote;
        elements.prevSpecialTermsText.parentElement.style.display = 'block';
      } else {
        elements.prevSpecialTermsText.parentElement.style.display = 'none';
      }
    }

    renderPreviewSignatures();
  }

  // 載入資料至表單
  function loadFormData(data) {
    if (!data) return;
    Object.keys(data).forEach(function (k) {
      if (elements[k]) {
        elements[k].value = data[k];
      }
    });
    renderPreview();
  }

  // 從表單擷取資料物件
  function getFormData() {
    return {
      receiptNo: elements.receiptNo.value,
      receiptDate: elements.receiptDate.value,
      holdDeadline: elements.holdDeadline.value,
      paymentMethod: elements.paymentMethod.value,
      propertyAddress: elements.propertyAddress.value,
      tenantName: elements.tenantName.value,
      tenantPhone: elements.tenantPhone.value,
      tenantIdCard: elements.tenantIdCard.value,
      landlordName: elements.landlordName.value,
      managerPhone: elements.managerPhone.value,
      agreedRent: elements.agreedRent.value,
      agreedDeposit: elements.agreedDeposit.value,
      agreedLeaseStart: elements.agreedLeaseStart.value,
      agreedSignDeadline: elements.agreedSignDeadline.value,
      depositAmount: elements.depositAmount.value,
      depositOffsetMode: elements.depositOffsetMode.value,
      specialTerms: elements.specialTerms.value
    };
  }

  // LocalStorage 離線暫存
  var DRAFT_KEY = 'ganju_holding_deposit_draft_v1';

  function saveDraft() {
    var data = getFormData();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      if (window.GanjuToast) {
        window.GanjuToast.show('定金收據草稿已成功暫存！', 'success');
      } else {
        alert('定金收據草稿已成功暫存！');
      }
    } catch (e) {
      alert('草稿儲存失敗：' + e.message);
    }
  }

  function loadDraft() {
    try {
      var saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        loadFormData(parsed);
      } else {
        loadFormData(sampleData);
      }
    } catch (e) {
      loadFormData(sampleData);
    }
  }

  function clearDraft() {
    if (confirm('確定要清空所有填寫內容並重設嗎？')) {
      localStorage.removeItem(DRAFT_KEY);
      if (padManager) padManager.clear();
      if (padTenant) padTenant.clear();
      loadFormData({
        receiptNo: 'HD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
        receiptDate: new Date().toISOString().slice(0, 10),
        holdDeadline: '',
        paymentMethod: 'cash',
        propertyAddress: '',
        tenantName: '',
        tenantPhone: '',
        tenantIdCard: '',
        landlordName: '港居不動產開發有限公司（受託代管方）',
        managerPhone: '0929-880-880',
        agreedRent: '',
        agreedDeposit: '',
        agreedLeaseStart: '',
        agreedSignDeadline: '',
        depositAmount: '',
        depositOffsetMode: 'offset_rent',
        specialTerms: ''
      });
      if (window.GanjuToast) {
        window.GanjuToast.show('已清空表單！', 'info');
      }
    }
  }

  // 複製 LINE 存證回報文字
  function copyLineSummary() {
    var d = getFormData();
    var depVal = parseFloat(d.depositAmount) || 0;
    var capStr = toChineseCapital(depVal);

    var text =
      '【港居不動產 ｜ 租屋承租保留定金收訖通知】\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '📋 收據序號：' + d.receiptNo + '\n' +
      '📅 收款日期：' + d.receiptDate + '\n' +
      '⏳ 保留有效截止：' + formatDateTime(d.holdDeadline) + '\n' +
      '🏠 承租物業：' + d.propertyAddress + '\n' +
      '👤 承租人：' + d.tenantName + ' (' + d.tenantPhone + ')\n' +
      '💰 定金實收：NT$ ' + formatMoney(depVal) + ' 元整 (' + capStr + ')\n' +
      '📝 定金抵充：' + getOffsetModeText(d.depositOffsetMode) + '\n' +
      '─────────────────────\n' +
      '📌 約定條件：月租 NT$ ' + formatMoney(d.agreedRent) + ' ｜ 押金 NT$ ' + formatMoney(d.agreedDeposit) + '\n' +
      '🖋️ 約定最遲簽約日：' + d.agreedSignDeadline + '\n' +
      '⚖️ 法規依據：《民法》第248條及第249條（逾期未簽約依法沒收定金／出租人違約加倍返還）\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '受託代管：港居不動產開發有限公司\n' +
      '專案諮詢專線：0929-880-880 陳俊銘經理';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (window.GanjuToast) {
          window.GanjuToast.show('已複製 LINE 定金收據文字！可直接貼至客戶對話群組。', 'success');
        } else {
          alert('已複製 LINE 定金收據文字！');
        }
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('已複製 LINE 定金收據文字！');
    }
  }

  // HTML5 Canvas 840×1080px 高畫質圖卡生成
  function downloadCardImage() {
    var d = getFormData();
    var depVal = parseFloat(d.depositAmount) || 0;
    var capStr = toChineseCapital(depVal);

    var cvs = document.createElement('canvas');
    cvs.width = 840;
    cvs.height = 1080;
    var ctx = cvs.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍橫幅
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, 840, 140);

    // 頂部金色邊線
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 134, 840, 6);

    // 頂部文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('租賃住宅承租保留定金收據暨切結書', 420, 60);

    ctx.fillStyle = '#c5a059';
    ctx.font = '16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('港居不動產開發有限公司・依據《民法》第248/249條法定效力開立', 420, 95);

    // 收據序號與日期條
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(40, 160, 760, 44);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 160, 760, 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('序號：' + d.receiptNo, 55, 188);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a5568';
    ctx.font = '14px sans-serif';
    ctx.fillText('收款日：' + d.receiptDate + ' ｜ 保留截止：' + formatDateTime(d.holdDeadline), 785, 188);

    // 基本資訊區塊
    var curY = 230;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('📍 承租物業標的與雙方當事人', 40, curY);

    curY += 15;
    ctx.fillStyle = '#fcfcfd';
    ctx.fillRect(40, curY, 760, 115);
    ctx.strokeRect(40, curY, 760, 115);

    ctx.fillStyle = '#2d3748';
    ctx.font = '15px sans-serif';
    ctx.fillText('租賃物業：' + (d.propertyAddress || '—'), 55, curY + 30);
    ctx.fillText('承 租 人：' + (d.tenantName || '—') + '  ｜  電話：' + (d.tenantPhone || '—') + '  ｜  身分證：' + (d.tenantIdCard || '—'), 55, curY + 60);
    ctx.fillText('出 租 方：' + (d.landlordName || '—') + '  ｜  支付方式：' + getPaymentMethodText(d.paymentMethod), 55, curY + 90);

    // 金額展示金色方框
    curY += 140;
    ctx.fillStyle = '#fefcf7';
    ctx.fillRect(40, curY, 760, 95);
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, curY, 760, 95);

    ctx.fillStyle = '#744210';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('定金實收金額：', 60, curY + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#b7791f';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('NT$ ' + formatMoney(depVal), 770, curY + 45);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('大寫：' + capStr + ' (' + getOffsetModeText(d.depositOffsetMode) + ')', 60, curY + 75);

    // 約定條件
    curY += 120;
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('📝 約定正式簽約租賃條件', 40, curY);

    curY += 15;
    ctx.fillStyle = '#fcfcfd';
    ctx.fillRect(40, curY, 760, 80);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, curY, 760, 80);

    ctx.fillStyle = '#2d3748';
    ctx.font = '15px sans-serif';
    ctx.fillText('約定月租：NT$ ' + formatMoney(d.agreedRent) + ' 元整   ｜   約定押金：NT$ ' + formatMoney(d.agreedDeposit) + ' 元整', 55, curY + 30);
    ctx.fillText('約定最遲簽約日：' + d.agreedSignDeadline + '   ｜   預計起租日：' + d.agreedLeaseStart, 55, curY + 60);

    // 民法第249條法定效力聲明
    curY += 105;
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('⚖️ 《民法》第248/249條法定定金效力約定', 40, curY);

    curY += 15;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, curY, 760, 110);
    ctx.strokeRect(40, curY, 760, 110);

    ctx.fillStyle = '#4a5568';
    ctx.font = '13px sans-serif';
    ctx.fillText('1. 契約成立推定：本定金收受後，依《民法》第248條推定租賃意願成立，受定金方不得另行招租他人。', 55, curY + 25);
    ctx.fillText('2. 承租人違約沒收：承租人逾期未簽約或無故不承租，受定金方依法沒收定金，承租人不得請求返還。', 55, curY + 50);
    ctx.fillText('3. 出租人違約加倍返還：出租方無正當理由拒絕出租或另租他人，受定金方應加倍返還所受定金。', 55, curY + 75);
    ctx.fillText('4. 抵充原則：正式簽約時，本定金依約定全額抵作首期租金或保證金之一部，充份維護雙方權益。', 55, curY + 98);

    // 簽章區域 (左右雙簽)
    curY += 135;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('受託代管方 (收款確認簽署)：', 50, curY);
    ctx.fillText('承 租 人 (付款切結簽署)：', 450, curY);

    var drawSigToCanvas = function (pad, x, y, w, h) {
      if (pad && pad.hasSigned()) {
        var img = new Image();
        img.src = pad.toDataURL();
        ctx.drawImage(img, x, y, w, h);
      } else {
        ctx.strokeStyle = '#cbd5e0';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#a0aec0';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(電子線上親簽)', x + w / 2, y + h / 2 + 5);
      }
    };

    drawSigToCanvas(padManager, 50, curY + 10, 320, 90);
    drawSigToCanvas(padTenant, 450, curY + 10, 320, 90);

    // 頁尾官方宣告
    ctx.fillStyle = '#718096';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號 ｜ 專利防偽存證憑證', 420, 1055);

    // 下載圖片
    var link = document.createElement('a');
    link.download = '港居不動產_定金收據_' + d.receiptNo + '_' + (d.tenantName || '客戶') + '.png';
    link.href = cvs.toDataURL('image/png');
    link.click();

    if (window.GanjuToast) {
      window.GanjuToast.show('定金收據圖卡下載成功！', 'success');
    }
  }

  // 事件綁定與初始化
  function initEvents() {
    // 輸入連動即時預覽
    var inputs = [
      elements.receiptNo, elements.receiptDate, elements.holdDeadline,
      elements.paymentMethod, elements.propertyAddress, elements.tenantName,
      elements.tenantPhone, elements.tenantIdCard, elements.landlordName,
      elements.managerPhone, elements.agreedRent, elements.agreedDeposit,
      elements.agreedLeaseStart, elements.agreedSignDeadline, elements.depositAmount,
      elements.depositOffsetMode, elements.specialTerms
    ];

    inputs.forEach(function (inp) {
      if (inp) {
        inp.addEventListener('input', renderPreview);
        inp.addEventListener('change', renderPreview);
      }
    });

    // 簽章初始化
    padManager = initSignaturePad(elements.canvasManager);
    padTenant = initSignaturePad(elements.canvasTenant);

    if (elements.btnClearManager) {
      elements.btnClearManager.addEventListener('click', function () {
        if (padManager) padManager.clear();
      });
    }

    if (elements.btnClearTenant) {
      elements.btnClearTenant.addEventListener('click', function () {
        if (padTenant) padTenant.clear();
      });
    }

    // 按鈕群事件
    if (elements.btnPrint) {
      elements.btnPrint.addEventListener('click', function () {
        window.print();
      });
    }

    if (elements.btnDownloadCard) {
      elements.btnDownloadCard.addEventListener('click', downloadCardImage);
    }

    if (elements.btnCopyLine) {
      elements.btnCopyLine.addEventListener('click', copyLineSummary);
    }

    if (elements.btnSaveDraft) {
      elements.btnSaveDraft.addEventListener('click', saveDraft);
    }

    if (elements.btnLoadSample) {
      elements.btnLoadSample.addEventListener('click', function () {
        loadFormData(sampleData);
        if (window.GanjuToast) window.GanjuToast.show('已載入示範資料！', 'info');
      });
    }

    if (elements.btnClearDraft) {
      elements.btnClearDraft.addEventListener('click', clearDraft);
    }
  }

  // 頁面載入執行
  document.addEventListener('DOMContentLoaded', function () {
    initEvents();
    loadDraft();
    renderPreview();
  });

})();
