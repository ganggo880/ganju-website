/**
 * 港居不動產 - 租賃住宅現場看屋鑰匙借出保管與返還簽收切結產生器 (key-custody-agreement.js)
 * 遵循《民法》第 432 條善良管理人義務與第 184 條侵權損害賠償
 * 支援三簽章畫布（借用人、發放經辦、歸還驗收）、雙階段點收、A4 列印、Canvas 圖卡與 LINE 存證
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

  // 取得現在時間之 datetime-local 格式
  function getNowDateTimeLocal(offsetHours) {
    var d = new Date();
    if (offsetHours) {
      d.setHours(d.getHours() + offsetHours);
    }
    var pad = function (num) { return (num < 10 ? '0' : '') + num; };
    var year = d.getFullYear();
    var month = pad(d.getMonth() + 1);
    var day = pad(d.getDate());
    var hours = pad(d.getHours());
    var minutes = pad(d.getMinutes());
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  function formatDisplayDateTime(dtStr) {
    if (!dtStr) return '—';
    var d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    var pad = function (num) { return (num < 10 ? '0' : '') + num; };
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // DOM 元素快取
  var elements = {
    // 借調基本資訊
    custodyNo: document.getElementById('custodyNo'),
    borrowPurpose: document.getElementById('borrowPurpose'),
    propertyAddress: document.getElementById('propertyAddress'),
    propertyUnit: document.getElementById('propertyUnit'),

    // 借用人身分資料
    borrowerName: document.getElementById('borrowerName'),
    borrowerPhone: document.getElementById('borrowerPhone'),
    borrowerIdCard: document.getElementById('borrowerIdCard'),
    borrowerCompany: document.getElementById('borrowerCompany'),
    borrowerLicense: document.getElementById('borrowerLicense'),

    // 借調時程與擔保
    borrowTime: document.getElementById('borrowTime'),
    expectedReturnTime: document.getElementById('expectedReturnTime'),
    securityType: document.getElementById('securityType'),
    securityAmount: document.getElementById('securityAmount'),
    securityIdDoc: document.getElementById('securityIdDoc'),
    capitalAmountDisplay: document.getElementById('capitalAmountDisplay'),
    numberAmountDisplay: document.getElementById('numberAmountDisplay'),

    // 借出品項核選與數量
    chkMainKey: document.getElementById('chkMainKey'),
    qtyMainKey: document.getElementById('qtyMainKey'),
    chkRoomKey: document.getElementById('chkRoomKey'),
    qtyRoomKey: document.getElementById('qtyRoomKey'),
    chkElevatorTag: document.getElementById('chkElevatorTag'),
    qtyElevatorTag: document.getElementById('qtyElevatorTag'),
    chkGarageRemote: document.getElementById('chkGarageRemote'),
    qtyGarageRemote: document.getElementById('qtyGarageRemote'),
    chkMailboxKey: document.getElementById('chkMailboxKey'),
    qtyMailboxKey: document.getElementById('qtyMailboxKey'),
    chkTrashTag: document.getElementById('chkTrashTag'),
    qtyTrashTag: document.getElementById('qtyTrashTag'),
    chkPasscode: document.getElementById('chkPasscode'),
    txtPasscode: document.getElementById('txtPasscode'),
    chkOther: document.getElementById('chkOther'),
    txtOther: document.getElementById('txtOther'),

    // 階段二：返還驗收
    returnStatus: document.getElementById('returnStatus'),
    actualReturnTime: document.getElementById('actualReturnTime'),
    depositRefundStatus: document.getElementById('depositRefundStatus'),

    // 簽章畫布
    canvasBorrower: document.getElementById('canvasBorrower'),
    canvasIssuer: document.getElementById('canvasIssuer'),
    canvasInspector: document.getElementById('canvasInspector'),
    btnClearBorrower: document.getElementById('btnClearBorrower'),
    btnClearIssuer: document.getElementById('btnClearIssuer'),
    btnClearInspector: document.getElementById('btnClearInspector'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽紙張元素
    prevCustodyNo: document.getElementById('prevCustodyNo'),
    prevPurposeBadge: document.getElementById('prevPurposeBadge'),
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevBorrowerInfo: document.getElementById('prevBorrowerInfo'),
    prevScheduleInfo: document.getElementById('prevScheduleInfo'),
    prevSecurityInfo: document.getElementById('prevSecurityInfo'),
    prevItemsContainer: document.getElementById('prevItemsContainer'),
    prevReturnStatus: document.getElementById('prevReturnStatus'),
    prevActualReturnTime: document.getElementById('prevActualReturnTime'),
    prevRefundStatus: document.getElementById('prevRefundStatus')
  };

  // 手寫簽章板封裝類別
  function SignaturePad(canvas, onEndStroke) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.isEmpty = true;
    this.onEndStroke = onEndStroke || function () {};

    this.init();
  }

  SignaturePad.prototype.init = function () {
    var self = this;
    var rect = this.canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;

    // Retina 2x 高解析縮放
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.ctx.lineWidth = 2.2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#1a365d';

    var getPos = function (e) {
      var r = self.canvas.getBoundingClientRect();
      var clientX = e.clientX;
      var clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      return {
        x: clientX - r.left,
        y: clientY - r.top
      };
    };

    var startDraw = function (e) {
      if (e.type === 'touchstart') e.preventDefault();
      self.isDrawing = true;
      self.isEmpty = false;
      var pos = getPos(e);
      self.ctx.beginPath();
      self.ctx.moveTo(pos.x, pos.y);
    };

    var draw = function (e) {
      if (!self.isDrawing) return;
      if (e.type === 'touchmove') e.preventDefault();
      var pos = getPos(e);
      self.ctx.lineTo(pos.x, pos.y);
      self.ctx.stroke();
    };

    var endDraw = function (e) {
      if (!self.isDrawing) return;
      self.isDrawing = false;
      self.ctx.closePath();
      self.onEndStroke();
    };

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', endDraw);

    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    this.canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', endDraw);
  };

  SignaturePad.prototype.clear = function () {
    var dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.isEmpty = true;
    this.onEndStroke();
  };

  SignaturePad.prototype.toDataURL = function () {
    if (this.isEmpty) return null;
    return this.canvas.toDataURL('image/png');
  };

  SignaturePad.prototype.fromDataURL = function (dataUrl) {
    if (!dataUrl) return;
    var self = this;
    var img = new Image();
    img.onload = function () {
      var dpr = window.devicePixelRatio || 1;
      self.ctx.drawImage(img, 0, 0, self.canvas.width / dpr, self.canvas.height / dpr);
      self.isEmpty = false;
      self.onEndStroke();
    };
    img.src = dataUrl;
  };

  // 初始化簽名板實例
  var padBorrower, padIssuer, padInspector;

  function updateSignaturesPreview() {
    var imgBorrower = document.getElementById('prevSignBorrower');
    var imgIssuer = document.getElementById('prevSignIssuer');
    var imgInspector = document.getElementById('prevSignInspector');

    if (imgBorrower) {
      var bUrl = padBorrower ? padBorrower.toDataURL() : null;
      imgBorrower.src = bUrl || '';
      imgBorrower.style.display = bUrl ? 'block' : 'none';
    }

    if (imgIssuer) {
      var iUrl = padIssuer ? padIssuer.toDataURL() : null;
      imgIssuer.src = iUrl || '';
      imgIssuer.style.display = iUrl ? 'block' : 'none';
    }

    if (imgInspector) {
      var insUrl = padInspector ? padInspector.toDataURL() : null;
      imgInspector.src = insUrl || '';
      imgInspector.style.display = insUrl ? 'block' : 'none';
    }
  }

  // 取得品項統計與清單 HTML
  function getSelectedItemsSummary() {
    var items = [];
    if (elements.chkMainKey.checked) {
      items.push({ name: '專用大門鑰匙', qty: parseInt(elements.qtyMainKey.value) || 1, unit: '支', checked: true });
    }
    if (elements.chkRoomKey.checked) {
      items.push({ name: '室內房門鑰匙', qty: parseInt(elements.qtyRoomKey.value) || 1, unit: '支', checked: true });
    }
    if (elements.chkElevatorTag.checked) {
      items.push({ name: '社區大門/電梯感應磁扣', qty: parseInt(elements.qtyElevatorTag.value) || 1, unit: '枚', checked: true });
    }
    if (elements.chkGarageRemote.checked) {
      items.push({ name: '地下室車庫鐵捲門遙控器', qty: parseInt(elements.qtyGarageRemote.value) || 1, unit: '個', checked: true });
    }
    if (elements.chkMailboxKey.checked) {
      items.push({ name: '專用信箱鑰匙', qty: parseInt(elements.qtyMailboxKey.value) || 1, unit: '支', checked: true });
    }
    if (elements.chkTrashTag.checked) {
      items.push({ name: '環保室/垃圾感應磁扣', qty: parseInt(elements.qtyTrashTag.value) || 1, unit: '枚', checked: true });
    }
    if (elements.chkPasscode.checked) {
      var codeVal = elements.txtPasscode.value.trim() || '現場指定';
      items.push({ name: '電子門鎖臨時密碼 (' + codeVal + ')', qty: 1, unit: '組', checked: true });
    }
    if (elements.chkOther.checked) {
      var otherVal = elements.txtOther.value.trim() || '其他配件';
      items.push({ name: otherVal, qty: 1, unit: '項', checked: true });
    }
    return items;
  }

  // 同步表單資料至即時 A4 預覽紙張
  function syncFormToPreview() {
    // 單號
    if (elements.prevCustodyNo) {
      elements.prevCustodyNo.textContent = elements.custodyNo.value || 'KC-20261025-01';
    }

    // 類別標籤
    if (elements.prevPurposeBadge) {
      var purposeText = elements.borrowPurpose.options[elements.borrowPurpose.selectedIndex].text;
      elements.prevPurposeBadge.textContent = purposeText;
    }

    // 標的物
    if (elements.prevPropertyAddress) {
      var addr = elements.propertyAddress.value || '未填寫標的物地址';
      var unit = elements.propertyUnit.value ? ' (' + elements.propertyUnit.value + ')' : '';
      elements.prevPropertyAddress.textContent = addr + unit;
    }

    // 借用人
    if (elements.prevBorrowerInfo) {
      var bName = elements.borrowerName.value || '未填寫姓名';
      var bPhone = elements.borrowerPhone.value || '未填寫電話';
      var bId = elements.borrowerIdCard.value ? ' / 身分證字號：' + elements.borrowerIdCard.value : '';
      var bComp = elements.borrowerCompany.value ? ' / 公司：' + elements.borrowerCompany.value : '';
      var bLic = elements.borrowerLicense.value ? ' (' + elements.borrowerLicense.value + ')' : '';
      elements.prevBorrowerInfo.innerHTML = '<strong>' + escapeHtml(bName) + '</strong> (' + escapeHtml(bPhone) + ')' +
        escapeHtml(bId + bComp + bLic);
    }

    // 時程
    if (elements.prevScheduleInfo) {
      var tBorrow = formatDisplayDateTime(elements.borrowTime.value);
      var tReturn = formatDisplayDateTime(elements.expectedReturnTime.value);
      elements.prevScheduleInfo.innerHTML = '借出時間：<strong>' + escapeHtml(tBorrow) + '</strong> ｜ 約定返還時間：<strong style="color: #c53030;">' + escapeHtml(tReturn) + '</strong>';
    }

    // 擔保
    var sType = elements.securityType.value;
    var sAmount = parseFloat(elements.securityAmount.value) || 0;
    var sIdDoc = elements.securityIdDoc.value || '營業員識別證正本';
    var securityDesc = '';

    if (sType === 'deposit') {
      securityDesc = '保管押金 NT$ ' + formatMoney(sAmount) + ' 元整 (' + toChineseCapital(sAmount) + ')';
    } else if (sType === 'id_card') {
      securityDesc = '暫押證件：' + sIdDoc;
    } else if (sType === 'deposit_and_id') {
      securityDesc = '押金 NT$ ' + formatMoney(sAmount) + ' 元整 ＋ 暫押證件 (' + sIdDoc + ')';
    } else {
      securityDesc = '公司信任免押金借調';
    }

    if (elements.prevSecurityInfo) {
      elements.prevSecurityInfo.textContent = securityDesc;
    }

    // 擔保展示條
    if (elements.capitalAmountDisplay) {
      elements.capitalAmountDisplay.textContent = toChineseCapital(sAmount);
    }
    if (elements.numberAmountDisplay) {
      elements.numberAmountDisplay.textContent = 'NT$ ' + formatMoney(sAmount);
    }

    // 物品清單
    var items = getSelectedItemsSummary();
    if (elements.prevItemsContainer) {
      if (items.length === 0) {
        elements.prevItemsContainer.innerHTML = '<div style="color: #a0aec0; font-style: italic;">尚未勾選任何借出品項</div>';
      } else {
        var html = '<div class="paper-items-grid">';
        items.forEach(function (it) {
          html += '<div class="paper-item-entry checked">' +
            '<i class="fa-solid fa-key"></i> ' +
            '<span>' + escapeHtml(it.name) + '：<strong>' + it.qty + '</strong> ' + it.unit + '</span>' +
            '</div>';
        });
        html += '</div>';
        elements.prevItemsContainer.innerHTML = html;
      }
    }

    // 階段二驗收資訊
    if (elements.prevReturnStatus) {
      var rStatusText = elements.returnStatus.options[elements.returnStatus.selectedIndex].text;
      elements.prevReturnStatus.textContent = rStatusText;
    }
    if (elements.prevActualReturnTime) {
      elements.prevActualReturnTime.textContent = formatDisplayDateTime(elements.actualReturnTime.value);
    }
    if (elements.prevRefundStatus) {
      var refText = elements.depositRefundStatus.options[elements.depositRefundStatus.selectedIndex].text;
      elements.prevRefundStatus.textContent = refText;
    }

    updateSignaturesPreview();
  }

  // 儲存草稿至 LocalStorage
  function saveDraft() {
    var data = {
      custodyNo: elements.custodyNo.value,
      borrowPurpose: elements.borrowPurpose.value,
      propertyAddress: elements.propertyAddress.value,
      propertyUnit: elements.propertyUnit.value,
      borrowerName: elements.borrowerName.value,
      borrowerPhone: elements.borrowerPhone.value,
      borrowerIdCard: elements.borrowerIdCard.value,
      borrowerCompany: elements.borrowerCompany.value,
      borrowerLicense: elements.borrowerLicense.value,
      borrowTime: elements.borrowTime.value,
      expectedReturnTime: elements.expectedReturnTime.value,
      securityType: elements.securityType.value,
      securityAmount: elements.securityAmount.value,
      securityIdDoc: elements.securityIdDoc.value,
      chkMainKey: elements.chkMainKey.checked,
      qtyMainKey: elements.qtyMainKey.value,
      chkRoomKey: elements.chkRoomKey.checked,
      qtyRoomKey: elements.qtyRoomKey.value,
      chkElevatorTag: elements.chkElevatorTag.checked,
      qtyElevatorTag: elements.qtyElevatorTag.value,
      chkGarageRemote: elements.chkGarageRemote.checked,
      qtyGarageRemote: elements.qtyGarageRemote.value,
      chkMailboxKey: elements.chkMailboxKey.checked,
      qtyMailboxKey: elements.qtyMailboxKey.value,
      chkTrashTag: elements.chkTrashTag.checked,
      qtyTrashTag: elements.qtyTrashTag.value,
      chkPasscode: elements.chkPasscode.checked,
      txtPasscode: elements.txtPasscode.value,
      chkOther: elements.chkOther.checked,
      txtOther: elements.txtOther.value,
      returnStatus: elements.returnStatus.value,
      actualReturnTime: elements.actualReturnTime.value,
      depositRefundStatus: elements.depositRefundStatus.value,
      sigBorrower: padBorrower ? padBorrower.toDataURL() : null,
      sigIssuer: padIssuer ? padIssuer.toDataURL() : null,
      sigInspector: padInspector ? padInspector.toDataURL() : null,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem('ganju_key_custody_draft_v1', JSON.stringify(data));
      showToast('草稿已成功儲存至本機瀏覽器', 'success');
    } catch (e) {
      showToast('儲存草稿失敗：容量已滿或存取受限', 'error');
    }
  }

  // 讀取本機草稿
  function loadDraft() {
    var raw = localStorage.getItem('ganju_key_custody_draft_v1');
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (data.custodyNo) elements.custodyNo.value = data.custodyNo;
      if (data.borrowPurpose) elements.borrowPurpose.value = data.borrowPurpose;
      if (data.propertyAddress) elements.propertyAddress.value = data.propertyAddress;
      if (data.propertyUnit) elements.propertyUnit.value = data.propertyUnit;
      if (data.borrowerName) elements.borrowerName.value = data.borrowerName;
      if (data.borrowerPhone) elements.borrowerPhone.value = data.borrowerPhone;
      if (data.borrowerIdCard) elements.borrowerIdCard.value = data.borrowerIdCard;
      if (data.borrowerCompany) elements.borrowerCompany.value = data.borrowerCompany;
      if (data.borrowerLicense) elements.borrowerLicense.value = data.borrowerLicense;
      if (data.borrowTime) elements.borrowTime.value = data.borrowTime;
      if (data.expectedReturnTime) elements.expectedReturnTime.value = data.expectedReturnTime;
      if (data.securityType) elements.securityType.value = data.securityType;
      if (data.securityAmount !== undefined) elements.securityAmount.value = data.securityAmount;
      if (data.securityIdDoc) elements.securityIdDoc.value = data.securityIdDoc;

      if (data.chkMainKey !== undefined) elements.chkMainKey.checked = data.chkMainKey;
      if (data.qtyMainKey) elements.qtyMainKey.value = data.qtyMainKey;
      if (data.chkRoomKey !== undefined) elements.chkRoomKey.checked = data.chkRoomKey;
      if (data.qtyRoomKey) elements.qtyRoomKey.value = data.qtyRoomKey;
      if (data.chkElevatorTag !== undefined) elements.chkElevatorTag.checked = data.chkElevatorTag;
      if (data.qtyElevatorTag) elements.qtyElevatorTag.value = data.qtyElevatorTag;
      if (data.chkGarageRemote !== undefined) elements.chkGarageRemote.checked = data.chkGarageRemote;
      if (data.qtyGarageRemote) elements.qtyGarageRemote.value = data.qtyGarageRemote;
      if (data.chkMailboxKey !== undefined) elements.chkMailboxKey.checked = data.chkMailboxKey;
      if (data.qtyMailboxKey) elements.qtyMailboxKey.value = data.qtyMailboxKey;
      if (data.chkTrashTag !== undefined) elements.chkTrashTag.checked = data.chkTrashTag;
      if (data.qtyTrashTag) elements.qtyTrashTag.value = data.qtyTrashTag;
      if (data.chkPasscode !== undefined) elements.chkPasscode.checked = data.chkPasscode;
      if (data.txtPasscode) elements.txtPasscode.value = data.txtPasscode;
      if (data.chkOther !== undefined) elements.chkOther.checked = data.chkOther;
      if (data.txtOther) elements.txtOther.value = data.txtOther;

      if (data.returnStatus) elements.returnStatus.value = data.returnStatus;
      if (data.actualReturnTime) elements.actualReturnTime.value = data.actualReturnTime;
      if (data.depositRefundStatus) elements.depositRefundStatus.value = data.depositRefundStatus;

      if (data.sigBorrower && padBorrower) padBorrower.fromDataURL(data.sigBorrower);
      if (data.sigIssuer && padIssuer) padIssuer.fromDataURL(data.sigIssuer);
      if (data.sigInspector && padInspector) padInspector.fromDataURL(data.sigInspector);

      syncFormToPreview();
      return true;
    } catch (e) {
      console.warn('載入草稿異常:', e);
      return false;
    }
  }

  // 載入示範資料
  function loadSampleData() {
    elements.custodyNo.value = 'KC-20261025-01';
    elements.borrowPurpose.value = 'broker_viewing';
    elements.propertyAddress.value = '港居愛河灣水岸景觀宅 A棟 12F-3 (高雄市苓雅區海邊路)';
    elements.propertyUnit.value = '已完成細清，請穿著現場鞋套';

    elements.borrowerName.value = '陳信宏';
    elements.borrowerPhone.value = '0928-333-888';
    elements.borrowerIdCard.value = 'E123456789';
    elements.borrowerCompany.value = '永慶不動產 亞洲新灣區加盟店';
    elements.borrowerLicense.value = '(110) 登字第398765號';

    elements.borrowTime.value = getNowDateTimeLocal(0);
    elements.expectedReturnTime.value = getNowDateTimeLocal(3); // 3小時後歸還

    elements.securityType.value = 'deposit_and_id';
    elements.securityAmount.value = '1000';
    elements.securityIdDoc.value = '營業員識別證正本';

    // 勾選項
    elements.chkMainKey.checked = true;
    elements.qtyMainKey.value = '1';
    elements.chkRoomKey.checked = false;
    elements.qtyRoomKey.value = '0';
    elements.chkElevatorTag.checked = true;
    elements.qtyElevatorTag.value = '1';
    elements.chkGarageRemote.checked = false;
    elements.qtyGarageRemote.value = '0';
    elements.chkMailboxKey.checked = false;
    elements.qtyMailboxKey.value = '0';
    elements.chkTrashTag.checked = false;
    elements.qtyTrashTag.value = '0';
    elements.chkPasscode.checked = true;
    elements.txtPasscode.value = '當日訪客密碼 #8899*';
    elements.chkOther.checked = true;
    elements.txtOther.value = '全室電箱冷氣總開關確認卡 1 張';

    elements.returnStatus.value = 'pending';
    elements.actualReturnTime.value = '';
    elements.depositRefundStatus.value = 'pending';

    syncFormToPreview();
    showToast('已載入房仲同業配案帶看示範範本', 'info');
  }

  // 清除草稿
  function clearDraft() {
    if (confirm('確定要清空目前填寫的內容與簽章嗎？')) {
      localStorage.removeItem('ganju_key_custody_draft_v1');
      if (padBorrower) padBorrower.clear();
      if (padIssuer) padIssuer.clear();
      if (padInspector) padInspector.clear();

      elements.custodyNo.value = 'KC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01';
      elements.propertyAddress.value = '';
      elements.propertyUnit.value = '';
      elements.borrowerName.value = '';
      elements.borrowerPhone.value = '';
      elements.borrowerIdCard.value = '';
      elements.borrowerCompany.value = '';
      elements.borrowerLicense.value = '';
      elements.borrowTime.value = getNowDateTimeLocal(0);
      elements.expectedReturnTime.value = getNowDateTimeLocal(2);
      elements.securityAmount.value = '1000';
      elements.securityIdDoc.value = '身分證/健保卡正本';

      elements.chkMainKey.checked = true;
      elements.qtyMainKey.value = '1';
      elements.chkRoomKey.checked = false;
      elements.chkElevatorTag.checked = true;
      elements.qtyElevatorTag.value = '1';
      elements.chkGarageRemote.checked = false;
      elements.chkMailboxKey.checked = false;
      elements.chkTrashTag.checked = false;
      elements.chkPasscode.checked = false;
      elements.chkOther.checked = false;

      syncFormToPreview();
      showToast('已清空所有內容與簽名', 'info');
    }
  }

  // 產生 LINE 通知文字
  function copyLineText() {
    var custodyNo = elements.custodyNo.value || 'KC-20261025-01';
    var purposeText = elements.borrowPurpose.options[elements.borrowPurpose.selectedIndex].text;
    var property = elements.propertyAddress.value || '未填寫地址';
    var borrower = elements.borrowerName.value || '借用人';
    var phone = elements.borrowerPhone.value || '電話';
    var company = elements.borrowerCompany.value ? '【' + elements.borrowerCompany.value + '】' : '';
    var tBorrow = formatDisplayDateTime(elements.borrowTime.value);
    var tReturn = formatDisplayDateTime(elements.expectedReturnTime.value);

    var items = getSelectedItemsSummary();
    var itemsStr = items.map(function (it) {
      return '・' + it.name + '：' + it.qty + ' ' + it.unit;
    }).join('\n');

    var text = '【港居不動產｜鑰匙門禁借出保管存證通報】\n' +
      '📋 單號：' + custodyNo + ' (' + purposeText + ')\n' +
      '🏢 標的物：' + property + '\n' +
      '👤 借用人：' + borrower + ' ' + company + '\n' +
      '📞 聯絡電話：' + phone + '\n' +
      '🕒 借出時間：' + tBorrow + '\n' +
      '⏳ 約定歸還：' + tReturn + '\n\n' +
      '🔑 借出品項清單：\n' + (itemsStr || '・無項目') + '\n\n' +
      '⚠️ 法定保管責任宣告（民法第432條）：\n' +
      '1. 嚴禁以任何方式私自打製鑰匙或拷貝門禁磁扣。\n' +
      '2. 離開前必須確實關閉水電、反鎖大門與門窗。\n' +
      '3. 請依約定時間歸還，逾期每日計收違約金500元。\n' +
      '4. 鑰匙磁扣若有遺失，借用人願全額負擔整套門鎖更新費用。\n\n' +
      '港居不動產開發有限公司 敬啟\n' +
      '聯絡專線：0968-863-880';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已複製 LINE 借出存證與催還通報文字！', 'success');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已複製 LINE 借出存證與催還通報文字！', 'success');
    } catch (err) {
      showToast('複製失敗，請手動複製', 'error');
    }
    document.body.removeChild(ta);
  }

  // 產生 840×1080px Canvas 存證圖卡下載
  function downloadCardImage() {
    var canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');

    // 背景底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#1a2639';
    ctx.fillRect(0, 0, 840, 85);

    // 頂部品牌文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司｜鑰匙門禁借出保管切結單', 30, 48);

    ctx.fillStyle = '#c5a059';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('GANJU REAL ESTATE MANAGEMENT・民法第432條善良管理人責任存證', 30, 72);

    // 單號與狀態標籤
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(30, 105, 780, 50);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(30, 105, 780, 50);

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('切結單號：' + (elements.custodyNo.value || 'KC-20261025-01'), 45, 136);

    var purposeText = elements.borrowPurpose.options[elements.borrowPurpose.selectedIndex].text;
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('【' + purposeText + '】', 600, 136);

    // 標的物與借用人資訊卡
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 170, 780, 150);

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('標的物：', 45, 202);
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(elements.propertyAddress.value || '未填寫標的物地址', 120, 202);

    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('借用人：', 45, 238);
    ctx.font = '15px "Noto Sans TC", sans-serif';
    var bInfo = (elements.borrowerName.value || '姓名') + ' (' + (elements.borrowerPhone.value || '電話') + ') ' +
      (elements.borrowerCompany.value ? '【' + elements.borrowerCompany.value + '】' : '');
    ctx.fillText(bInfo, 120, 238);

    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('時　程：', 45, 274);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    var tSchedule = '借出：' + formatDisplayDateTime(elements.borrowTime.value) + '  至  預計歸還：' + formatDisplayDateTime(elements.expectedReturnTime.value);
    ctx.fillText(tSchedule, 120, 274);

    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('擔　保：', 45, 306);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#c53030';
    var sType = elements.securityType.value;
    var sAmount = parseFloat(elements.securityAmount.value) || 0;
    var sDesc = (sType === 'deposit' || sType === 'deposit_and_id') ?
      '保管押金 NT$ ' + formatMoney(sAmount) + ' 元整 (' + toChineseCapital(sAmount) + ')' :
      '暫留存證件：' + (elements.securityIdDoc.value || '營業員識別證正本');
    ctx.fillText(sDesc, 120, 306);

    // 借出品項清單
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(30, 335, 780, 185);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(30, 335, 780, 185);

    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('🔑 借出品項與配件明細點收表', 45, 365);

    var items = getSelectedItemsSummary();
    var yPos = 395;
    ctx.fillStyle = '#2d3748';
    ctx.font = '14px "Noto Sans TC", sans-serif';

    if (items.length === 0) {
      ctx.fillText('（尚未勾選任何品項）', 45, yPos);
    } else {
      items.forEach(function (it, idx) {
        if (idx < 6) {
          var colX = (idx % 2 === 0) ? 45 : 430;
          var curY = yPos + Math.floor(idx / 2) * 32;
          ctx.fillText('・' + it.name + '：' + it.qty + ' ' + it.unit, colX, curY);
        }
      });
    }

    // 法定切結條款
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(30, 535, 780, 235);
    ctx.strokeStyle = '#feebc8';
    ctx.strokeRect(30, 535, 780, 235);

    ctx.fillStyle = '#9c4221';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('⚖️ 借用保管切結義務（民法第432條、第184條侵權賠償責任）', 45, 565);

    ctx.fillStyle = '#744210';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    var clauses = [
      '1. 【嚴禁複製】：絕不私自備份、打製鑰匙或拷貝磁扣，違者願賠償伍萬元懲罰性違約金並負刑事責任。',
      '2. 【準時返還】：依約定期限返還原處，逾期未經同意每逾一日計收違約金新臺幣 500 元。',
      '3. 【換鎖賠償】：鑰匙磁扣若有遺失或損壞，借用人無條件照價賠償更換全戶鎖具與全社區重設磁扣之全額。',
      '4. 【現場安全】：帶看或進場作業完畢離開前，必須確實確認水電關閉並將門窗大門全數反鎖。'
    ];
    clauses.forEach(function (c, idx) {
      ctx.fillText(c, 45, 600 + idx * 38);
    });

    // 簽章區域
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('借用人親筆簽署：', 60, 800);
    ctx.fillText('港居經辦人員簽認：', 450, 800);

    ctx.strokeStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(60, 885);
    ctx.lineTo(360, 885);
    ctx.moveTo(450, 885);
    ctx.lineTo(750, 885);
    ctx.stroke();

    // 繪製簽章
    var bData = padBorrower ? padBorrower.toDataURL() : null;
    var iData = padIssuer ? padIssuer.toDataURL() : null;

    var drawRemaining = function () {
      // 底部資訊
      ctx.fillStyle = '#718096';
      ctx.font = '12px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司｜合法特許租賃住宅服務業 高市租登字第0012號｜統編 96797997', 60, 930);
      ctx.fillText('產製時間：' + new Date().toLocaleString('zh-TW') + '｜防偽電子存證單據', 60, 955);

      // 下載
      var link = document.createElement('a');
      link.download = '港居鑰匙借出切結存證單_' + (elements.custodyNo.value || 'KC') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('已成功下載高畫質存證圖卡！', 'success');
    };

    var loaded = 0;
    var totalToLoad = (bData ? 1 : 0) + (iData ? 1 : 0);

    if (totalToLoad === 0) {
      drawRemaining();
    } else {
      if (bData) {
        var imgB = new Image();
        imgB.onload = function () {
          ctx.drawImage(imgB, 60, 810, 200, 70);
          loaded++;
          if (loaded >= totalToLoad) drawRemaining();
        };
        imgB.src = bData;
      }
      if (iData) {
        var imgI = new Image();
        imgI.onload = function () {
          ctx.drawImage(imgI, 450, 810, 200, 70);
          loaded++;
          if (loaded >= totalToLoad) drawRemaining();
        };
        imgI.src = iData;
      }
    }
  }

  // Toast 訊息提示
  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = type === 'success' ? '#22543d' : type === 'error' ? '#742a2a' : '#1a365d';
    toast.style.color = '#ffffff';
    toast.style.padding = '0.75rem 1.25rem';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '600';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.5rem';
    toast.innerHTML = '<i class="fa-solid ' + (type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info') + '"></i> ' + escapeHtml(message);

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // 初始化所有事件監聽
  function initEvents() {
    // 簽章畫布初始化
    if (elements.canvasBorrower) {
      padBorrower = new SignaturePad(elements.canvasBorrower, updateSignaturesPreview);
      elements.btnClearBorrower.addEventListener('click', function () {
        padBorrower.clear();
      });
    }

    if (elements.canvasIssuer) {
      padIssuer = new SignaturePad(elements.canvasIssuer, updateSignaturesPreview);
      elements.btnClearIssuer.addEventListener('click', function () {
        padIssuer.clear();
      });
    }

    if (elements.canvasInspector) {
      padInspector = new SignaturePad(elements.canvasInspector, updateSignaturesPreview);
      elements.btnClearInspector.addEventListener('click', function () {
        padInspector.clear();
      });
    }

    // 表單各輸入欄位即時連動預覽
    var inputList = [
      elements.custodyNo, elements.borrowPurpose, elements.propertyAddress, elements.propertyUnit,
      elements.borrowerName, elements.borrowerPhone, elements.borrowerIdCard, elements.borrowerCompany, elements.borrowerLicense,
      elements.borrowTime, elements.expectedReturnTime, elements.securityType, elements.securityAmount, elements.securityIdDoc,
      elements.chkMainKey, elements.qtyMainKey, elements.chkRoomKey, elements.qtyRoomKey,
      elements.chkElevatorTag, elements.qtyElevatorTag, elements.chkGarageRemote, elements.qtyGarageRemote,
      elements.chkMailboxKey, elements.qtyMailboxKey, elements.chkTrashTag, elements.qtyTrashTag,
      elements.chkPasscode, elements.txtPasscode, elements.chkOther, elements.txtOther,
      elements.returnStatus, elements.actualReturnTime, elements.depositRefundStatus
    ];

    inputList.forEach(function (inp) {
      if (!inp) return;
      inp.addEventListener('input', syncFormToPreview);
      inp.addEventListener('change', syncFormToPreview);
    });

    // 按鈕監聽
    if (elements.btnPrint) {
      elements.btnPrint.addEventListener('click', function () {
        window.print();
      });
    }

    if (elements.btnDownloadCard) {
      elements.btnDownloadCard.addEventListener('click', downloadCardImage);
    }

    if (elements.btnCopyLine) {
      elements.btnCopyLine.addEventListener('click', copyLineText);
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

    // 初始時間填寫
    if (!elements.borrowTime.value) {
      elements.borrowTime.value = getNowDateTimeLocal(0);
    }
    if (!elements.expectedReturnTime.value) {
      elements.expectedReturnTime.value = getNowDateTimeLocal(2);
    }

    // 嘗試恢復草稿，若無則載入示範預覽
    var hasDraft = loadDraft();
    if (!hasDraft) {
      syncFormToPreview();
    }
  }

  // DOM 載入後啟動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
  } else {
    initEvents();
  }

})();
