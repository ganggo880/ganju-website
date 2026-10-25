/**
 * 港居不動產 - 住宅租賃無障礙設備使用與安全特約切結書產生器
 * 核心邏輯: accessibility-agreement.js
 * 依據《民法》第431/432條、《身心障礙者權益保障法》第57/84條與建築物無障礙設施規範設計
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
        this.clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clear();
        });
      }

      window.addEventListener('resize', () => {
        const data = this.toDataURL();
        this.initCanvas();
        if (this.hasDrawn) {
          const img = new Image();
          img.onload = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = data;
        }
      });
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.hasDrawn = false;
      if (this.placeholderEl) this.placeholderEl.style.display = 'block';
      if (this.onUpdate) this.onUpdate(null);
    }

    isEmpty() {
      return !this.hasDrawn;
    }

    toDataURL() {
      return this.hasDrawn ? this.canvas.toDataURL('image/png') : null;
    }
  }

  // 3. 主要程式啟動
  document.addEventListener('DOMContentLoaded', function () {
    // 預設日期為當天
    const today = new Date().toISOString().split('T')[0];
    const agreementDateInput = document.getElementById('agreementDate');
    if (agreementDateInput && !agreementDateInput.value) {
      agreementDateInput.value = today;
    }

    // 簽章畫布初始化
    const landlordCanvas = document.getElementById('landlordCanvas');
    const landlordClearBtn = document.getElementById('landlordClearBtn');
    const landlordPlaceholder = document.getElementById('landlordPlaceholder');
    const signImgLandlord = document.getElementById('signImgLandlord');

    const tenantCanvas = document.getElementById('tenantCanvas');
    const tenantClearBtn = document.getElementById('tenantClearBtn');
    const tenantPlaceholder = document.getElementById('tenantPlaceholder');
    const signImgTenant = document.getElementById('signImgTenant');

    let landlordPad = null;
    let tenantPad = null;

    if (landlordCanvas) {
      landlordPad = new SignaturePad(
        landlordCanvas,
        landlordClearBtn,
        landlordPlaceholder,
        function (dataUrl) {
          if (signImgLandlord) {
            if (dataUrl) {
              signImgLandlord.src = dataUrl;
              signImgLandlord.style.display = 'block';
            } else {
              signImgLandlord.src = '';
              signImgLandlord.style.display = 'none';
            }
          }
        }
      );
    }

    if (tenantCanvas) {
      tenantPad = new SignaturePad(
        tenantCanvas,
        tenantClearBtn,
        tenantPlaceholder,
        function (dataUrl) {
          if (signImgTenant) {
            if (dataUrl) {
              signImgTenant.src = dataUrl;
              signImgTenant.style.display = 'block';
            } else {
              signImgTenant.src = '';
              signImgTenant.style.display = 'none';
            }
          }
        }
      );
    }

    // 表單元素參照
    const formFields = {
      contractNumber: document.getElementById('contractNumber'),
      agreementDate: document.getElementById('agreementDate'),
      propertyAddress: document.getElementById('propertyAddress'),
      landlordName: document.getElementById('landlordName'),
      landlordTaxId: document.getElementById('landlordTaxId'),
      tenantName: document.getElementById('tenantName'),
      tenantIdNo: document.getElementById('tenantIdNo'),
      tenantPhone: document.getElementById('tenantPhone'),
      beneficiaryName: document.getElementById('beneficiaryName'),
      restoreDays: document.getElementById('restoreDays'),
      deductDepositLimit: document.getElementById('deductDepositLimit'),
      specialRemark: document.getElementById('specialRemark')
    };

    // 預覽元素參照
    const previewEls = {
      previewContractNo: document.getElementById('previewContractNo'),
      previewAddress: document.getElementById('previewAddress'),
      previewLandlord: document.getElementById('previewLandlord'),
      previewTenant: document.getElementById('previewTenant'),
      previewTenantId: document.getElementById('previewTenantId'),
      previewTenantPhone: document.getElementById('previewTenantPhone'),
      previewBeneficiary: document.getElementById('previewBeneficiary'),
      previewDispositionDesc: document.getElementById('previewDispositionDesc'),
      previewFacilityList: document.getElementById('previewFacilityList'),
      previewRestoreDays: document.getElementById('previewRestoreDays'),
      previewDeductNum: document.getElementById('previewDeductNum'),
      previewDeductChinese: document.getElementById('previewDeductChinese'),
      previewSpecialRemarkWrap: document.getElementById('previewSpecialRemarkWrap'),
      previewSpecialRemarkText: document.getElementById('previewSpecialRemarkText'),
      previewDate: document.getElementById('previewDate'),
      landlordSignDate: document.getElementById('landlordSignDate')
    };

    // 模式選擇聯動樣式
    const modeCards = document.querySelectorAll('.access-mode-card');
    function getSelectedMode() {
      const checkedRadio = document.querySelector('input[name="dispositionMode"]:checked');
      return checkedRadio ? checkedRadio.value : 'modeA';
    }

    modeCards.forEach((card) => {
      card.addEventListener('click', function () {
        modeCards.forEach((c) => c.classList.remove('selected'));
        this.classList.add('selected');
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          updatePreview();
        }
      });
    });

    // 取得所有已勾選的設施清單
    function getCheckedFacilities() {
      const checked = [];
      document.querySelectorAll('.facility-checkbox').forEach((cb) => {
        if (cb.checked) {
          const textEl = cb.closest('.access-check-item').querySelector('.access-check-text strong');
          if (textEl) {
            checked.push(textEl.textContent.replace('：', '').trim());
          }
        }
      });
      return checked;
    }

    // 更新右側預覽畫面
    function updatePreview() {
      if (previewEls.previewContractNo) {
        previewEls.previewContractNo.textContent = formFields.contractNumber.value.trim() || '—';
      }
      if (previewEls.previewAddress) {
        previewEls.previewAddress.textContent = formFields.propertyAddress.value.trim() || '（租賃住宅標的地址）';
      }
      if (previewEls.previewLandlord) {
        const lName = formFields.landlordName.value.trim() || '港居不動產開發有限公司';
        const lTax = formFields.landlordTaxId.value.trim() || '96797997';
        previewEls.previewLandlord.textContent = `${lName}（統編／證號：${lTax}）`;
      }
      if (previewEls.previewTenant) {
        previewEls.previewTenant.textContent = formFields.tenantName.value.trim() || '（立切結書人姓名）';
      }
      if (previewEls.previewTenantId) {
        previewEls.previewTenantId.textContent = formFields.tenantIdNo.value.trim() || '—';
      }
      if (previewEls.previewTenantPhone) {
        previewEls.previewTenantPhone.textContent = formFields.tenantPhone.value.trim() || '—';
      }
      if (previewEls.previewBeneficiary) {
        const bene = formFields.beneficiaryName.value.trim();
        previewEls.previewBeneficiary.textContent = bene ? `受照護人／實際使用人：${bene}` : '受照護人／實際使用人：同承租人本人';
      }

      // 設備處置模式更新
      const mode = getSelectedMode();
      const rDays = formFields.restoreDays.value.trim() || '7';
      const deductVal = Number(formFields.deductDepositLimit.value) || 8000;
      const deductCh = numberToChineseUppercase(deductVal);

      if (previewEls.previewDeductNum) {
        previewEls.previewDeductNum.textContent = deductVal.toLocaleString();
      }
      if (previewEls.previewDeductChinese) {
        previewEls.previewDeductChinese.textContent = deductCh;
      }
      if (previewEls.previewRestoreDays) {
        previewEls.previewRestoreDays.textContent = rDays;
      }

      if (previewEls.previewDispositionDesc) {
        if (mode === 'modeA') {
          previewEls.previewDispositionDesc.innerHTML = `<strong>【模式 A：無償留歸出租人（免拆回復）】</strong>雙方合意本切結所列通用安全設施（如不鏽鋼防滑扶手、地面防滑、斜坡板），退租時承租人<strong>免予拆除</strong>，並特約拋棄《民法》第 431 條第 1 項有益費用償還請求權，無償留歸房屋所有權人所有。`;
        } else if (mode === 'modeB') {
          previewEls.previewDispositionDesc.innerHTML = `<strong>【模式 B：承租人退租自費拆除回復原狀】</strong>涉及個人專用載具或機電導軌（如樓梯升降椅、充電線路等），承租人承諾於租期屆滿或租約終止後 <strong>${rDays} 日內</strong>自費拆卸運離，並妥善補土油漆或矽利康平整填補固定孔洞，回復牆面與樓梯原狀。`;
        } else {
          previewEls.previewDispositionDesc.innerHTML = `<strong>【模式 C：折價受讓或押金代扣處置】</strong>退租點交時雙方合意依現況殘值折價由出租人受讓；若承租人未依約拆除，同意由受託代管業代雇工班清理拆除，所需工料費由押租保證金優先扣抵，扣抵上限約定為新臺幣 <strong>${deductVal.toLocaleString()} 元整（${deductCh}）</strong>。`;
        }
      }

      // 切結日期
      const dStr = formFields.agreementDate.value;
      let dateChinese = '中華民國 年 月 日';
      if (dStr) {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const rocYear = parseInt(parts[0], 10) - 1911;
          dateChinese = `中華民國 ${rocYear} 年 ${parts[1]} 月 ${parts[2]} 日`;
        }
      }
      if (previewEls.previewDate) previewEls.previewDate.textContent = `立書日期：${dateChinese}`;
      if (previewEls.landlordSignDate) previewEls.landlordSignDate.textContent = `簽署日期：${dateChinese}`;

      // 無障礙設施要項
      if (previewEls.previewFacilityList) {
        const facilities = getCheckedFacilities();
        if (facilities.length > 0) {
          previewEls.previewFacilityList.textContent = facilities.join('、');
        } else {
          previewEls.previewFacilityList.textContent = '衛浴安全扶手防滑、門檻斜坡板、沐浴折疊椅與急救鈴、樓梯升降椅裝置、走道夜燈照明與門框加寬、電動輪椅充電專用迴路（通用友善全套）';
        }
      }

      // 特別加註約定
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

    // 監聽表單輸入
    Object.values(formFields).forEach((el) => {
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    // 監聽勾選框
    document.querySelectorAll('.facility-checkbox').forEach((cb) => {
      cb.addEventListener('change', updatePreview);
    });

    // 初次更新
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

        // 頂部品牌裝飾條
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 840, 14);

        // 外框裝飾線
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 28, 784, 1124);

        // 標題區域
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 24px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司', 420, 68);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('住宅租賃無障礙設備使用與安全特約切結書', 420, 102);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《民法》第431/432條、《身權法》第57/84條與建築物無障礙規範簽立】', 420, 126);

        // 分隔線
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, 142);
        ctx.lineTo(792, 142);
        ctx.stroke();

        // 標的與當事人基本資料表
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
        const beneVal = formFields.beneficiaryName.value.trim() ? `（受照護人：${formFields.beneficiaryName.value.trim()}）` : '';
        const tenantVal = `${formFields.tenantName.value.trim() || '—'}${beneVal}（身分證字號：${formFields.tenantIdNo.value.trim() || '—'} ｜ 電話：${formFields.tenantPhone.value.trim() || '—'}）`;

        drawRow(155, '主租賃契約編號', contractVal);
        drawRow(187, '租賃物標的地址', addressVal);
        drawRow(219, '受託代管／出租人', landlordVal);
        drawRow(251, '承租人（立切結人）', tenantVal);

        // 法律核心條款標題與內容
        let currY = 305;
        const drawClauseTitle = (title) => {
          ctx.fillStyle = '#1d4ed8';
          ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(title, 48, currY);
          currY += 20;
        };

        const drawClauseText = (text, maxWidth = 744) => {
          ctx.fillStyle = '#1e293b';
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          const words = text.split('');
          let line = '';
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, 48, currY);
              line = words[n];
              currY += 18;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 48, currY);
          currY += 22;
        };

        // 第一條
        drawClauseTitle('第一條、無障礙設施項目登錄與施工安全規範');
        const facilities = getCheckedFacilities();
        const facilityStr = facilities.length > 0 ? facilities.join('、') : '衛浴防滑扶手、門檻斜坡板、折疊沐浴椅急救鈴、升降椅裝置、走道照明加寬、輪椅充電迴路';
        drawClauseText(`一、承租人基於生活照護需求經出租人同意增設：【${facilityStr}】。`);
        drawClauseText('二、施工保證：所有鑽孔與機電施作須由合格專業廠商依國家安全標準施作，不得損壞建築結構樑柱、冷熱水暗管、電線管路或防水層；如有損壞，承租人負完全修復責任。');

        // 第二條
        drawClauseTitle('第二條、設備處置歸屬與回復原狀約定（民法第431條特約）');
        const mode = getSelectedMode();
        const rDays = formFields.restoreDays.value.trim() || '7';
        const deductVal = Number(formFields.deductDepositLimit.value) || 8000;
        const deductCh = numberToChineseUppercase(deductVal);

        if (mode === 'modeA') {
          drawClauseText('一、【模式 A：無償留歸出租人】經出租人認定對通用居住有益之設施（如防滑扶手、斜坡板），退租時承租人免拆除，特約拋棄民法第431條有益費用償還請求權，無償留歸房屋所有權人。');
        } else if (mode === 'modeB') {
          drawClauseText(`一、【模式 B：承租人自費拆除回復】個人載具或機電導軌（如升降椅、充電線路），承租人承諾於租約終止後 ${rDays} 日內自費拆卸運離，並以專業補土油漆平整填補孔洞，回復原狀。`);
        } else {
          drawClauseText(`一、【模式 C：折價受讓或押金代扣】雙方得於退租時合意折價受讓；承租人未依約拆除時，同意由受託代管業代雇工班清理，費用由押金扣抵，上限為新臺幣 ${deductVal.toLocaleString()} 元整（${deductCh}）。`);
        }

        // 第三條
        drawClauseTitle('第三條、操作安全維護與人身意外免責宣告');
        drawClauseText('一、自主操作維護：無障礙設備係承租人基於個人需求出資購置或委裝，使用人應遵照原廠安全手冊操作並定期維護（如升降椅安全帶、煞車檢修）。');
        drawClauseText('二、意外免責宣告：因使用人操作不慎、超載或設備機件故障導致人員摔倒受傷或意外，出租人及受託代管業免負任何法律損害賠償責任。');

        // 第四條（特約加註）
        const remarkVal = formFields.specialRemark.value.trim();
        if (remarkVal) {
          drawClauseTitle('第四條、雙方特別加註特約事項');
          drawClauseText(remarkVal);
        }

        // 簽署日期
        const dStr = formFields.agreementDate.value;
        let dateChinese = '中華民國 年 月 日';
        if (dStr) {
          const parts = dStr.split('-');
          if (parts.length === 3) {
            dateChinese = `中華民國 ${parseInt(parts[0], 10) - 1911} 年 ${parts[1]} 月 ${parts[2]} 日`;
          }
        }
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`立切結書日期：${dateChinese}`, 792, currY + 10);
        currY += 25;

        // 雙方簽名框底圖繪製
        const signBoxY = Math.max(currY + 10, 930);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(48, signBoxY, 340, 150);
        ctx.strokeRect(452, signBoxY, 340, 150);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(49, signBoxY + 1, 338, 28);
        ctx.fillRect(453, signBoxY + 1, 338, 28);

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('出租人／受託代管業（同意簽署）：', 60, signBoxY + 19);
        ctx.fillText('承租人／立切結書人（親筆簽署）：', 464, signBoxY + 19);

        // 繪製雙方簽名
        let drawnSigns = 0;
        const totalSigns = 2;

        const finalizeAndDownload = () => {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('本文件由港居不動產開發有限公司線上法務工具系統自動生成・高雄市小港區中安路880號・電話：0968-863-880', 420, 1145);

          const link = document.createElement('a');
          link.download = `港居不動產_無障礙設備使用與安全特約切結書_${formFields.tenantName.value.trim() || '立書人'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };

        const landlordSignUrl = landlordPad ? landlordPad.toDataURL() : null;
        const tenantSignUrl = tenantPad ? tenantPad.toDataURL() : null;

        if (landlordSignUrl) {
          const imgL = new Image();
          imgL.onload = function () {
            ctx.drawImage(imgL, 70, signBoxY + 35, 290, 105);
            drawnSigns++;
            if (drawnSigns === totalSigns) finalizeAndDownload();
          };
          imgL.src = landlordSignUrl;
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('（受託代管機構戳印處）', 218, signBoxY + 95);
          drawnSigns++;
        }

        if (tenantSignUrl) {
          const imgT = new Image();
          imgT.onload = function () {
            ctx.drawImage(imgT, 474, signBoxY + 35, 290, 105);
            drawnSigns++;
            if (drawnSigns === totalSigns) finalizeAndDownload();
          };
          imgT.src = tenantSignUrl;
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('（承租人親筆正楷手寫簽章）', 622, signBoxY + 95);
          drawnSigns++;
        }

        if (drawnSigns === totalSigns) {
          finalizeAndDownload();
        }
      });
    }

    // 5. 列印按鈕動作
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // 6. 複製 LINE 切結摘要
    const copyLineBtn = document.getElementById('copyLineBtn');
    if (copyLineBtn) {
      copyLineBtn.addEventListener('click', function () {
        const cNo = formFields.contractNumber.value.trim() || '—';
        const addr = formFields.propertyAddress.value.trim() || '—';
        const tName = formFields.tenantName.value.trim() || '—';
        const bene = formFields.beneficiaryName.value.trim() || tName;
        const mode = getSelectedMode();
        let modeName = '模式 A（無償留歸免拆）';
        if (mode === 'modeB') modeName = `模式 B（${formFields.restoreDays.value.trim() || '7'}日內自費拆除回復）`;
        if (mode === 'modeC') modeName = '模式 C（折價受讓或押金代扣）';
        const facilities = getCheckedFacilities();
        const facilityStr = facilities.length > 0 ? facilities.join('、') : '衛浴扶手、門檻斜坡板、沐浴折疊椅急救鈴、升降椅裝置、走道照明加寬、輪椅充電迴路';

        const lineText = `【港居不動產｜住宅租賃無障礙設備使用與安全特約切結書存證】
📍 房屋標的：${addr}
📄 主約編號：${cNo}
👤 承租人（立切結人）：${tName}（實際受照護人：${bene}）

♿ 經許可增設無障礙設施：
${facilityStr}

⚖️ 設備處置與回復原狀約定：
・歸屬模式：${modeName}
・施工安全：合格廠商依法規施作，保證不破壞結構樑柱與暗管防水層。
・意外免責：使用人遵照原廠手冊操作，非歸責於出租人之操作事故免責。

📅 立切結書日期：${formFields.agreementDate.value || today}
🏛️ 受託代管機構：港居不動產開發有限公司（統編：96797997）
💡 本切結依據《民法》第431/432條、《身權法》第57/84條與建築物無障礙規範簽署生效。`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lineText).then(() => {
            alert('已成功複製「無障礙設備安全切結摘要」至剪貼簿！可直接貼入 LINE 群組存證。');
          }).catch(() => {
            prompt('請手動複製以下切結文字：', lineText);
          });
        } else {
          prompt('請手動複製以下切結文字：', lineText);
        }
      });
    }

    // 7. LocalStorage 自動草稿備份
    const STORAGE_KEY = 'ganju_accessibility_draft';
    function saveDraft() {
      const data = {};
      Object.keys(formFields).forEach((key) => {
        if (formFields[key]) data[key] = formFields[key].value;
      });
      data.dispositionMode = getSelectedMode();
      const facilityStates = {};
      document.querySelectorAll('.facility-checkbox').forEach((cb, idx) => {
        facilityStates[idx] = cb.checked;
      });
      data.facilityStates = facilityStates;
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
          if (key === 'facilityStates') {
            const states = data[key];
            document.querySelectorAll('.facility-checkbox').forEach((cb, idx) => {
              if (states[idx] !== undefined) cb.checked = states[idx];
            });
          } else if (key === 'dispositionMode') {
            const radio = document.querySelector(`input[name="dispositionMode"][value="${data[key]}"]`);
            if (radio) {
              radio.checked = true;
              modeCards.forEach((c) => c.classList.remove('selected'));
              const parentCard = radio.closest('.access-mode-card');
              if (parentCard) parentCard.classList.add('selected');
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
    document.querySelectorAll('.facility-checkbox').forEach((cb) => {
      cb.addEventListener('change', saveDraft);
    });
    document.querySelectorAll('input[name="dispositionMode"]').forEach((rb) => {
      rb.addEventListener('change', saveDraft);
    });

    // 嘗試加載草稿
    loadDraft();
  });
})();
