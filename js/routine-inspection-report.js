/**
 * 港居不動產 - 住宅租賃屋況定期巡檢維護報告書 (routine-inspection-report.js)
 * 遵循《租賃住宅市場發展及管理條例》第 28 條與內政部委託代管定型化契約規範
 * 支援六大安全檢驗矩陣、相片縮圖存證、雙手寫簽章、A4 列印、Canvas 圖卡與 LINE 存證
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

  // DOM 元素快取
  var elements = {
    // 巡檢基本資訊
    reportNo: document.getElementById('reportNo'),
    inspectDate: document.getElementById('inspectDate'),
    inspectCycle: document.getElementById('inspectCycle'),
    inspectorName: document.getElementById('inspectorName'),
    inspectorCert: document.getElementById('inspectorCert'),
    propertyAddress: document.getElementById('propertyAddress'),
    tenantName: document.getElementById('tenantName'),
    tenantPhone: document.getElementById('tenantPhone'),
    accompanyPerson: document.getElementById('accompanyPerson'),

    // 六大安全檢驗項目與備註
    smokeAlarmStatus: document.getElementById('smokeAlarmStatus'),
    smokeAlarmNote: document.getElementById('smokeAlarmNote'),

    gasStatus: document.getElementById('gasStatus'),
    gasNote: document.getElementById('gasNote'),

    electricStatus: document.getElementById('electricStatus'),
    electricNote: document.getElementById('electricNote'),

    plumbingStatus: document.getElementById('plumbingStatus'),
    plumbingNote: document.getElementById('plumbingNote'),

    doorStatus: document.getElementById('doorStatus'),
    doorNote: document.getElementById('doorNote'),

    occupancyStatus: document.getElementById('occupancyStatus'),
    occupancyNote: document.getElementById('occupancyNote'),

    // 綜合判定與處置建議
    overallRating: document.getElementById('overallRating'),
    actionPlan: document.getElementById('actionPlan'),
    defectSummary: document.getElementById('defectSummary'),

    // 相片上傳與預覽
    inputPhotoElectric: document.getElementById('inputPhotoElectric'),
    thumbPhotoElectric: document.getElementById('thumbPhotoElectric'),
    labelPhotoElectric: document.getElementById('labelPhotoElectric'),

    inputPhotoGas: document.getElementById('inputPhotoGas'),
    thumbPhotoGas: document.getElementById('thumbPhotoGas'),
    labelPhotoGas: document.getElementById('labelPhotoGas'),

    inputPhotoPlumbing: document.getElementById('inputPhotoPlumbing'),
    thumbPhotoPlumbing: document.getElementById('thumbPhotoPlumbing'),
    labelPhotoPlumbing: document.getElementById('labelPhotoPlumbing'),

    inputPhotoOverview: document.getElementById('inputPhotoOverview'),
    thumbPhotoOverview: document.getElementById('thumbPhotoOverview'),
    labelPhotoOverview: document.getElementById('labelPhotoOverview'),

    // 簽章畫布
    canvasInspector: document.getElementById('canvasInspector'),
    canvasTenant: document.getElementById('canvasTenant'),
    btnClearInspector: document.getElementById('btnClearInspector'),
    btnClearTenant: document.getElementById('btnClearTenant'),

    // 操作按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    btnSaveDraft: document.getElementById('btnSaveDraft'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnClearDraft: document.getElementById('btnClearDraft'),

    // 預覽紙張元素
    prevReportNo: document.getElementById('prevReportNo'),
    prevInspectDate: document.getElementById('prevInspectDate'),
    prevInspectCycle: document.getElementById('prevInspectCycle'),
    prevPropertyAddress: document.getElementById('prevPropertyAddress'),
    prevInspectorInfo: document.getElementById('prevInspectorInfo'),
    prevTenantInfo: document.getElementById('prevTenantInfo'),
    prevAccompany: document.getElementById('prevAccompany'),

    prevSmokeStatus: document.getElementById('prevSmokeStatus'),
    prevSmokeNote: document.getElementById('prevSmokeNote'),
    prevGasStatus: document.getElementById('prevGasStatus'),
    prevGasNote: document.getElementById('prevGasNote'),
    prevElectricStatus: document.getElementById('prevElectricStatus'),
    prevElectricNote: document.getElementById('prevElectricNote'),
    prevPlumbingStatus: document.getElementById('prevPlumbingStatus'),
    prevPlumbingNote: document.getElementById('prevPlumbingNote'),
    prevDoorStatus: document.getElementById('prevDoorStatus'),
    prevDoorNote: document.getElementById('prevDoorNote'),
    prevOccupancyStatus: document.getElementById('prevOccupancyStatus'),
    prevOccupancyNote: document.getElementById('prevOccupancyNote'),

    prevOverallRating: document.getElementById('prevOverallRating'),
    prevActionPlan: document.getElementById('prevActionPlan'),
    prevDefectSummary: document.getElementById('prevDefectSummary'),

    prevImgElectric: document.getElementById('prevImgElectric'),
    prevImgGas: document.getElementById('prevImgGas'),
    prevImgPlumbing: document.getElementById('prevImgPlumbing'),
    prevImgOverview: document.getElementById('prevImgOverview'),

    prevSignInspector: document.getElementById('prevSignInspector'),
    prevSignTenant: document.getElementById('prevSignTenant')
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
  var padInspector, padTenant;

  // 照片暫存 DataURL
  var photoData = {
    electric: null,
    gas: null,
    plumbing: null,
    overview: null
  };

  function updateSignaturesPreview() {
    if (elements.prevSignInspector) {
      var iUrl = padInspector ? padInspector.toDataURL() : null;
      elements.prevSignInspector.src = iUrl || '';
      elements.prevSignInspector.style.display = iUrl ? 'block' : 'none';
    }

    if (elements.prevSignTenant) {
      var tUrl = padTenant ? padTenant.toDataURL() : null;
      elements.prevSignTenant.src = tUrl || '';
      elements.prevSignTenant.style.display = tUrl ? 'block' : 'none';
    }
  }

  function handlePhotoUpload(file, key, thumbEl, labelEl, prevImgEl) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        // 本地 Canvas 縮圖處理防記憶體暴增 (最大寬高 1000px)
        var maxDim = 1000;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        var resizedUrl = c.toDataURL('image/jpeg', 0.85);
        photoData[key] = resizedUrl;

        if (thumbEl) {
          thumbEl.src = resizedUrl;
          thumbEl.style.display = 'block';
        }
        if (labelEl) {
          labelEl.style.display = 'none';
        }
        if (prevImgEl) {
          prevImgEl.src = resizedUrl;
          prevImgEl.style.display = 'block';
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // 渲染狀態標籤 HTML
  function renderStatusHtml(statusVal) {
    if (statusVal === 'ok' || statusVal.indexOf('正常') !== -1 || statusVal.indexOf('良好') !== -1) {
      return '<span class="status-badge-ok"><i class="fa-solid fa-circle-check"></i> 良好正常</span>';
    } else if (statusVal === 'warn' || statusVal.indexOf('注意') !== -1 || statusVal.indexOf('輕微') !== -1) {
      return '<span class="status-badge-warn"><i class="fa-solid fa-triangle-exclamation"></i> 需留意改善</span>';
    } else {
      return '<span class="status-badge-danger"><i class="fa-solid fa-circle-xmark"></i> 瑕疵異常</span>';
    }
  }

  // 同步表單至即時 A4 預覽紙張
  function syncFormToPreview() {
    // 巡檢基本資訊
    if (elements.prevReportNo) {
      elements.prevReportNo.textContent = elements.reportNo.value || 'IR-20261025-01';
    }
    if (elements.prevInspectDate) {
      elements.prevInspectDate.textContent = elements.inspectDate.value || getTodayString();
    }
    if (elements.prevInspectCycle) {
      elements.prevInspectCycle.textContent = elements.inspectCycle.value || '第一季例行巡檢 Q1';
    }
    if (elements.prevPropertyAddress) {
      elements.prevPropertyAddress.textContent = elements.propertyAddress.value || '未填寫物業地址';
    }
    if (elements.prevInspectorInfo) {
      var iName = elements.inspectorName.value || '陳俊銘 經理';
      var iCert = elements.inspectorCert.value ? ' (' + elements.inspectorCert.value + ')' : '';
      elements.prevInspectorInfo.textContent = iName + iCert;
    }
    if (elements.prevTenantInfo) {
      var tName = elements.tenantName.value || '承租人';
      var tPhone = elements.tenantPhone.value ? ' (' + elements.tenantPhone.value + ')' : '';
      elements.prevTenantInfo.textContent = tName + tPhone;
    }
    if (elements.prevAccompany) {
      elements.prevAccompany.textContent = elements.accompanyPerson.value || '承租人親自陪同';
    }

    // 六大檢驗矩陣項目
    if (elements.prevSmokeStatus) {
      elements.prevSmokeStatus.innerHTML = renderStatusHtml(elements.smokeAlarmStatus.value);
    }
    if (elements.prevSmokeNote) {
      elements.prevSmokeNote.textContent = elements.smokeAlarmNote.value || '獨立式住警器電力與蜂鳴聲測試正常，公共逃生通道順暢無雜物。';
    }

    if (elements.prevGasStatus) {
      elements.prevGasStatus.innerHTML = renderStatusHtml(elements.gasStatus.value);
    }
    if (elements.prevGasNote) {
      elements.prevGasNote.textContent = elements.gasNote.value || '熱水器強制排氣管銜接密合無破損，瓦斯管線無老化或洩漏氣味。';
    }

    if (elements.prevElectricStatus) {
      elements.prevElectricStatus.innerHTML = renderStatusHtml(elements.electricStatus.value);
    }
    if (elements.prevElectricNote) {
      elements.prevElectricNote.textContent = elements.electricNote.value || '總配電盤無過載焦味，漏電斷路器(ELCB)測試正常跳脫。';
    }

    if (elements.prevPlumbingStatus) {
      elements.prevPlumbingStatus.innerHTML = renderStatusHtml(elements.plumbingStatus.value);
    }
    if (elements.prevPlumbingNote) {
      elements.prevPlumbingNote.textContent = elements.plumbingNote.value || '廚房與衛浴給水排水流暢無堵塞，外牆窗框與天花板無新發壁癌水漬。';
    }

    if (elements.prevDoorStatus) {
      elements.prevDoorStatus.innerHTML = renderStatusHtml(elements.doorStatus.value);
    }
    if (elements.prevDoorNote) {
      elements.prevDoorNote.textContent = elements.doorNote.value || '大門防盜鎖及室內門窗五金推拉滑順，冷氣機定期濾網清潔良好。';
    }

    if (elements.prevOccupancyStatus) {
      elements.prevOccupancyStatus.innerHTML = renderStatusHtml(elements.occupancyStatus.value);
    }
    if (elements.prevOccupancyNote) {
      elements.prevOccupancyNote.textContent = elements.occupancyNote.value || '住戶遵守社區規約，無私自轉租或違規分租跡象，環境整潔。';
    }

    // 綜合判定與處置建議
    if (elements.prevOverallRating) {
      elements.prevOverallRating.innerHTML = renderStatusHtml(elements.overallRating.value);
    }
    if (elements.prevActionPlan) {
      elements.prevActionPlan.textContent = elements.actionPlan.value || '屋況維持良好，建議列入下一季定期追蹤';
    }
    if (elements.prevDefectSummary) {
      elements.prevDefectSummary.textContent = elements.defectSummary.value || '本次巡檢各項消防水電結構皆維持合規標準，無急迫性修繕需求。已向承租人宣導夏季高負載用電安全規範。';
    }

    updateSignaturesPreview();
  }

  // 儲存草稿
  function saveDraft() {
    var data = {
      reportNo: elements.reportNo.value,
      inspectDate: elements.inspectDate.value,
      inspectCycle: elements.inspectCycle.value,
      inspectorName: elements.inspectorName.value,
      inspectorCert: elements.inspectorCert.value,
      propertyAddress: elements.propertyAddress.value,
      tenantName: elements.tenantName.value,
      tenantPhone: elements.tenantPhone.value,
      accompanyPerson: elements.accompanyPerson.value,
      smokeAlarmStatus: elements.smokeAlarmStatus.value,
      smokeAlarmNote: elements.smokeAlarmNote.value,
      gasStatus: elements.gasStatus.value,
      gasNote: elements.gasNote.value,
      electricStatus: elements.electricStatus.value,
      electricNote: elements.electricNote.value,
      plumbingStatus: elements.plumbingStatus.value,
      plumbingNote: elements.plumbingNote.value,
      doorStatus: elements.doorStatus.value,
      doorNote: elements.doorNote.value,
      occupancyStatus: elements.occupancyStatus.value,
      occupancyNote: elements.occupancyNote.value,
      overallRating: elements.overallRating.value,
      actionPlan: elements.actionPlan.value,
      defectSummary: elements.defectSummary.value,
      photos: photoData,
      sigInspector: padInspector ? padInspector.toDataURL() : null,
      sigTenant: padTenant ? padTenant.toDataURL() : null,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem('ganju_routine_inspection_draft_v1', JSON.stringify(data));
      showToast('巡檢報告草稿已成功儲存至本機！', 'success');
    } catch (e) {
      showToast('儲存草稿失敗：瀏覽器儲存空間不足', 'error');
    }
  }

  // 讀取草稿
  function loadDraft() {
    var raw = localStorage.getItem('ganju_routine_inspection_draft_v1');
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (data.reportNo) elements.reportNo.value = data.reportNo;
      if (data.inspectDate) elements.inspectDate.value = data.inspectDate;
      if (data.inspectCycle) elements.inspectCycle.value = data.inspectCycle;
      if (data.inspectorName) elements.inspectorName.value = data.inspectorName;
      if (data.inspectorCert) elements.inspectorCert.value = data.inspectorCert;
      if (data.propertyAddress) elements.propertyAddress.value = data.propertyAddress;
      if (data.tenantName) elements.tenantName.value = data.tenantName;
      if (data.tenantPhone) elements.tenantPhone.value = data.tenantPhone;
      if (data.accompanyPerson) elements.accompanyPerson.value = data.accompanyPerson;

      if (data.smokeAlarmStatus) elements.smokeAlarmStatus.value = data.smokeAlarmStatus;
      if (data.smokeAlarmNote) elements.smokeAlarmNote.value = data.smokeAlarmNote;
      if (data.gasStatus) elements.gasStatus.value = data.gasStatus;
      if (data.gasNote) elements.gasNote.value = data.gasNote;
      if (data.electricStatus) elements.electricStatus.value = data.electricStatus;
      if (data.electricNote) elements.electricNote.value = data.electricNote;
      if (data.plumbingStatus) elements.plumbingStatus.value = data.plumbingStatus;
      if (data.plumbingNote) elements.plumbingNote.value = data.plumbingNote;
      if (data.doorStatus) elements.doorStatus.value = data.doorStatus;
      if (data.doorNote) elements.doorNote.value = data.doorNote;
      if (data.occupancyStatus) elements.occupancyStatus.value = data.occupancyStatus;
      if (data.occupancyNote) elements.occupancyNote.value = data.occupancyNote;

      if (data.overallRating) elements.overallRating.value = data.overallRating;
      if (data.actionPlan) elements.actionPlan.value = data.actionPlan;
      if (data.defectSummary) elements.defectSummary.value = data.defectSummary;

      if (data.photos) {
        photoData = data.photos;
        if (photoData.electric && elements.thumbPhotoElectric) {
          elements.thumbPhotoElectric.src = photoData.electric;
          elements.thumbPhotoElectric.style.display = 'block';
          elements.labelPhotoElectric.style.display = 'none';
          elements.prevImgElectric.src = photoData.electric;
          elements.prevImgElectric.style.display = 'block';
        }
        if (photoData.gas && elements.thumbPhotoGas) {
          elements.thumbPhotoGas.src = photoData.gas;
          elements.thumbPhotoGas.style.display = 'block';
          elements.labelPhotoGas.style.display = 'none';
          elements.prevImgGas.src = photoData.gas;
          elements.prevImgGas.style.display = 'block';
        }
        if (photoData.plumbing && elements.thumbPhotoPlumbing) {
          elements.thumbPhotoPlumbing.src = photoData.plumbing;
          elements.thumbPhotoPlumbing.style.display = 'block';
          elements.labelPhotoPlumbing.style.display = 'none';
          elements.prevImgPlumbing.src = photoData.plumbing;
          elements.prevImgPlumbing.style.display = 'block';
        }
        if (photoData.overview && elements.thumbPhotoOverview) {
          elements.thumbPhotoOverview.src = photoData.overview;
          elements.thumbPhotoOverview.style.display = 'block';
          elements.labelPhotoOverview.style.display = 'none';
          elements.prevImgOverview.src = photoData.overview;
          elements.prevImgOverview.style.display = 'block';
        }
      }

      if (data.sigInspector && padInspector) padInspector.fromDataURL(data.sigInspector);
      if (data.sigTenant && padTenant) padTenant.fromDataURL(data.sigTenant);

      syncFormToPreview();
      return true;
    } catch (e) {
      console.warn('載入草稿異常:', e);
      return false;
    }
  }

  // 載入示範資料
  function loadSampleData() {
    elements.reportNo.value = 'IR-20261025-01';
    elements.inspectDate.value = getTodayString();
    elements.inspectCycle.value = '第一季例行巡檢 Q1';
    elements.inspectorName.value = '陳俊銘 經理';
    elements.inspectorCert.value = '(112)登字第013739號';
    elements.propertyAddress.value = '港居愛河灣水岸景觀宅 A棟 12F-3 (高雄市苓雅區海邊路)';
    elements.tenantName.value = '林宇軒';
    elements.tenantPhone.value = '0932-888-999';
    elements.accompanyPerson.value = '承租人親自陪同';

    elements.smokeAlarmStatus.value = 'ok';
    elements.smokeAlarmNote.value = '獨立式住警器測試發報聲響宏亮，逃生走道寬度符合法規無堆放鞋櫃雜物。';

    elements.gasStatus.value = 'ok';
    elements.gasNote.value = '強制排氣熱水器排氣管延伸室外固定良好，瓦斯軟管卡箍扣緊，肥皂水檢驗無洩漏。';

    elements.electricStatus.value = 'ok';
    elements.electricNote.value = '配電盤無異常發熱與跳脫痕跡，廚房高功率插座接地正常，用電負載安全。';

    elements.plumbingStatus.value = 'ok';
    elements.plumbingNote.value = '浴室與陽台落水頭排水通暢，馬桶水箱浮球定位正常無滲水，天花板無壁癌。';

    elements.doorStatus.value = 'warn';
    elements.doorNote.value = '前陽台氣密落地窗左側滑輪微卡阻，建議工務同仁定期保養上油即可順暢。';

    elements.occupancyStatus.value = 'ok';
    elements.occupancyNote.value = '同住成員與登記名冊相符（林先生夫婦與長子），寵物柴犬已植入晶片無擾鄰。';

    elements.overallRating.value = 'ok';
    elements.actionPlan.value = '屋況維持良好，建議列入下一季例行追蹤';
    elements.defectSummary.value = '全室水電、消防瓦斯安全良好，屋況維護極佳。僅陽台落地窗滑輪略有微塵阻力，已現場潤滑處理完畢。承租人生活習慣優異。';

    syncFormToPreview();
    showToast('已載入標準季檢示範資料！', 'info');
  }

  // 清空重填
  function clearDraft() {
    if (confirm('確定要清空目前填寫的巡檢紀錄與簽章嗎？')) {
      localStorage.removeItem('ganju_routine_inspection_draft_v1');
      if (padInspector) padInspector.clear();
      if (padTenant) padTenant.clear();

      elements.reportNo.value = 'IR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01';
      elements.inspectDate.value = getTodayString();
      elements.inspectCycle.value = '第一季例行巡檢 Q1';
      elements.inspectorName.value = '陳俊銘 經理';
      elements.inspectorCert.value = '(112)登字第013739號';
      elements.propertyAddress.value = '';
      elements.tenantName.value = '';
      elements.tenantPhone.value = '';
      elements.accompanyPerson.value = '承租人親自陪同';

      elements.smokeAlarmStatus.value = 'ok';
      elements.smokeAlarmNote.value = '';
      elements.gasStatus.value = 'ok';
      elements.gasNote.value = '';
      elements.electricStatus.value = 'ok';
      elements.electricNote.value = '';
      elements.plumbingStatus.value = 'ok';
      elements.plumbingNote.value = '';
      elements.doorStatus.value = 'ok';
      elements.doorNote.value = '';
      elements.occupancyStatus.value = 'ok';
      elements.occupancyNote.value = '';

      elements.overallRating.value = 'ok';
      elements.actionPlan.value = '屋況維持良好，建議列入下一季例行追蹤';
      elements.defectSummary.value = '';

      photoData = { electric: null, gas: null, plumbing: null, overview: null };
      ['Electric', 'Gas', 'Plumbing', 'Overview'].forEach(function (k) {
        if (elements['thumbPhoto' + k]) elements['thumbPhoto' + k].style.display = 'none';
        if (elements['labelPhoto' + k]) elements['labelPhoto' + k].style.display = 'flex';
        if (elements['prevImg' + k]) elements['prevImg' + k].style.display = 'none';
      });

      syncFormToPreview();
      showToast('已清空巡檢表單內容', 'info');
    }
  }

  // LINE 巡檢成果通報文字複製
  function copyLineText() {
    var rNo = elements.reportNo.value || 'IR-20261025-01';
    var rDate = elements.inspectDate.value || getTodayString();
    var cycle = elements.inspectCycle.value || '季檢';
    var prop = elements.propertyAddress.value || '未填寫物業地址';
    var tenant = elements.tenantName.value || '承租人';
    var inspector = elements.inspectorName.value || '港居專員';
    var overall = elements.overallRating.value === 'ok' ? '🟢 優良良好（無安全顧慮）' :
                  elements.overallRating.value === 'warn' ? '🟡 輕微注意（建議預防維護）' : '🔴 重大異常（需盡速派工修繕）';
    var plan = elements.actionPlan.value || '列入下一季定期追蹤';
    var summary = elements.defectSummary.value || '水電消防運作正常，無急迫修繕。';

    var text = '【港居不動產｜房屋定期巡檢成果通報】\n' +
      '📋 巡檢單號：' + rNo + '\n' +
      '🏢 巡檢標的：' + prop + '\n' +
      '📅 巡檢週期：' + cycle + ' (' + rDate + ')\n' +
      '👤 承租人：' + tenant + ' ｜ 陪同模式：' + elements.accompanyPerson.value + '\n' +
      '🛡️ 巡檢專員：' + inspector + '\n\n' +
      '🔍 六大安全檢驗綜合評定：\n' +
      '・' + overall + '\n' +
      '・處置方針：' + plan + '\n' +
      '📝 屋況摘要：' + summary + '\n\n' +
      '⚖️ 合規保障：本案依《租賃住宅市場發展及管理條例》第28條受託落實定期巡查，守護您的資產安全與居住品質。\n\n' +
      '港居不動產開發有限公司 物業管理部 敬呈\n' +
      '服務專線：0968-863-880';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('已複製 LINE 巡檢通報文字！', 'success');
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
      showToast('已複製 LINE 巡檢通報文字！', 'success');
    } catch (e) {
      showToast('複製失敗，請手動選取複製', 'error');
    }
    document.body.removeChild(ta);
  }

  // Canvas 840×1080px 圖卡生成下載
  function downloadCardImage() {
    var canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, 840, 100);

    // 金色細飾條
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 96, 840, 4);

    // 標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產｜住宅租賃屋況定期巡檢報告', 40, 48);

    ctx.fillStyle = '#dfca9b';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('依據《租賃住宅市場發展及管理條例》第28條受託定期巡查存查', 40, 78);

    // 單號與日期
    ctx.fillStyle = '#718096';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('報告單號：' + (elements.reportNo.value || 'IR-20261025-01'), 800, 48);
    ctx.fillText('巡檢日期：' + (elements.inspectDate.value || getTodayString()), 800, 78);
    ctx.textAlign = 'left';

    // 資訊方塊 (物業與人員)
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(40, 120, 760, 110);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 120, 760, 110);

    ctx.fillStyle = '#1a202c';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('🏢 巡檢標的物：' + (elements.propertyAddress.value || '未填寫物業地址'), 55, 150);

    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#4a5568';
    ctx.fillText('📅 巡檢週期：' + (elements.inspectCycle.value || '第一季例行巡檢 Q1') + ' ｜ 陪同模式：' + (elements.accompanyPerson.value || '承租人親自陪同'), 55, 180);
    ctx.fillText('👤 承租人：' + (elements.tenantName.value || '承租人') + ' (' + (elements.tenantPhone.value || '無電話') + ') ｜ 巡檢專員：' + (elements.inspectorName.value || '陳俊銘 經理'), 55, 210);

    // 六大安全指標清冊
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('【六大核心安全與設施檢驗結果】', 40, 260);

    var matrixItems = [
      { name: '1. 消防與住警設備', val: elements.smokeAlarmStatus.value, note: elements.smokeAlarmNote.value },
      { name: '2. 瓦斯與熱水器排氣', val: elements.gasStatus.value, note: elements.gasNote.value },
      { name: '3. 配電盤與用電負載', val: elements.electricStatus.value, note: elements.electricNote.value },
      { name: '4. 給排水與防水滲漏', val: elements.plumbingStatus.value, note: elements.plumbingNote.value },
      { name: '5. 門窗結構與隨附家電', val: elements.doorStatus.value, note: elements.doorNote.value },
      { name: '6. 居住秩序與環境整潔', val: elements.occupancyStatus.value, note: elements.occupancyNote.value }
    ];

    var startY = 280;
    matrixItems.forEach(function (item, idx) {
      var rowY = startY + idx * 46;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(40, rowY, 760, 42);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(40, rowY, 760, 42);

      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
      ctx.fillText(item.name, 55, rowY + 26);

      var isOk = item.val === 'ok' || item.val.indexOf('正常') !== -1;
      var isWarn = item.val === 'warn' || item.val.indexOf('注意') !== -1;

      ctx.fillStyle = isOk ? '#22543d' : isWarn ? '#744210' : '#742a2a';
      ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
      var statusTxt = isOk ? '🟢 良好正常' : isWarn ? '🟡 需留意改善' : '🔴 瑕疵異常';
      ctx.fillText(statusTxt, 230, rowY + 26);

      ctx.fillStyle = '#4a5568';
      ctx.font = '12px "Noto Sans TC", sans-serif';
      var noteStr = item.note || '現場巡查正常無異常發現。';
      if (noteStr.length > 28) noteStr = noteStr.slice(0, 28) + '...';
      ctx.fillText(noteStr, 340, rowY + 26);
    });

    // 綜合診斷與處置建議
    var diagY = 575;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(40, diagY, 760, 100);
    ctx.strokeStyle = '#feebc8';
    ctx.strokeRect(40, diagY, 760, 100);

    ctx.fillStyle = '#9c4221';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('🎯 巡檢專員綜合評定與處置對策：', 55, diagY + 28);

    ctx.fillStyle = '#744210';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText('評定等級：' + (elements.overallRating.value === 'ok' ? '🟢 優良良好（無安全顧慮）' : '🟡 需預防維護') + ' ｜ 方針：' + (elements.actionPlan.value || '下一季例行追蹤'), 55, diagY + 54);

    var defText = elements.defectSummary.value || '屋況維持良好，消防電氣均符合規範。';
    if (defText.length > 45) defText = defText.slice(0, 45) + '...';
    ctx.fillText('巡檢備忘：' + defText, 55, diagY + 80);

    // 現場存證照片縮圖區
    var photoY = 690;
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('📷 關鍵部位現場存證照片：', 40, photoY);

    var pList = [
      { key: 'electric', name: '配電盤' },
      { key: 'gas', name: '熱水器' },
      { key: 'plumbing', name: '衛浴給水' },
      { key: 'overview', name: '整體屋況' }
    ];

    var pLoaded = 0;
    var pTotal = 4;

    function drawSignaturesAndFinish() {
      // 底部簽章區
      var signY = 880;
      ctx.strokeStyle = '#cbd5e0';
      ctx.beginPath();
      ctx.moveTo(40, signY);
      ctx.lineTo(800, signY);
      ctx.stroke();

      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
      ctx.fillText('巡檢專員簽章：', 55, signY + 30);
      ctx.fillText('承租人確認簽章：', 440, signY + 30);

      var iSig = padInspector ? padInspector.toDataURL() : null;
      var tSig = padTenant ? padTenant.toDataURL() : null;

      var sigLoaded = 0;
      var sigTotal = (iSig ? 1 : 0) + (tSig ? 1 : 0);

      function exportFinal() {
        // 頁尾官方標記
        ctx.fillStyle = '#718096';
        ctx.font = '12px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司 GANJU REAL ESTATE ｜ 統編：96797997 ｜ 服務專線：0968-863-880', 420, 1045);
        ctx.fillText('本報告依《個人資料保護法》本機運算產生・零上傳雲端保證個資隱私安全', 420, 1065);

        var link = document.createElement('a');
        link.download = '港居定期巡檢報告書_' + (elements.reportNo.value || 'IR-20261025-01') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('已下載 840×1080px 巡檢成果圖卡！', 'success');
      }

      if (sigTotal === 0) {
        exportFinal();
      } else {
        if (iSig) {
          var imgI = new Image();
          imgI.onload = function () {
            ctx.drawImage(imgI, 55, signY + 38, 140, 48);
            sigLoaded++;
            if (sigLoaded >= sigTotal) exportFinal();
          };
          imgI.src = iSig;
        }
        if (tSig) {
          var imgT = new Image();
          imgT.onload = function () {
            ctx.drawImage(imgT, 440, signY + 38, 140, 48);
            sigLoaded++;
            if (sigLoaded >= sigTotal) exportFinal();
          };
          imgT.src = tSig;
        }
      }
    }

    pList.forEach(function (pItem, pIdx) {
      var boxX = 40 + pIdx * 195;
      var boxY = photoY + 15;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(boxX, boxY, 180, 145);
      ctx.strokeStyle = '#cbd5e0';
      ctx.strokeRect(boxX, boxY, 180, 145);

      var pUrl = photoData[pItem.key];
      if (pUrl) {
        var pImg = new Image();
        pImg.onload = function () {
          ctx.drawImage(pImg, boxX + 5, boxY + 5, 170, 110);
          ctx.fillStyle = '#4a5568';
          ctx.font = '12px "Noto Sans TC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pItem.name + ' [已存證]', boxX + 90, boxY + 133);
          ctx.textAlign = 'left';
          pLoaded++;
          if (pLoaded >= pTotal) drawSignaturesAndFinish();
        };
        pImg.src = pUrl;
      } else {
        ctx.fillStyle = '#a0aec0';
        ctx.font = '12px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('[無相片]', boxX + 90, boxY + 65);
        ctx.fillText(pItem.name, boxX + 90, boxY + 85);
        ctx.textAlign = 'left';
        pLoaded++;
        if (pLoaded >= pTotal) drawSignaturesAndFinish();
      }
    });
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

  // 初始化事件綁定
  function initEvents() {
    // 簽名板實例化
    if (elements.canvasInspector) {
      padInspector = new SignaturePad(elements.canvasInspector, updateSignaturesPreview);
      elements.btnClearInspector.addEventListener('click', function () {
        padInspector.clear();
      });
    }

    if (elements.canvasTenant) {
      padTenant = new SignaturePad(elements.canvasTenant, updateSignaturesPreview);
      elements.btnClearTenant.addEventListener('click', function () {
        padTenant.clear();
      });
    }

    // 相片上傳監聽
    if (elements.inputPhotoElectric) {
      elements.inputPhotoElectric.addEventListener('change', function (e) {
        handlePhotoUpload(e.target.files[0], 'electric', elements.thumbPhotoElectric, elements.labelPhotoElectric, elements.prevImgElectric);
      });
    }

    if (elements.inputPhotoGas) {
      elements.inputPhotoGas.addEventListener('change', function (e) {
        handlePhotoUpload(e.target.files[0], 'gas', elements.thumbPhotoGas, elements.labelPhotoGas, elements.prevImgGas);
      });
    }

    if (elements.inputPhotoPlumbing) {
      elements.inputPhotoPlumbing.addEventListener('change', function (e) {
        handlePhotoUpload(e.target.files[0], 'plumbing', elements.thumbPhotoPlumbing, elements.labelPhotoPlumbing, elements.prevImgPlumbing);
      });
    }

    if (elements.inputPhotoOverview) {
      elements.inputPhotoOverview.addEventListener('change', function (e) {
        handlePhotoUpload(e.target.files[0], 'overview', elements.thumbPhotoOverview, elements.labelPhotoOverview, elements.prevImgOverview);
      });
    }

    // 表單各輸入欄位即時連動預覽
    var inputList = [
      elements.reportNo, elements.inspectDate, elements.inspectCycle,
      elements.inspectorName, elements.inspectorCert, elements.propertyAddress,
      elements.tenantName, elements.tenantPhone, elements.accompanyPerson,
      elements.smokeAlarmStatus, elements.smokeAlarmNote,
      elements.gasStatus, elements.gasNote,
      elements.electricStatus, elements.electricNote,
      elements.plumbingStatus, elements.plumbingNote,
      elements.doorStatus, elements.doorNote,
      elements.occupancyStatus, elements.occupancyNote,
      elements.overallRating, elements.actionPlan, elements.defectSummary
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
    if (!elements.inspectDate.value) elements.inspectDate.value = getTodayString();

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
