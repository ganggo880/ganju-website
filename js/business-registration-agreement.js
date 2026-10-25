/**
 * 住宅租賃設址營業與稅賦補償切結協議書核心邏輯引擎
 * business-registration-agreement.js
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
    var len = str.length;
    var result = '';
    var zero = false;

    // 以 4 位數為一節 (萬、億)
    var parts = [];
    while (str.length > 0) {
      parts.push(str.slice(-4));
      str = str.slice(0, -4);
    }

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
      } else if (i === 0 && result !== '') {
        // 當個位段為全零時不補大單位
      }
    }

    return '新臺幣 ' + result + '元整';
  }

  // 格式化千分位
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

  // 全域狀態與初始化
  var app = {
    currentMode: 'allow', // 'allow' (同意設址並補償) 或 'forbid' (嚴格禁止設址)
    sigLandlord: null,
    sigTenant: null,

    init: function () {
      this.bindInputs();
      this.bindModeToggle();
      this.initSignaturePads();
      this.bindActions();
      this.recalcAndRender();
    },

    bindModeToggle: function () {
      var self = this;
      var btnAllow = document.getElementById('btnModeAllow');
      var btnForbid = document.getElementById('btnModeForbid');

      if (btnAllow && btnForbid) {
        btnAllow.addEventListener('click', function () {
          self.setMode('allow');
        });
        btnForbid.addEventListener('click', function () {
          self.setMode('forbid');
        });
      }
    },

    setMode: function (mode) {
      this.currentMode = mode;
      var btnAllow = document.getElementById('btnModeAllow');
      var btnForbid = document.getElementById('btnModeForbid');
      var allowSection = document.getElementById('allowCalcSection');

      if (mode === 'allow') {
        btnAllow.classList.add('active');
        btnForbid.classList.remove('active');
        if (allowSection) allowSection.style.display = 'block';
      } else {
        btnForbid.classList.add('active');
        btnAllow.classList.remove('active');
        if (allowSection) allowSection.style.display = 'none';
      }

      this.recalcAndRender();
    },

    bindInputs: function () {
      var self = this;
      var inputIds = [
        'docNumber', 'agreementDate', 'propertyAddress', 'monthlyRent',
        'houseValue', 'landValue', 'landlordName', 'landlordId', 'landlordPhone', 'landlordAddress',
        'tenantName', 'tenantId', 'tenantPhone', 'tenantAddress',
        'companyName', 'companyUnifiedId', 'businessType', 'relocationDays', 'dailyPenaltyRate'
      ];

      inputIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function () {
            self.recalcAndRender();
          });
        }
      });
    },

    initSignaturePads: function () {
      this.sigLandlord = new SignaturePad('canvasLandlord', 'btnClearLandlord', 'imgPreviewLandlord');
      this.sigTenant = new SignaturePad('canvasTenant', 'btnClearTenant', 'imgPreviewTenant');
    },

    getValues: function () {
      return {
        docNumber: document.getElementById('docNumber').value || 'GANJU-REG-20261025',
        agreementDate: document.getElementById('agreementDate').value || '2026-10-25',
        propertyAddress: document.getElementById('propertyAddress').value || '高雄市小港區中安路888號5樓之2',
        monthlyRent: parseInt(document.getElementById('monthlyRent').value, 10) || 28000,
        houseValue: parseInt(document.getElementById('houseValue').value, 10) || 450000,
        landValue: parseInt(document.getElementById('landValue').value, 10) || 680000,
        landlordName: document.getElementById('landlordName').value || '陳美蘭',
        landlordId: document.getElementById('landlordId').value || 'E220198***',
        landlordPhone: document.getElementById('landlordPhone').value || '0912-345-678',
        landlordAddress: document.getElementById('landlordAddress').value || '高雄市苓雅區四維三路2號',
        tenantName: document.getElementById('tenantName').value || '張廷浩（創益數位行銷有限公司 籌備處）',
        tenantId: document.getElementById('tenantId').value || 'S123456***',
        tenantPhone: document.getElementById('tenantPhone').value || '0988-765-432',
        tenantAddress: document.getElementById('tenantAddress').value || '高雄市小港區大業北路120號',
        companyName: document.getElementById('companyName').value || '創益數位行銷有限公司',
        companyUnifiedId: document.getElementById('companyUnifiedId').value || '83921045',
        businessType: document.getElementById('businessType').value || '資訊軟體與數位網路廣告業',
        relocationDays: parseInt(document.getElementById('relocationDays').value, 10) || 15,
        dailyPenaltyRate: parseInt(document.getElementById('dailyPenaltyRate').value, 10) || 2000
      };
    },

    recalcAndRender: function () {
      var v = this.getValues();

      // 計算各項稅額差額
      // 1. 房屋稅差額：自用 1.2% vs 營業用 3% (差 1.8%)
      var houseTaxDiff = Math.round(v.houseValue * 0.018);
      // 2. 地價稅差額：自用 0.2% vs 一般營業 1.0% (差 0.8%)
      var landTaxDiff = Math.round(v.landValue * 0.008);
      // 3. 租金綜合所得稅與二代健保補償（設算年租金 10% 租賃所得扣繳 + 2.11% 補充保費 = 12.11%）
      var annualRent = v.monthlyRent * 12;
      var taxIncomeDiff = Math.round(annualRent * 0.1211);
      // 年度總補償金額
      var annualTotalComp = houseTaxDiff + landTaxDiff + taxIncomeDiff;
      var monthlyComp = Math.round(annualTotalComp / 12);

      // 更新編輯器上的大寫標籤
      var monthlyRentUpper = document.getElementById('monthlyRentUpper');
      if (monthlyRentUpper) monthlyRentUpper.textContent = toFinancialChinese(v.monthlyRent);

      var compUpper = document.getElementById('compUpper');
      if (compUpper) compUpper.textContent = toFinancialChinese(monthlyComp);

      // 更新試算數值
      var calcHouseDiff = document.getElementById('calcHouseDiff');
      if (calcHouseDiff) calcHouseDiff.textContent = 'NT$ ' + formatMoney(houseTaxDiff) + ' 元/年';

      var calcLandDiff = document.getElementById('calcLandDiff');
      if (calcLandDiff) calcLandDiff.textContent = 'NT$ ' + formatMoney(landTaxDiff) + ' 元/年';

      var calcIncomeDiff = document.getElementById('calcIncomeDiff');
      if (calcIncomeDiff) calcIncomeDiff.textContent = 'NT$ ' + formatMoney(taxIncomeDiff) + ' 元/年';

      var calcTotalAnnual = document.getElementById('calcTotalAnnual');
      if (calcTotalAnnual) calcTotalAnnual.textContent = 'NT$ ' + formatMoney(annualTotalComp) + ' 元/年';

      var calcTotalMonthly = document.getElementById('calcTotalMonthly');
      if (calcTotalMonthly) calcTotalMonthly.textContent = 'NT$ ' + formatMoney(monthlyComp) + ' 元/月';

      // 更新右側 A4 預覽公文
      document.getElementById('pvDocNumber').textContent = v.docNumber;
      document.getElementById('pvAgreementDate').textContent = v.agreementDate;
      document.getElementById('pvPropertyAddress').textContent = v.propertyAddress;
      document.getElementById('pvMonthlyRent').textContent = '新臺幣 ' + formatMoney(v.monthlyRent) + ' 元/月（' + toFinancialChinese(v.monthlyRent) + '）';
      document.getElementById('pvCompanyName').textContent = v.companyName;
      document.getElementById('pvCompanyUnifiedId').textContent = v.companyUnifiedId;
      document.getElementById('pvBusinessType').textContent = v.businessType;
      document.getElementById('pvLandlordName').textContent = v.landlordName;
      document.getElementById('pvLandlordId').textContent = v.landlordId;
      document.getElementById('pvLandlordPhone').textContent = v.landlordPhone;
      document.getElementById('pvTenantName').textContent = v.tenantName;
      document.getElementById('pvTenantId').textContent = v.tenantId;
      document.getElementById('pvTenantPhone').textContent = v.tenantPhone;

      var pvModeBadge = document.getElementById('pvModeBadge');
      var pvLegalClauses = document.getElementById('pvLegalClauses');
      var pvDocTitle = document.getElementById('pvDocTitle');

      if (this.currentMode === 'allow') {
        if (pvDocTitle) pvDocTitle.textContent = '住宅租賃設址營業同意暨稅賦補償切結協議書';
        if (pvModeBadge) {
          pvModeBadge.textContent = '【特約許可設址模式】';
          pvModeBadge.style.color = '#B45309';
        }
        if (pvLegalClauses) {
          pvLegalClauses.innerHTML =
            '<p><strong>第一條（設立登記特約許可）：</strong>出租人特約同意承租人以租賃住宅地址辦理「' + v.companyName + '」（統一編號：' + v.companyUnifiedId + '）之營利事業登記或營業地址登記，營業項目限定為「' + v.businessType + '」，嚴禁供特種行業、危險化學品存放或非法經營使用。</p>' +
            '<p><strong>第二條（稅賦差額全額補償義務）：</strong>因承租人設址營業致租賃房屋喪失自用住宅稅率，所衍生之各項年度稅費差額（房屋稅差額約 NT$' + formatMoney(houseTaxDiff) + '、地價稅差額約 NT$' + formatMoney(landTaxDiff) + '、租金所得扣繳及健保補充保費約 NT$' + formatMoney(taxIncomeDiff) + '，年計約 NT$' + formatMoney(annualTotalComp) + ' 元），雙方合意約定由承租人每月隨同租金全額補貼新臺幣 <strong>' + formatMoney(monthlyComp) + '</strong> 元（' + toFinancialChinese(monthlyComp) + '），絕無異議。</p>' +
            '<p><strong>第三條（租約終止限期遷址切結）：</strong>租賃契約期滿、提前終止或合法解除時，承租人承諾於 <strong>' + v.relocationDays + ' 日</strong> 內辦妥商業主管機關及稅捐稽徵機關之遷址或歇業註銷登記。若逾期未完成遷離，每逾一日願給付出租人懲罰性違約金新臺幣 <strong>' + formatMoney(v.dailyPenaltyRate) + '</strong> 元整，並無條件同意出租人得持本協議書逕行向主管機關申請廢止該址營業登記及強制遷出。</p>' +
            '<p><strong>第四條（連帶清償責任）：</strong>承租人對公司營業期間衍生之一切商業債務、罰鍰、水電及損害，與公司負全部連帶給付責任，保證出租人房屋產權完整不受任何假扣押或強制執行追及。</p>';
        }
      } else {
        if (pvDocTitle) pvDocTitle.textContent = '住宅租賃嚴禁設址營業暨防私設登記切結書';
        if (pvModeBadge) {
          pvModeBadge.textContent = '【嚴格禁止設址模式】';
          pvModeBadge.style.color = '#DC2626';
        }
        if (pvLegalClauses) {
          pvLegalClauses.innerHTML =
            '<p><strong>第一條（嚴禁設立登記宣告）：</strong>租賃住宅純供承租人居住生活之用，出租人嚴格禁止承租人或任何第三人以本租賃地址申辦公司行號、商號、工作室、稅籍設立登記或營業地址借址登記。</p>' +
            '<p><strong>第二條（違約私自登記重額懲罰）：</strong>承租人若擅自或私自以租賃地址向稅捐或經濟主管機關辦理營利事業、營業稅籍或法人設址登記，視為承租人根本違約。出租人得不經事先催告程序立即終止租約，並沒收全額押租保證金。承租人並願給付相當於 <strong>參個月租金（新臺幣 ' + formatMoney(v.monthlyRent * 3) + ' 元整）</strong> 之懲罰性違約金。</p>' +
            '<p><strong>第三條（無條件騰空搬遷與逕行廢止授權）：</strong>發生擅自設址情事時，承租人同意於租約終止後 <strong>三日內</strong> 無條件騰空遷讓交還房屋，並不可撤銷授權出租人逕行檢附本切結書向商業主管機關及國稅局聲請廢止、撤銷或強制遷出該營業登記，承租人願全額賠償因此產生之一切稅金差額、行政規費與律師訴訟費。</p>';
        }
      }
    },

    bindActions: function () {
      var self = this;

      var btnPrint = document.getElementById('btnPrintDoc');
      if (btnPrint) {
        btnPrint.addEventListener('click', function () {
          window.print();
        });
      }

      var btnCard = document.getElementById('btnDownloadCard');
      if (btnCard) {
        btnCard.addEventListener('click', function () {
          self.generateAndDownloadCard();
        });
      }

      var btnLine = document.getElementById('btnCopyLine');
      if (btnLine) {
        btnLine.addEventListener('click', function () {
          self.copyLineText();
        });
      }
    },

    copyLineText: function () {
      var v = this.getValues();
      var houseTaxDiff = Math.round(v.houseValue * 0.018);
      var landTaxDiff = Math.round(v.landValue * 0.008);
      var taxIncomeDiff = Math.round(v.monthlyRent * 12 * 0.1211);
      var annualTotalComp = houseTaxDiff + landTaxDiff + taxIncomeDiff;
      var monthlyComp = Math.round(annualTotalComp / 12);

      var text = '【港居不動產｜住宅租賃設址營業與稅賦補償協議備忘】\n';
      text += '━━━━━━━━━━━━━━━━\n';
      text += '📄 文件編號：' + v.docNumber + '\n';
      text += '📅 簽署日期：' + v.agreementDate + '\n';
      text += '🏢 協議模式：' + (this.currentMode === 'allow' ? '特約許可設址並全額補償稅賦' : '嚴格禁止設址營業違約重罰') + '\n';
      text += '📍 標的房屋：' + v.propertyAddress + '\n';
      text += '💰 正常月租：NT$ ' + formatMoney(v.monthlyRent) + ' 元/月\n';
      text += '👤 出租人：' + v.landlordName + ' (' + v.landlordPhone + ')\n';
      text += '👤 承租人：' + v.tenantName + ' (' + v.tenantPhone + ')\n';
      text += '🏢 登記事業：' + v.companyName + '（統編：' + v.companyUnifiedId + '）\n';

      if (this.currentMode === 'allow') {
        text += '--------------------------------\n';
        text += '📊 營業稅額補償差額試算：\n';
        text += '・房屋稅差額：NT$ ' + formatMoney(houseTaxDiff) + ' 元/年\n';
        text += '・地價稅差額：NT$ ' + formatMoney(landTaxDiff) + ' 元/年\n';
        text += '・所得扣繳與健保：NT$ ' + formatMoney(taxIncomeDiff) + ' 元/年\n';
        text += '・每月約定補償款：NT$ ' + formatMoney(monthlyComp) + ' 元/月 (' + toFinancialChinese(monthlyComp) + ')\n';
        text += '--------------------------------\n';
        text += '⚠️ 退租遷離切結：約滿終止 ' + v.relocationDays + ' 日內辦妥遷址，逾期每日罰款 NT$ ' + formatMoney(v.dailyPenaltyRate) + ' 元。\n';
      } else {
        text += '⚠️ 違約處罰：絕無設址，若擅自登記願賠償 3 個月租金懲罰性違約金並立即搬遷！\n';
      }

      text += '━━━━━━━━━━━━━━━━\n';
      text += '📌 本協議由港居不動產線上法務系統存證產生（純前端防護）';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          alert('已成功複製設址營業協議備忘至剪貼簿！可直接貼至 LINE 群組告知雙方。');
        }).catch(function () {
          prompt('請複製以下文字：', text);
        });
      } else {
        prompt('請複製以下文字：', text);
      }
    },

    generateAndDownloadCard: function () {
      var v = this.getValues();
      var canvas = document.createElement('canvas');
      canvas.width = 840;
      canvas.height = 1080;
      var ctx = canvas.getContext('2d');

      // 背景深海軍藍漸層
      var bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(1, '#1A365D');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 840, 1080);

      // 頂部香檳金裝飾線
      ctx.fillStyle = '#C5A059';
      ctx.fillRect(40, 40, 760, 4);

      // 品牌抬頭
      ctx.fillStyle = '#C5A059';
      ctx.font = 'bold 20px "PingFang TC", "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產開發有限公司 ｜ GANJU REAL ESTATE', 40, 75);

      // 文件主標題
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "PingFang TC", "Noto Sans TC", sans-serif';
      var titleText = this.currentMode === 'allow' ? '住宅租賃設址營業同意暨稅賦補償協議書' : '住宅租賃嚴格禁止設址營業切結書';
      ctx.fillText(titleText, 40, 125);

      // 資訊白底卡片
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(40, 150, 760, 860, 16);
      ctx.fill();

      // 卡片內部繪製
      ctx.fillStyle = '#1A365D';
      ctx.font = 'bold 18px "PingFang TC", "Noto Sans TC", sans-serif';
      ctx.fillText('【合規法務存證備忘單】', 70, 195);

      ctx.fillStyle = '#64748B';
      ctx.font = '14px "PingFang TC", "Noto Sans TC", sans-serif';
      ctx.fillText('文件編號：' + v.docNumber + ' ｜ 簽署日期：' + v.agreementDate, 70, 225);

      // 分隔線
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, 245);
      ctx.lineTo(730, 245);
      ctx.stroke();

      // 條列主要資訊
      ctx.fillStyle = '#334155';
      ctx.font = '15px "PingFang TC", "Noto Sans TC", sans-serif';
      var y = 280;

      function drawRow(label, val) {
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 15px "PingFang TC", sans-serif';
        ctx.fillText(label, 70, y);
        ctx.fillStyle = '#0F172A';
        ctx.font = '15px "PingFang TC", sans-serif';
        ctx.fillText(val, 220, y);
        y += 34;
      }

      drawRow('租賃住宅地址：', v.propertyAddress);
      drawRow('原契約月租金：', 'NT$ ' + formatMoney(v.monthlyRent) + ' 元/月');
      drawRow('出租人（產權方）：', v.landlordName + ' (' + v.landlordPhone + ')');
      drawRow('承租人（設址方）：', v.tenantName + ' (' + v.tenantPhone + ')');
      drawRow('登記事業名稱：', v.companyName + '（統編：' + v.companyUnifiedId + '）');
      drawRow('登記營業項目：', v.businessType);

      // 補償計算或禁令框
      y += 10;
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.roundRect(70, y, 700, 160, 12);
      ctx.fill();
      ctx.stroke();

      if (this.currentMode === 'allow') {
        var houseTaxDiff = Math.round(v.houseValue * 0.018);
        var landTaxDiff = Math.round(v.landValue * 0.008);
        var taxIncomeDiff = Math.round(v.monthlyRent * 12 * 0.1211);
        var annualTotalComp = houseTaxDiff + landTaxDiff + taxIncomeDiff;
        var monthlyComp = Math.round(annualTotalComp / 12);

        ctx.fillStyle = '#B45309';
        ctx.font = 'bold 16px "PingFang TC", sans-serif';
        ctx.fillText('⚖️ 營業稅費補償差額明細：', 90, y + 32);

        ctx.fillStyle = '#334155';
        ctx.font = '14px "PingFang TC", sans-serif';
        ctx.fillText('・房屋稅現值差額 (3% vs 1.2%)：NT$ ' + formatMoney(houseTaxDiff) + ' 元/年', 90, y + 62);
        ctx.fillText('・地價稅現值差額 (1% vs 0.2%)：NT$ ' + formatMoney(landTaxDiff) + ' 元/年', 90, y + 90);
        ctx.fillText('・租金扣繳與健保補充保費：NT$ ' + formatMoney(taxIncomeDiff) + ' 元/年', 90, y + 118);

        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 16px "PingFang TC", sans-serif';
        ctx.fillText('★ 雙方合意每月補貼金額：NT$ ' + formatMoney(monthlyComp) + ' 元/月 (' + toFinancialChinese(monthlyComp) + ')', 90, y + 146);
      } else {
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 16px "PingFang TC", sans-serif';
        ctx.fillText('🚫 嚴格禁止設址營業與違約罰則：', 90, y + 36);

        ctx.fillStyle = '#334155';
        ctx.font = '14px "PingFang TC", sans-serif';
        ctx.fillText('・本住宅純供居住使用，嚴禁申辦公司行號、商號、工作室或營業稅籍登記。', 90, y + 70);
        ctx.fillText('・若擅自偷設登記，出租人得立即解除契約沒收押金，並請求 3 個月租金違約金。', 90, y + 102);
        ctx.fillText('・承租人同意無條件於 3 日內騰空遷讓，並授權出租人逕向主管機關聲請廢止。', 90, y + 134);
      }

      // 簽名區域
      y += 185;
      ctx.fillStyle = '#1A365D';
      ctx.font = 'bold 15px "PingFang TC", sans-serif';
      ctx.fillText('出租人簽署：', 90, y);
      ctx.fillText('承租人兼負責人簽署：', 440, y);

      // 繪製手寫簽名（如有）
      var imgLandlord = this.sigLandlord.getImageData();
      var imgTenant = this.sigTenant.getImageData();

      var self = this;
      var loadedCount = 0;
      var totalToLoad = 0;
      if (imgLandlord) totalToLoad++;
      if (imgTenant) totalToLoad++;

      function finishCard() {
        // 底部署名與防偽資訊
        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px "PingFang TC", sans-serif';
        ctx.fillText('港居不動產開發有限公司 ｜ 高市地政字號 96797997 ｜ 純前端零上傳高敏資訊防護', 70, 990);

        // 觸發下載
        var link = document.createElement('a');
        link.download = '設址營業稅賦補償協議書_' + v.docNumber + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      if (totalToLoad === 0) {
        finishCard();
      } else {
        if (imgLandlord) {
          var imageL = new Image();
          imageL.onload = function () {
            ctx.drawImage(imageL, 90, y + 10, 260, 65);
            loadedCount++;
            if (loadedCount === totalToLoad) finishCard();
          };
          imageL.src = imgLandlord;
        }
        if (imgTenant) {
          var imageT = new Image();
          imageT.onload = function () {
            ctx.drawImage(imageT, 440, y + 10, 260, 65);
            loadedCount++;
            if (loadedCount === totalToLoad) finishCard();
          };
          imageT.src = imgTenant;
        }
      }
    }
  };

  // DOM 就緒後啟動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      app.init();
    });
  } else {
    app.init();
  }
})();
