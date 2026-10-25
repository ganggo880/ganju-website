/**
 * 港居不動產 - 住宅租賃室內防潮防黴與環境通風維護承諾書產生器
 * 核心邏輯: mold-prevention-agreement.js
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
        this.clearBtn.addEventListener('click', () => this.clear());
      }

      window.addEventListener('resize', () => {
        const data = this.toDataURL();
        this.initCanvas();
        if (this.hasDrawn && data) {
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
      if (!this.hasDrawn) return null;
      return this.canvas.toDataURL('image/png');
    }
  }

  // 3. 主應用程式初始化
  document.addEventListener('DOMContentLoaded', function () {
    // 綁定輸入欄位元素
    const formFields = {
      contractNumber: document.getElementById('contractNumber'),
      propertyAddress: document.getElementById('propertyAddress'),
      landlordName: document.getElementById('landlordName'),
      landlordTaxId: document.getElementById('landlordTaxId'),
      tenantName: document.getElementById('tenantName'),
      tenantIdNo: document.getElementById('tenantIdNo'),
      tenantPhone: document.getElementById('tenantPhone'),
      notifyHours: document.getElementById('notifyHours'),
      compensationLimit: document.getElementById('compensationLimit'),
      agreementDate: document.getElementById('agreementDate'),
      specialRemark: document.getElementById('specialRemark')
    };

    // 預設日期為今天 (YYYY-MM-DD)
    if (formFields.agreementDate && !formFields.agreementDate.value) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      formFields.agreementDate.value = `${yyyy}-${mm}-${dd}`;
    }

    // 預覽元素
    const previewEls = {
      previewContractNo: document.getElementById('previewContractNo'),
      previewAddress: document.getElementById('previewAddress'),
      previewLandlord: document.getElementById('previewLandlord'),
      previewTenant: document.getElementById('previewTenant'),
      previewTenantId: document.getElementById('previewTenantId'),
      previewTenantPhone: document.getElementById('previewTenantPhone'),
      previewNotifyHours: document.getElementById('previewNotifyHours'),
      previewLimitNum: document.getElementById('previewLimitNum'),
      previewLimitChinese: document.getElementById('previewLimitChinese'),
      previewDate: document.getElementById('previewDate'),
      previewMeasuresList: document.getElementById('previewMeasuresList'),
      previewSpecialRemarkWrap: document.getElementById('previewSpecialRemarkWrap'),
      previewSpecialRemarkText: document.getElementById('previewSpecialRemarkText'),
      signImgLandlord: document.getElementById('signImgLandlord'),
      signImgTenant: document.getElementById('signImgTenant')
    };

    // 雙手寫簽章板
    const landlordCanvas = document.getElementById('landlordCanvas');
    const landlordClearBtn = document.getElementById('landlordClearBtn');
    const landlordPlaceholder = document.getElementById('landlordPlaceholder');

    const tenantCanvas = document.getElementById('tenantCanvas');
    const tenantClearBtn = document.getElementById('tenantClearBtn');
    const tenantPlaceholder = document.getElementById('tenantPlaceholder');

    let landlordSignPad = null;
    let tenantSignPad = null;

    if (landlordCanvas) {
      landlordSignPad = new SignaturePad(
        landlordCanvas,
        landlordClearBtn,
        landlordPlaceholder,
        (dataUrl) => {
          if (previewEls.signImgLandlord) {
            previewEls.signImgLandlord.src = dataUrl || '';
            previewEls.signImgLandlord.style.display = dataUrl ? 'block' : 'none';
          }
        }
      );
    }

    if (tenantCanvas) {
      tenantSignPad = new SignaturePad(
        tenantCanvas,
        tenantClearBtn,
        tenantPlaceholder,
        (dataUrl) => {
          if (previewEls.signImgTenant) {
            previewEls.signImgTenant.src = dataUrl || '';
            previewEls.signImgTenant.style.display = dataUrl ? 'block' : 'none';
          }
        }
      );
    }

    // 取得所有勾選項目的文字
    function getCheckedLabels(selector) {
      const checkboxes = document.querySelectorAll(selector + ':checked');
      const list = [];
      checkboxes.forEach((cb) => {
        const titleEl = cb.closest('.mold-checkbox-label').querySelector('.mold-checkbox-text');
        if (titleEl) {
          list.push(titleEl.firstChild.textContent.trim());
        }
      });
      return list;
    }

    // 即時連動更新預覽內容
    function updatePreview() {
      // 契約編號
      if (previewEls.previewContractNo) {
        previewEls.previewContractNo.textContent = formFields.contractNumber.value.trim() || '（未填寫契約編號）';
      }

      // 房屋地址
      if (previewEls.previewAddress) {
        previewEls.previewAddress.textContent = formFields.propertyAddress.value.trim() || '高雄市前鎮區/小港區租賃物現場';
      }

      // 出租人
      if (previewEls.previewLandlord) {
        const lName = formFields.landlordName.value.trim() || '港居不動產開發有限公司';
        const lTax = formFields.landlordTaxId.value.trim() ? `（統編：${formFields.landlordTaxId.value.trim()}）` : '';
        previewEls.previewLandlord.textContent = `${lName} ${lTax}`;
      }

      // 承租人
      if (previewEls.previewTenant) {
        previewEls.previewTenant.textContent = formFields.tenantName.value.trim() || '（立承諾書人姓名）';
      }
      if (previewEls.previewTenantId) {
        previewEls.previewTenantId.textContent = formFields.tenantIdNo.value.trim() || '—';
      }
      if (previewEls.previewTenantPhone) {
        previewEls.previewTenantPhone.textContent = formFields.tenantPhone.value.trim() || '—';
      }

      // 通報時限
      if (previewEls.previewNotifyHours) {
        previewEls.previewNotifyHours.textContent = formFields.notifyHours.value.trim() || '48';
      }

      // 賠償限額
      const limitVal = Number(formFields.compensationLimit.value) || 5000;
      if (previewEls.previewLimitNum) {
        previewEls.previewLimitNum.textContent = limitVal.toLocaleString();
      }
      if (previewEls.previewLimitChinese) {
        previewEls.previewLimitChinese.textContent = numberToChineseUppercase(limitVal);
      }

      // 切結日期
      if (previewEls.previewDate) {
        const dStr = formFields.agreementDate.value;
        if (dStr) {
          const parts = dStr.split('-');
          if (parts.length === 3) {
            const rocYear = parseInt(parts[0], 10) - 1911;
            previewEls.previewDate.textContent = `中華民國 ${rocYear} 年 ${parts[1]} 月 ${parts[2]} 日`;
          } else {
            previewEls.previewDate.textContent = dStr;
          }
        } else {
          previewEls.previewDate.textContent = '中華民國 年 月 日';
        }
      }

      // 防潮措施要項
      if (previewEls.previewMeasuresList) {
        const measures = getCheckedLabels('.measure-checkbox');
        if (measures.length > 0) {
          previewEls.previewMeasuresList.textContent = measures.join('、');
        } else {
          previewEls.previewMeasuresList.textContent = '洗沐抽風排濕、室內除濕晾衣、空調濾網每季清洗、木質家具保留間隙、南風反潮除濕防護、門窗膠條定期擦拭（全面防護）';
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

    // 監聽所有表單輸入
    Object.values(formFields).forEach((el) => {
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    // 監聽勾選框
    document.querySelectorAll('.measure-checkbox').forEach((cb) => {
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
        ctx.fillStyle = '#1e3a8a';
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
        ctx.fillText('住宅租賃室內防潮防黴與環境通風維護承諾書', 420, 102);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《民法》第423/430/432/437條善良管理人責任與及時通報義務簽立】', 420, 126);

        // 分隔線
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, 142);
        ctx.lineTo(792, 142);
        ctx.stroke();

        // 契約基本資訊表格框
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(48, 156, 744, 96);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(48, 156, 744, 96);

        ctx.fillStyle = '#334155';
        ctx.font = '13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'left';

        const contractNo = formFields.contractNumber.value.trim() || '（未填寫）';
        const address = formFields.propertyAddress.value.trim() || '高雄市前鎮區/小港區租賃物現場';
        const landlord = formFields.landlordName.value.trim() || '港居不動產開發有限公司';
        const tenant = formFields.tenantName.value.trim() || '（立承諾書人）';
        const tenantId = formFields.tenantIdNo.value.trim() || '—';
        const tenantPhone = formFields.tenantPhone.value.trim() || '—';
        const notifyH = formFields.notifyHours.value.trim() || '48';
        const limitVal = Number(formFields.compensationLimit.value) || 5000;

        ctx.fillText(`主約編號：${contractNo}`, 64, 182);
        ctx.fillText(`租賃物地址：${address}`, 380, 182);
        ctx.fillText(`受託代管／出租人：${landlord}`, 64, 212);
        ctx.fillText(`承租人姓名：${tenant} (${tenantId})`, 380, 212);
        ctx.fillText(`連絡電話：${tenantPhone}`, 64, 238);
        ctx.fillText(`立書日期：${previewEls.previewDate.textContent}`, 380, 238);

        // 核心法條與約定條款
        let y = 280;
        const drawClauseTitle = (num, text) => {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(`${num}. ${text}`, 48, y);
          y += 20;
        };

        const drawClauseBody = (lines) => {
          ctx.fillStyle = '#475569';
          ctx.font = '12px "PingFang TC", "Microsoft JhengHei", sans-serif';
          lines.forEach((line) => {
            ctx.fillText(line, 64, y);
            y += 18;
          });
          y += 6;
        };

        drawClauseTitle('第一條', '善良管理人通風維護義務與防潮排濕要項');
        const measures = getCheckedLabels('.measure-checkbox');
        const measuresStr = measures.length > 0 ? measures.join('、') : '洗沐抽風排濕、除濕晾衣、空調濾網清洗、防潮通風間隙';
        drawClauseBody([
          `一、承租人承諾以善良管理人之注意義務，維持租賃標的良好通風，杜絕人為潮濕積累。`,
          `二、防潮保養要項：${measuresStr}。`,
          `三、衛浴洗沐後應抽風 30~60 分鐘；室內晾衣強制除濕；木製家具與牆面預留 5~10cm 通風間隙。`
        ]);

        drawClauseTitle('第二條', '發黴瑕疵通報黃金時限與損害擴大責任');
        drawClauseBody([
          `一、依《民法》第 437 條規定，承租人發現牆面結露滲水、水痕、壁癌或異常大面積發黴跡象時，`,
          `    應於 ${notifyH} 小時內拍照通報出租人或受託代管業。`,
          `二、承租人怠於通報致出租人無法及時修繕而擴大損害者，承租人應負擔擴大損害部分之賠償責任。`
        ]);

        drawClauseTitle('第三條', '責任歸屬界定原則（結構修繕 vs 人為維護）');
        drawClauseBody([
          `一、結構性滲漏水、外牆冷熱暗管滲漏、頂樓防水層老化等不可抗力瑕疵，由出租人全額負擔修繕。`,
          `二、日常通風不良、浴室不抽風、室內緊閉大量晾衣等人為悶濕釀黴，由承租人自主清潔除黴。`
        ]);

        drawClauseTitle('第四條', '家具損害賠償與專業除黴清潔約定');
        drawClauseBody([
          `一、承租人因使用不當致木質家具、床組、壁面發黴毀損，應依折舊殘值照價賠償或負擔除黴費用。`,
          `二、雙方合意承租人因人為受潮發黴之賠償上限約定為新臺幣 ${limitVal.toLocaleString()} 元整`,
          `    （大寫：${numberToChineseUppercase(limitVal)}），退租時由押租保證金優先扣抵清結。`
        ]);

        const remarkVal = formFields.specialRemark.value.trim();
        if (remarkVal) {
          drawClauseTitle('第五條', '特約加註事項');
          drawClauseBody([`特別約定：${remarkVal}`]);
        }

        // 簽章區域 (底端)
        y = 960;
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(48, y);
        ctx.lineTo(792, y);
        ctx.stroke();

        y += 24;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('出租人／受託代管業（簽章）：', 80, y);
        ctx.fillText('承租人／立承諾書人（親筆簽名）：', 450, y);

        // 畫入簽名
        const landlordImgUrl = landlordSignPad ? landlordSignPad.toDataURL() : null;
        const tenantImgUrl = tenantSignPad ? tenantSignPad.toDataURL() : null;

        let loaded = 0;
        const totalToLoad = (landlordImgUrl ? 1 : 0) + (tenantImgUrl ? 1 : 0);

        const finalizeCanvasDownload = () => {
          // 印製日期與防偽字串
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          const hashStr = `GANJU-MOLD-PREV-V5.5-${Date.now().toString(36).toUpperCase()}`;
          ctx.fillText(`存證編號：${hashStr} ｜ 港居數位營運法務中心`, 792, 1140);

          // 下載檔案
          const link = document.createElement('a');
          const tName = formFields.tenantName.value.trim() || '承租人';
          const dStr = formFields.agreementDate.value || '2026';
          link.download = `住宅租賃室內防潮防黴維護承諾書_${tName}_${dStr}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        if (totalToLoad === 0) {
          finalizeCanvasDownload();
        } else {
          if (landlordImgUrl) {
            const lImg = new Image();
            lImg.onload = () => {
              ctx.drawImage(lImg, 80, y + 10, 240, 70);
              loaded++;
              if (loaded === totalToLoad) finalizeCanvasDownload();
            };
            lImg.src = landlordImgUrl;
          }
          if (tenantImgUrl) {
            const tImg = new Image();
            tImg.onload = () => {
              ctx.drawImage(tImg, 450, y + 10, 240, 70);
              loaded++;
              if (loaded === totalToLoad) finalizeCanvasDownload();
            };
            tImg.src = tenantImgUrl;
          }
        }
      });
    }

    // 5. LINE 備忘摘要複製
    const copyLineBtn = document.getElementById('copyLineBtn');
    if (copyLineBtn) {
      copyLineBtn.addEventListener('click', function () {
        const tName = formFields.tenantName.value.trim() || '立承諾書人';
        const contractNo = formFields.contractNumber.value.trim() || '主約約定';
        const address = formFields.propertyAddress.value.trim() || '租賃標的現場';
        const notifyH = formFields.notifyHours.value.trim() || '48';
        const limitVal = Number(formFields.compensationLimit.value) || 5000;
        const limitChinese = numberToChineseUppercase(limitVal);
        const dateStr = previewEls.previewDate.textContent;

        const summary = [
          `【港居租賃 - 住宅租賃室內防潮防黴與通風維護承諾通知】`,
          `------------------------------`,
          `承租人：${tName} 先生/女士`,
          `主租賃契約編號：${contractNo}`,
          `租賃物門牌：${address}`,
          `立書生效日期：${dateStr}`,
          `------------------------------`,
          `💧【核心防潮排濕與保養要項】：`,
          `1. 衛浴抽風排濕：洗沐完畢強制開啟抽風機 30~60 分鐘或刮除積水，嚴禁關閉抽風悶濕水氣。`,
          `2. 室內除濕晾衣：室內晾衣務必開啟除濕機或保持對流，防範相對濕度超標全室發黴。`,
          `3. 空調濾網清洗：冷氣室內機濾網每季定期清水洗滌陰乾，防範出風口滋生黴菌孢子。`,
          `4. 家具保留間隔：木製收納櫃、床架靠牆留設 5~10 公分通風安全間距，杜絕結露悶黴。`,
          `5. 瑕疵及時通報：發現牆面滲水、水痕、壁癌掉漆，承諾於 ${notifyH} 小時內拍照通報（民法第437條）。`,
          `6. 責任分擔賠償：結構漏水由屋主全額修繕；因個人不良悶濕習慣釀黴，承租人願負擔除黴清潔費（上限 NT$ ${limitVal.toLocaleString()} 元整，${limitChinese}）。`,
          `------------------------------`,
          `港居不動產開發有限公司（統編：96797997）`,
          `線上合約查核中心：https://example.com/mold-prevention-agreement.html`
        ].join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(summary).then(() => {
            alert('已成功複製「室內防潮防黴維護承諾書」LINE 摘要至剪貼簿！');
          }).catch(() => {
            prompt('請手動複製以下切結摘要：', summary);
          });
        } else {
          prompt('請手動複製以下切結摘要：', summary);
        }
      });
    }

    // 6. 列印按鈕
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // 7. 草稿自動暫存與還原
    const STORAGE_KEY = 'ganju_mold_prev_draft';
    function saveDraft() {
      const data = {};
      Object.keys(formFields).forEach((key) => {
        if (formFields[key]) data[key] = formFields[key].value;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadDraft() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        Object.keys(data).forEach((key) => {
          if (formFields[key] && data[key]) {
            formFields[key].value = data[key];
          }
        });
        updatePreview();
      } catch (e) {
        console.warn('Draft load failed', e);
      }
    }

    loadDraft();
    Object.values(formFields).forEach((el) => {
      if (el) el.addEventListener('change', saveDraft);
    });
  });
})();
