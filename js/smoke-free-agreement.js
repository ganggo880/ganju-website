/**
 * 港居不動產 - 住宅租賃無菸住宅（全面禁菸）特約承諾書產生器
 * 核心邏輯: smoke-free-agreement.js
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
      violationFineAmount: document.getElementById('violationFineAmount'),
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
      previewFineNum: document.getElementById('previewFineNum'),
      previewFineChinese: document.getElementById('previewFineChinese'),
      previewDate: document.getElementById('previewDate'),
      previewItemsList: document.getElementById('previewItemsList'),
      previewSpacesList: document.getElementById('previewSpacesList'),
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
        const titleEl = cb.closest('.smoke-checkbox-label').querySelector('.smoke-checkbox-text');
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

      // 違約金數額
      const fineVal = Number(formFields.violationFineAmount.value) || 5000;
      if (previewEls.previewFineNum) {
        previewEls.previewFineNum.textContent = fineVal.toLocaleString();
      }
      if (previewEls.previewFineChinese) {
        previewEls.previewFineChinese.textContent = numberToChineseUppercase(fineVal);
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

      // 禁菸品項列表
      if (previewEls.previewItemsList) {
        const items = getCheckedLabels('.item-checkbox');
        if (items.length > 0) {
          previewEls.previewItemsList.textContent = items.join('、');
        } else {
          previewEls.previewItemsList.textContent = '全品項傳統紙菸、電子煙、加熱菸、水煙及各類新興菸草（全品項禁菸）';
        }
      }

      // 禁菸區域列表
      if (previewEls.previewSpacesList) {
        const spaces = getCheckedLabels('.space-checkbox');
        if (spaces.length > 0) {
          previewEls.previewSpacesList.textContent = spaces.join('、');
        } else {
          previewEls.previewSpacesList.textContent = '承租室內專有空間、浴廁排氣管道孔、專屬陽台露台、大樓共用梯間走廊及窗戶邊緣（全面禁菸）';
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
    document.querySelectorAll('.item-checkbox, .space-checkbox').forEach((cb) => {
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
        ctx.fillText('住宅租賃無菸住宅（全面禁菸）特約承諾書', 420, 102);

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 12px "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText('【依據《菸害防制法》第18/19/20條與《民法》第432條善良管理人責任簽立】', 420, 126);

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
        const fineVal = Number(formFields.violationFineAmount.value) || 5000;

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

        drawClauseTitle('第一條', '全面禁菸範圍與新興菸品全面納管');
        const items = getCheckedLabels('.item-checkbox');
        const itemsStr = items.length > 0 ? items.join('、') : '紙菸、電子煙、加熱菸、水煙';
        drawClauseBody([
          `一、承租人承諾於本租賃標的範圍內嚴格遵守「全無菸住宅原則」，全面禁止吸食任何菸品。`,
          `二、禁菸品項涵蓋：${itemsStr}。`,
          `三、嚴禁使用各類新興霧化器具、草本薰香與產生焦油及二手菸氣味之任何載具。`
        ]);

        drawClauseTitle('第二條', '管制空間區域與管道間防擴散約定');
        const spaces = getCheckedLabels('.space-checkbox');
        const spacesStr = spaces.length > 0 ? spaces.join('、') : '室內專有部分、陽台、浴廁排氣孔、梯間走廊';
        drawClauseBody([
          `一、管制空間涵蓋：${spacesStr}。`,
          `二、承租人絕不於浴室排氣孔、抽油煙機孔朝管路吐煙，避免二手菸沿管道間逸散至其他住戶。`,
          `三、嚴禁將手伸出窗外或於陽台、露台吸菸，同住人及來訪親友之吸菸行為一律由承租人負連帶責任。`
        ]);

        drawClauseTitle('第三條', '三級違約處置責任與懲罰性違約金');
        drawClauseBody([
          `一、初次違規：經管委會反映、鄰居申訴或留有菸蒂煙味，出租人以書面或 LINE 勸導限期改善。`,
          `二、再次違規：經查證屬實，承租人同意自願支付懲罰性違約金新臺幣 ${fineVal.toLocaleString()} 元整`,
          `    （大寫：${numberToChineseUppercase(fineVal)}），作為社區公衛安寧維護之補償。`,
          `三、三次以上或拒不改善：出租人得依法逕行提前終止租約，限期 7 日內遷出返還，無須給付搬遷補償。`
        ]);

        drawClauseTitle('第四條', '深層專業除味清潔與損害賠償完全負擔');
        drawClauseBody([
          `一、退租或終止租約時若殘留菸味，承租人應負擔專業臭氧燻蒸、空氣淨化與光觸媒除味施作費用。`,
          `二、室內牆面、天花板附著尼古丁焦油者，承租人全額負擔全室批土重新粉刷得利防菸油漆之工料費。`,
          `三、如因二手菸味侵害鄰居居住安寧遭提告侵權，承租人應自負民刑事賠償責任並負擔相關訴訟費用。`
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
          const hashStr = `GANJU-SMOKE-FREE-V5.4-${Date.now().toString(36).toUpperCase()}`;
          ctx.fillText(`存證編號：${hashStr} ｜ 港居數位營運法務中心`, 792, 1140);

          // 下載檔案
          const link = document.createElement('a');
          const tName = formFields.tenantName.value.trim() || '承租人';
          const dStr = formFields.agreementDate.value || '2026';
          link.download = `住宅租賃無菸住宅特約承諾書_${tName}_${dStr}.png`;
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
        const fineVal = Number(formFields.violationFineAmount.value) || 5000;
        const fineChinese = numberToChineseUppercase(fineVal);
        const dateStr = previewEls.previewDate.textContent;

        const summary = [
          `【港居租賃 - 住宅租賃無菸住宅（全面禁菸）特約承諾通知】`,
          `------------------------------`,
          `承租人：${tName} 先生/女士`,
          `主租賃契約編號：${contractNo}`,
          `租賃物門牌：${address}`,
          `立書生效日期：${dateStr}`,
          `------------------------------`,
          `🚭【核心禁菸與管理規範】：`,
          `1. 全無菸標的：承租室內、衛浴抽風孔、陽台露台、大樓共用梯間及窗邊全面禁菸。`,
          `2. 全品項納管：紙菸、電子煙、加熱菸、水煙及各類新興菸草均在嚴禁之列。`,
          `3. 共同拘束：同住人、家屬與來訪親友之一切吸菸行為，承租人負完全連帶責任。`,
          `4. 違約處置：初次違規勸導；再犯自願支付懲罰性違約金 NT$ ${fineVal.toLocaleString()} 元整（${fineChinese}）；屢勸不聽者依法逕行提前終止租約限期遷讓。`,
          `5. 復原賠償：若殘留菸味焦油，承租人自願承擔專業臭氧除味燻蒸與得利油漆全室粉刷費用。`,
          `------------------------------`,
          `港居不動產開發有限公司（統編：96797997）`,
          `線上合約查核中心：https://example.com/smoke-free-agreement.html`
        ].join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(summary).then(() => {
            alert('已成功複製「住宅租賃無菸住宅特約承諾書」LINE 摘要至剪貼簿！');
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
    const STORAGE_KEY = 'ganju_smoke_free_draft';
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
