/**
 * 港居不動產 - 租賃住宅房客遷入登記與住戶緊急聯絡人資料卡 (tenant-check-in-form.js)
 * 遵循《公寓大廈管理條例》第 35 條與《個人資料保護法》法定目的規範
 * 支援同住人動態名冊、雙組緊急聯絡人、雙手寫簽章、A4 列印、Canvas 圖卡與 LINE 存證
 */

(function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTodayString() {
    var d = new Date();
    var pad = function (num) { return (num < 10 ? '0' : '') + num; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function getOneYearLaterString() {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    var pad = function (num) { return (num < 10 ? '0' : '') + num; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // DOM 元素快取
  var elements = {
    // 遷入與物業基本資訊
    checkInNo: document.getElementById('checkInNo'),
    checkInDate: document.getElementById('checkInDate'),
    leaseStart: document.getElementById('leaseStart'),
    leaseEnd: document.getElementById('leaseEnd'),
    propertyAddress: document.getElementById('propertyAddress'),
    parkingInfo: document.getElementById('parkingInfo'),

    // 主承租人資訊
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),
    tenantIdCard: document.getElementById('tenantIdCard'),
    tenantEmail: document.getElementById('tenantEmail'),
    tenantCompany: document.getElementById('tenantCompany'),
    carPlate: document.getElementById('carPlate'),
    scooterPlate: document.getElementById('scooterPlate'),

    // 緊急聯絡人一
    emergency1Name: document.getElementById('emergency1Name'),
    emergency1Relation: document.getElementById('emergency1Relation'),
    emergency1Phone: document.getElementById('emergency1Phone'),
    emergency1Address: document.getElementById('emergency1Address'),

    // 緊急聯絡人二
    emergency2Name: document.getElementById('emergency2Name'),
    emergency2Relation: document.getElementById('emergency2Relation'),
    emergency2Phone: document.getElementById('emergency2Phone'),

    // 寵物與特殊生活狀況
    petInfo: document.getElementById('petInfo'),
    specialEquipment: document.getElementById('specialEquipment'),
    healthNotes: document.getElementById('healthNotes'),

    // 同住人容器
    coResidentsContainer: document.getElementById('coResidentsContainer'),
    btnAddCoResident: document.getElementById('btnAddCoResident'),

    // 簽章畫布
    canvasTenant: document.getElementById('canvasTenant'),
    canvasManager: document.getElementById('canvasManager'),
    btnClearTenant: document.getElementById('btnClearTenant'),
    btnClearManager: document.getElementById('btnClearManager'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽紙張元素
    prevCheckInNo: document.getElementById('prevCheckInNo'),
    prevCheckInDate: document.getElementById('prevCheckInDate'),
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevLeasePeriod: document.getElementById('prevLeasePeriod'),
    prevTenantInfo: document.getElementById('prevTenantInfo'),
    prevParkingPlates: document.getElementById('prevParkingPlates'),
    prevCoResidentsBlock: document.getElementById('prevCoResidentsBlock'),
    prevEmergency1Info: document.getElementById('prevEmergency1Info'),
    prevEmergency2Info: document.getElementById('prevEmergency2Info'),
    prevPetNotes: document.getElementById('prevPetNotes'),
    prevSignTenant: document.getElementById('prevSignTenant'),
    prevSignManager: document.getElementById('prevSignManager')
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

  // 簽名板實例
  var padTenant, padManager;

  function updateSignaturesPreview() {
    if (elements.prevSignTenant) {
      var tUrl = padTenant ? padTenant.toDataURL() : null;
      elements.prevSignTenant.src = tUrl || '';
      elements.prevSignTenant.style.display = tUrl ? 'block' : 'none';
    }

    if (elements.prevSignManager) {
      var mUrl = padManager ? padManager.toDataURL() : null;
      elements.prevSignManager.src = mUrl || '';
      elements.prevSignManager.style.display = mUrl ? 'block' : 'none';
    }
  }

  // 同住人動態項目管理
  function addCoResidentRow(name, relation, idCard, phone) {
    var row = document.createElement('div');
    row.className = 'dynamic-item-row';
    row.innerHTML = '' +
      '<input type="text" class="co-name" placeholder="姓名" value="' + escapeHtml(name || '') + '">' +
      '<input type="text" class="co-rel" placeholder="關係 (如配偶)" value="' + escapeHtml(relation || '') + '">' +
      '<input type="text" class="co-id" placeholder="身分證字號" value="' + escapeHtml(idCard || '') + '">' +
      '<input type="tel" class="co-phone" placeholder="聯絡電話" value="' + escapeHtml(phone || '') + '">' +
      '<button type="button" class="btn-remove-row" title="刪除此同住人" aria-label="刪除此同住人">' +
      '<i class="fa-solid fa-trash-can"></i>' +
      '</button>';

    var removeBtn = row.querySelector('.btn-remove-row');
    removeBtn.addEventListener('click', function () {
      elements.coResidentsContainer.removeChild(row);
      syncFormToPreview();
    });

    var inputs = row.querySelectorAll('input');
    inputs.forEach(function (inp) {
      inp.addEventListener('input', syncFormToPreview);
    });

    elements.coResidentsContainer.appendChild(row);
    syncFormToPreview();
  }

  function getCoResidentsData() {
    var rows = elements.coResidentsContainer.querySelectorAll('.dynamic-item-row');
    var list = [];
    rows.forEach(function (r) {
      var n = r.querySelector('.co-name').value.trim();
      var rel = r.querySelector('.co-rel').value.trim();
      var id = r.querySelector('.co-id').value.trim();
      var ph = r.querySelector('.co-phone').value.trim();
      if (n || rel || id || ph) {
        list.push({ name: n, relation: rel, idCard: id, phone: ph });
      }
    });
    return list;
  }

  // 同步表單資料至即時 A4 預覽紙張
  function syncFormToPreview() {
    // 單號與日期
    if (elements.prevCheckInNo) {
      elements.prevCheckInNo.textContent = elements.checkInNo.value || 'CI-20261025-01';
    }
    if (elements.prevCheckInDate) {
      elements.prevCheckInDate.textContent = elements.checkInDate.value || getTodayString();
    }

    // 標的物與車位
    if (elements.prevPropertyAddress) {
      elements.prevPropertyAddress.textContent = elements.propertyAddress.value || '未填寫物業地址';
    }
    if (elements.prevLeasePeriod) {
      var lStart = elements.leaseStart.value || '起租日';
      var lEnd = elements.leaseEnd.value || '退租日';
      elements.prevLeasePeriod.textContent = lStart + ' 至 ' + lEnd;
    }

    // 主承租人資訊
    if (elements.prevTenantInfo) {
      var tName = elements.tenantName.value || '承租人姓名';
      var tPhone = elements.tenantPhone.value || '電話';
      var tId = elements.tenantIdCard.value ? ' / 身分證字號：' + elements.tenantIdCard.value : '';
      var tEmail = elements.tenantEmail.value ? ' / 信箱：' + elements.tenantEmail.value : '';
      var tComp = elements.tenantCompany.value ? ' / 服務單位：' + elements.tenantCompany.value : '';
      elements.prevTenantInfo.innerHTML = '<strong>' + escapeHtml(tName) + '</strong> (' + escapeHtml(tPhone) + ')' +
        escapeHtml(tId + tEmail + tComp);
    }

    // 車籍與車位
    if (elements.prevParkingPlates) {
      var pInfo = elements.parkingInfo.value || '無專用車位';
      var carP = elements.carPlate.value ? '汽車車牌：' + elements.carPlate.value : '無汽車';
      var scotP = elements.scooterPlate.value ? '機車車牌：' + elements.scooterPlate.value : '無機車';
      elements.prevParkingPlates.textContent = pInfo + ' ｜ ' + carP + ' ｜ ' + scotP;
    }

    // 同住人清單
    var coList = getCoResidentsData();
    if (elements.prevCoResidentsBlock) {
      if (coList.length === 0) {
        elements.prevCoResidentsBlock.innerHTML = '<span style="color: #718096; font-style: italic;">無同住人（主承租人單獨承租入住）</span>';
      } else {
        var html = '<table class="sub-residents-table"><thead><tr>' +
          '<th>姓名</th><th>關係稱謂</th><th>身分證字號</th><th>聯絡電話</th>' +
          '</tr></thead><tbody>';
        coList.forEach(function (c) {
          html += '<tr>' +
            '<td><strong>' + escapeHtml(c.name || '—') + '</strong></td>' +
            '<td>' + escapeHtml(c.relation || '—') + '</td>' +
            '<td>' + escapeHtml(c.idCard || '—') + '</td>' +
            '<td>' + escapeHtml(c.phone || '—') + '</td>' +
            '</tr>';
        });
        html += '</tbody></table>';
        elements.prevCoResidentsBlock.innerHTML = html;
      }
    }

    // 緊急聯絡人一
    if (elements.prevEmergency1Info) {
      var e1Name = elements.emergency1Name.value || '未填寫';
      var e1Rel = elements.emergency1Relation.value ? ' (' + elements.emergency1Relation.value + ')' : '';
      var e1Phone = elements.emergency1Phone.value ? ' / 電話：' + elements.emergency1Phone.value : '';
      var e1Addr = elements.emergency1Address.value ? ' / 地址：' + elements.emergency1Address.value : '';
      elements.prevEmergency1Info.innerHTML = '<strong>' + escapeHtml(e1Name + e1Rel) + '</strong>' + escapeHtml(e1Phone + e1Addr);
    }

    // 緊急聯絡人二
    if (elements.prevEmergency2Info) {
      var e2Name = elements.emergency2Name.value || '未填寫';
      var e2Rel = elements.emergency2Relation.value ? ' (' + elements.emergency2Relation.value + ')' : '';
      var e2Phone = elements.emergency2Phone.value ? ' / 電話：' + elements.emergency2Phone.value : '';
      elements.prevEmergency2Info.innerHTML = '<strong>' + escapeHtml(e2Name + e2Rel) + '</strong>' + escapeHtml(e2Phone);
    }

    // 寵物與備忘
    if (elements.prevPetNotes) {
      var pNote = elements.petInfo.value || '無飼養寵物';
      var eqNote = elements.specialEquipment.value ? ' / 特殊設備：' + elements.specialEquipment.value : '';
      var hNote = elements.healthNotes.value ? ' / 醫療照護：' + elements.healthNotes.value : '';
      elements.prevPetNotes.textContent = pNote + eqNote + hNote;
    }

    updateSignaturesPreview();
  }

  // 儲存草稿至 LocalStorage
  function saveDraft() {
    var data = {
      checkInNo: elements.checkInNo.value,
      checkInDate: elements.checkInDate.value,
      leaseStart: elements.leaseStart.value,
      leaseEnd: elements.leaseEnd.value,
      propertyAddress: elements.propertyAddress.value,
      parkingInfo: elements.parkingInfo.value,
      tenantName: elements.tenantName.value,
      tenantPhone: elements.tenantPhone.value,
      tenantIdCard: elements.tenantIdCard.value,
      tenantEmail: elements.tenantEmail.value,
      tenantCompany: elements.tenantCompany.value,
      carPlate: elements.carPlate.value,
      scooterPlate: elements.scooterPlate.value,
      emergency1Name: elements.emergency1Name.value,
      emergency1Relation: elements.emergency1Relation.value,
      emergency1Phone: elements.emergency1Phone.value,
      emergency1Address: elements.emergency1Address.value,
      emergency2Name: elements.emergency2Name.value,
      emergency2Relation: elements.emergency2Relation.value,
      emergency2Phone: elements.emergency2Phone.value,
      petInfo: elements.petInfo.value,
      specialEquipment: elements.specialEquipment.value,
      healthNotes: elements.healthNotes.value,
      coResidents: getCoResidentsData(),
      sigTenant: padTenant ? padTenant.toDataURL() : null,
      sigManager: padManager ? padManager.toDataURL() : null,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem('ganju_tenant_checkin_draft_v1', JSON.stringify(data));
      showToast('住戶資料草稿已成功儲存至本機！', 'success');
    } catch (e) {
      showToast('儲存草稿失敗：瀏覽器儲存空間不足', 'error');
    }
  }

  // 讀取本機草稿
  function loadDraft() {
    var raw = localStorage.getItem('ganju_tenant_checkin_draft_v1');
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (data.checkInNo) elements.checkInNo.value = data.checkInNo;
      if (data.checkInDate) elements.checkInDate.value = data.checkInDate;
      if (data.leaseStart) elements.leaseStart.value = data.leaseStart;
      if (data.leaseEnd) elements.leaseEnd.value = data.leaseEnd;
      if (data.propertyAddress) elements.propertyAddress.value = data.propertyAddress;
      if (data.parkingInfo) elements.parkingInfo.value = data.parkingInfo;
      if (data.tenantName) elements.tenantName.value = data.tenantName;
      if (data.tenantPhone) elements.tenantPhone.value = data.tenantPhone;
      if (data.tenantIdCard) elements.tenantIdCard.value = data.tenantIdCard;
      if (data.tenantEmail) elements.tenantEmail.value = data.tenantEmail;
      if (data.tenantCompany) elements.tenantCompany.value = data.tenantCompany;
      if (data.carPlate) elements.carPlate.value = data.carPlate;
      if (data.scooterPlate) elements.scooterPlate.value = data.scooterPlate;
      if (data.emergency1Name) elements.emergency1Name.value = data.emergency1Name;
      if (data.emergency1Relation) elements.emergency1Relation.value = data.emergency1Relation;
      if (data.emergency1Phone) elements.emergency1Phone.value = data.emergency1Phone;
      if (data.emergency1Address) elements.emergency1Address.value = data.emergency1Address;
      if (data.emergency2Name) elements.emergency2Name.value = data.emergency2Name;
      if (data.emergency2Relation) elements.emergency2Relation.value = data.emergency2Relation;
      if (data.emergency2Phone) elements.emergency2Phone.value = data.emergency2Phone;
      if (data.petInfo) elements.petInfo.value = data.petInfo;
      if (data.specialEquipment) elements.specialEquipment.value = data.specialEquipment;
      if (data.healthNotes) elements.healthNotes.value = data.healthNotes;

      elements.coResidentsContainer.innerHTML = '';
      if (data.coResidents && Array.isArray(data.coResidents)) {
        data.coResidents.forEach(function (c) {
          addCoResidentRow(c.name, c.relation, c.idCard, c.phone);
        });
      }

      if (data.sigTenant && padTenant) padTenant.fromDataURL(data.sigTenant);
      if (data.sigManager && padManager) padManager.fromDataURL(data.sigManager);

      syncFormToPreview();
      return true;
    } catch (e) {
      console.warn('載入草稿異常:', e);
      return false;
    }
  }

  // 載入示範資料
  function loadSampleData() {
    elements.checkInNo.value = 'CI-20261025-01';
    elements.checkInDate.value = getTodayString();
    elements.leaseStart.value = getTodayString();
    elements.leaseEnd.value = getOneYearLaterString();
    elements.propertyAddress.value = '港居愛河灣水岸景觀宅 A棟 12F-3 (高雄市苓雅區海邊路)';
    elements.parkingInfo.value = '地下二樓 B2-45 (汽車位) / 一樓 M-18 (機車格)';

    elements.tenantName.value = '林宇軒';
    elements.tenantPhone.value = '0932-888-999';
    elements.tenantIdCard.value = 'E123888999';
    elements.tenantEmail.value = 'yuxuan.lin@example.com';
    elements.tenantCompany.value = '台積電晶圓廠・資深製程工程師';
    elements.carPlate.value = 'ABC-8899';
    elements.scooterPlate.value = 'MNO-3388';

    elements.emergency1Name.value = '林明峰';
    elements.emergency1Relation.value = '父親';
    elements.emergency1Phone.value = '0912-345-678';
    elements.emergency1Address.value = '臺南市東區長榮路一段120號';

    elements.emergency2Name.value = '黃俊傑';
    elements.emergency2Relation.value = '公司主管/部門經理';
    elements.emergency2Phone.value = '0922-111-222';

    elements.petInfo.value = '柴犬 1 隻 (晶片號碼：900115002345678，體重 9kg，已結紮且定期施打狂犬病疫苗)';
    elements.specialEquipment.value = '無高功率特殊負載，配備合規空氣清淨機與除濕機';
    elements.healthNotes.value = '同住父親偶爾來訪，有降血壓藥物定期服用需注意';

    elements.coResidentsContainer.innerHTML = '';
    addCoResidentRow('陳思穎', '配偶', 'E223999888', '0955-666-777');
    addCoResidentRow('林小寶', '長子', 'E123000111', '就讀愛河國小二年級');

    syncFormToPreview();
    showToast('已載入典型雙薪家庭示範資料！', 'info');
  }

  // 清除重填
  function clearDraft() {
    if (confirm('確定要清空目前填寫的遷入登記內容與手寫簽章嗎？')) {
      localStorage.removeItem('ganju_tenant_checkin_draft_v1');
      if (padTenant) padTenant.clear();
      if (padManager) padManager.clear();

      elements.checkInNo.value = 'CI-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01';
      elements.checkInDate.value = getTodayString();
      elements.leaseStart.value = getTodayString();
      elements.leaseEnd.value = getOneYearLaterString();
      elements.propertyAddress.value = '';
      elements.parkingInfo.value = '';
      elements.tenantName.value = '';
      elements.tenantPhone.value = '';
      elements.tenantIdCard.value = '';
      elements.tenantEmail.value = '';
      elements.tenantCompany.value = '';
      elements.carPlate.value = '';
      elements.scooterPlate.value = '';
      elements.emergency1Name.value = '';
      elements.emergency1Relation.value = '';
      elements.emergency1Phone.value = '';
      elements.emergency1Address.value = '';
      elements.emergency2Name.value = '';
      elements.emergency2Relation.value = '';
      elements.emergency2Phone.value = '';
      elements.petInfo.value = '';
      elements.specialEquipment.value = '';
      elements.healthNotes.value = '';

      elements.coResidentsContainer.innerHTML = '';

      syncFormToPreview();
      showToast('已清空所有內容與簽名', 'info');
    }
  }

  // LINE 存證通知複製
  function copyLineText() {
    var checkInNo = elements.checkInNo.value || 'CI-20261025-01';
    var property = elements.propertyAddress.value || '未填寫物業地址';
    var tenant = elements.tenantName.value || '主承租人';
    var phone = elements.tenantPhone.value || '電話';
    var cDate = elements.checkInDate.value || getTodayString();
    var park = elements.parkingInfo.value ? '🅿️ 車位資訊：' + elements.parkingInfo.value + '\n' : '';
    var car = elements.carPlate.value ? '🚗 汽車車牌：' + elements.carPlate.value + '\n' : '';
    var scot = elements.scooterPlate.value ? '🛵 機車車牌：' + elements.scooterPlate.value + '\n' : '';

    var coList = getCoResidentsData();
    var coStr = coList.length > 0 ?
      '👥 同住家屬/室友：' + coList.map(function (c) { return c.name + '(' + c.relation + ')'; }).join('、') + '\n' :
      '👥 同住家屬/室友：無（單獨承租）\n';

    var e1 = '🚨 第一緊急聯絡人：' + (elements.emergency1Name.value || '未填') + ' (' + (elements.emergency1Relation.value || '關係') + ') ' + (elements.emergency1Phone.value || '') + '\n';
    var e2 = '🚨 第二緊急聯絡人：' + (elements.emergency2Name.value || '未填') + ' (' + (elements.emergency2Relation.value || '關係') + ') ' + (elements.emergency2Phone.value || '') + '\n';

    var text = '【港居不動產｜住戶房客遷入登記存證通知】\n' +
      '📋 登記單號：' + checkInNo + '\n' +
      '🏢 承租標的：' + property + '\n' +
      '📅 遷入日期：' + cDate + '\n' +
      '👤 主承租人：' + tenant + ' (' + phone + ')\n' +
      coStr + park + car + scot +
      e1 + e2 + '\n' +
      '⚖️ 合規聲明：\n' +
      '1. 本資料依個人資料保護法及公寓大廈管理條例登記存查。\n' +
      '2. 承租人承諾遵守社區住戶規約，落實垃圾分類與公共安全維護。\n' +
      '3. 如有同住人或緊急聯絡資訊異動，將於7日內主動通知更新。\n\n' +
      '港居不動產開發有限公司 物業管理部 敬啟\n' +
      '服務電話：0968-863-880';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已複製 LINE 住戶遷入登記通知文字！', 'success');
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
      showToast('已複製 LINE 住戶遷入登記通知文字！', 'success');
    } catch (err) {
      showToast('複製失敗，請手動複製', 'error');
    }
    document.body.removeChild(ta);
  }

  // 下載 Canvas 840×1080px 存證圖卡
  function downloadCardImage() {
    var canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#1a2639';
    ctx.fillRect(0, 0, 840, 85);

    // 頂部標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 23px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司｜住戶遷入登記與緊急聯絡資料卡', 30, 48);

    ctx.fillStyle = '#c5a059';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('GANJU REAL ESTATE・公寓大廈管理條例第35條暨個資保護合規存證', 30, 72);

    // 單號與遷入日期條
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(30, 105, 780, 50);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(30, 105, 780, 50);

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('登記單號：' + (elements.checkInNo.value || 'CI-20261025-01'), 45, 136);

    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('遷入生效日：' + (elements.checkInDate.value || getTodayString()), 560, 136);

    // 物業與承租人基本資料框
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 170, 780, 160);

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('租賃標的：', 45, 202);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText(elements.propertyAddress.value || '未填寫物業地址', 125, 202);

    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('主承租人：', 45, 238);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    var tInfo = (elements.tenantName.value || '姓名') + ' (' + (elements.tenantPhone.value || '電話') + ') / 身分證：' +
      (elements.tenantIdCard.value || '未填');
    ctx.fillText(tInfo, 125, 238);

    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('車位車籍：', 45, 274);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    var pInfo = (elements.parkingInfo.value || '無車位') + ' ｜ 汽：' + (elements.carPlate.value || '無') + ' ｜ 機：' + (elements.scooterPlate.value || '無');
    ctx.fillText(pInfo, 125, 274);

    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('租約起迄：', 45, 308);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText((elements.leaseStart.value || '起') + ' 至 ' + (elements.leaseEnd.value || '迄'), 125, 308);

    // 同住人名冊框
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(30, 345, 780, 165);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(30, 345, 780, 165);

    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('👥 同住家屬與室友名冊', 45, 375);

    var coList = getCoResidentsData();
    var yPos = 405;
    ctx.fillStyle = '#2d3748';
    ctx.font = '14px "Noto Sans TC", sans-serif';

    if (coList.length === 0) {
      ctx.fillText('（無同住人，由主承租人單獨承租）', 45, yPos);
    } else {
      coList.forEach(function (c, idx) {
        if (idx < 3) {
          ctx.fillText('・' + (c.name || '未填') + ' (' + (c.relation || '關係') + ') / 身分證：' + (c.idCard || '—') + ' / 電話：' + (c.phone || '—'), 45, yPos + idx * 30);
        }
      });
    }

    // 緊急聯絡人與寵物狀況
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e0';
    ctx.strokeRect(30, 525, 780, 150);

    ctx.fillStyle = '#c53030';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('🚨 緊急聯絡人備查 (第一順位直系優先)', 45, 555);

    ctx.fillStyle = '#2d3748';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    var e1 = '第一聯絡人：' + (elements.emergency1Name.value || '姓名') + ' (' + (elements.emergency1Relation.value || '關係') + ') ' + (elements.emergency1Phone.value || '電話') + ' / 地址：' + (elements.emergency1Address.value || '未填');
    ctx.fillText(e1, 45, 585);

    var e2 = '第二聯絡人：' + (elements.emergency2Name.value || '姓名') + ' (' + (elements.emergency2Relation.value || '關係') + ') ' + (elements.emergency2Phone.value || '電話');
    ctx.fillText(e2, 45, 615);

    var petStr = '🐾 寵物與備忘：' + (elements.petInfo.value || '無飼養寵物') + (elements.specialEquipment.value ? ' / ' + elements.specialEquipment.value : '');
    ctx.fillText(petStr, 45, 645);

    // 法定切結條款
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(30, 690, 780, 140);
    ctx.strokeStyle = '#feebc8';
    ctx.strokeRect(30, 690, 780, 140);

    ctx.fillStyle = '#9c4221';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('⚖️ 住戶切結宣告（個人資料保護法特定目的 086/069/040/090）', 45, 715);

    ctx.fillStyle = '#744210';
    ctx.font = '12px "Noto Sans TC", sans-serif';
    ctx.fillText('1. 本表個人資料僅供港居物業管理、公寓大廈管委會住戶報備及緊急聯絡使用，絕不外流挪作他用。', 45, 740);
    ctx.fillText('2. 承租人承諾嚴守社區住戶生活規約，落實垃圾分類，晚間十點後保持安寧，嚴禁室內吸菸或吸毒違法情事。', 45, 765);
    ctx.fillText('3. 如同住人名單或緊急聯絡電話有異動，承租人同意於 7 日內主動向港居不動產通報更新。', 45, 790);

    // 簽章區域
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('主承租人確認簽章：', 60, 860);
    ctx.fillText('港居物業經辦人員：', 450, 860);

    ctx.strokeStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(60, 935);
    ctx.lineTo(360, 935);
    ctx.moveTo(450, 935);
    ctx.lineTo(750, 935);
    ctx.stroke();

    var tData = padTenant ? padTenant.toDataURL() : null;
    var mData = padManager ? padManager.toDataURL() : null;

    var drawRemaining = function () {
      ctx.fillStyle = '#718096';
      ctx.font = '12px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司｜特許證號：高市租登字第0012號｜統編 96797997', 60, 975);
      ctx.fillText('建檔時間：' + new Date().toLocaleString('zh-TW') + '｜住戶安全與個資法遵循電子憑證', 60, 1000);

      var link = document.createElement('a');
      link.download = '港居住戶遷入登記卡_' + (elements.checkInNo.value || 'CI') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('已成功下載住戶資料存證圖卡！', 'success');
    };

    var loaded = 0;
    var totalToLoad = (tData ? 1 : 0) + (mData ? 1 : 0);

    if (totalToLoad === 0) {
      drawRemaining();
    } else {
      if (tData) {
        var imgT = new Image();
        imgT.onload = function () {
          ctx.drawImage(imgT, 60, 865, 180, 65);
          loaded++;
          if (loaded >= totalToLoad) drawRemaining();
        };
        imgT.src = tData;
      }
      if (mData) {
        var imgM = new Image();
        imgM.onload = function () {
          ctx.drawImage(imgM, 450, 865, 180, 65);
          loaded++;
          if (loaded >= totalToLoad) drawRemaining();
        };
        imgM.src = mData;
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

  // 初始化事件
  function initEvents() {
    // 簽章畫布初始化
    if (elements.canvasTenant) {
      padTenant = new SignaturePad(elements.canvasTenant, updateSignaturesPreview);
      elements.btnClearTenant.addEventListener('click', function () {
        padTenant.clear();
      });
    }

    if (elements.canvasManager) {
      padManager = new SignaturePad(elements.canvasManager, updateSignaturesPreview);
      elements.btnClearManager.addEventListener('click', function () {
        padManager.clear();
      });
    }

    // 新增同住人按鈕
    if (elements.btnAddCoResident) {
      elements.btnAddCoResident.addEventListener('click', function () {
        addCoResidentRow('', '', '', '');
      });
    }

    // 表單各輸入欄位即時連動預覽
    var inputList = [
      elements.checkInNo, elements.checkInDate, elements.leaseStart, elements.leaseEnd,
      elements.propertyAddress, elements.parkingInfo,
      elements.tenantName, elements.tenantPhone, elements.tenantIdCard, elements.tenantEmail, elements.tenantCompany,
      elements.carPlate, elements.scooterPlate,
      elements.emergency1Name, elements.emergency1Relation, elements.emergency1Phone, elements.emergency1Address,
      elements.emergency2Name, elements.emergency2Relation, elements.emergency2Phone,
      elements.petInfo, elements.specialEquipment, elements.healthNotes
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

    // 初始日期預設
    if (!elements.checkInDate.value) elements.checkInDate.value = getTodayString();
    if (!elements.leaseStart.value) elements.leaseStart.value = getTodayString();
    if (!elements.leaseEnd.value) elements.leaseEnd.value = getOneYearLaterString();

    // 嘗試恢復草稿，若無則載入示範資料
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
