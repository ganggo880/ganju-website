/**
 * 住宅租賃用電用火安全暨失火責任切結協議書核心邏輯引擎
 * fire-safety-agreement.js
 * 港居不動產開發有限公司 - 零後端本地運算
 */

(function () {
  'use strict';

  // 繁體中文金融大寫數字對照表
  var DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  var UNITS = ['', '拾', '佰', '仟'];
  var BIG_UNITS = ['', '萬', '億'];

  function toFinancialChinese(num) {
    num = parseInt(num, 10);
    if (isNaN(num) || num === 0) return '零元整';
    if (num < 0) return '負' + toFinancialChinese(Math.abs(num));

    var str = num.toString();
    var parts = [];
    while (str.length > 0) {
      parts.push(str.slice(-4));
      str = str.slice(0, -4);
    }

    var result = '';
    for (var i = parts.length - 1; i >= 0; i--) {
      var part = parts[i];
      var partStr = '';
      var partZero = false;

      for (var j = 0; j < part.length; j++) {
        var digit = parseInt(part[j], 10);
        var unitIdx = part.length - 1 - j;

        if (digit === 0) {
          partZero = true;
        } else {
          if (partZero) {
            partStr += '零';
            partZero = false;
          }
          partStr += DIGITS[digit] + UNITS[unitIdx];
        }
      }

      if (partStr !== '') {
        result += partStr + BIG_UNITS[i];
      }
    }

    return '新臺幣 ' + result + '元整';
  }

  function formatMoney(num) {
    var val = parseInt(num, 10);
    if (isNaN(val)) return '0';
    return val.toLocaleString('zh-TW');
  }

  // 簽名板類別 (Retina 2x 支援)
  function SignaturePad(canvasId, clearBtnId, previewImgId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.clearBtn = document.getElementById(clearBtnId);
    this.previewImg = document.getElementById(previewImgId);
    this.isDrawing = false;
    this.hasDrawn = false;

    this.initCanvas();
    this.bindEvents();
  }

  SignaturePad.prototype.initCanvas = function () {
    var rect = this.canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0F172A';
    this.ctx.lineWidth = 2.5;
  };

  SignaturePad.prototype.getPos = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var clientX = e.clientX;
    var clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  SignaturePad.prototype.bindEvents = function () {
    var self = this;

    function start(e) {
      e.preventDefault();
      self.isDrawing = true;
      var pos = self.getPos(e);
      self.ctx.beginPath();
      self.ctx.moveTo(pos.x, pos.y);
    }

    function move(e) {
      if (!self.isDrawing) return;
      e.preventDefault();
      var pos = self.getPos(e);
      self.ctx.lineTo(pos.x, pos.y);
      self.ctx.stroke();
      self.hasDrawn = true;
    }

    function end(e) {
      if (!self.isDrawing) return;
      self.isDrawing = false;
      self.updatePreview();
    }

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', start, { passive: false });
    this.canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', function () {
        self.clear();
      });
    }

    window.addEventListener('resize', function () {
      if (!self.hasDrawn) {
        self.initCanvas();
      }
    });
  };

  SignaturePad.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasDrawn = false;
    if (this.previewImg) {
      this.previewImg.style.display = 'none';
      this.previewImg.src = '';
    }
  };

  SignaturePad.prototype.updatePreview = function () {
    if (this.previewImg && this.hasDrawn) {
      this.previewImg.src = this.canvas.toDataURL('image/png');
      this.previewImg.style.display = 'block';
    }
  };

  SignaturePad.prototype.getImageData = function () {
    return this.hasDrawn ? this.canvas.toDataURL('image/png') : null;
  };

  // 全域 App 核心邏輯
  var app = {
    sigLandlord: null,
    sigTenant: null,
    appliances: [
      { name: '瞬熱式微電腦電暖器', wattage: 1200, location: '主臥室', dedicated: true },
      { name: '高溫多功能氣炸鍋', wattage: 1400, location: '廚房流理台', dedicated: true },
      { name: '微波爐 (800W輸出)', wattage: 1150, location: '廚房電器櫃', dedicated: true }
    ],

    init: function () {
      this.bindInputs();
      this.renderApplianceTable();
      this.bindApplianceEvents();
      this.initSignaturePads();
      this.bindActions();
      this.recalcAndRender();
    },

    bindInputs: function () {
      var self = this;
      var inputIds = [
        'docNumber', 'agreementDate', 'propertyAddress', 'leaseTerm',
        'landlordName', 'landlordId', 'landlordPhone', 'landlordAddress',
        'tenantName', 'tenantId', 'tenantPhone', 'tenantAddress',
        'chkArticle434Exclusion', 'insuranceOption', 'firePenaltyAmount',
        'ruleExtCord', 'ruleHighPower', 'ruleAlarmCheck',
        'ruleIncenseCandle', 'ruleGasVent', 'ruleHazardMaterials'
      ];

      inputIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function () {
            self.recalcAndRender();
          });
          el.addEventListener('change', function () {
            self.recalcAndRender();
          });
        }
      });
    },

    bindApplianceEvents: function () {
      var self = this;
      var btnAdd = document.getElementById('btnAddAppliance');
      if (btnAdd) {
        btnAdd.addEventListener('click', function () {
          var nameInput = document.getElementById('newAppName');
          var wattInput = document.getElementById('newAppWatt');
          var locInput = document.getElementById('newAppLoc');
          var dedInput = document.getElementById('newAppDedicated');

          var name = (nameInput && nameInput.value.trim()) || '未命名電器';
          var watt = (wattInput && parseInt(wattInput.value, 10)) || 1000;
          var loc = (locInput && locInput.value.trim()) || '客廳';
          var ded = dedInput ? dedInput.checked : true;

          self.appliances.push({
            name: name,
            wattage: watt,
            location: loc,
            dedicated: ded
          });

          if (nameInput) nameInput.value = '';
          if (wattInput) wattInput.value = '';
          if (locInput) locInput.value = '';

          self.renderApplianceTable();
          self.recalcAndRender();
        });
      }
    },

    renderApplianceTable: function () {
      var self = this;
      var tbody = document.getElementById('applianceTableBody');
      if (!tbody) return;

      tbody.innerHTML = '';
      if (this.appliances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:12px;">尚未登錄任何高耗能電器（無攜帶高功率電器切結）</td></tr>';
        return;
      }

      this.appliances.forEach(function (item, index) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><strong>' + self.escapeHtml(item.name) + '</strong></td>' +
          '<td>' + item.wattage + ' W</td>' +
          '<td>' + self.escapeHtml(item.location) + '</td>' +
          '<td style="text-align:center;">' + (item.dedicated ? '<span style="color:#059669; font-weight:700;">✓ 獨立專插</span>' : '<span style="color:#DC2626;">✕ 延長線</span>') + '</td>' +
          '<td style="text-align:center;"><button type="button" class="btn-del-item" data-index="' + index + '"><i class="fa-solid fa-trash"></i> 移除</button></td>';
        tbody.appendChild(tr);
      });

      var delButtons = tbody.querySelectorAll('.btn-del-item');
      delButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          self.appliances.splice(idx, 1);
          self.renderApplianceTable();
          self.recalcAndRender();
        });
      });
    },

    initSignaturePads: function () {
      this.sigLandlord = new SignaturePad('canvasLandlord', 'btnClearLandlord', 'imgPreviewLandlord');
      this.sigTenant = new SignaturePad('canvasTenant', 'btnClearTenant', 'imgPreviewTenant');
    },

    getValues: function () {
      var chk434 = document.getElementById('chkArticle434Exclusion');
      var is434Excluded = chk434 ? chk434.checked : true;

      var insOpt = document.getElementById('insuranceOption');
      var insVal = insOpt ? insOpt.value : 'tenant';

      var penaltyVal = document.getElementById('firePenaltyAmount');
      var penaltyNum = penaltyVal ? parseInt(penaltyVal.value, 10) : 300000;
      if (isNaN(penaltyNum)) penaltyNum = 300000;

      return {
        docNumber: document.getElementById('docNumber').value || 'GANJU-FIRE-20261025',
        agreementDate: document.getElementById('agreementDate').value || '2026-10-25',
        propertyAddress: document.getElementById('propertyAddress').value || '高雄市小港區中安路888號5樓之2',
        leaseTerm: document.getElementById('leaseTerm').value || '自民國 115 年 11 月 01 日起至民國 116 年 10 月 31 日止',
        landlordName: document.getElementById('landlordName').value || '陳美蘭',
        landlordId: document.getElementById('landlordId').value || 'E220198***',
        landlordPhone: document.getElementById('landlordPhone').value || '0912-345-678',
        landlordAddress: document.getElementById('landlordAddress').value || '高雄市苓雅區四維三路2號',
        tenantName: document.getElementById('tenantName').value || '黃柏鈞',
        tenantId: document.getElementById('tenantId').value || 'S129845***',
        tenantPhone: document.getElementById('tenantPhone').value || '0975-123-888',
        tenantAddress: document.getElementById('tenantAddress').value || '高雄市小港區宏治路168號',
        is434Excluded: is434Excluded,
        insuranceOption: insVal,
        firePenaltyAmount: penaltyNum,
        rules: {
          extCord: document.getElementById('ruleExtCord') ? document.getElementById('ruleExtCord').checked : true,
          highPower: document.getElementById('ruleHighPower') ? document.getElementById('ruleHighPower').checked : true,
          alarmCheck: document.getElementById('ruleAlarmCheck') ? document.getElementById('ruleAlarmCheck').checked : true,
          incenseCandle: document.getElementById('ruleIncenseCandle') ? document.getElementById('ruleIncenseCandle').checked : true,
          gasVent: document.getElementById('ruleGasVent') ? document.getElementById('ruleGasVent').checked : true,
          hazardMaterials: document.getElementById('ruleHazardMaterials') ? document.getElementById('ruleHazardMaterials').checked : true
        }
      };
    },

    recalcAndRender: function () {
      var v = this.getValues();

      // 更新大寫標籤
      var penaltyUpper = document.getElementById('penaltyUpper');
      if (penaltyUpper) {
        penaltyUpper.textContent = toFinancialChinese(v.firePenaltyAmount);
      }

      // 更新預覽公文內容
      var pvDocNo = document.getElementById('pvDocNo');
      if (pvDocNo) pvDocNo.textContent = v.docNumber;

      var pvDate = document.getElementById('pvDate');
      if (pvDate) pvDate.textContent = v.agreementDate;

      var pvAddress = document.getElementById('pvAddress');
      if (pvAddress) pvAddress.textContent = v.propertyAddress;

      var pvLeaseTerm = document.getElementById('pvLeaseTerm');
      if (pvLeaseTerm) pvLeaseTerm.textContent = v.leaseTerm;

      var pvLandlordName = document.getElementById('pvLandlordName');
      if (pvLandlordName) pvLandlordName.textContent = v.landlordName;
      var pvLandlordId = document.getElementById('pvLandlordId');
      if (pvLandlordId) pvLandlordId.textContent = v.landlordId;
      var pvLandlordPhone = document.getElementById('pvLandlordPhone');
      if (pvLandlordPhone) pvLandlordPhone.textContent = v.landlordPhone;

      var pvTenantName = document.getElementById('pvTenantName');
      if (pvTenantName) pvTenantName.textContent = v.tenantName;
      var pvTenantId = document.getElementById('pvTenantId');
      if (pvTenantId) pvTenantId.textContent = v.tenantId;
      var pvTenantPhone = document.getElementById('pvTenantPhone');
      if (pvTenantPhone) pvTenantPhone.textContent = v.tenantPhone;

      // 特約條款更新 (民法 434 條)
      var pvArticle434Text = document.getElementById('pvArticle434Text');
      if (pvArticle434Text) {
        if (v.is434Excluded) {
          pvArticle434Text.innerHTML = '<strong style="color:#DC2626;">【特別合意排除民法第434條重大過失限制】</strong><br>' +
            '依最高法院判例見解，《民法》第434條失火責任之規定非強行規定，雙方特此合意排除適用。承租人承諾以「善良管理人之高度注意義務」使用保管租賃物。<strong>承租人縱因輕過失（包含但不限於電器未關、延長線串接過載、香燭傾倒、未熄煙蒂、鍋爐空燒等）致租賃物失火毀損滅失，承租人均應對出租人負完全賠償責任</strong>，絕不以民法第434條重大過失原則主張免責。';
        } else {
          pvArticle434Text.innerHTML = '<strong>【法定重大過失責任】</strong><br>' +
            '雙方依《民法》第434條之規定，租賃物因承租人之重大過失致失火而毀損滅失者，承租人對於出租人負損害賠償責任。承租人仍應依第432條盡善良管理人保管責任。';
        }
      }

      // 保險與違約賠償條款
      var pvInsuranceText = document.getElementById('pvInsuranceText');
      if (pvInsuranceText) {
        var insDesc = '';
        if (v.insuranceOption === 'tenant') {
          insDesc = '承租人同意於起租日前自費向產物保險公司投保「承租人火災責任附加保險」（保額不得低於新臺幣 500 萬元整），並將保單影本交出租人備查。';
        } else if (v.insuranceOption === 'landlord_share') {
          insDesc = '租賃物由出租人投保住宅火災及地震保險，承租人同意按年分攤火險保費之 50%，若因承租人過失失火致保險公司行使代位求償，承租人無異議承受。';
        } else {
          insDesc = '租賃雙方維持一般保險約定，倘因承租人過失致租賃物毀損，承租人負全部損害賠償之責。';
        }
        pvInsuranceText.innerHTML = insDesc + '<br>若違反本協議安全守則經查證屬實且未於 24 小時內改善，承租人同意支付懲罰性違約金 <strong>' + toFinancialChinese(v.firePenaltyAmount) + '（NT$ ' + formatMoney(v.firePenaltyAmount) + '）</strong>，出租人並得依法終止租賃契約。';
      }

      // 守則預覽清單
      var pvRulesList = document.getElementById('pvRulesList');
      if (pvRulesList) {
        var rHtml = '<ol style="margin: 0; padding-left: 20px;">';
        rHtml += '<li><strong>高耗能電器專插管制：</strong>耗電達 800W 以上高功率電器（暖氣、氣炸鍋、微波爐、烤箱等）必須使用獨立壁面插座，嚴禁串接延長線。使用完畢或離家必須確實拔除插頭或關閉開關。</li>';
        rHtml += '<li><strong>延長線嚴格安全標準：</strong>室內使用之延長線必須具備經濟部標準檢驗局 BSMI 認證，附帶過載自動斷電保護開關，嚴禁延長線「多重串接」或藏匿於地毯、床墊等易燃物下方。</li>';
        rHtml += '<li><strong>住宅用火災警報器維護：</strong>依《消防法》第6條第4項規定，承租人應每季按壓測試住警器蜂鳴測試鈕一次，若警報器發出弱電嗶聲，應立即自行更換鋰電池，嚴禁私自拆卸或用塑膠袋遮蓋。</li>';
        rHtml += '<li><strong>神明桌與明火禁令：</strong>' + (v.rules.incenseCandle ? '<span style="color:#DC2626; font-weight:700;">【全面禁絕香燭明火】</span>全戶嚴禁設置神明桌點燃香火、長明油燈或蠟燭，嚴禁室內燒香拜拜或燃燒紙錢。' : '室內得設置無明火LED神龕，倘點燃香火必須有人在場監控，離開視線即刻熄滅。') + '</li>';
        rHtml += '<li><strong>瓦斯防空燒與熱水器排氣通風：</strong>廚房炊事時人絕不可離開視線；瓦斯熱水器必須確認強制排氣功能正常，工作陽台及排氣管周邊嚴禁加裝氣密窗封閉或堆置雜物阻礙通風。</li>';
        rHtml += '<li><strong>危險易燃物存放禁令：</strong>嚴禁在租賃處所堆置汽油、煤油、大量高濃度酒精、瓦斯鋼瓶、煙火爆竹等各類法定危險易燃物品。</li>';
        rHtml += '</ol>';
        pvRulesList.innerHTML = rHtml;
      }

      // 預覽電器列表
      var pvAppList = document.getElementById('pvApplianceList');
      if (pvAppList) {
        if (this.appliances.length === 0) {
          pvAppList.innerHTML = '<p style="color:#64748B; font-style:italic;">承租人具結聲明：本戶未攜帶及使用任何額外之 800W 以上高功率發熱電器設備。</p>';
        } else {
          var tHtml = '<table class="doc-table"><thead><tr><th>電器設備名稱</th><th>額定功率 (W)</th><th>安置空間位置</th><th>供電插座規範</th></tr></thead><tbody>';
          this.appliances.forEach(function (app) {
            tHtml += '<tr><td><strong>' + app.name + '</strong></td><td>' + app.wattage + ' W</td><td>' + app.location + '</td><td>' + (app.dedicated ? '獨立壁面插座（合格）' : '<span style="color:#DC2626;">待改善（限改專插）</span>') + '</td></tr>';
          });
          tHtml += '</tbody></table>';
          pvAppList.innerHTML = tHtml;
        }
      }
    },

    bindActions: function () {
      var self = this;

      // 1. 列印
      var btnPrint = document.getElementById('btnPrintDoc');
      if (btnPrint) {
        btnPrint.addEventListener('click', function () {
          window.print();
        });
      }

      // 2. 下載圖卡
      var btnDownload = document.getElementById('btnDownloadCard');
      if (btnDownload) {
        btnDownload.addEventListener('click', function () {
          self.generateAndDownloadCard();
        });
      }

      // 3. 複製 LINE 備忘
      var btnCopyLine = document.getElementById('btnCopyLine');
      if (btnCopyLine) {
        btnCopyLine.addEventListener('click', function () {
          self.copyLineText();
        });
      }
    },

    copyLineText: function () {
      var v = this.getValues();
      var msg = '【港居不動產 住宅用電用火安全暨失火責任切結存證】\n' +
        '------------------------------------\n' +
        '📄 存證協議編號：' + v.docNumber + '\n' +
        '📅 簽署協議日期：' + v.agreementDate + '\n' +
        '🏠 租賃標的地址：' + v.propertyAddress + '\n' +
        '👤 出租人代表：' + v.landlordName + ' (' + v.landlordPhone + ')\n' +
        '👤 承租人具結：' + v.tenantName + ' (' + v.tenantPhone + ')\n' +
        '------------------------------------\n' +
        '⚡ 民法第434條特約：' + (v.is434Excluded ? '【合意排除重大過失】承租人因輕過失致失火亦負全額賠償責任' : '依民法重大過失規範') + '\n' +
        '🔥 火災保險與違約：違反約定罰則 ' + toFinancialChinese(v.firePenaltyAmount) + '（NT$' + formatMoney(v.firePenaltyAmount) + '）\n' +
        '------------------------------------\n' +
        '📋 申報列管高耗能電器：\n';

      if (this.appliances.length === 0) {
        msg += '• 承租人切結未攜帶額外高功率電器\n';
      } else {
        this.appliances.forEach(function (app, i) {
          msg += (i + 1) + '. ' + app.name + ' (' + app.wattage + 'W, ' + app.location + ' - ' + (app.dedicated ? '獨立專插' : '待改專插') + ')\n';
        });
      }

      msg += '------------------------------------\n' +
        '⚠️ 安全維護承諾六大準則：\n' +
        '1. 高功率電器限獨立壁插，嚴禁串接延長線。\n' +
        '2. 住警器每季定期檢測電池，絕不私自拆卸。\n' +
        '3. 嚴禁室內明火拜拜與燃燒香燭紙錢。\n' +
        '4. 瓦斯熱水器強排暢通，嚴禁封閉窗戶。\n' +
        '5. 承租人簽名確認並承擔善良管理人照護全責。\n' +
        '------------------------------------\n' +
        '港居不動產開發有限公司 敬啟（純前端安全存證）';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(function () {
          alert('✅ 已成功複製用電用火安全協議 LINE 存證備忘文字！可直接貼至 LINE 房東/租客群組。');
        }).catch(function () {
          alert('文字已準備完成：\n\n' + msg);
        });
      } else {
        alert('文字已準備完成：\n\n' + msg);
      }
    },

    generateAndDownloadCard: function () {
      var v = this.getValues();
      var canvas = document.createElement('canvas');
      var width = 840;
      var height = 1180;
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');

      // 背景色
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 頂部紅色品牌邊條
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(0, 0, width, 14);

      // 頂部橫幅背景
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 14, width, 100);

      // 頂部橫幅文字
      ctx.fillStyle = '#64748B';
      ctx.font = '600 14px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司 ｜ 租賃法務安防存證公文', 40, 48);

      ctx.fillStyle = '#991B1B';
      ctx.font = '800 24px "Noto Sans TC", sans-serif';
      ctx.fillText('住宅租賃用電用火安全暨失火責任切結協議書', 40, 84);

      // 右上角存證標籤
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(width - 190, 40, 150, 32);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 13px "Noto Sans TC", sans-serif';
      ctx.fillText('民法第434條特約', width - 175, 61);

      // 分隔線
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 125);
      ctx.lineTo(width - 40, 125);
      ctx.stroke();

      // 基本協議資訊方塊
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(40, 140, width - 80, 110);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(40, 140, width - 80, 110);

      ctx.fillStyle = '#1A365D';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      ctx.fillText('協議存證編號：' + v.docNumber, 55, 168);
      ctx.fillText('簽署生效日期：' + v.agreementDate, 440, 168);

      ctx.font = '500 14px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('租賃標的物：' + v.propertyAddress, 55, 198);
      ctx.fillText('租賃合約期：' + v.leaseTerm, 55, 228);

      // 雙方當事人列
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(40, 260, (width - 90) / 2, 70);
      ctx.strokeRect(40, 260, (width - 90) / 2, 70);
      ctx.fillStyle = '#1A365D';
      ctx.font = '700 14px "Noto Sans TC", sans-serif';
      ctx.fillText('出租人 (甲方)：' + v.landlordName, 55, 285);
      ctx.font = '400 13px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('身分證號：' + v.landlordId + '  電話：' + v.landlordPhone, 55, 310);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(width / 2 + 5, 260, (width - 90) / 2, 70);
      ctx.strokeRect(width / 2 + 5, 260, (width - 90) / 2, 70);
      ctx.fillStyle = '#1A365D';
      ctx.font = '700 14px "Noto Sans TC", sans-serif';
      ctx.fillText('承租人 (乙方)：' + v.tenantName, width / 2 + 20, 285);
      ctx.font = '400 13px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('身分證號：' + v.tenantId + '  電話：' + v.tenantPhone, width / 2 + 20, 310);

      // 第一重核心特約：民法 434 排除
      ctx.fillStyle = '#FEF2F2';
      ctx.fillRect(40, 345, width - 80, 110);
      ctx.strokeStyle = '#FCA5A5';
      ctx.strokeRect(40, 345, width - 80, 110);

      ctx.fillStyle = '#DC2626';
      ctx.font = '800 15px "Noto Sans TC", sans-serif';
      ctx.fillText('★ 關鍵特約：合意排除民法第434條重大過失限制宣告', 55, 372);

      ctx.font = '400 13px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#7F1D1D';
      var lawDesc = '立協議書人合意排除《民法》第434條之重大過失責任限制。承租人承諾以善良管理人注意義務使用租賃處所；';
      var lawDesc2 = '若因輕微過失（包含未拔插頭、電線負載過載、香火傾倒、鍋爐空燒等）引發火災致租賃物毀損，承租人均應負完全賠償責任。';
      var lawDesc3 = '違規懲罰性違約金：' + toFinancialChinese(v.firePenaltyAmount) + '（NT$' + formatMoney(v.firePenaltyAmount) + '）。';
      ctx.fillText(lawDesc, 55, 396);
      ctx.fillText(lawDesc2, 55, 418);
      ctx.fillText(lawDesc3, 55, 440);

      // 六大安全規範條款
      ctx.fillStyle = '#1A365D';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      ctx.fillText('二、用電用火安全維護恪遵要項', 40, 480);

      var rulesY = 505;
      var safetyRules = [
        '1. 高功率電器 (800W+) 限用獨立壁面專插，使用完畢確實拔除插頭。',
        '2. 嚴禁延長線多重串聯，禁用未附過載斷電之雜牌延長線。',
        '3. 住宅用火災警報器依消防法每季測試，弱電立即換裝鋰電池，絕不拆除。',
        '4. 室內全面禁絕明火祭祀、燒香點燭與燃燒金紙，維護鄰里居家安寧。',
        '5. 瓦斯熱水器強排通風孔道嚴禁私設氣密窗遮蔽，炊事防空燒。',
        '6. 嚴禁存放汽油、易燃溶劑或超量高壓瓦斯鋼瓶等各類危險物品。'
      ];

      ctx.font = '400 13px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#334155';
      safetyRules.forEach(function (r) {
        ctx.fillText(r, 55, rulesY);
        rulesY += 24;
      });

      // 高功率電器登錄表格
      ctx.fillStyle = '#1A365D';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      ctx.fillText('三、申報列管高功率發熱電器清冊', 40, 675);

      // 表頭
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(40, 690, width - 80, 28);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(40, 690, width - 80, 28);

      ctx.fillStyle = '#1A365D';
      ctx.font = '700 13px "Noto Sans TC", sans-serif';
      ctx.fillText('電器名稱', 55, 709);
      ctx.fillText('額定瓦數 (W)', 280, 709);
      ctx.fillText('擺放位置', 440, 709);
      ctx.fillText('插座規格與狀態', 600, 709);

      var tableY = 718;
      if (this.appliances.length === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(40, tableY, width - 80, 30);
        ctx.strokeRect(40, tableY, width - 80, 30);
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'italic 13px "Noto Sans TC", sans-serif';
        ctx.fillText('承租人聲明無攜帶 800W 以上高耗能電器', 55, tableY + 20);
        tableY += 30;
      } else {
        var selfApp = this.appliances.slice(0, 4); // 最多畫 4 項避免擠壓簽名區
        selfApp.forEach(function (item) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(40, tableY, width - 80, 28);
          ctx.strokeRect(40, tableY, width - 80, 28);

          ctx.fillStyle = '#1E293B';
          ctx.font = '500 13px "Noto Sans TC", sans-serif';
          ctx.fillText(item.name, 55, tableY + 19);
          ctx.fillText(item.wattage + ' W', 280, tableY + 19);
          ctx.fillText(item.location, 440, tableY + 19);

          if (item.dedicated) {
            ctx.fillStyle = '#059669';
            ctx.fillText('✓ 獨立專用壁插', 600, tableY + 19);
          } else {
            ctx.fillStyle = '#DC2626';
            ctx.fillText('✕ 需限期改專插', 600, tableY + 19);
          }
          tableY += 28;
        });
      }

      // 簽名簽署欄
      var sigBlockY = 880;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(40, sigBlockY, width - 80, 180);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(40, sigBlockY, width - 80, 180);

      ctx.fillStyle = '#1A365D';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      ctx.fillText('立協議書人正式親筆手寫電子簽章', 55, sigBlockY + 28);

      // 出租人簽名方塊
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(55, sigBlockY + 45, 330, 110);
      ctx.strokeRect(55, sigBlockY + 45, 330, 110);
      ctx.fillStyle = '#64748B';
      ctx.font = '600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('出租人 / 授權管理業者 (港居不動產) 簽署：', 65, sigBlockY + 65);

      // 承租人簽名方塊
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(445, sigBlockY + 45, 330, 110);
      ctx.strokeRect(445, sigBlockY + 45, 330, 110);
      ctx.fillStyle = '#64748B';
      ctx.font = '600 12px "Noto Sans TC", sans-serif';
      ctx.fillText('承租人 (連帶安全切結人) 親筆簽署：', 455, sigBlockY + 65);

      // 港居紅色公章
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(310, sigBlockY + 70, 70, 70);
      ctx.fillStyle = '#DC2626';
      ctx.font = '700 11px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產', 315, sigBlockY + 95);
      ctx.fillText('安全安檢章', 315, sigBlockY + 115);
      ctx.fillText('合約存證', 320, sigBlockY + 130);

      // 頁尾資訊
      ctx.fillStyle = '#64748B';
      ctx.font = '400 12px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ 高市租登字第0012號 ｜ 純前端運算・無雲端留存', 40, height - 30);
      ctx.fillText('產製時間：' + new Date().toLocaleString('zh-TW'), width - 300, height - 30);

      // 繪製簽名
      var landData = this.sigLandlord ? this.sigLandlord.getImageData() : null;
      var tenData = this.sigTenant ? this.sigTenant.getImageData() : null;

      function triggerDownload() {
        var link = document.createElement('a');
        link.download = '住宅租賃用電用火安全暨失火責任切結書_' + v.docNumber + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      var loadedImages = 0;
      var totalToLoad = (landData ? 1 : 0) + (tenData ? 1 : 0);

      if (totalToLoad === 0) {
        triggerDownload();
        return;
      }

      function checkFinish() {
        loadedImages++;
        if (loadedImages >= totalToLoad) {
          triggerDownload();
        }
      }

      if (landData) {
        var imgL = new Image();
        imgL.onload = function () {
          ctx.drawImage(imgL, 70, sigBlockY + 75, 230, 70);
          checkFinish();
        };
        imgL.src = landData;
      }

      if (tenData) {
        var imgT = new Image();
        imgT.onload = function () {
          ctx.drawImage(imgT, 460, sigBlockY + 75, 290, 70);
          checkFinish();
        };
        imgT.src = tenData;
      }
    },

    escapeHtml: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.addEventListener('DOMContentLoaded', function () {
    app.init();
  });

})();
