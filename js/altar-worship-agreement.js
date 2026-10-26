/**
 * 港居不動產 - 住宅租賃祭祀焚香與神明祖先牌位安奉特約承諾書產生器
 * 核心邏輯: altar-worship-agreement.js
 * 依據《民法》第432/434條、《消防法》第6條、《公寓大廈管理條例》第16條與《空氣污染防制法》第32條設計
 */

(function () {
  'use strict';

  // 1. 金融大寫數字轉換公用函式
  function numberToChineseUppercase(n) {
    n = Math.floor(Number(n));
    if (isNaN(n) || n <= 0) return '零元整';
    var fraction = ['角', '分'];
    var digit = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    var unit = [
      ['元', '萬', '億'],
      ['', '拾', '佰', '仟']
    ];
    var head = n < 0 ? '負' : '';
    n = Math.abs(n);
    var s = '';
    for (var i = 0; i < unit[0].length && n > 0; i++) {
      var p = '';
      for (var j = 0; j < unit[1].length && n > 0; j++) {
        p = digit[n % 10] + unit[1][j] + p;
        n = Math.floor(n / 10);
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整') + '整';
  }

  // 2. Retina 2x 高靈敏度電子手寫簽章類別
  class SignaturePad {
    constructor(canvas, clearBtn, placeholderEl, onUpdate) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.clearBtn = clearBtn;
      this.placeholderEl = placeholderEl;
      this.onUpdate = onUpdate;
      this.isDrawing = false;
      this.hasDrawn = false;

      this.initCanvas();
      this.bindEvents();
    }

    initCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * ratio;
      this.canvas.height = rect.height * ratio;
      this.ctx.scale(ratio, ratio);
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    bindEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const start = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        const pos = getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        if (this.placeholderEl) this.placeholderEl.style.display = 'none';
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.hasDrawn = true;
        if (this.onUpdate) this.onUpdate(this.toDataURL());
      };

      const stop = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        if (this.onUpdate) this.onUpdate(this.toDataURL());
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', stop);

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => {
          this.clear();
        });
      }

      window.addEventListener('resize', () => {
        if (!this.hasDrawn) {
          this.initCanvas();
        }
      });
    }

    clear() {
      const ratio = Math.max(window.devicePixelRatio || 1, 2);
      this.ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
      this.hasDrawn = false;
      if (this.placeholderEl) this.placeholderEl.style.display = 'block';
      if (this.onUpdate) this.onUpdate('');
    }

    toDataURL() {
      return this.hasDrawn ? this.canvas.toDataURL('image/png') : '';
    }
  }

  // 3. 主應用邏輯初始化
  document.addEventListener('DOMContentLoaded', function () {
    // 綁定表單元素
    const formFields = {
      contractNumber: document.getElementById('contractNumber'),
      propertyAddress: document.getElementById('propertyAddress'),
      landlordName: document.getElementById('landlordName'),
      landlordTaxId: document.getElementById('landlordTaxId'),
      landlordPhone: document.getElementById('landlordPhone'),
      tenantName: document.getElementById('tenantName'),
      tenantIdNo: document.getElementById('tenantIdNo'),
      tenantPhone: document.getElementById('tenantPhone'),
      deityName: document.getElementById('deityName'),
      altarLocation: document.getElementById('altarLocation'),
      altarSpecs: document.getElementById('altarSpecs'),
      violationFine: document.getElementById('violationFine'),
      agreementDate: document.getElementById('agreementDate'),
      specialRemark: document.getElementById('specialRemark')
    };

    // 預覽元素
    const previewEls = {
      previewContractNo: document.getElementById('previewContractNo'),
      previewAddress: document.getElementById('previewAddress'),
      previewLandlord: document.getElementById('previewLandlord'),
      previewTenant: document.getElementById('previewTenant'),
      previewModeTitle: document.getElementById('previewModeTitle'),
      previewModeClause: document.getElementById('previewModeClause'),
      previewPermittedBox: document.getElementById('previewPermittedBox'),
      previewPermittedDeity: document.getElementById('previewPermittedDeity'),
      previewPermittedLoc: document.getElementById('previewPermittedLoc'),
      previewFineAmount: document.getElementById('previewFineAmount'),
      previewFineUppercase: document.getElementById('previewFineUppercase'),
      previewRulesList: document.getElementById('previewRulesList'),
      previewSpecialRemarkWrap: document.getElementById('previewSpecialRemarkWrap'),
      previewSpecialRemarkText: document.getElementById('previewSpecialRemarkText'),
      previewDate: document.getElementById('previewDate'),
      previewSignLandlordImg: document.getElementById('previewSignLandlordImg'),
      previewSignTenantImg: document.getElementById('previewSignTenantImg')
    };

    // 預設日期為今日
    if (formFields.agreementDate && !formFields.agreementDate.value) {
      const today = new Date().toISOString().split('T')[0];
      formFields.agreementDate.value = today;
    }

    // 模式選擇卡片切換
    const modeCards = document.querySelectorAll('.altar-mode-card');
    const permittedFieldsGroup = document.getElementById('permittedFieldsGroup');

    function getSelectedMode() {
      const checkedRadio = document.querySelector('input[name="worshipMode"]:checked');
      return checkedRadio ? checkedRadio.value : 'prohibited';
    }

    modeCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.addEventListener('change', function () {
          modeCards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          togglePermittedFields(this.value);
          updatePreview();
        });
      }
      card.addEventListener('click', function () {
        if (radio && !radio.checked) {
          radio.checked = true;
          modeCards.forEach((c) => c.classList.remove('active'));
          this.classList.add('active');
          togglePermittedFields(radio.value);
          updatePreview();
        }
      });
    });

    function togglePermittedFields(mode) {
      if (permittedFieldsGroup) {
        if (mode === 'permitted') {
          permittedFieldsGroup.style.display = 'block';
        } else {
          permittedFieldsGroup.style.display = 'none';
        }
      }
    }

    // 初始化手寫簽章板
    const canvasLandlord = document.getElementById('sigCanvasLandlord');
    const clearLandlord = document.getElementById('clearSigLandlord');
    const phLandlord = document.getElementById('sigPhLandlord');

    const canvasTenant = document.getElementById('sigCanvasTenant');
    const clearTenant = document.getElementById('clearSigTenant');
    const phTenant = document.getElementById('sigPhTenant');

    const sigLandlordPad = new SignaturePad(canvasLandlord, clearLandlord, phLandlord, (dataUrl) => {
      if (previewEls.previewSignLandlordImg) {
        if (dataUrl) {
          previewEls.previewSignLandlordImg.src = dataUrl;
          previewEls.previewSignLandlordImg.style.display = 'block';
        } else {
          previewEls.previewSignLandlordImg.src = '';
          previewEls.previewSignLandlordImg.style.display = 'none';
        }
      }
    });

    const sigTenantPad = new SignaturePad(canvasTenant, clearTenant, phTenant, (dataUrl) => {
      if (previewEls.previewSignTenantImg) {
        if (dataUrl) {
          previewEls.previewSignTenantImg.src = dataUrl;
          previewEls.previewSignTenantImg.style.display = 'block';
        } else {
          previewEls.previewSignTenantImg.src = '';
          previewEls.previewSignTenantImg.style.display = 'none';
        }
      }
    });

    // 動態更新 A4 預覽公文內容
    function updatePreview() {
      const mode = getSelectedMode();

      // 基本資訊
      if (previewEls.previewContractNo) {
        previewEls.previewContractNo.textContent = formFields.contractNumber.value.trim() || '—';
      }
      if (previewEls.previewAddress) {
        previewEls.previewAddress.textContent = formFields.propertyAddress.value.trim() || '—';
      }
      if (previewEls.previewLandlord) {
        const lName = formFields.landlordName.value.trim() || '港居不動產開發有限公司';
        const lTax = formFields.landlordTaxId.value.trim() || '96797997';
        previewEls.previewLandlord.textContent = `${lName}（統一編號/身分證號：${lTax}）`;
      }
      if (previewEls.previewTenant) {
        const tName = formFields.tenantName.value.trim() || '—';
        const tId = formFields.tenantIdNo.value.trim() || '—';
        const tPhone = formFields.tenantPhone.value.trim() || '—';
        previewEls.previewTenant.textContent = `${tName}（身分證字號：${tId} ｜ 電話：${tPhone}）`;
      }

      // 日期
      if (previewEls.previewDate) {
        const dVal = formFields.agreementDate.value;
        if (dVal) {
          const parts = dVal.split('-');
          const y = parseInt(parts[0], 10) - 1911;
          previewEls.previewDate.textContent = `中華民國 ${y} 年 ${parseInt(parts[1], 10)} 月 ${parseInt(parts[2], 10)} 日`;
        } else {
          previewEls.previewDate.textContent = '中華民國 年 月 日';
        }
      }

      // 罰金與油漆賠償上限
      const fineVal = parseInt(formFields.violationFine.value, 10) || 15000;
      if (previewEls.previewFineAmount) {
        previewEls.previewFineAmount.textContent = fineVal.toLocaleString('zh-TW');
      }
      if (previewEls.previewFineUppercase) {
        previewEls.previewFineUppercase.textContent = numberToChineseUppercase(fineVal);
      }

      // 模式說明與特約內文
      if (mode === 'prohibited') {
        if (previewEls.previewModeTitle) {
          previewEls.previewModeTitle.textContent = '【模式 A：全面淨空無香煙住宅（嚴禁安奉神位與室內焚香）】';
        }
        if (previewEls.previewModeClause) {
          previewEls.previewModeClause.innerHTML =
            '承租人切結承諾租賃標的物室內專有空間及附屬陽台，<strong>嚴禁設立任何神明桌、佛龕、祖先公媽牌位、靈位或祭祀設施</strong>，並<strong>全面禁止於室內焚香、點燃酥油燈/香氛蠟燭、燃燒精油或焚燒紙錢冥紙</strong>。若有違反，承租人除應於接獲出租人通知後 <strong>7 日內無條件完全遷離移置</strong>外，自願支付懲罰性違約金，並賠償因油煙氣味致全室重新粉刷修復之一切費用。';
        }
        if (previewEls.previewPermittedBox) {
          previewEls.previewPermittedBox.style.display = 'none';
        }
      } else {
        if (previewEls.previewModeTitle) {
          previewEls.previewModeTitle.textContent = '【模式 B：特約許可安奉與防火防煙安全自律模式】';
        }
        if (previewEls.previewModeClause) {
          previewEls.previewModeClause.innerHTML =
            '出租人本於善良管理人原則，特約同意承租人於約定位置安奉指定神位，承租人承諾恪遵下列<strong>耐燃防火隔離、無煙環保香品、外出熄滅明火、全室煙燻除污復原</strong>等六大安全自律規範，保證絕不危害公共安全與物業價值。';
        }
        if (previewEls.previewPermittedBox) {
          previewEls.previewPermittedBox.style.display = 'block';
          if (previewEls.previewPermittedDeity) {
            previewEls.previewPermittedDeity.textContent = formFields.deityName.value.trim() || '（未載明）';
          }
          if (previewEls.previewPermittedLoc) {
            const locVal = formFields.altarLocation.value.trim() || '（未載明）';
            const specVal = formFields.altarSpecs.value.trim() ? ` ｜ 防火規格：${formFields.altarSpecs.value.trim()}` : '';
            previewEls.previewPermittedLoc.textContent = `${locVal}${specVal}`;
          }
        }
      }

      // 勾選規範清單即時同步
      if (previewEls.previewRulesList) {
        previewEls.previewRulesList.innerHTML = '';
        const checkboxes = document.querySelectorAll('.altar-rule-cb:checked');
        if (checkboxes.length === 0) {
          previewEls.previewRulesList.innerHTML = '<li style="color:#ef4444;">⚠️ 尚未勾選任何安全承諾規範項目</li>';
        } else {
          checkboxes.forEach((cb) => {
            const li = document.createElement('li');
            li.style.marginBottom = '4px';
            const strong = cb.getAttribute('data-title') || '';
            const desc = cb.getAttribute('data-desc') || '';
            li.innerHTML = `<strong>${strong}</strong>：${desc}`;
            previewEls.previewRulesList.appendChild(li);
          });
        }
      }

      // 特別加註
      if (previewEls.previewSpecialRemarkWrap && previewEls.previewSpecialRemarkText) {
        const remarkVal = formFields.specialRemark.value.trim();
        if (remarkVal) {
          previewEls.previewSpecialRemarkWrap.style.display = 'block';
          previewEls.previewSpecialRemarkText.textContent = remarkVal;
        } else {
          previewEls.previewSpecialRemarkWrap.style.display = 'none';
        }
      }
    }

    // 監聽表單欄位輸入
    Object.values(formFields).forEach((el) => {
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    // 監聽勾選項目
    document.querySelectorAll('.altar-rule-cb').forEach((cb) => {
      cb.addEventListener('change', updatePreview);
    });

    // 初次更新
    togglePermittedFields(getSelectedMode());
    updatePreview();

    // 4. 匯出高畫質存證圖卡 (840 × 1180px)
    const exportCardBtn = document.getElementById('exportCardBtn');
    if (exportCardBtn) {
      exportCardBtn.addEventListener('click', function () {
        const canvas = document.createElement('canvas');
        canvas.width = 840;
        canvas.height = 1180;
        const ctx = canvas.getContext('2d');

        // 背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 840, 1180);

        // 頂部裝飾金橘條
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, 0, 840, 14);

        // 外框線
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 28, 784, 1124);

        // 標題區域
        ctx.fillStyle = '#0f2b48';
        ctx.font = 'bold 24px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司', 420, 68);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 21px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('住宅租賃祭祀焚香與神明祖先牌位安奉特約承諾書', 420, 102);

        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《民法》第432/434條、《消防法》與《公寓大廈管理條例》簽立】', 420, 126);

        // 分隔線
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, 142);
        ctx.lineTo(792, 142);
        ctx.stroke();

        // 標的資料表
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#334155';

        const drawRow = (y, label, val) => {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(48, y, 170, 32);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(218, y, 574, 32);
          ctx.strokeStyle = '#cbd5e1';
          ctx.strokeRect(48, y, 170, 32);
          ctx.strokeRect(218, y, 574, 32);

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(label, 60, y + 21);

          ctx.fillStyle = '#0f172a';
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(val, 230, y + 21);
        };

        const contractVal = formFields.contractNumber.value.trim() || '—';
        const addressVal = formFields.propertyAddress.value.trim() || '—';
        const landlordVal = `${formFields.landlordName.value.trim() || '港居不動產開發有限公司'}（統編：${formFields.landlordTaxId.value.trim() || '96797997'}）`;
        const tenantVal = `${formFields.tenantName.value.trim() || '—'}（身分證：${formFields.tenantIdNo.value.trim() || '—'} ｜ 電話：${formFields.tenantPhone.value.trim() || '—'}）`;

        drawRow(154, '租賃契約編號', contractVal);
        drawRow(186, '租賃標的地址', addressVal);
        drawRow(218, '出租人 / 代管業', landlordVal);
        drawRow(250, '承租人 / 立承諾人', tenantVal);

        // 特約模式宣告
        const mode = getSelectedMode();
        ctx.fillStyle = '#fffbeb';
        ctx.fillRect(48, 292, 744, 34);
        ctx.strokeStyle = '#fde68a';
        ctx.strokeRect(48, 292, 744, 34);

        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        const modeStr = mode === 'prohibited'
          ? '約定模式：【模式 A：全面淨空無香煙住宅（嚴禁安奉神位與室內焚香）】'
          : `約定模式：【模式 B：特約許可安奉神位（神號：${formFields.deityName.value.trim() || '—'} ｜ 位置：${formFields.altarLocation.value.trim() || '—'}）】`;
        ctx.fillText(modeStr, 60, 314);

        // 違約金與修復費用
        const fineVal = parseInt(formFields.violationFine.value, 10) || 15000;
        const fineText = `違約處置金／全室粉刷除垢賠償上限：新臺幣 ${fineVal.toLocaleString()} 元整（${numberToChineseUppercase(fineVal)}）`;
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText(fineText, 60, 348);

        // 特約條款清單
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('核心特約與法制切結條款：', 48, 382);

        const clauses = [
          '一、民法第432條善良管理人責任：承租人負有保管維護租賃標的乾淨完整義務，防止煙燻發黑。',
          '二、失火責任特約排除抗辯：承租人室內用火用電因祭祀焚香疏失釀災，排除重大過失抗辯，負完全賠償責任。',
          '三、金紙焚燒絕對禁令：依公寓大廈管理條例第16條與空污法第32條，嚴禁室內、陽台及公共梯間焚燒紙錢。',
          '四、住警器安全維護：依消防法第6條，嚴禁私自遮蔽、拆卸或拔除偵煙式火災警報器。',
          '五、明火外出熄滅義務：外出離家及夜間就寢前，必須確認香火完全熄滅，周邊1.5米內嚴禁堆置易燃物。',
          '六、退租全室煙燻除污復原：退租時因焚香致天花板、牆面燻黑發黃，承租人同意負擔全室重新粉刷油漆費用。'
        ];

        ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#334155';
        let currentY = 410;
        clauses.forEach((cl) => {
          ctx.fillText(cl, 56, currentY);
          currentY += 28;
        });

        // 具體承諾事項核取清單
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('承租人勾選履行之安全自律規範：', 48, currentY + 12);
        currentY += 38;

        const checkedBoxes = document.querySelectorAll('.altar-rule-cb:checked');
        ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#475569';
        if (checkedBoxes.length === 0) {
          ctx.fillText('（承租人未勾選任何項目）', 56, currentY);
          currentY += 24;
        } else {
          checkedBoxes.forEach((cb) => {
            const title = cb.getAttribute('data-title') || '';
            const desc = cb.getAttribute('data-desc') || '';
            ctx.fillStyle = '#d97706';
            ctx.fillText('☑ ', 56, currentY);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
            ctx.fillText(title + '：', 76, currentY);
            ctx.fillStyle = '#334155';
            ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
            ctx.fillText(desc.length > 48 ? desc.substring(0, 48) + '...' : desc, 76 + ctx.measureText(title + '：').width, currentY);
            currentY += 26;
          });
        }

        // 特別加註
        const remark = formFields.specialRemark.value.trim();
        if (remark) {
          currentY += 6;
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText('雙方特別加註約定：', 48, currentY);
          currentY += 22;
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillStyle = '#b45309';
          ctx.fillText(remark.length > 55 ? remark.substring(0, 55) + '...' : remark, 56, currentY);
          currentY += 20;
        }

        // 簽章區域 (固定於底部)
        const signY = 960;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(48, signY);
        ctx.lineTo(792, signY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 左簽章：出租人
        ctx.fillStyle = '#0f2b48';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('出租人 / 受託代管業（簽章）：', 56, signY + 30);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(56, signY + 44, 340, 90);

        // 右簽章：承租人
        ctx.fillText('承租人 / 立承諾書人（親簽）：', 436, signY + 30);
        ctx.strokeRect(436, signY + 44, 340, 90);

        // 繪製簽名圖
        const landlordSig = sigLandlordPad.toDataURL();
        const tenantSig = sigTenantPad.toDataURL();

        const finishExport = () => {
          // 簽署日期
          const dateVal = formFields.agreementDate.value;
          let dateStr = '中華民國 年 月 日';
          if (dateVal) {
            const p = dateVal.split('-');
            dateStr = `簽署日期：中華民國 ${parseInt(p[0], 10) - 1911} 年 ${parseInt(p[1], 10)} 月 ${parseInt(p[2], 10)} 日`;
          }
          ctx.fillStyle = '#64748b';
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(dateStr, 792, 1140);

          ctx.textAlign = 'left';
          ctx.fillText('本憑證由港居不動產線上工具自動產生・符合民法與租賃定型化契約規範', 48, 1140);

          // 下載圖檔
          const link = document.createElement('a');
          const addrClean = (formFields.propertyAddress.value.trim() || '房屋').replace(/[^\w\u4e00-\u9fa5]/g, '_');
          link.download = `港居不動產_祭祀焚香與神明安奉特約承諾書_${addrClean}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };

        let pendingImages = 0;
        if (landlordSig) {
          pendingImages++;
          const imgL = new Image();
          imgL.onload = () => {
            ctx.drawImage(imgL, 70, signY + 48, 310, 82);
            pendingImages--;
            if (pendingImages === 0) finishExport();
          };
          imgL.src = landlordSig;
        }

        if (tenantSig) {
          pendingImages++;
          const imgT = new Image();
          imgT.onload = () => {
            ctx.drawImage(imgT, 450, signY + 48, 310, 82);
            pendingImages--;
            if (pendingImages === 0) finishExport();
          };
          imgT.src = tenantSig;
        }

        if (pendingImages === 0) {
          finishExport();
        }
      });
    }

    // 5. 列印按鈕
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // 6. 一鍵複製 LINE 格式化文字
    const copyLineBtn = document.getElementById('copyLineBtn');
    if (copyLineBtn) {
      copyLineBtn.addEventListener('click', function () {
        const mode = getSelectedMode();
        const modeName = mode === 'prohibited'
          ? '【模式 A：全面淨空無香煙住宅（嚴禁神桌與室內焚香）】'
          : `【模式 B：特約許可安奉神位（${formFields.deityName.value.trim() || '指定神號'}）】`;

        const fineVal = parseInt(formFields.violationFine.value, 10) || 15000;
        const checkedRules = [];
        document.querySelectorAll('.altar-rule-cb:checked').forEach((cb) => {
          checkedRules.push(`• ${cb.getAttribute('data-title')}`);
        });

        const lineText = `【港居不動產｜住宅租賃祭祀焚香與神明祖先牌位安奉特約承諾書】
─────────────────────
📋 租賃契約：${formFields.contractNumber.value.trim() || '—'}
🏠 物業標的：${formFields.propertyAddress.value.trim() || '—'}
👤 出租人：${formFields.landlordName.value.trim() || '港居不動產開發有限公司'}
👤 承租人：${formFields.tenantName.value.trim() || '—'}（${formFields.tenantPhone.value.trim() || '—'}）
─────────────────────
📜 約定模式：${modeName}
💰 違約金／全室粉刷除垢賠償上限：NT$ ${fineVal.toLocaleString()} 元整（${numberToChineseUppercase(fineVal)}）
─────────────────────
🛡️ 承租人安全自律履行要項：
${checkedRules.length > 0 ? checkedRules.join('\n') : '• 恪遵民法善良管理人維護義務'}
─────────────────────
⚖️ 法制作業依據：《民法》第432/434條、《消防法》第6條、《公寓大廈管理條例》第16條與《空氣污染防制法》第32條。
📅 簽署日期：${formFields.agreementDate.value || '今日'}
※ 完整具結手寫存證圖卡與A4公文正本已存證歸檔。`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lineText).then(() => {
            alert('✅ 承諾書 LINE 格式化切結摘要已成功複製至剪貼簿！');
          }).catch(() => {
            prompt('請手動複製以下切結文字：', lineText);
          });
        } else {
          prompt('請手動複製以下切結文字：', lineText);
        }
      });
    }

    // 7. LocalStorage 自動草稿備份
    const STORAGE_KEY = 'ganju_altar_worship_draft';
    function saveDraft() {
      const data = {};
      Object.keys(formFields).forEach((key) => {
        if (formFields[key]) data[key] = formFields[key].value;
      });
      data.worshipMode = getSelectedMode();
      const ruleStates = {};
      document.querySelectorAll('.altar-rule-cb').forEach((cb, idx) => {
        ruleStates[idx] = cb.checked;
      });
      data.ruleStates = ruleStates;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    function loadDraft() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.keys(data).forEach((key) => {
          if (key === 'ruleStates') {
            const states = data[key];
            document.querySelectorAll('.altar-rule-cb').forEach((cb, idx) => {
              if (states[idx] !== undefined) cb.checked = states[idx];
            });
          } else if (key === 'worshipMode') {
            const radio = document.querySelector(`input[name="worshipMode"][value="${data[key]}"]`);
            if (radio) {
              radio.checked = true;
              modeCards.forEach((c) => c.classList.remove('active'));
              const parentCard = radio.closest('.altar-mode-card');
              if (parentCard) parentCard.classList.add('active');
              togglePermittedFields(data[key]);
            }
          } else if (formFields[key]) {
            formFields[key].value = data[key];
          }
        });
        updatePreview();
      } catch (e) {}
    }

    // 監聽失去焦點自動存檔
    Object.values(formFields).forEach((el) => {
      if (el) el.addEventListener('blur', saveDraft);
    });
    document.querySelectorAll('.altar-rule-cb').forEach((cb) => {
      cb.addEventListener('change', saveDraft);
    });
    document.querySelectorAll('input[name="worshipMode"]').forEach((rb) => {
      rb.addEventListener('change', saveDraft);
    });

    // 嘗試加載草稿
    loadDraft();
  });
})();
