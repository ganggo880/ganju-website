/**
 * 港居不動產 - 住宅租賃天然災害防汛防颱與緊急應變責任切結書產生器
 * 核心邏輯: disaster-prevention-agreement.js
 * 依據《民法》第429/430/432/437條、第184/191條與《災害防救法》防颱防汛規範設計
 */

(function () {
  'use strict';

  // 1. 金融大寫數字轉換公用函式
  function numberToChineseUppercase(n) {
    n = Math.floor(Number(n));
    if (isNaN(n) || n <= 0) return '零元整';
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
    const formFields = {
      contractNumber: document.getElementById('contractNumber'),
      agreementDate: document.getElementById('agreementDate'),
      propertyAddress: document.getElementById('propertyAddress'),
      landlordName: document.getElementById('landlordName'),
      landlordTaxId: document.getElementById('landlordTaxId'),
      landlordPhone: document.getElementById('landlordPhone'),
      tenantName: document.getElementById('tenantName'),
      tenantIdNo: document.getElementById('tenantIdNo'),
      tenantPhone: document.getElementById('tenantPhone'),
      communityPhone: document.getElementById('communityPhone'),
      equipmentNote: document.getElementById('equipmentNote'),
      negligenceCap: document.getElementById('negligenceCap'),
      specialRemark: document.getElementById('specialRemark')
    };

    const previewEls = {
      previewContractNo: document.getElementById('previewContractNo'),
      previewAddress: document.getElementById('previewAddress'),
      previewLandlord: document.getElementById('previewLandlord'),
      previewTenant: document.getElementById('previewTenant'),
      previewEmergencyContacts: document.getElementById('previewEmergencyContacts'),
      previewEquipmentNote: document.getElementById('previewEquipmentNote'),
      previewModeTitle: document.getElementById('previewModeTitle'),
      previewModeClause: document.getElementById('previewModeClause'),
      previewCapAmount: document.getElementById('previewCapAmount'),
      previewCapUppercase: document.getElementById('previewCapUppercase'),
      previewRulesList: document.getElementById('previewRulesList'),
      previewSpecialRemarkWrap: document.getElementById('previewSpecialRemarkWrap'),
      previewSpecialRemarkText: document.getElementById('previewSpecialRemarkText'),
      previewDate: document.getElementById('previewDate'),
      previewSignLandlordImg: document.getElementById('previewSignLandlordImg'),
      previewSignTenantImg: document.getElementById('previewSignTenantImg')
    };

    if (formFields.agreementDate && !formFields.agreementDate.value) {
      const today = new Date().toISOString().split('T')[0];
      formFields.agreementDate.value = today;
    }

    const modeCards = document.querySelectorAll('.disaster-mode-card');

    function getSelectedMode() {
      const checkedRadio = document.querySelector('input[name="disasterMode"]:checked');
      return checkedRadio ? checkedRadio.value : 'mode_standard';
    }

    modeCards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.addEventListener('change', function () {
          modeCards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          updatePreview();
        });
      }
      card.addEventListener('click', function () {
        if (radio && !radio.checked) {
          radio.checked = true;
          modeCards.forEach((c) => c.classList.remove('active'));
          this.classList.add('active');
          updatePreview();
        }
      });
    });

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
      if (previewEls.previewEmergencyContacts) {
        const lPhone = formFields.landlordPhone.value.trim() || '0968-863-880';
        const cPhone = formFields.communityPhone.value.trim() || '119 / 1999 市民防救災專線';
        previewEls.previewEmergencyContacts.textContent = `代管緊急搶修：${lPhone} ｜ 社區管理室/防災中心：${cPhone}`;
      }
      if (previewEls.previewEquipmentNote) {
        previewEls.previewEquipmentNote.textContent = formFields.equipmentNote.value.trim() || '標準氣密門窗、陽台獨立落水頭、分路無熔絲斷路器';
      }

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

      const capVal = parseInt(formFields.negligenceCap.value, 10) || 20000;
      if (previewEls.previewCapAmount) {
        previewEls.previewCapAmount.textContent = capVal.toLocaleString('zh-TW');
      }
      if (previewEls.previewCapUppercase) {
        previewEls.previewCapUppercase.textContent = numberToChineseUppercase(capVal);
      }

      if (mode === 'mode_standard') {
        if (previewEls.previewModeTitle) {
          previewEls.previewModeTitle.textContent = '【模式 A：一般大樓／公寓標準防颱防漏模式】';
        }
        if (previewEls.previewModeClause) {
          previewEls.previewModeClause.innerHTML =
            '承租人於中央氣象署發布海上陸上颱風警報或豪雨特報期間，應落實<strong>全室氣密門窗緊閉上鎖、陽台落水頭清淤暢通及外推懸掛盆栽移入室內</strong>之保管注意義務，防範暴風雨灌入室內泡損木地板與裝潢。';
        }
      } else if (mode === 'mode_ground') {
        if (previewEls.previewModeTitle) {
          previewEls.previewModeTitle.textContent = '【模式 B：透天一樓／店面／地下車位強化防汛模式】';
        }
        if (previewEls.previewModeClause) {
          previewEls.previewModeClause.innerHTML =
            '針對一樓出入口、騎樓及地下室車位，承租人於豪雨特報或颱風警報期間應配合<strong>組裝防汛擋水閘門（防水板）、堆置防洪沙包，並依社區防災指示將低窪處停放之汽機車預先移置高處</strong>，防範積水倒灌與車輛泡水損害。';
        }
      } else {
        if (previewEls.previewModeTitle) {
          previewEls.previewModeTitle.textContent = '【模式 C：高樓層景觀戶／頂樓露台戶抗強風豪雨模式】';
        }
        if (previewEls.previewModeClause) {
          previewEls.previewModeClause.innerHTML =
            '針對高樓層迎風面與專用大露台，承租人於颱風來襲前應徹底<strong>清除露台主副雙排水孔落葉淤泥、加固大面落地窗安全鎖扣，並將露台大型戶外家具、植栽全面移入室內或牢靠固定</strong>，嚴防高空掉落物致生公共危險與積水溢流。';
        }
      }

      if (previewEls.previewRulesList) {
        previewEls.previewRulesList.innerHTML = '';
        const checkboxes = document.querySelectorAll('.disaster-rule-cb:checked');
        if (checkboxes.length === 0) {
          previewEls.previewRulesList.innerHTML = '<li style="color:#ef4444;">⚠️ 尚未勾選任何防颱防汛應變規範項目</li>';
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

    Object.values(formFields).forEach((el) => {
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    document.querySelectorAll('.disaster-rule-cb').forEach((cb) => {
      cb.addEventListener('change', updatePreview);
    });

    updatePreview();

    // 4. 匯出高畫質存證圖卡 (840 × 1180px)
    const exportCardBtn = document.getElementById('exportCardBtn');
    if (exportCardBtn) {
      exportCardBtn.addEventListener('click', function () {
        const canvas = document.createElement('canvas');
        canvas.width = 840;
        canvas.height = 1180;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 840, 1180);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, 840, 14);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 28, 784, 1124);

        ctx.fillStyle = '#0f2b48';
        ctx.font = 'bold 24px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司', 420, 68);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 21px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('住宅租賃天然災害防汛防颱與緊急應變責任切結書', 420, 102);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《民法》第429/430/432/437條、第184/191條與《災害防救法》簽立】', 420, 126);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, 142);
        ctx.lineTo(792, 142);
        ctx.stroke();

        ctx.textAlign = 'left';
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
        drawRow(250, '承租人 / 立切結人', tenantVal);

        const mode = getSelectedMode();
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(48, 292, 744, 34);
        ctx.strokeStyle = '#bae6fd';
        ctx.strokeRect(48, 292, 744, 34);

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        let modeStr = '約定模式：【模式 A：一般大樓／公寓標準防颱防漏模式】';
        if (mode === 'mode_ground') {
          modeStr = '約定模式：【模式 B：透天一樓／店面／地下車位強化防汛模式（含防水閘門協同）】';
        } else if (mode === 'mode_highrise') {
          modeStr = '約定模式：【模式 C：高樓層景觀戶／頂樓露台戶抗強風豪雨模式（雙落水頭清淤）】';
        }
        ctx.fillText(modeStr, 60, 314);

        const capVal = parseInt(formFields.negligenceCap.value, 10) || 20000;
        const capText = `人為疏失（未關窗／落水頭阻塞）致地板裝潢泡水修復賠償基準：新臺幣 ${capVal.toLocaleString()} 元整（${numberToChineseUppercase(capVal)}）`;
        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText(capText, 60, 348);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('核心防颱防汛責任分界與法制切結條款：', 48, 382);

        const clauses = [
          '一、民法第432條保管義務：颱風豪雨期間應緊閉門窗並清理陽台排水孔，因未關窗或淤積倒灌由承租人負責。',
          '二、民法第191條掉落物防範：陸上警報發布後應將陽台懸掛盆栽雜物移入室內，若吹落砸傷人車負完全責任。',
          '三、民法第437條黃金24小時通報：遇不可抗力風災破窗或結構滲漏，應於24小時內拍照錄影通報代管中心搶修。',
          '四、緊急止損與斷電防護：發生進水時應協助以毛巾水桶初步擋水，並拔除受潮插座電源防範漏電短路。',
          '五、民法第429條天災修繕分界：已盡防範義務仍發生之自然結構損壞由出租人修繕，人為疏失由承租人賠償。'
        ];

        ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#334155';
        let currentY = 410;
        clauses.forEach((cl) => {
          ctx.fillText(cl, 56, currentY);
          currentY += 28;
        });

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('承租人勾選履行之防颱防汛應變要項：', 48, currentY + 12);
        currentY += 38;

        const checkedBoxes = document.querySelectorAll('.disaster-rule-cb:checked');
        ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#475569';
        if (checkedBoxes.length === 0) {
          ctx.fillText('（承租人未勾選任何項目）', 56, currentY);
          currentY += 24;
        } else {
          checkedBoxes.forEach((cb) => {
            const title = cb.getAttribute('data-title') || '';
            const desc = cb.getAttribute('data-desc') || '';
            ctx.fillStyle = '#0284c7';
            ctx.fillText('☑ ', 56, currentY);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
            ctx.fillText(title + '：', 76, currentY);
            ctx.fillStyle = '#334155';
            ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
            ctx.fillText(desc.length > 46 ? desc.substring(0, 46) + '...' : desc, 76 + ctx.measureText(title + '：').width, currentY);
            currentY += 26;
          });
        }

        const remark = formFields.specialRemark.value.trim();
        if (remark) {
          currentY += 6;
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText('雙方特別加註約定：', 48, currentY);
          currentY += 22;
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillStyle = '#0369a1';
          ctx.fillText(remark.length > 55 ? remark.substring(0, 55) + '...' : remark, 56, currentY);
        }

        const signY = 960;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(48, signY);
        ctx.lineTo(792, signY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#0f2b48';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('出租人 / 受託代管業（簽章）：', 56, signY + 30);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(56, signY + 44, 340, 90);

        ctx.fillText('承租人 / 立切結書人（親簽）：', 436, signY + 30);
        ctx.strokeRect(436, signY + 44, 340, 90);

        const landlordSig = sigLandlordPad.toDataURL();
        const tenantSig = sigTenantPad.toDataURL();

        const finishExport = () => {
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

          const link = document.createElement('a');
          const addrClean = (formFields.propertyAddress.value.trim() || '房屋').replace(/[^\w\u4e00-\u9fa5]/g, '_');
          link.download = `港居不動產_防汛防颱與緊急應變責任切結書_${addrClean}.png`;
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
        let modeName = '【模式 A：一般大樓／公寓標準防颱防漏模式】';
        if (mode === 'mode_ground') {
          modeName = '【模式 B：透天一樓／店面／地下車位強化防汛模式】';
        } else if (mode === 'mode_highrise') {
          modeName = '【模式 C：高樓層景觀戶／頂樓露台戶抗強風豪雨模式】';
        }

        const capVal = parseInt(formFields.negligenceCap.value, 10) || 20000;
        const checkedRules = [];
        document.querySelectorAll('.disaster-rule-cb:checked').forEach((cb) => {
          checkedRules.push(`• ${cb.getAttribute('data-title')}`);
        });

        const lineText = `【港居不動產｜住宅租賃天然災害防汛防颱與緊急應變責任切結書】
─────────────────────
📋 租賃契約：${formFields.contractNumber.value.trim() || '—'}
🏠 物業標的：${formFields.propertyAddress.value.trim() || '—'}
👤 出租人：${formFields.landlordName.value.trim() || '港居不動產開發有限公司'}
👤 承租人：${formFields.tenantName.value.trim() || '—'}（${formFields.tenantPhone.value.trim() || '—'}）
☎️ 緊急搶修專線：${formFields.landlordPhone.value.trim() || '0968-863-880'}
─────────────────────
🌪️ 防汛防颱模式：${modeName}
💰 人為疏失（未關窗／落水頭阻塞）修復賠償基準：NT$ ${capVal.toLocaleString()} 元整（${numberToChineseUppercase(capVal)}）
─────────────────────
🛡️ 承租人防颱防汛應變履行要項：
${checkedRules.length > 0 ? checkedRules.join('\n') : '• 恪遵民法善良管理人防颱防汛保管義務'}
─────────────────────
⚖️ 法制作業依據：《民法》第429/430/432/437條、第184/191條與《災害防救法》。
📅 簽署日期：${formFields.agreementDate.value || '今日'}
※ 完整具結手寫存證圖卡與A4公文正本已存證歸檔。`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lineText).then(() => {
            alert('✅ 防汛防颱切結書 LINE 格式化摘要已成功複製至剪貼簿！');
          }).catch(() => {
            prompt('請手動複製以下切結文字：', lineText);
          });
        } else {
          prompt('請手動複製以下切結文字：', lineText);
        }
      });
    }

    // 7. LocalStorage 自動草稿備份
    const STORAGE_KEY = 'ganju_disaster_prevention_draft';
    function saveDraft() {
      const data = {};
      Object.keys(formFields).forEach((key) => {
        if (formFields[key]) data[key] = formFields[key].value;
      });
      data.disasterMode = getSelectedMode();
      const ruleStates = {};
      document.querySelectorAll('.disaster-rule-cb').forEach((cb, idx) => {
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
            document.querySelectorAll('.disaster-rule-cb').forEach((cb, idx) => {
              if (states[idx] !== undefined) cb.checked = states[idx];
            });
          } else if (key === 'disasterMode') {
            const radio = document.querySelector(`input[name="disasterMode"][value="${data[key]}"]`);
            if (radio) {
              radio.checked = true;
              modeCards.forEach((c) => c.classList.remove('active'));
              const parentCard = radio.closest('.disaster-mode-card');
              if (parentCard) parentCard.classList.add('active');
            }
          } else if (formFields[key]) {
            formFields[key].value = data[key];
          }
        });
        updatePreview();
      } catch (e) {}
    }

    Object.values(formFields).forEach((el) => {
      if (el) el.addEventListener('blur', saveDraft);
    });
    document.querySelectorAll('.disaster-rule-cb').forEach((cb) => {
      cb.addEventListener('change', saveDraft);
    });
    document.querySelectorAll('input[name="disasterMode"]').forEach((rb) => {
      rb.addEventListener('change', saveDraft);
    });

    loadDraft();
  });
})();
