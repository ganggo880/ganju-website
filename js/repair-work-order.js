/**
 * ==========================================================================
 * 港居不動產 - 租賃住宅修繕通報派工與完工驗收證明單核心邏輯
 * repair-work-order.js
 * 依據《民法》第429/430條修繕義務與包租代管請款核銷標準設計
 * ==========================================================================
 */

(function () {
  'use strict';

  // 繁體中文金融大寫金額轉換演算法
  function toChineseCapital(n) {
    if (isNaN(n) || n === null || n === '') return '零元整';
    n = Math.floor(Math.abs(Number(n)));
    if (n === 0) return '零元整';

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

  // DOM 元素快取
  var elements = {
    // 工單基本資料
    workOrderNo: document.getElementById('workOrderNo'),
    reportDate: document.getElementById('reportDate'),
    scheduledDate: document.getElementById('scheduledDate'),
    completedDate: document.getElementById('completedDate'),
    urgencyLevel: document.getElementById('urgencyLevel'),
    repairCategory: document.getElementById('repairCategory'),
    isEmergencyPreauth: document.getElementById('isEmergencyPreauth'),

    // 物業與關係人
    propertyAddress: document.getElementById('propertyAddress'),
    landlordName: document.getElementById('landlordName'),
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),

    // 施工廠商
    contractorName: document.getElementById('contractorName'),
    contractorPhone: document.getElementById('contractorPhone'),
    contractorTaxId: document.getElementById('contractorTaxId'),
    warrantyPeriod: document.getElementById('warrantyPeriod'),

    // 責任歸屬與說明
    costBearer: document.getElementById('costBearer'),
    problemDesc: document.getElementById('problemDesc'),
    actionDesc: document.getElementById('actionDesc'),

    // 工項表格與小計
    itemsContainer: document.getElementById('itemsContainer'),
    btnAddItem: document.getElementById('btnAddItem'),
    totalCostDisplay: document.getElementById('totalCostDisplay'),
    capitalCostDisplay: document.getElementById('capitalCostDisplay'),

    // 照片上傳
    filePhotoBefore: document.getElementById('filePhotoBefore'),
    filePhotoAfter: document.getElementById('filePhotoAfter'),
    previewBeforeWrap: document.getElementById('previewBeforeWrap'),
    previewAfterWrap: document.getElementById('previewAfterWrap'),
    imgBefore: document.getElementById('imgBefore'),
    imgAfter: document.getElementById('imgAfter'),

    // 簽章畫布
    canvasTenant: document.getElementById('canvasTenant'),
    canvasContractor: document.getElementById('canvasContractor'),
    canvasManager: document.getElementById('canvasManager'),
    btnClearTenant: document.getElementById('btnClearTenant'),
    btnClearContractor: document.getElementById('btnClearContractor'),
    btnClearManager: document.getElementById('btnClearManager'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽紙張替換標籤
    prevOrderNo: document.getElementById('prevOrderNo'),
    prevReportDate: document.getElementById('prevReportDate'),
    prevCategoryUrgency: document.getElementById('prevCategoryUrgency'),
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevTenantInfo: document.getElementById('prevTenantInfo'),
    prevLandlordInfo: document.getElementById('prevLandlordInfo'),
    prevContractorInfo: document.getElementById('prevContractorInfo'),
    prevCostBearerBadge: document.getElementById('prevCostBearerBadge'),
    prevProblemDesc: document.getElementById('prevProblemDesc'),
    prevActionDesc: document.getElementById('prevActionDesc'),
    prevItemsTableBody: document.getElementById('prevItemsTableBody'),
    prevTotalAmountText: document.getElementById('prevTotalAmountText'),
    paperImgBefore: document.getElementById('paperImgBefore'),
    paperImgAfter: document.getElementById('paperImgAfter'),
    paperPlaceholderBefore: document.getElementById('paperPlaceholderBefore'),
    paperPlaceholderAfter: document.getElementById('paperPlaceholderAfter'),
    imgSigTenant: document.getElementById('imgSigTenant'),
    imgSigContractor: document.getElementById('imgSigContractor'),
    imgSigManager: document.getElementById('imgSigManager'),
    prevSignDate: document.getElementById('prevSignDate')
  };

  // 三方電子簽章板管理
  var sigTenant = initSignaturePad(elements.canvasTenant);
  var sigContractor = initSignaturePad(elements.canvasContractor);
  var sigManager = initSignaturePad(elements.canvasManager);

  function initSignaturePad(canvas) {
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var isDrawing = false;
    var hasSigned = false;

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var ratio = window.devicePixelRatio || 2;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0F2341';
    }

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

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

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
    function updateSigImg(sigObj, imgEl) {
      if (!imgEl) return;
      var data = sigObj.toDataURL();
      if (data) {
        imgEl.src = data;
        imgEl.style.display = 'block';
        if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
        if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'flex';
      }
    }

    updateSigImg(sigTenant, elements.imgSigTenant);
    updateSigImg(sigContractor, elements.imgSigContractor);
    updateSigImg(sigManager, elements.imgSigManager);
  }

  // 工項明細清單陣列
  var repairItems = [
    { name: '浴室臉盆下水存水彎更換 (防臭金屬防破管)', qty: 1, unitPrice: 1200, note: '材料費含防水膠帶' },
    { name: '冷熱混水龍頭漏水橡膠閥心維修', qty: 1, unitPrice: 800, note: '止水閥老化耗損' },
    { name: '水電技師檢修工資與測試通水費', qty: 1, unitPrice: 1500, note: '施工1.5小時' }
  ];

  // 渲染左側工項輸入列表
  function renderInputItems() {
    if (!elements.itemsContainer) return;
    elements.itemsContainer.innerHTML = '';

    repairItems.forEach(function (item, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="text" class="item-name" value="' + escapeHtml(item.name) + '" placeholder="維修工程項目"></td>' +
        '<td style="width: 70px;"><input type="number" class="item-qty" value="' + item.qty + '" min="1" step="1"></td>' +
        '<td style="width: 100px;"><input type="number" class="item-price" value="' + item.unitPrice + '" min="0" step="50"></td>' +
        '<td style="width: 100px; font-weight: 700; color: var(--primary-dark); text-align: right;" class="item-subtotal">NT$ ' + formatMoney(item.qty * item.unitPrice) + '</td>' +
        '<td><input type="text" class="item-note" value="' + escapeHtml(item.note) + '" placeholder="備註/耗損歸屬"></td>' +
        '<td style="width: 44px; text-align: center;"><button type="button" class="btn-del-item" data-idx="' + idx + '" title="刪除工項"><i class="fa-solid fa-trash-can"></i></button></td>';

      elements.itemsContainer.appendChild(tr);
    });

    // 綁定輸入即時更新
    var inputs = elements.itemsContainer.querySelectorAll('input');
    inputs.forEach(function (inp) {
      inp.addEventListener('input', function () {
        syncItemsFromInputs();
        renderPreview();
      });
    });

    // 綁定刪除按鈕
    var delBtns = elements.itemsContainer.querySelectorAll('.btn-del-item');
    delBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (repairItems.length > 1) {
          repairItems.splice(idx, 1);
          renderInputItems();
          renderPreview();
        } else {
          alert('至少需保留一項修繕項目！');
        }
      });
    });

    calculateTotal();
  }

  function syncItemsFromInputs() {
    var rows = elements.itemsContainer.querySelectorAll('tr');
    repairItems = [];
    rows.forEach(function (row) {
      var name = row.querySelector('.item-name').value;
      var qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      var price = parseFloat(row.querySelector('.item-price').value) || 0;
      var note = row.querySelector('.item-note').value;
      repairItems.push({ name: name, qty: qty, unitPrice: price, note: note });
      row.querySelector('.item-subtotal').textContent = 'NT$ ' + formatMoney(qty * price);
    });
    calculateTotal();
  }

  function calculateTotal() {
    var total = 0;
    repairItems.forEach(function (it) {
      total += (it.qty * it.unitPrice);
    });

    if (elements.totalCostDisplay) {
      elements.totalCostDisplay.textContent = 'NT$ ' + formatMoney(total) + ' 元';
    }
    if (elements.capitalCostDisplay) {
      elements.capitalCostDisplay.textContent = '【大寫：' + toChineseCapital(total) + '】';
    }
    return total;
  }

  // 渲染右側 A4 紙本預覽
  function renderPreview() {
    var total = calculateTotal();

    // 基本資訊
    var orderNo = elements.workOrderNo.value.trim() || 'RO-20261025-01';
    elements.prevOrderNo.textContent = '工單編號：' + orderNo;

    var rDate = elements.reportDate.value || '2026-10-25';
    var cDate = elements.completedDate.value || '2026-10-26';
    elements.prevReportDate.textContent = '通報日期：' + rDate + ' ｜ 完工驗收：' + cDate;

    var catText = elements.repairCategory.options[elements.repairCategory.selectedIndex].text;
    var urgText = elements.urgencyLevel.options[elements.urgencyLevel.selectedIndex].text;
    elements.prevCategoryUrgency.textContent = catText + '（' + urgText + '）';

    // 房屋與關係人
    elements.prevPropertyAddress.textContent = elements.propertyAddress.value.trim() || '高雄市前鎮區中華五路999號12樓之2';
    elements.prevTenantInfo.textContent = (elements.tenantName.value.trim() || '陳志遠') + '（電話：' + (elements.tenantPhone.value.trim() || '0922-111-222') + '）';
    elements.prevLandlordInfo.textContent = elements.landlordName.value.trim() || '港居不動產開發有限公司（受託代管方）';
    elements.prevContractorInfo.textContent =
      (elements.contractorName.value.trim() || '順捷水電工程行') + ' / ' +
      (elements.contractorPhone.value.trim() || '0911-888-999') + '（保固：' +
      (elements.warrantyPeriod.value.trim() || '3個月') + '）';

    // 費用歸屬與緊急代墊
    var bearerText = elements.costBearer.options[elements.costBearer.selectedIndex].text;
    var preauthTag = elements.isEmergencyPreauth.checked ? '【🚨 符合 5,000 元免報備緊急搶修代墊核銷】' : '';
    elements.prevCostBearerBadge.textContent = bearerText + ' ' + preauthTag;

    // 故障與處理
    elements.prevProblemDesc.textContent = elements.problemDesc.value.trim() || '洗手台排水不順並伴隨水管滲漏壁癌隱患。';
    elements.prevActionDesc.textContent = elements.actionDesc.value.trim() || '拆卸舊管、換裝防臭防鏽金屬存水彎，並更換冷熱混水龍頭止水橡膠閥心，通水測試防漏合格。';

    // 預覽工項表格
    if (elements.prevItemsTableBody) {
      elements.prevItemsTableBody.innerHTML = '';
      repairItems.forEach(function (it, i) {
        var tr = document.createElement('tr');
        var sub = it.qty * it.unitPrice;
        tr.innerHTML =
          '<td>' + (i + 1) + '. ' + escapeHtml(it.name) + '</td>' +
          '<td style="text-align: center;">' + it.qty + '</td>' +
          '<td class="text-right">$' + formatMoney(it.unitPrice) + '</td>' +
          '<td class="text-right" style="font-weight: 700;">$' + formatMoney(sub) + '</td>' +
          '<td>' + escapeHtml(it.note || '-') + '</td>';
        elements.prevItemsTableBody.appendChild(tr);
      });
    }

    if (elements.prevTotalAmountText) {
      elements.prevTotalAmountText.innerHTML =
        '總計金額：<strong style="color: #1a365d; font-size: 1.15rem;">新臺幣 ' + toChineseCapital(total) +
        '（NT$ ' + formatMoney(total) + ' 元整）</strong>';
    }

    // 簽署日期
    var today = new Date();
    var y = today.getFullYear() - 1911;
    var m = today.getMonth() + 1;
    var d = today.getDate();
    elements.prevSignDate.textContent = '驗收結案日期：中華民國 ' + y + ' 年 ' + m + ' 月 ' + d + ' 日';
  }

  // 施工前後照片預覽處理
  function handlePhotoUpload(inputEl, previewWrap, imgEl, paperImgEl, placeholderEl) {
    if (!inputEl) return;
    inputEl.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (event) {
        var dataUrl = event.target.result;
        imgEl.src = dataUrl;
        previewWrap.style.display = 'block';

        if (paperImgEl) {
          paperImgEl.src = dataUrl;
          paperImgEl.style.display = 'block';
        }
        if (placeholderEl) {
          placeholderEl.style.display = 'none';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 儲存草稿
  function saveDraft() {
    var data = {
      workOrderNo: elements.workOrderNo.value,
      reportDate: elements.reportDate.value,
      scheduledDate: elements.scheduledDate.value,
      completedDate: elements.completedDate.value,
      urgencyLevel: elements.urgencyLevel.value,
      repairCategory: elements.repairCategory.value,
      isEmergencyPreauth: elements.isEmergencyPreauth.checked,
      propertyAddress: elements.propertyAddress.value,
      landlordName: elements.landlordName.value,
      tenantName: elements.tenantName.value,
      tenantPhone: elements.tenantPhone.value,
      contractorName: elements.contractorName.value,
      contractorPhone: elements.contractorPhone.value,
      contractorTaxId: elements.contractorTaxId.value,
      warrantyPeriod: elements.warrantyPeriod.value,
      costBearer: elements.costBearer.value,
      problemDesc: elements.problemDesc.value,
      actionDesc: elements.actionDesc.value,
      repairItems: repairItems
    };

    localStorage.setItem('ganju_repair_workorder_draft_v1', JSON.stringify(data));
    showToast('💾 修繕工單資料已成功暫存於本機！');
  }

  // 載入草稿
  function loadDraft() {
    var saved = localStorage.getItem('ganju_repair_workorder_draft_v1');
    if (!saved) return;
    try {
      var d = JSON.parse(saved);
      if (d.workOrderNo !== undefined) elements.workOrderNo.value = d.workOrderNo;
      if (d.reportDate !== undefined) elements.reportDate.value = d.reportDate;
      if (d.scheduledDate !== undefined) elements.scheduledDate.value = d.scheduledDate;
      if (d.completedDate !== undefined) elements.completedDate.value = d.completedDate;
      if (d.urgencyLevel !== undefined) elements.urgencyLevel.value = d.urgencyLevel;
      if (d.repairCategory !== undefined) elements.repairCategory.value = d.repairCategory;
      if (d.isEmergencyPreauth !== undefined) elements.isEmergencyPreauth.checked = d.isEmergencyPreauth;
      if (d.propertyAddress !== undefined) elements.propertyAddress.value = d.propertyAddress;
      if (d.landlordName !== undefined) elements.landlordName.value = d.landlordName;
      if (d.tenantName !== undefined) elements.tenantName.value = d.tenantName;
      if (d.tenantPhone !== undefined) elements.tenantPhone.value = d.tenantPhone;
      if (d.contractorName !== undefined) elements.contractorName.value = d.contractorName;
      if (d.contractorPhone !== undefined) elements.contractorPhone.value = d.contractorPhone;
      if (d.contractorTaxId !== undefined) elements.contractorTaxId.value = d.contractorTaxId;
      if (d.warrantyPeriod !== undefined) elements.warrantyPeriod.value = d.warrantyPeriod;
      if (d.costBearer !== undefined) elements.costBearer.value = d.costBearer;
      if (d.problemDesc !== undefined) elements.problemDesc.value = d.problemDesc;
      if (d.actionDesc !== undefined) elements.actionDesc.value = d.actionDesc;
      if (d.repairItems && Array.isArray(d.repairItems) && d.repairItems.length > 0) {
        repairItems = d.repairItems;
      }
    } catch (e) {
      console.error('Failed to parse draft:', e);
    }
  }

  // 載入示範範本
  function loadSampleData() {
    elements.workOrderNo.value = 'RO-20261025-01';
    elements.reportDate.value = '2026-10-25';
    elements.scheduledDate.value = '2026-10-26';
    elements.completedDate.value = '2026-10-26';
    elements.urgencyLevel.value = 'urgent';
    elements.repairCategory.value = 'plumbing';
    elements.isEmergencyPreauth.checked = true;
    elements.propertyAddress.value = '高雄市前鎮區中華五路999號12樓之2';
    elements.landlordName.value = '港居不動產開發有限公司（受託代管方）';
    elements.tenantName.value = '陳志遠';
    elements.tenantPhone.value = '0922-111-222';
    elements.contractorName.value = '順捷水電工程行';
    elements.contractorPhone.value = '0911-888-999';
    elements.contractorTaxId.value = '82345678';
    elements.warrantyPeriod.value = '3個月（施工責任保固）';
    elements.costBearer.value = 'landlord';
    elements.problemDesc.value = '房客反映主臥衛浴面盆排水管漏水滲至地面，伴隨輕微滴漏水聲，疑似下水金屬軟管鏽蝕破損。';
    elements.actionDesc.value = '技師進場拆卸舊鏽蝕存水彎，換裝防臭加厚型金屬下水管並更新橡膠迫緊密封圈；重新測試盛水排水5次無洩漏，功能恢復正常。';

    repairItems = [
      { name: '浴室臉盆下水存水彎全套更換 (防臭金屬防破管)', qty: 1, unitPrice: 1200, note: '材料費含防水膠帶' },
      { name: '冷熱混水龍頭漏水橡膠閥心維修更換', qty: 1, unitPrice: 800, note: '止水閥自然老化耗損' },
      { name: '專業水電技師進場檢修與通水測試工資', qty: 1, unitPrice: 1500, note: '施工1.5小時' }
    ];

    renderInputItems();
    renderPreview();
    showToast('✨ 已載入標準衛浴修繕派工與驗收實例範本！');
  }

  // 清空草稿
  function clearDraft() {
    if (confirm('確定要清空目前工單的所有輸入資料與簽章嗎？')) {
      localStorage.removeItem('ganju_repair_workorder_draft_v1');
      sigTenant.clear();
      sigContractor.clear();
      sigManager.clear();
      document.querySelector('form').reset();
      repairItems = [{ name: '新修繕工項', qty: 1, unitPrice: 1000, note: '' }];
      renderInputItems();
      renderPreview();
      showToast('🗑️ 工單已重置清空');
    }
  }

  // 複製 LINE 派工與驗收通知
  function copyLineSummary() {
    var orderNo = elements.workOrderNo.value.trim() || 'RO-20261025-01';
    var addr = elements.propertyAddress.value.trim() || '租賃標的物';
    var tName = elements.tenantName.value.trim() || '承租人';
    var cName = elements.contractorName.value.trim() || '施工廠商';
    var total = calculateTotal();
    var bearerText = elements.costBearer.options[elements.costBearer.selectedIndex].text;
    var preauth = elements.isEmergencyPreauth.checked ? '（🚨 符合5000元免報備緊急搶修代墊）' : '';

    var lineMsg =
      '【港居不動產｜修繕派工與完工驗收通報單】\n' +
      '──────────────────\n' +
      '📋 工單編號：' + orderNo + '\n' +
      '📍 物業地址：' + addr + '\n' +
      '👤 承租人：' + tName + '（' + (elements.tenantPhone.value.trim() || '') + '）\n' +
      '🔧 施工廠商：' + cName + '（' + (elements.contractorPhone.value.trim() || '') + '）\n' +
      '🛠️ 修繕項目：' + (elements.problemDesc.value.trim() || '如工單所載') + '\n' +
      '💰 完工金額：NT$ ' + formatMoney(total) + ' 元整（' + toChineseCapital(total) + '）\n' +
      '⚖️ 費用歸屬：' + bearerText + preauth + '\n' +
      '🛡️ 施工保固：' + (elements.warrantyPeriod.value.trim() || '3個月') + '\n' +
      '✅ 驗收狀態：承租人與物業專員已簽認驗收合格\n' +
      '──────────────────\n' +
      '📞 港居專員：陳俊銘 經理 0968-863-880\n' +
      '🏢 特許證照：(113)高市租登字第0012號';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lineMsg).then(function () {
        showToast('📋 LINE 派工與驗收通報文字已複製至剪貼簿！');
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
      showToast('📋 LINE 通報摘要已複製！');
    } catch (e) {
      prompt('請手動複製以下工單文字：', text);
    }
    document.body.removeChild(ta);
  }

  // 繪製並下載 840×1080px 高畫質 PNG 驗收存證圖卡
  function downloadCard() {
    var cv = document.createElement('canvas');
    cv.width = 840;
    cv.height = 1080;
    var ctx = cv.getContext('2d');

    // 底色海軍藍
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

    // 抬頭品牌
    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 22px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('港居不動產開發有限公司・物業修繕請款驗收憑證', 50, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('租賃住宅修繕通報派工與完工驗收證明單', 50, 108);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('依據民法第429/430條修繕義務｜特許證照：(113)高市租登字第0012號', 50, 138);

    // 白色主卡片
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 40, 165, 760, 855, 14);
    ctx.fill();

    // 工單抬頭資訊
    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 20px "PingFang TC", "Microsoft JhengHei", sans-serif';
    var orderNo = elements.workOrderNo.value.trim() || 'RO-20261025-01';
    ctx.fillText('【工單編號：' + orderNo + ' ｜ 完工驗收核銷憑證】', 65, 210);

    // 基本資料區塊
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, 65, 230, 710, 165, 8);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('物業標的：' + (elements.propertyAddress.value.trim() || '如工單所載'), 85, 260);
    ctx.fillText('承 租 人：' + (elements.tenantName.value.trim() || '陳志遠') + '（電話：' + (elements.tenantPhone.value.trim() || '0922-111-222') + '）', 85, 290);
    ctx.fillText('施工廠商：' + (elements.contractorName.value.trim() || '順捷水電工程行') + ' / ' + (elements.contractorPhone.value.trim() || '0911-888-999'), 85, 320);
    ctx.fillText('修繕類別：' + elements.repairCategory.options[elements.repairCategory.selectedIndex].text + ' ｜ 保固：' + (elements.warrantyPeriod.value.trim() || '3個月'), 85, 350);
    ctx.fillText('費用負擔：' + elements.costBearer.options[elements.costBearer.selectedIndex].text + (elements.isEmergencyPreauth.checked ? ' (符合5,000元緊急代墊)' : ''), 85, 380);

    // 故障與處理
    ctx.fillStyle = '#0F2341';
    ctx.font = 'bold 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('修繕原因與處理結果：', 65, 425);

    ctx.fillStyle = '#334155';
    ctx.font = '14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    var pDesc = '狀況：' + (elements.problemDesc.value.trim() || '無');
    var aDesc = '處置：' + (elements.actionDesc.value.trim() || '無');
    ctx.fillText(pDesc.length > 45 ? pDesc.substring(0, 45) + '...' : pDesc, 65, 455);
    ctx.fillText(aDesc.length > 45 ? aDesc.substring(0, 45) + '...' : aDesc, 65, 480);

    // 金額彙總
    var total = calculateTotal();
    ctx.fillStyle = 'rgba(197, 160, 89, 0.15)';
    roundRect(ctx, 65, 510, 710, 70, 8);
    ctx.fill();
    ctx.strokeStyle = '#C5A059';
    ctx.stroke();

    ctx.fillStyle = '#B08C45';
    ctx.font = 'bold 16px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('工程結案請款總金額：', 85, 550);

    ctx.fillStyle = '#1A365D';
    ctx.font = 'bold 20px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('新臺幣 ' + toChineseCapital(total) + '（NT$ ' + formatMoney(total) + ' 元）', 270, 550);

    // 三方簽章欄位
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 15px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('承租人驗收簽認：', 65, 620);
    ctx.fillText('施工廠商完工簽認：', 315, 620);
    ctx.fillText('港居物業專員結案：', 565, 620);

    // 承租人簽名
    if (sigTenant.hasSignature()) {
      var imgT = new Image();
      imgT.src = sigTenant.toDataURL();
      ctx.drawImage(imgT, 65, 635, 210, 85);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 14px "PingFang TC", sans-serif';
      ctx.fillText('（以手寫板簽署）', 65, 675);
    }

    // 施工廠商簽名
    if (sigContractor.hasSignature()) {
      var imgC = new Image();
      imgC.src = sigContractor.toDataURL();
      ctx.drawImage(imgC, 315, 635, 210, 85);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 14px "PingFang TC", sans-serif';
      ctx.fillText('（以手寫板簽署）', 315, 675);
    }

    // 港居專員簽名
    if (sigManager.hasSignature()) {
      var imgM = new Image();
      imgM.src = sigManager.toDataURL();
      ctx.drawImage(imgM, 565, 635, 210, 85);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 14px "PingFang TC", sans-serif';
      ctx.fillText('（以手寫板簽署）', 565, 675);
    }

    // 底部文字
    ctx.fillStyle = '#64748B';
    ctx.font = '14px "PingFang TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('本單據經三方簽章生效，可作為屋主代管月結扣抵或租客退租點交修繕求償之合法會計佐證憑證。', 65, 780);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
    var signDateStr = elements.prevSignDate.textContent || '中華民國 115 年 10 月 25 日';
    ctx.fillText(signDateStr + ' ｜ 港居不動產物業維運中心存檔', 65, 810);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px "PingFang TC", sans-serif';
    ctx.fillText('GANJU REAL ESTATE MANAGEMENT CO., LTD. ALL RIGHTS RESERVED.', 220, 970);

    // 下載 PNG
    var link = document.createElement('a');
    link.download = '港居不動產_修繕派工與驗收單_' + orderNo + '.png';
    link.href = cv.toDataURL('image/png');
    link.click();
    showToast('🖼️ 高畫質 PNG 驗收存證圖卡已成功下載！');
  }

  // 輔助函式
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
      '#workOrderForm input, #workOrderForm select, #workOrderForm textarea'
    );
    inputs.forEach(function (el) {
      el.addEventListener('input', renderPreview);
      el.addEventListener('change', renderPreview);
    });

    // 新增工項按鈕
    if (elements.btnAddItem) {
      elements.btnAddItem.addEventListener('click', function () {
        repairItems.push({ name: '新增工程材料工項', qty: 1, unitPrice: 500, note: '' });
        renderInputItems();
        renderPreview();
      });
    }

    // 施工前後照片
    handlePhotoUpload(elements.filePhotoBefore, elements.previewBeforeWrap, elements.imgBefore, elements.paperImgBefore, elements.paperPlaceholderBefore);
    handlePhotoUpload(elements.filePhotoAfter, elements.previewAfterWrap, elements.imgAfter, elements.paperImgAfter, elements.paperPlaceholderAfter);

    // 清空簽章按鈕
    if (elements.btnClearTenant) {
      elements.btnClearTenant.addEventListener('click', function () {
        sigTenant.clear();
      });
    }
    if (elements.btnClearContractor) {
      elements.btnClearContractor.addEventListener('click', function () {
        sigContractor.clear();
      });
    }
    if (elements.btnClearManager) {
      elements.btnClearManager.addEventListener('click', function () {
        sigManager.clear();
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
    renderInputItems();
    initEventListeners();
    renderPreview();
  });
})();
