/**
 * ==========================================================================
 * 港居不動產 - 租賃住宅連帶保證人保證書與履約切結書核心邏輯
 * guarantor-agreement.js
 * 依據《民法》第739~745條連帶保證與定型化契約規範設計
 * ==========================================================================
 */

(function () {
  'use strict';

  // 繁體中文金融大寫金額轉換演算法
  function toChineseCapital(n) {
    if (isNaN(n) || n === null || n === '') return '零元整';
    n = Math.floor(Math.abs(Number(n)));
    if (n === 0) return '零元整';

    var fraction = ['角', '分'];
    var digit = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    var unit = [
      ['元', '萬', '億'],
      ['', '拾', '佰', '仟']
    ];

    var s = '';
    for (var i = 0; i < unit[0].length && n > 0; i++) {
      var p = '';
      for (var j = 0; j < unit[1].length && n > 0; j++) {
        p = digit[n % 10] + unit[1][j] + p;
        n = Math.floor(n / 10);
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return s
      .replace(/(零.)*零元/, '元')
      .replace(/(零.)+/g, '零')
      .replace(/^整$/, '零元整') + '整';
  }

  // 格式化千分位
  function formatMoney(num) {
    return Number(num || 0).toLocaleString('zh-TW');
  }

  // DOM 元素引用快取
  var elements = {
    // 房屋與租賃資料
    propertyAddress: document.getElementById('propertyAddress'),
    leaseStartDate: document.getElementById('leaseStartDate'),
    leaseEndDate: document.getElementById('leaseEndDate'),
    monthlyRent: document.getElementById('monthlyRent'),

    // 出租人（房東／受託代管方）
    landlordName: document.getElementById('landlordName'),
    landlordPhone: document.getElementById('landlordPhone'),

    // 承租人（房客）
    tenantName: document.getElementById('tenantName'),
    tenantId: document.getElementById('tenantId'),
    tenantPhone: document.getElementById('tenantPhone'),
    tenantAddress: document.getElementById('tenantAddress'),

    // 連帶保證人
    guarantorName: document.getElementById('guarantorName'),
    guarantorId: document.getElementById('guarantorId'),
    guarantorPhone: document.getElementById('guarantorPhone'),
    guarantorRelation: document.getElementById('guarantorRelation'),
    guarantorEmployer: document.getElementById('guarantorEmployer'),
    guarantorAddress: document.getElementById('guarantorAddress'),

    // 擔保限制與範圍
    guaranteeLimitType: document.getElementById('guaranteeLimitType'),
    guaranteeLimitAmount: document.getElementById('guaranteeLimitAmount'),
    scopeRent: document.getElementById('scopeRent'),
    scopeUtility: document.getElementById('scopeUtility'),
    scopePenalty: document.getElementById('scopePenalty'),
    scopeDamage: document.getElementById('scopeDamage'),
    scopeUnjust: document.getElementById('scopeUnjust'),
    scopeLegal: document.getElementById('scopeLegal'),
    customTerms: document.getElementById('customTerms'),

    // 簽章畫布
    canvasGuarantor: document.getElementById('canvasGuarantor'),
    canvasTenant: document.getElementById('canvasTenant'),
    btnClearGuarantor: document.getElementById('btnClearGuarantor'),
    btnClearTenant: document.getElementById('btnClearTenant'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽替換標籤
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevLeasePeriod: document.getElementById('prevLeasePeriod'),
    prevLandlordName: document.getElementById('prevLandlordName'),
    prevTenantName: document.getElementById('prevTenantName'),
    prevTenantId: document.getElementById('prevTenantId'),
    prevTenantPhone: document.getElementById('prevTenantPhone'),
    prevTenantAddress: document.getElementById('prevTenantAddress'),
    prevGuarantorName: document.getElementById('prevGuarantorName'),
    prevGuarantorId: document.getElementById('prevGuarantorId'),
    prevGuarantorPhone: document.getElementById('prevGuarantorPhone'),
    prevGuarantorRelation: document.getElementById('prevGuarantorRelation'),
    prevGuarantorEmployer: document.getElementById('prevGuarantorEmployer'),
    prevGuarantorAddress: document.getElementById('prevGuarantorAddress'),
    prevGuaranteeLimitText: document.getElementById('prevGuaranteeLimitText'),
    prevScopeList: document.getElementById('prevScopeList'),
    prevCustomTerms: document.getElementById('prevCustomTerms'),
    prevSignDate: document.getElementById('prevSignDate'),
    imgSigGuarantor: document.getElementById('imgSigGuarantor'),
    imgSigTenant: document.getElementById('imgSigTenant')
  };

  // 雙電子簽章板管理物件
  var sigGuarantor = initSignaturePad(elements.canvasGuarantor);
  var sigTenant = initSignaturePad(elements.canvasTenant);

  function initSignaturePad(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var isDrawing = false;
    var hasSigned = false;

    // Retina 2x 高清適配
    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var ratio = window.devicePixelRatio || 2;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0F2341';
    }

    // 初始化與監聽尺寸
    resizeCanvas();
    window.addEventListener('resize', function () {
      if (!hasSigned) resizeCanvas();
    });

    function getCoords(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasSigned = true;
      var pos = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function moveDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      var pos = getCoords(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function endDraw(e) {
      if (!isDrawing) return;
      isDrawing = false;
      ctx.closePath();
      updatePreviewSignatures();
    }

    // 滑鼠事件
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

    // 觸控事件
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw, { passive: false });

    return {
      clear: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
        updatePreviewSignatures();
      },
      hasSignature: function () {
        return hasSigned;
      },
      toDataURL: function () {
        return hasSigned ? canvas.toDataURL('image/png') : '';
      }
    };
  }

  function updatePreviewSignatures() {
    if (elements.imgSigGuarantor) {
      var dataG = sigGuarantor.toDataURL();
      if (dataG) {
        elements.imgSigGuarantor.src = dataG;
        elements.imgSigGuarantor.style.display = 'block';
        if (elements.imgSigGuarantor.nextElementSibling) {
          elements.imgSigGuarantor.nextElementSibling.style.display = 'none';
        }
      } else {
        elements.imgSigGuarantor.style.display = 'none';
        if (elements.imgSigGuarantor.nextElementSibling) {
          elements.imgSigGuarantor.nextElementSibling.style.display = 'flex';
        }
      }
    }

    if (elements.imgSigTenant) {
      var dataT = sigTenant.toDataURL();
      if (dataT) {
        elements.imgSigTenant.src = dataT;
        elements.imgSigTenant.style.display = 'block';
        if (elements.imgSigTenant.nextElementSibling) {
          elements.imgSigTenant.nextElementSibling.style.display = 'none';
        }
      } else {
        elements.imgSigTenant.style.display = 'none';
        if (elements.imgSigTenant.nextElementSibling) {
          elements.imgSigTenant.nextElementSibling.style.display = 'flex';
        }
      }
    }
  }

  // 即時連動更新預覽合約內容
  function renderPreview() {
    // 房屋與租期
    var addr = elements.propertyAddress.value.trim() || '高雄市前鎮區中華五路（請填寫租賃住宅完整地址）';
    elements.prevPropertyAddress.textContent = addr;

    var sDate = elements.leaseStartDate.value || '2026-11-01';
    var eDate = elements.leaseEndDate.value || '2027-10-31';
    var mRent = Number(elements.monthlyRent.value) || 25000;
    elements.prevLeasePeriod.textContent = sDate + ' 起至 ' + eDate + ' 止（約定月租金 NT$ ' + formatMoney(mRent) + ' 元）';

    // 出租人
    var lName = elements.landlordName.value.trim() || '港居不動產開發有限公司（受託管理代管方）';
    elements.prevLandlordName.textContent = lName;

    // 承租人
    var tNameVal = elements.tenantName.value.trim() || '王承租';
    elements.prevTenantName.textContent = tNameVal;
    var tCell = document.getElementById('prevTenantNameCell');
    if (tCell) tCell.textContent = tNameVal;
    elements.prevTenantId.textContent = elements.tenantId.value.trim() || 'E123456789';
    elements.prevTenantPhone.textContent = elements.tenantPhone.value.trim() || '0912-345-678';
    elements.prevTenantAddress.textContent = elements.tenantAddress.value.trim() || '戶籍地址如雙方租賃契約所載';

    // 連帶保證人
    var gNameVal = elements.guarantorName.value.trim() || '林保證';
    elements.prevGuarantorName.textContent = gNameVal;
    var gCell = document.getElementById('prevGuarantorNameCell');
    if (gCell) gCell.textContent = gNameVal;
    elements.prevGuarantorId.textContent = elements.guarantorId.value.trim() || 'S223344556';
    elements.prevGuarantorPhone.textContent = elements.guarantorPhone.value.trim() || '0988-765-432';
    elements.prevGuarantorRelation.textContent = elements.guarantorRelation.value.trim() || '父子 / 親屬';
    elements.prevGuarantorEmployer.textContent = elements.guarantorEmployer.value.trim() || '台灣高科技股份有限公司・工程師';
    elements.prevGuarantorAddress.textContent = elements.guarantorAddress.value.trim() || '高雄市苓雅區四維三路（請填寫保證人戶籍地）';

    // 擔保責任上限
    var limitType = elements.guaranteeLimitType.value;
    if (limitType === 'capped') {
      var limitAmt = Number(elements.guaranteeLimitAmount.value) || 150000;
      var capitalText = toChineseCapital(limitAmt);
      elements.prevGuaranteeLimitText.innerHTML =
        '本連帶保證責任以 <strong class="paper-highlight">新臺幣 ' + capitalText + '（NT$ ' + formatMoney(limitAmt) + ' 元）</strong> 為最高清償上限。';
    } else {
      elements.prevGuaranteeLimitText.innerHTML =
        '本連帶保證人同意負 <strong class="paper-highlight">完全連帶清償責任，不設責任最高限額</strong>，直至承租人完全履行租賃契約之一切債務為止。';
    }

    // 擔保範圍清單
    var scopes = [];
    if (elements.scopeRent.checked) scopes.push('承租人積欠之租金、大樓管理費及停車位租金。');
    if (elements.scopeUtility.checked) scopes.push('承租人使用期間所衍生之自來水費、電費、天然瓦斯費、寬頻網路費及公共電費分攤。');
    if (elements.scopePenalty.checked) scopes.push('租賃期間違約、提前終止租約之法定或約定違約賠償金。');
    if (elements.scopeDamage.checked) scopes.push('租賃住宅室內裝潢、附屬家具家電損壞、滅失之修復費用或折舊賠償金。');
    if (elements.scopeUnjust.checked) scopes.push('租約屆滿或終止後未依約騰空遷讓交還房屋所生之相當於租金之不當得利及懲罰性違約金。');
    if (elements.scopeLegal.checked) scopes.push('因承租人違約所致出租人支出之存證信函規費、調處費、律師費、訴訟費用及民事強制執行費用。');

    var listHtml = '';
    scopes.forEach(function (s) {
      listHtml += '<li>' + s + '</li>';
    });
    elements.prevScopeList.innerHTML = listHtml;

    // 自訂特約
    var custom = elements.customTerms.value.trim();
    if (custom) {
      elements.prevCustomTerms.textContent = custom;
      elements.prevCustomTerms.parentElement.style.display = 'block';
    } else {
      elements.prevCustomTerms.parentElement.style.display = 'none';
    }

    // 簽署日期
    var today = new Date();
    var y = today.getFullYear() - 1911;
    var m = today.getMonth() + 1;
    var d = today.getDate();
    elements.prevSignDate.textContent = '中華民國 ' + y + ' 年 ' + m + ' 月 ' + d + ' 日';
  }

  // 儲存草稿至 LocalStorage
  function saveDraft() {
    var data = {
      propertyAddress: elements.propertyAddress.value,
      leaseStartDate: elements.leaseStartDate.value,
      leaseEndDate: elements.leaseEndDate.value,
      monthlyRent: elements.monthlyRent.value,
      landlordName: elements.landlordName.value,
      landlordPhone: elements.landlordPhone.value,
      tenantName: elements.tenantName.value,
      tenantId: elements.tenantId.value,
      tenantPhone: elements.tenantPhone.value,
      tenantAddress: elements.tenantAddress.value,
      guarantorName: elements.guarantorName.value,
      guarantorId: elements.guarantorId.value,
      guarantorPhone: elements.guarantorPhone.value,
      guarantorRelation: elements.guarantorRelation.value,
      guarantorEmployer: elements.guarantorEmployer.value,
      guarantorAddress: elements.guarantorAddress.value,
      guaranteeLimitType: elements.guaranteeLimitType.value,
      guaranteeLimitAmount: elements.guaranteeLimitAmount.value,
      scopeRent: elements.scopeRent.checked,
      scopeUtility: elements.scopeUtility.checked,
      scopePenalty: elements.scopePenalty.checked,
      scopeDamage: elements.scopeDamage.checked,
      scopeUnjust: elements.scopeUnjust.checked,
      scopeLegal: elements.scopeLegal.checked,
      customTerms: elements.customTerms.value
    };

    localStorage.setItem('ganju_guarantor_draft_v1', JSON.stringify(data));
    showToast('💾 連帶保證書資料已成功暫存於本機瀏覽器！');
  }

  // 載入草稿
  function loadDraft() {
    var saved = localStorage.getItem('ganju_guarantor_draft_v1');
    if (!saved) return;
    try {
      var d = JSON.parse(saved);
      if (d.propertyAddress !== undefined) elements.propertyAddress.value = d.propertyAddress;
      if (d.leaseStartDate !== undefined) elements.leaseStartDate.value = d.leaseStartDate;
      if (d.leaseEndDate !== undefined) elements.leaseEndDate.value = d.leaseEndDate;
      if (d.monthlyRent !== undefined) elements.monthlyRent.value = d.monthlyRent;
      if (d.landlordName !== undefined) elements.landlordName.value = d.landlordName;
      if (d.landlordPhone !== undefined) elements.landlordPhone.value = d.landlordPhone;
      if (d.tenantName !== undefined) elements.tenantName.value = d.tenantName;
      if (d.tenantId !== undefined) elements.tenantId.value = d.tenantId;
      if (d.tenantPhone !== undefined) elements.tenantPhone.value = d.tenantPhone;
      if (d.tenantAddress !== undefined) elements.tenantAddress.value = d.tenantAddress;
      if (d.guarantorName !== undefined) elements.guarantorName.value = d.guarantorName;
      if (d.guarantorId !== undefined) elements.guarantorId.value = d.guarantorId;
      if (d.guarantorPhone !== undefined) elements.guarantorPhone.value = d.guarantorPhone;
      if (d.guarantorRelation !== undefined) elements.guarantorRelation.value = d.guarantorRelation;
      if (d.guarantorEmployer !== undefined) elements.guarantorEmployer.value = d.guarantorEmployer;
      if (d.guarantorAddress !== undefined) elements.guarantorAddress.value = d.guarantorAddress;
      if (d.guaranteeLimitType !== undefined) elements.guaranteeLimitType.value = d.guaranteeLimitType;
      if (d.guaranteeLimitAmount !== undefined) elements.guaranteeLimitAmount.value = d.guaranteeLimitAmount;
      if (d.scopeRent !== undefined) elements.scopeRent.checked = d.scopeRent;
      if (d.scopeUtility !== undefined) elements.scopeUtility.checked = d.scopeUtility;
      if (d.scopePenalty !== undefined) elements.scopePenalty.checked = d.scopePenalty;
      if (d.scopeDamage !== undefined) elements.scopeDamage.checked = d.scopeDamage;
      if (d.scopeUnjust !== undefined) elements.scopeUnjust.checked = d.scopeUnjust;
      if (d.scopeLegal !== undefined) elements.scopeLegal.checked = d.scopeLegal;
      if (d.customTerms !== undefined) elements.customTerms.value = d.customTerms;
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }

  // 載入示範範本
  function loadSampleData() {
    elements.propertyAddress.value = '高雄市前鎮區中華五路999號12樓之2';
    elements.leaseStartDate.value = '2026-11-01';
    elements.leaseEndDate.value = '2027-10-31';
    elements.monthlyRent.value = '26000';
    elements.landlordName.value = '港居不動產開發有限公司（受託代管方）';
    elements.landlordPhone.value = '07-791-2288 / 0968-863-880';
    elements.tenantName.value = '陳志遠';
    elements.tenantId.value = 'E124567890';
    elements.tenantPhone.value = '0922-111-222';
    elements.tenantAddress.value = '高雄市三民區博愛一路120號5樓';
    elements.guarantorName.value = '陳建宏';
    elements.guarantorId.value = 'E100223344';
    elements.guarantorPhone.value = '0933-555-666';
    elements.guarantorRelation.value = '父子（同居親屬）';
    elements.guarantorEmployer.value = '中鋼集團・正職工程師（在職滿10年）';
    elements.guarantorAddress.value = '高雄市小港區中安路825號';
    elements.guaranteeLimitType.value = 'capped';
    elements.guaranteeLimitAmount.value = '150000';
    elements.scopeRent.checked = true;
    elements.scopeUtility.checked = true;
    elements.scopePenalty.checked = true;
    elements.scopeDamage.checked = true;
    elements.scopeUnjust.checked = true;
    elements.scopeLegal.checked = true;
    elements.customTerms.value = '保證人同意如承租人逾期繳租達15日，港居不動產得逕行發送簡訊及電話通知保證人協助履行，保證人承諾立即督促或代為清償。';

    renderPreview();
    showToast('✨ 已載入標準合約連帶保證人實例範本！');
  }

  // 清除草稿
  function clearDraft() {
    if (confirm('確定要清空目前輸入的所有連帶保證人資料與畫布簽名嗎？')) {
      localStorage.removeItem('ganju_guarantor_draft_v1');
      sigGuarantor.clear();
      sigTenant.clear();
      document.querySelector('form').reset();
      renderPreview();
      showToast('🗑️ 草稿與簽章已重置清空');
    }
  }

  // 複製 LINE 催繳與擔保協議通知文字
  function copyLineSummary() {
    var gName = elements.guarantorName.value.trim() || '連帶保證人';
    var tName = elements.tenantName.value.trim() || '承租人';
    var addr = elements.propertyAddress.value.trim() || '租賃標的物';
    var limitText = elements.guaranteeLimitType.value === 'capped'
      ? '最高清償上限 NT$ ' + formatMoney(elements.guaranteeLimitAmount.value) + ' 元'
      : '無最高限額完全連帶清償責任';

    var lineMsg =
      '【港居不動產｜住宅租賃連帶保證人合約通知】\n' +
      '──────────────────\n' +
      '📍 租賃地址：' + addr + '\n' +
      '👤 承租人：' + tName + '\n' +
      '🛡️ 連帶保證人：' + gName + '（關係：' + (elements.guarantorRelation.value.trim() || '親屬') + '）\n' +
      '💰 擔保責任：' + limitText + '\n' +
      '⚖️ 法律聲明：已明確同意拋棄《民法》第745條先訴抗辯權，願就租金、水電、修繕損害與違約金負完全連帶清償之責。\n' +
      '──────────────────\n' +
      '📞 港居專員：陳俊銘 經理 0968-863-880\n' +
      '🏢 特許證照：(113)高市租登字第0012號';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lineMsg).then(function () {
        showToast('📋 LINE 擔保協議摘要文字已複製至剪貼簿！');
      }).catch(function () {
        fallbackCopyText(lineMsg);
      });
    } else {
      fallbackCopyText(lineMsg);
    }
  }

  function fallbackCopyText(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('📋 LINE 擔保協議摘要已複製！');
    } catch (e) {
      prompt('請手動複製以下合約文字：', text);
    }
    document.body.removeChild(ta);
  }

  // 繪製並下載 840×1080px 高畫質 PNG 擔保存證圖卡
  function downloadCard() {
    var cv = document.createElement('canvas');
    cv.width = 840;
    cv.height = 1080;
    var ctx = cv.getContext('2d');

    // 底色背景海軍藍微漸層
    var bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    bgGrad.addColorStop(0, '#0F2341');
    bgGrad.addColorStop(1, '#1A365D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 840, 1080);

    // 金色頂部裝飾條
    var goldGrad = ctx.createLinearGradient(0, 0, 840, 0);
    goldGrad.addColorStop(0, '#C5A059');
    goldGrad.addColorStop(0.5, '#E5C07B');
    goldGrad.addColorStop(1, '#B08C45');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, 840, 12);

    // 港居品牌抬頭
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 22px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('港居不動產開發有限公司・官方認證合約憑證', 50, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('租賃住宅連帶保證人保證暨履約切結書', 50, 110);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('依據《民法》第739~745條連帶保證規範｜特許證照：(113)高市租登字第0012號', 50, 140);

    // 白色主卡片區域
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 40, 170, 760, 840, 16);
    ctx.fill();

    // 卡片內文標題
    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 22px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('【擔保責任與法律效力宣告】', 70, 220);

    // 物業與承租人標的表
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, 70, 240, 700, 190, 8);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('租賃標的：' + (elements.propertyAddress.value.trim() || '如租賃契約所載'), 90, 275);
    ctx.fillText('租賃期間：' + (elements.leaseStartDate.value || '2026-11-01') + ' 至 ' + (elements.leaseEndDate.value || '2027-10-31'), 90, 310);
    ctx.fillText('承 租 人：' + (elements.tenantName.value.trim() || '王承租') + '（身分證：' + (elements.tenantId.value.trim() || 'E123456789') + '）', 90, 345);
    ctx.fillText('連帶保證人：' + (elements.guarantorName.value.trim() || '林保證') + '（關係：' + (elements.guarantorRelation.value.trim() || '親屬') + '・電話：' + (elements.guarantorPhone.value.trim() || '0988-765-432') + '）', 90, 380);
    ctx.fillText('任職單位：' + (elements.guarantorEmployer.value.trim() || '未揭露'), 90, 415);

    // 核心法律保障聲明框
    ctx.fillStyle = 'rgba(197, 160, 89, 0.12)';
    roundRect(ctx, 70, 450, 700, 150, 8);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#B08C45';
    ctx.font = 'bold 17px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('⚖️ 連帶清償與放棄先訴抗辯權切結：', 90, 485);

    ctx.fillStyle = '#334155';
    ctx.font = '15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    var l1 = '1. 連帶保證人同意就承租人積欠之租金、水電雜費、違約金及損害賠償負連帶責任。';
    var l2 = '2. 保證人自願明確拋棄民法第745條之先訴抗辯權，不得要求出租人先行強制執行。';
    var l3 = elements.guaranteeLimitType.value === 'capped'
      ? '3. 最高責任限額：新臺幣 ' + toChineseCapital(elements.guaranteeLimitAmount.value) + '（NT$ ' + formatMoney(elements.guaranteeLimitAmount.value) + ' 元）。'
      : '3. 最高責任限額：完全連帶清償責任，不設責任上限。';

    ctx.fillText(l1, 90, 520);
    ctx.fillText(l2, 90, 550);
    ctx.fillText(l3, 90, 580);

    // 雙方簽名區塊
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('連帶保證人親簽：', 90, 640);
    ctx.fillText('承租人確認親簽：', 450, 640);

    // 連帶保證人簽名畫布貼入
    if (sigGuarantor.hasSignature()) {
      var imgG = new Image();
      imgG.src = sigGuarantor.toDataURL();
      ctx.drawImage(imgG, 90, 655, 260, 95);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 16px "PingFang TC", sans-serif';
      ctx.fillText('（以電子手寫板簽署存證）', 90, 700);
    }

    // 承租人簽名畫布貼入
    if (sigTenant.hasSignature()) {
      var imgT = new Image();
      imgT.src = sigTenant.toDataURL();
      ctx.drawImage(imgT, 450, 655, 260, 95);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 16px "PingFang TC", sans-serif';
      ctx.fillText('（以電子手寫板簽署存證）', 450, 700);
    }

    // 底部防偽認證章
    ctx.fillStyle = '#64748B';
    ctx.font = '14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    var signDateStr = elements.prevSignDate.textContent || '中華民國 115 年 10 月 25 日';
    ctx.fillText('簽署日期：' + signDateStr + ' ｜ 港居受託管理專章認證存卷', 90, 800);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('本圖卡經 HTML5 Canvas 數位加密生成，與正式 A4 紙本合約具等同法律佐證力。', 90, 830);

    // 底部浮水印
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px "PingFang TC", sans-serif';
    ctx.fillText('GANJU REAL ESTATE MANAGEMENT CO., LTD. ALL RIGHTS RESERVED.', 220, 970);

    // 下載 PNG 檔案
    var link = document.createElement('a');
    link.download = '港居不動產_連帶保證人切結書_' + (elements.tenantName.value.trim() || '承租人') + '.png';
    link.href = cv.toDataURL('image/png');
    link.click();
    showToast('🖼️ 高畫質 PNG 擔保存證圖卡已成功下載！');
  }

  // 繪製圓角矩形輔助函式
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 簡易 Toast 提示訊息
  function showToast(msg) {
    var existing = document.querySelector('.custom-toast-msg');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'custom-toast-msg';
    toast.textContent = msg;
    toast.style.cssText =
      'position: fixed; bottom: 2rem; right: 2rem; background: #0F2341; color: #FFFFFF;' +
      'border-left: 4px solid #C5A059; padding: 0.85rem 1.5rem; border-radius: 8px;' +
      'box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 999999; font-size: 0.95rem;' +
      'font-weight: 600; display: flex; align-items: center; gap: 0.5rem; animation: slideInUp 0.3s ease;';

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(function () {
        if (toast.parentElement) toast.remove();
      }, 400);
    }, 3000);
  }

  // 監聽所有表單欄位輸入更新
  function initEventListeners() {
    var inputs = document.querySelectorAll(
      '#guarantorForm input, #guarantorForm select, #guarantorForm textarea'
    );
    inputs.forEach(function (el) {
      el.addEventListener('input', renderPreview);
      el.addEventListener('change', renderPreview);
    });

    // 擔保限額類型切換
    if (elements.guaranteeLimitType) {
      elements.guaranteeLimitType.addEventListener('change', function () {
        var isCapped = elements.guaranteeLimitType.value === 'capped';
        var amtGroup = document.getElementById('limitAmountGroup');
        if (amtGroup) {
          amtGroup.style.display = isCapped ? 'block' : 'none';
        }
        renderPreview();
      });
    }

    // 簽名板清空
    if (elements.btnClearGuarantor) {
      elements.btnClearGuarantor.addEventListener('click', function () {
        sigGuarantor.clear();
      });
    }
    if (elements.btnClearTenant) {
      elements.btnClearTenant.addEventListener('click', function () {
        sigTenant.clear();
      });
    }

    // 功能按鈕
    if (elements.btnPrint) {
      elements.btnPrint.addEventListener('click', function () {
        window.print();
      });
    }
    if (elements.btnDownloadCard) {
      elements.btnDownloadCard.addEventListener('click', downloadCard);
    }
    if (elements.btnCopyLine) {
      elements.btnCopyLine.addEventListener('click', copyLineSummary);
    }
    if (elements.btnSaveDraft) {
      elements.btnSaveDraft.addEventListener('click', saveDraft);
    }
    if (elements.btnLoadSample) {
      elements.btnLoadSample.addEventListener('click', loadSampleData);
    }
    if (elements.btnClearDraft) {
      elements.btnClearDraft.addEventListener('click', clearDraft);
    }
  }

  // 初始化執行
  document.addEventListener('DOMContentLoaded', function () {
    loadDraft();
    initEventListeners();
    renderPreview();
  });
})();
