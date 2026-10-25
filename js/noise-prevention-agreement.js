/**
 * 港居不動產 - 住宅租賃噪音防制與生活安寧特約承諾書產生器
 * 核心邏輯: noise-prevention-agreement.js
 * 依據《民法》第793/432條、《噪音管制法》第6條、《社會秩序維護法》第72條與《公寓大廈管理條例》第16條
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
        // 尺寸變化時保持簽名
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
      quietWeekdayStart: document.getElementById('quietWeekdayStart'),
      quietWeekdayEnd: document.getElementById('quietWeekdayEnd'),
      quietHolidayStart: document.getElementById('quietHolidayStart'),
      quietHolidayEnd: document.getElementById('quietHolidayEnd'),
      noiseDecibelLimit: document.getElementById('noiseDecibelLimit'),
      cureHours: document.getElementById('cureHours'),
      penaltyAmount: document.getElementById('penaltyAmount'),
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
      previewQuietWeekday: document.getElementById('previewQuietWeekday'),
      previewQuietHoliday: document.getElementById('previewQuietHoliday'),
      previewNoiseDecibel: document.getElementById('previewNoiseDecibel'),
      previewCureHours: document.getElementById('previewCureHours'),
      previewPenaltyNum: document.getElementById('previewPenaltyNum'),
      previewPenaltyChinese: document.getElementById('previewPenaltyChinese'),
      previewMeasuresList: document.getElementById('previewMeasuresList'),
      previewSpecialRemarkWrap: document.getElementById('previewSpecialRemarkWrap'),
      previewSpecialRemarkText: document.getElementById('previewSpecialRemarkText'),
      previewDate: document.getElementById('previewDate')
    };

    // 取得所有已勾選的管制要項文字
    function getCheckedLabels(selector) {
      const checked = [];
      document.querySelectorAll(selector).forEach((cb) => {
        if (cb.checked) {
          const textEl = cb.closest('.noise-check-item').querySelector('.noise-check-text strong');
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
        previewEls.previewTenant.textContent = formFields.tenantName.value.trim() || '（立承諾書人姓名）';
      }
      if (previewEls.previewTenantId) {
        previewEls.previewTenantId.textContent = formFields.tenantIdNo.value.trim() || '—';
      }
      if (previewEls.previewTenantPhone) {
        previewEls.previewTenantPhone.textContent = formFields.tenantPhone.value.trim() || '—';
      }

      // 安寧時段
      const wStart = formFields.quietWeekdayStart.value || '22:00';
      const wEnd = formFields.quietWeekdayEnd.value || '08:00';
      if (previewEls.previewQuietWeekday) {
        previewEls.previewQuietWeekday.textContent = `平日夜間每日 ${wStart} 至翌日 ${wEnd}`;
      }

      const hStart = formFields.quietHolidayStart.value || '22:00';
      const hEnd = formFields.quietHolidayEnd.value || '09:00';
      if (previewEls.previewQuietHoliday) {
        previewEls.previewQuietHoliday.textContent = `例假日及國定假日夜間 ${hStart} 至翌日 ${hEnd} 及午間 12:30 至 14:00`;
      }

      if (previewEls.previewNoiseDecibel) {
        previewEls.previewNoiseDecibel.textContent = formFields.noiseDecibelLimit.value.trim() || '45';
      }

      if (previewEls.previewCureHours) {
        previewEls.previewCureHours.textContent = formFields.cureHours.value.trim() || '24';
      }

      // 懲罰性違約金
      const penaltyVal = Number(formFields.penaltyAmount.value) || 3000;
      if (previewEls.previewPenaltyNum) {
        previewEls.previewPenaltyNum.textContent = penaltyVal.toLocaleString();
      }
      if (previewEls.previewPenaltyChinese) {
        previewEls.previewPenaltyChinese.textContent = numberToChineseUppercase(penaltyVal);
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

      // 噪音防制要項
      if (previewEls.previewMeasuresList) {
        const measures = getCheckedLabels('.measure-checkbox');
        if (measures.length > 0) {
          previewEls.previewMeasuresList.textContent = measures.join('、');
        } else {
          previewEls.previewMeasuresList.textContent = '視聽影音低頻管制、室內走動與地板衝擊音防制、桌椅靜音腳墊防震、深夜喧嘩聚會管制、樂器時段練習限制、高噪家電夜間運轉管制（全面安寧）';
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
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, 840, 14);

        // 外框裝飾線
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 28, 784, 1124);

        // 標題區域
        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 24px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司', 420, 68);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('住宅租賃噪音防制與生活安寧特約承諾書', 420, 102);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《民法》第793/432條、《社維法》第72條與《公寓大廈管理條例》第16條簽立】', 420, 126);

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
        const tenantVal = `${formFields.tenantName.value.trim() || '—'}（身分證字號：${formFields.tenantIdNo.value.trim() || '—'} ｜ 電話：${formFields.tenantPhone.value.trim() || '—'}）`;

        drawRow(155, '主租賃契約編號', contractVal);
        drawRow(187, '租賃物標的地址', addressVal);
        drawRow(219, '受託代管／出租人', landlordVal);
        drawRow(251, '承租人（立書人）', tenantVal);

        // 法律核心條款標題與內容
        let currY = 305;
        const drawClauseTitle = (title) => {
          ctx.fillStyle = '#0284c7';
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
        drawClauseTitle('第一條、安寧時段（Quiet Hours）與生活自律原則');
        const wStart = formFields.quietWeekdayStart.value || '22:00';
        const wEnd = formFields.quietWeekdayEnd.value || '08:00';
        const hStart = formFields.quietHolidayStart.value || '22:00';
        const hEnd = formFields.quietHolidayEnd.value || '09:00';
        const dbLimit = formFields.noiseDecibelLimit.value.trim() || '45';
        drawClauseText(`一、生活安寧時段：平日夜間每日 ${wStart} 至翌日 ${wEnd}；例假日及國定假日夜間 ${hStart} 至翌日 ${hEnd} 及午間 12:30 至 14:00。安寧時段室內活動音量應維持在 ${dbLimit} 分貝（dB(A)）以下，避免聲響侵入周邊鄰舍。`);
        const measures = getCheckedLabels('.measure-checkbox');
        const measuresStr = measures.length > 0 ? measures.join('、') : '視聽影音低頻管制、室內走動與地板衝擊音防制、桌椅靜音腳墊、深夜喧嘩管制、樂器時段練習限制、高噪家電夜間運轉管制';
        drawClauseText(`二、噪音防制自律範疇：承諾切實履行【${measuresStr}】。嚴禁深夜奔跑踩踏、重低音共振、深夜甩門或聚眾喧鬧，桌椅腳主動黏貼靜音腳墊。`);

        // 第二條
        drawClauseTitle('第二條、同住人與訪客共同拘束與完全連帶責任');
        drawClauseText('一、承租人之同住親友、訪客、派對賓客在承租專有空間及社區大樓公設範圍之一切製造喧囂噪音行為，視同承租人本人之行為，承租人負完全連帶防制與損害賠償責任。');

        // 第三條
        drawClauseTitle('第三條、三級違規處置機制與懲罰性違約金');
        const cureH = formFields.cureHours.value.trim() || '24';
        const penaltyVal = Number(formFields.penaltyAmount.value) || 3000;
        const penaltyCh = numberToChineseUppercase(penaltyVal);
        drawClauseText(`一、第一級（初次勸導）：經鄰舍陳情、管理室通知或員警查訪，出租人/代管業以書面或通訊軟體（LINE）勸導，承租人承諾於 ${cureH} 小時內完成改善。`);
        drawClauseText(`二、第二級（累犯罰鍰）：經勸導後仍再次接獲投訴查證屬實或遭警方裁罰，承租人同意支付懲罰性違約金新臺幣 ${penaltyVal.toLocaleString()} 元整（${penaltyCh}），作為社區生活安寧補償金。`);
        drawClauseText('三、第三級（終止租約）：累計投訴達三次以上或遭主管機關開單處分，出租人得依租賃專法提前終止租約，承租人應於 7 日內無條件搬遷返還房屋。');

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
        ctx.fillText(`立書日期：${dateChinese}`, 792, currY + 10);
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
        ctx.fillText('出租人／受託代管業（蓋章／簽署）：', 60, signBoxY + 19);
        ctx.fillText('承租人／立承諾書人（親筆簽署）：', 464, signBoxY + 19);

        // 繪製雙方簽名（若有）
        let drawnSigns = 0;
        const totalSigns = 2;

        const finalizeAndDownload = () => {
          // 頁尾官方浮水印與免責聲明
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('本文件由港居不動產開發有限公司線上法務工具系統自動生成・高雄市小港區中安路880號・電話：0968-863-880', 420, 1145);

          const link = document.createElement('a');
          link.download = `港居不動產_住宅租賃生活安寧特約承諾書_${formFields.tenantName.value.trim() || '立書人'}.png`;
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
        const wStart = formFields.quietWeekdayStart.value || '22:00';
        const wEnd = formFields.quietWeekdayEnd.value || '08:00';
        const hStart = formFields.quietHolidayStart.value || '22:00';
        const hEnd = formFields.quietHolidayEnd.value || '09:00';
        const dbLimit = formFields.noiseDecibelLimit.value.trim() || '45';
        const penaltyVal = Number(formFields.penaltyAmount.value) || 3000;
        const penaltyCh = numberToChineseUppercase(penaltyVal);
        const cureH = formFields.cureHours.value.trim() || '24';
        const measures = getCheckedLabels('.measure-checkbox');
        const measuresStr = measures.length > 0 ? measures.join('、') : '視聽影音低頻管制、室內走動防噪、桌椅靜音腳墊、深夜喧嘩管制、樂器時段練習限制、高噪家電夜間運轉管制';

        const lineText = `【港居不動產｜住宅租賃噪音防制與生活安寧特約承諾書存證】
📍 房屋標的：${addr}
📄 主約編號：${cNo}
👤 承租人（立書人）：${tName}

🔇 生活安寧時段（Quiet Hours）：
・平日夜間：每日 ${wStart} 至翌日 ${wEnd}
・例假日/國定假日：${hStart} 至翌日 ${hEnd} 及午間 12:30~14:00
・安寧管制限額：${dbLimit} 分貝（dB(A)）以下

✅ 自律防制要項：
${measuresStr}

⚖️ 違規處置責任約定：
1. 初次勸導：接獲通知應於 ${cureH} 小時內配合改善。
2. 累犯罰款：再次違規自願支付違約金 NT$ ${penaltyVal.toLocaleString()} 元整（${penaltyCh}）。
3. 終止租約：累計違規達 3 次或遭官方開罰，無條件提前終止租約並遷出。

📅 立書日期：${formFields.agreementDate.value || today}
🏛️ 受託代管機構：港居不動產開發有限公司（統編：96797997）
💡 本備忘依據《民法》第793/432條、《社維法》第72條與《公寓大廈管理條例》第16條簽署生效。`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lineText).then(() => {
            alert('已成功複製「住宅租賃生活安寧承諾書摘要」至剪貼簿！可直接貼入 LINE 群組存證。');
          }).catch(() => {
            prompt('請手動複製以下切結文字：', lineText);
          });
        } else {
          prompt('請手動複製以下切結文字：', lineText);
        }
      });
    }

    // 7. LocalStorage 自動草稿備份
    const STORAGE_KEY = 'ganju_noise_prevention_draft';
    function saveDraft() {
      const data = {};
      Object.keys(formFields).forEach((key) => {
        if (formFields[key]) data[key] = formFields[key].value;
      });
      const checkStates = {};
      document.querySelectorAll('.measure-checkbox').forEach((cb, idx) => {
        checkStates[idx] = cb.checked;
      });
      data.checkStates = checkStates;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // LocalStorage full or private browsing
      }
    }

    function loadDraft() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.keys(data).forEach((key) => {
          if (key === 'checkStates') {
            const checks = data[key];
            document.querySelectorAll('.measure-checkbox').forEach((cb, idx) => {
              if (checks[idx] !== undefined) cb.checked = checks[idx];
            });
          } else if (formFields[key]) {
            formFields[key].value = data[key];
          }
        });
        updatePreview();
      } catch (e) {}
    }

    // 當離開或修改時儲存草稿
    Object.values(formFields).forEach((el) => {
      if (el) el.addEventListener('blur', saveDraft);
    });
    document.querySelectorAll('.measure-checkbox').forEach((cb) => {
      cb.addEventListener('change', saveDraft);
    });

    // 嘗試加載草稿
    loadDraft();
  });
})();
