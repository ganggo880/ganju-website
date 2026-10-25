/**
 * js/abandoned-property-agreement.js
 * 港居不動產 - 租賃住宅承租人遺留物處理授權與拋棄切結書產生器核心腳本
 * 符合《租賃住宅市場發展及管理條例》第12條、內政部定型化契約應記載事項第18點、《民法》第445條留置權
 */

(function () {
  'use strict';

  // 數字轉繁體中文大寫金額
  function toChineseCurrency(num) {
    if (isNaN(num) || num === null || num === undefined) return '零元整';
    num = Math.round(Math.abs(num));
    if (num === 0) return '零元整';
    
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億'];
    
    let str = '';
    let numStr = num.toString();
    let len = numStr.length;
    
    let parts = [];
    while (numStr.length > 0) {
      parts.push(numStr.slice(-4));
      numStr = numStr.slice(0, -4);
    }
    
    let result = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      let part = parts[i];
      let partStr = '';
      let zero = false;
      for (let j = 0; j < part.length; j++) {
        let n = parseInt(part[j], 10);
        let u = part.length - 1 - j;
        if (n !== 0) {
          if (zero) {
            partStr += '零';
            zero = false;
          }
          partStr += digits[n] + units[u];
        } else {
          zero = true;
        }
      }
      if (partStr !== '') {
        result += partStr + bigUnits[i];
      }
    }
    
    return '新臺幣 ' + result + '元整';
  }

  // 狀態管理物件
  const state = {
    mode: 'on-site', // 'on-site' | 'pre-auth' | 'notice-expire'
    docNo: '',
    date: '',
    propertyAddress: '',
    tenantName: '',
    tenantId: '',
    tenantPhone: '',
    tenantAddress: '',
    landlordName: '港居不動產開發有限公司（受託代管公司）',
    landlordTaxId: '96797997',
    landlordPhone: '07-793-3997',
    agentLicense: '(112)高市字第013739號',
    witnessName: '',
    witnessRole: '',
    
    // 遺留物清單
    items: [
      { category: '廢棄家具', name: '雙人布沙發（布面破損泛黃）', qty: '1', unit: '組', val: '無殘值 (0元)', action: '代為清運廢棄', note: '租客同意免責丟棄' },
      { category: '老舊家電', name: '二手傳統窗型冷氣（不冷壞損）', qty: '1', unit: '台', val: '無殘值 (0元)', action: '交由資源回收', note: '機齡逾15年' },
      { category: '雜物袋', name: '生活雜物、舊衣物裝袋', qty: '3', unit: '袋', val: '無殘值 (0元)', action: '代為清運廢棄', note: '確認無貴重物品' }
    ],
    
    // 費用結算
    disposalFee: 3500,
    laborFee: 1500,
    storageFee: 0,
    securityDeposit: 15000,
    
    // 存證照片 (Base64)
    photos: {
      photo1: null,
      photo2: null,
      photo3: null,
      photo4: null
    },
    
    // 簽章狀態
    tenantSigned: false,
    landlordSigned: false
  };

  // DOM 元素引用快取
  const dom = {
    modeButtons: document.querySelectorAll('.mode-option-btn'),
    docNoInput: document.getElementById('docNoInput'),
    dateInput: document.getElementById('dateInput'),
    propertyAddress: document.getElementById('propertyAddress'),
    tenantName: document.getElementById('tenantName'),
    tenantId: document.getElementById('tenantId'),
    tenantPhone: document.getElementById('tenantPhone'),
    tenantAddress: document.getElementById('tenantAddress'),
    landlordName: document.getElementById('landlordName'),
    landlordTaxId: document.getElementById('landlordTaxId'),
    landlordPhone: document.getElementById('landlordPhone'),
    agentLicense: document.getElementById('agentLicense'),
    witnessName: document.getElementById('witnessName'),
    witnessRole: document.getElementById('witnessRole'),
    
    // 費用
    disposalFeeInput: document.getElementById('disposalFeeInput'),
    laborFeeInput: document.getElementById('laborFeeInput'),
    storageFeeInput: document.getElementById('storageFeeInput'),
    securityDepositInput: document.getElementById('securityDepositInput'),
    
    // 表格與按鈕
    itemsTableBody: document.getElementById('itemsTableBody'),
    btnAddItem: document.getElementById('btnAddItem'),
    btnDemoData: document.getElementById('btnDemoData'),
    btnClearForm: document.getElementById('btnClearForm'),
    
    // 預覽與輸出按鈕
    btnPrint: document.getElementById('btnPrint'),
    btnDownloadCard: document.getElementById('btnDownloadCard'),
    btnCopyLine: document.getElementById('btnCopyLine'),
    
    // A4 預覽元件
    previewDocTitle: document.getElementById('previewDocTitle'),
    previewDocNo: document.getElementById('previewDocNo'),
    previewDate: document.getElementById('previewDate'),
    previewAddress: document.getElementById('previewAddress'),
    previewTenant: document.getElementById('previewTenant'),
    previewLandlord: document.getElementById('previewLandlord'),
    previewWitness: document.getElementById('previewWitness'),
    previewStatuteText: document.getElementById('previewStatuteText'),
    previewItemsTableBody: document.getElementById('previewItemsTableBody'),
    previewFeeText: document.getElementById('previewFeeText'),
    previewPhotosGrid: document.getElementById('previewPhotosGrid'),
    previewTenantSigImg: document.getElementById('previewTenantSigImg'),
    previewLandlordSigImg: document.getElementById('previewLandlordSigImg'),
    
    // 簽名板
    tenantCanvas: document.getElementById('tenantSigCanvas'),
    landlordCanvas: document.getElementById('landlordSigCanvas'),
    btnClearTenantSig: document.getElementById('btnClearTenantSig'),
    btnClearLandlordSig: document.getElementById('btnClearLandlordSig')
  };

  // 模式文本對應
  const MODE_METAS = {
    'on-site': {
      title: '租賃住宅承租人退租遺留物處理授權與拋棄所有權切結書',
      badge: '退租點交現場合意切結模式',
      statute: '依據《租賃住宅市場發展及管理條例》第12條、內政部《住宅租賃定型化契約應記載事項》第18點及《民法》第764條規定，立切結書人（承租人）於租賃關係終止退租點交之日，因遷讓考量自願將下列留置於租賃標的物內之物品所有權無償全數拋棄，全權授權出租人或受託代管公司逕行處置、清運、拍賣或轉贈，絕無異議。'
    },
    'pre-auth': {
      title: '租賃契約附約：租約終止逾期遺留物事前處置授權約定書',
      badge: '簽約事前約定授權備忘模式',
      statute: '依據內政部《住宅租賃定型化契約應記載事項》第18點與《民法》第445條出租人留置權規範，雙方特立本約定書。承租人同意於租賃期間屆滿或契約合法終止後，若未依約騰空交還房屋並留置物品，經出租人催告期限屆滿後仍不搬離者，視為承租人拋棄留置物之所有權，由出租人全權處置清運，清運規費自押金扣抵。'
    },
    'notice-expire': {
      title: '租約合法終止暨催告期滿承租人遺留物依法強制處置清冊報告書',
      badge: '欠租終止催告期滿處置模式',
      statute: '依據《租賃住宅市場發展及管理條例》第12條及《民法》第440條、第445條規定，承租人欠租失聯且經存證信函合法終止租約催告限期遷讓逾期。出租人會同見證人依法開鎖入室勘查，針對現場留置物品進行現場造冊與拍照存證，依約視為承租人已拋棄所有權，正式進行廢棄物清運或拍賣抵償租務欠款。'
    }
  };

  // 初始化預設值
  function initDefaults() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    state.date = `${yyyy}-${mm}-${dd}`;
    state.docNo = `AP-${yyyy}${mm}${dd}-01`;
    
    if (dom.docNoInput) dom.docNoInput.value = state.docNo;
    if (dom.dateInput) dom.dateInput.value = state.date;
    if (dom.disposalFeeInput) dom.disposalFeeInput.value = state.disposalFee;
    if (dom.laborFeeInput) dom.laborFeeInput.value = state.laborFee;
    if (dom.storageFeeInput) dom.storageFeeInput.value = state.storageFee;
    if (dom.securityDepositInput) dom.securityDepositInput.value = state.securityDeposit;
    
    renderItemsTable();
    updateFeeSummary();
    renderA4Preview();
  }

  // 渲染動態遺留物表格
  function renderItemsTable() {
    if (!dom.itemsTableBody) return;
    dom.itemsTableBody.innerHTML = '';
    
    state.items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select class="table-select item-category" data-index="${index}">
            <option value="廢棄家具" ${item.category === '廢棄家具' ? 'selected' : ''}>廢棄家具</option>
            <option value="老舊家電" ${item.category === '老舊家電' ? 'selected' : ''}>老舊家電</option>
            <option value="雜物袋" ${item.category === '雜物袋' ? 'selected' : ''}>生活雜物</option>
            <option value="寢具被褥" ${item.category === '寢具被褥' ? 'selected' : ''}>寢具被褥</option>
            <option value="代步工具" ${item.category === '代步工具' ? 'selected' : ''}>代步工具/車輛</option>
            <option value="其他物品" ${item.category === '其他物品' ? 'selected' : ''}>其他物品</option>
          </select>
        </td>
        <td>
          <input type="text" class="table-input item-name" data-index="${index}" value="${escapeHtml(item.name)}" placeholder="物品名稱與特徵描述" />
        </td>
        <td style="width: 80px;">
          <input type="number" min="1" class="table-input item-qty" data-index="${index}" value="${item.qty}" />
        </td>
        <td style="width: 70px;">
          <input type="text" class="table-input item-unit" data-index="${index}" value="${escapeHtml(item.unit)}" placeholder="件/組" />
        </td>
        <td>
          <select class="table-select item-val" data-index="${index}">
            <option value="無殘值 (0元)" ${item.val.includes('0') ? 'selected' : ''}>無殘值 (0元)</option>
            <option value="微殘值" ${item.val.includes('微') ? 'selected' : ''}>微殘值</option>
            <option value="尚堪用" ${item.val.includes('堪') ? 'selected' : ''}>尚堪用</option>
          </select>
        </td>
        <td>
          <select class="table-select item-action" data-index="${index}">
            <option value="代為清運廢棄" ${item.action === '代為清運廢棄' ? 'selected' : ''}>代為清運廢棄</option>
            <option value="交由資源回收" ${item.action === '交由資源回收' ? 'selected' : ''}>交由資源回收</option>
            <option value="拍賣抵充欠款" ${item.action === '拍賣抵充欠款' ? 'selected' : ''}>拍賣抵充欠款</option>
            <option value="暫存保管(計費)" ${item.action.includes('暫存') ? 'selected' : ''}>暫存保管(計費)</option>
          </select>
        </td>
        <td style="text-align: center; width: 50px;">
          <button type="button" class="btn-delete-row" data-index="${index}" title="刪除本項">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      `;
      dom.itemsTableBody.appendChild(tr);
    });

    bindTableEvents();
    renderA4Preview();
  }

  // 綁定表格內部事件
  function bindTableEvents() {
    dom.itemsTableBody.querySelectorAll('.item-category').forEach(el => {
      el.addEventListener('change', e => {
        const idx = e.target.dataset.index;
        state.items[idx].category = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.item-name').forEach(el => {
      el.addEventListener('input', e => {
        const idx = e.target.dataset.index;
        state.items[idx].name = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.item-qty').forEach(el => {
      el.addEventListener('input', e => {
        const idx = e.target.dataset.index;
        state.items[idx].qty = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.item-unit').forEach(el => {
      el.addEventListener('input', e => {
        const idx = e.target.dataset.index;
        state.items[idx].unit = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.item-val').forEach(el => {
      el.addEventListener('change', e => {
        const idx = e.target.dataset.index;
        state.items[idx].val = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.item-action').forEach(el => {
      el.addEventListener('change', e => {
        const idx = e.target.dataset.index;
        state.items[idx].action = e.target.value;
        renderA4Preview();
      });
    });
    dom.itemsTableBody.querySelectorAll('.btn-delete-row').forEach(el => {
      el.addEventListener('click', e => {
        const btn = e.currentTarget;
        const idx = parseInt(btn.dataset.index, 10);
        if (state.items.length <= 1) {
          alert('清冊請至少保留一項物品紀錄。');
          return;
        }
        state.items.splice(idx, 1);
        renderItemsTable();
      });
    });
  }

  // 新增一列物品
  if (dom.btnAddItem) {
    dom.btnAddItem.addEventListener('click', () => {
      state.items.push({
        category: '廢棄家具',
        name: '',
        qty: '1',
        unit: '件',
        val: '無殘值 (0元)',
        action: '代為清運廢棄',
        note: ''
      });
      renderItemsTable();
    });
  }

  // 計算費用結算
  function updateFeeSummary() {
    const disposal = parseFloat(state.disposalFee) || 0;
    const labor = parseFloat(state.laborFee) || 0;
    const storage = parseFloat(state.storageFee) || 0;
    const totalCost = disposal + labor + storage;
    const deposit = parseFloat(state.securityDeposit) || 0;
    const netBalance = deposit - totalCost;

    const summaryEl = document.getElementById('feeSummaryBox');
    if (summaryEl) {
      let balanceHtml = '';
      if (netBalance >= 0) {
        balanceHtml = `
          <div class="fee-row total-refund">
            <span>自原押金抵扣後剩餘（應退還租客）：</span>
            <span>NT$ ${netBalance.toLocaleString()} 元 (${toChineseCurrency(netBalance)})</span>
          </div>
        `;
      } else {
        const deficit = Math.abs(netBalance);
        balanceHtml = `
          <div class="fee-row total-due">
            <span>原押金不足扣抵（承租人應補繳差額）：</span>
            <span>NT$ ${deficit.toLocaleString()} 元 (${toChineseCurrency(deficit)})</span>
          </div>
        `;
      }

      summaryEl.innerHTML = `
        <div class="fee-row">
          <span>清運及廢棄物處理規費：</span>
          <span>NT$ ${disposal.toLocaleString()} 元</span>
        </div>
        <div class="fee-row">
          <span>搬運工資與吊掛費用：</span>
          <span>NT$ ${labor.toLocaleString()} 元</span>
        </div>
        <div class="fee-row">
          <span>暫存倉儲保管費：</span>
          <span>NT$ ${storage.toLocaleString()} 元</span>
        </div>
        <div class="fee-row" style="font-weight: 700; color: var(--color-navy);">
          <span>清運處置總費用：</span>
          <span>NT$ ${totalCost.toLocaleString()} 元</span>
        </div>
        <div class="fee-row">
          <span>承租人原預繳押金總額：</span>
          <span>NT$ ${deposit.toLocaleString()} 元</span>
        </div>
        ${balanceHtml}
      `;
    }
  }

  // 照片壓縮與處理
  function setupPhotoSlots() {
    ['photo1', 'photo2', 'photo3', 'photo4'].forEach(id => {
      const input = document.getElementById(`${id}Input`);
      const slot = document.getElementById(`${id}Slot`);
      const preview = document.getElementById(`${id}Preview`);
      const btnClear = document.getElementById(`${id}Clear`);

      if (!input || !slot) return;

      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scale = MAX_WIDTH / img.width;
            if (scale < 1) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scale;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // 壓印存證時間
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.fillText(`港居不動產 存證紀錄 ${state.date} ${state.docNo}`, 10, canvas.height - 8);

            const base64 = canvas.toDataURL('image/jpeg', 0.75);
            state.photos[id] = base64;
            preview.src = base64;
            slot.classList.add('has-image');
            renderA4Preview();
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });

      if (btnClear) {
        btnClear.addEventListener('click', e => {
          e.stopPropagation();
          state.photos[id] = null;
          input.value = '';
          preview.src = '';
          slot.classList.remove('has-image');
          renderA4Preview();
        });
      }
    });
  }

  // 雙 Retina 2x 手寫簽名板模組
  function setupSignaturePads() {
    function initPad(canvas, clearBtn, onSignCallback) {
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      let drawing = false;
      let hasDrawn = false;

      function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 2;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0a192f';
      }

      resize();
      window.addEventListener('resize', resize);

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function startDraw(e) {
        drawing = true;
        hasDrawn = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        canvas.parentElement.classList.add('signed');
      }

      function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      function stopDraw() {
        if (!drawing) return;
        drawing = false;
        if (hasDrawn && onSignCallback) {
          onSignCallback(canvas.toDataURL('image/png'));
        }
      }

      // 滑鼠事件
      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

      // 觸控事件
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDraw);

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasDrawn = false;
          canvas.parentElement.classList.remove('signed');
          if (onSignCallback) onSignCallback(null);
        });
      }

      return {
        clear: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hasDrawn = false;
          canvas.parentElement.classList.remove('signed');
          if (onSignCallback) onSignCallback(null);
        }
      };
    }

    initPad(dom.tenantCanvas, dom.btnClearTenantSig, dataUrl => {
      state.tenantSigned = !!dataUrl;
      if (dom.previewTenantSigImg) {
        if (dataUrl) {
          dom.previewTenantSigImg.src = dataUrl;
          dom.previewTenantSigImg.style.display = 'block';
          const placeholder = document.getElementById('previewTenantSigPlaceholder');
          if (placeholder) placeholder.style.display = 'none';
        } else {
          dom.previewTenantSigImg.style.display = 'none';
          const placeholder = document.getElementById('previewTenantSigPlaceholder');
          if (placeholder) placeholder.style.display = 'flex';
        }
      }
    });

    initPad(dom.landlordCanvas, dom.btnClearLandlordSig, dataUrl => {
      state.landlordSigned = !!dataUrl;
      if (dom.previewLandlordSigImg) {
        if (dataUrl) {
          dom.previewLandlordSigImg.src = dataUrl;
          dom.previewLandlordSigImg.style.display = 'block';
          const placeholder = document.getElementById('previewLandlordSigPlaceholder');
          if (placeholder) placeholder.style.display = 'none';
        } else {
          dom.previewLandlordSigImg.style.display = 'none';
          const placeholder = document.getElementById('previewLandlordSigPlaceholder');
          if (placeholder) placeholder.style.display = 'flex';
        }
      }
    });
  }

  // 渲染右側 Live A4 預覽
  function renderA4Preview() {
    const meta = MODE_METAS[state.mode] || MODE_METAS['on-site'];
    
    // 標題與基本資料
    if (dom.previewDocTitle) dom.previewDocTitle.textContent = meta.title;
    if (dom.previewDocNo) dom.previewDocNo.textContent = state.docNo || 'AP-20261025-01';
    if (dom.previewDate) dom.previewDate.textContent = state.date || '2026-10-25';
    if (dom.previewAddress) dom.previewAddress.textContent = state.propertyAddress || '高雄市前鎮區中華五路 1234 號 12 樓之 3';
    
    // 承租人字串
    if (dom.previewTenant) {
      const name = state.tenantName || '陳志明';
      const id = state.tenantId ? ` (身分證字號: ${state.tenantId})` : '';
      const phone = state.tenantPhone ? ` 聯絡電話: ${state.tenantPhone}` : '';
      dom.previewTenant.textContent = `${name}${id}${phone}`;
    }

    // 出租人/管理公司字串
    if (dom.previewLandlord) {
      const lName = state.landlordName || '港居不動產開發有限公司（受託代管公司）';
      const tax = state.landlordTaxId ? ` 統編: ${state.landlordTaxId}` : '';
      const lic = state.agentLicense ? ` 證號: ${state.agentLicense}` : '';
      dom.previewLandlord.textContent = `${lName}${tax}${lic}`;
    }

    // 見證人/陪同人員
    if (dom.previewWitness) {
      if (state.witnessName) {
        dom.previewWitness.textContent = `${state.witnessName}（${state.witnessRole || '現場見證人'}）`;
      } else {
        dom.previewWitness.textContent = '無（承租人親自到場點收確認）';
      }
    }

    // 法定緣由依據
    if (dom.previewStatuteText) {
      dom.previewStatuteText.textContent = meta.statute;
    }

    // 物品清冊表格
    if (dom.previewItemsTableBody) {
      dom.previewItemsTableBody.innerHTML = '';
      state.items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="center">${idx + 1}</td>
          <td class="center">${escapeHtml(item.category)}</td>
          <td><strong>${escapeHtml(item.name || '未填寫品名')}</strong></td>
          <td class="center">${item.qty} ${escapeHtml(item.unit)}</td>
          <td class="center">${escapeHtml(item.val)}</td>
          <td class="center" style="font-weight: 600;">${escapeHtml(item.action)}</td>
        `;
        dom.previewItemsTableBody.appendChild(tr);
      });
    }

    // 費用結算說明
    if (dom.previewFeeText) {
      const disposal = parseFloat(state.disposalFee) || 0;
      const labor = parseFloat(state.laborFee) || 0;
      const storage = parseFloat(state.storageFee) || 0;
      const total = disposal + labor + storage;
      const deposit = parseFloat(state.securityDeposit) || 0;
      const net = deposit - total;

      let netStr = '';
      if (net >= 0) {
        netStr = `經由承租人原預繳押金 NT$ ${deposit.toLocaleString()} 元全額扣抵後，剩餘保證金 NT$ ${net.toLocaleString()} 元（${toChineseCurrency(net)}）於點交確認當日無息返還承租人。`;
      } else {
        const diff = Math.abs(net);
        netStr = `承租人原預繳押金 NT$ ${deposit.toLocaleString()} 元全數扣抵後尚不足清運規費，不足額 NT$ ${diff.toLocaleString()} 元（${toChineseCurrency(diff)}）由承租人（切結人）當場補足清償，絕無異議。`;
      }

      dom.previewFeeText.textContent = `清運處理與規費總計新臺幣 ${total.toLocaleString()} 元（清運處置規費 NT$ ${disposal.toLocaleString()}、工資吊掛 NT$ ${labor.toLocaleString()}、暫存費 NT$ ${storage.toLocaleString()}）。${netStr}`;
    }

    // 照片縮圖預覽
    if (dom.previewPhotosGrid) {
      dom.previewPhotosGrid.innerHTML = '';
      const photoKeys = ['photo1', 'photo2', 'photo3', 'photo4'];
      const photoLabels = ['遺留物全貌存證', '大件家具外觀', '雜物堆放實況', '通道清空現狀'];
      
      photoKeys.forEach((key, idx) => {
        const box = document.createElement('div');
        box.className = 'doc-photo-box';
        const src = state.photos[key];
        if (src) {
          box.innerHTML = `
            <img src="${src}" class="doc-photo-img" alt="${photoLabels[idx]}" />
            <div class="doc-photo-caption">圖${idx + 1}. ${photoLabels[idx]}</div>
          `;
        } else {
          box.innerHTML = `
            <div class="doc-photo-img" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:7pt;">(未上傳照片)</div>
            <div class="doc-photo-caption">圖${idx + 1}. ${photoLabels[idx]}</div>
          `;
        }
        dom.previewPhotosGrid.appendChild(box);
      });
    }
  }

  // 模式切換邏輯
  function setupModeSelector() {
    dom.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        renderA4Preview();
      });
    });
  }

  // 綁定輸入表單欄位
  function setupFormInputs() {
    const fieldMap = [
      { el: dom.docNoInput, key: 'docNo' },
      { el: dom.dateInput, key: 'date' },
      { el: dom.propertyAddress, key: 'propertyAddress' },
      { el: dom.tenantName, key: 'tenantName' },
      { el: dom.tenantId, key: 'tenantId' },
      { el: dom.tenantPhone, key: 'tenantPhone' },
      { el: dom.tenantAddress, key: 'tenantAddress' },
      { el: dom.landlordName, key: 'landlordName' },
      { el: dom.landlordTaxId, key: 'landlordTaxId' },
      { el: dom.landlordPhone, key: 'landlordPhone' },
      { el: dom.agentLicense, key: 'agentLicense' },
      { el: dom.witnessName, key: 'witnessName' },
      { el: dom.witnessRole, key: 'witnessRole' },
      { el: dom.disposalFeeInput, key: 'disposalFee', isFee: true },
      { el: dom.laborFeeInput, key: 'laborFee', isFee: true },
      { el: dom.storageFeeInput, key: 'storageFee', isFee: true },
      { el: dom.securityDepositInput, key: 'securityDeposit', isFee: true }
    ];

    fieldMap.forEach(item => {
      if (!item.el) return;
      item.el.addEventListener('input', e => {
        state[item.key] = e.target.value;
        if (item.isFee) {
          updateFeeSummary();
        }
        renderA4Preview();
      });
    });
  }

  // 示範資料載入
  function loadDemoData() {
    state.propertyAddress = '高雄市前鎮區中華五路 1234 號 12 樓之 3（港居微風大樓）';
    state.tenantName = '陳志明';
    state.tenantId = 'E123456789';
    state.tenantPhone = '0912-345-678';
    state.tenantAddress = '高雄市苓雅區四維三路 88 號 5 樓';
    state.witnessName = '林俊彥';
    state.witnessRole = '大樓管委會管理主任';

    state.disposalFee = 3500;
    state.laborFee = 1500;
    state.storageFee = 0;
    state.securityDeposit = 24000;

    state.items = [
      { category: '廢棄家具', name: '雙人 L 型布面沙發（彈簧塌陷破損）', qty: '1', unit: '組', val: '無殘值 (0元)', action: '代為清運廢棄', note: '租客同意免責丟棄' },
      { category: '老舊家電', name: '東元單門小冰箱（壓縮機漏冷媒壞損）', qty: '1', unit: '台', val: '無殘值 (0元)', action: '交由資源回收', note: '機齡逾12年' },
      { category: '寢具被褥', name: '二手雙人獨立筒床墊（泛黃受潮）', qty: '1', unit: '床', val: '無殘值 (0元)', action: '代為清運廢棄', note: '大型廢棄物' },
      { category: '雜物袋', name: '廚房鍋具與雜物打包袋', qty: '2', unit: '袋', val: '無殘值 (0元)', action: '代為清運廢棄', note: '確認無現金證件' }
    ];

    if (dom.propertyAddress) dom.propertyAddress.value = state.propertyAddress;
    if (dom.tenantName) dom.tenantName.value = state.tenantName;
    if (dom.tenantId) dom.tenantId.value = state.tenantId;
    if (dom.tenantPhone) dom.tenantPhone.value = state.tenantPhone;
    if (dom.tenantAddress) dom.tenantAddress.value = state.tenantAddress;
    if (dom.witnessName) dom.witnessName.value = state.witnessName;
    if (dom.witnessRole) dom.witnessRole.value = state.witnessRole;

    if (dom.disposalFeeInput) dom.disposalFeeInput.value = state.disposalFee;
    if (dom.laborFeeInput) dom.laborFeeInput.value = state.laborFee;
    if (dom.storageFeeInput) dom.storageFeeInput.value = state.storageFee;
    if (dom.securityDepositInput) dom.securityDepositInput.value = state.securityDeposit;

    renderItemsTable();
    updateFeeSummary();
    renderA4Preview();

    if (window.showToast) {
      window.showToast('已成功帶入常見退租拋棄示範資料！');
    }
  }

  // 清空表單
  function clearForm() {
    if (!confirm('確定要清空所有已輸入資料與簽章嗎？')) return;
    
    state.propertyAddress = '';
    state.tenantName = '';
    state.tenantId = '';
    state.tenantPhone = '';
    state.tenantAddress = '';
    state.witnessName = '';
    state.witnessRole = '';
    state.disposalFee = 0;
    state.laborFee = 0;
    state.storageFee = 0;
    state.securityDeposit = 0;

    state.items = [
      { category: '廢棄家具', name: '', qty: '1', unit: '件', val: '無殘值 (0元)', action: '代為清運廢棄', note: '' }
    ];

    if (dom.propertyAddress) dom.propertyAddress.value = '';
    if (dom.tenantName) dom.tenantName.value = '';
    if (dom.tenantId) dom.tenantId.value = '';
    if (dom.tenantPhone) dom.tenantPhone.value = '';
    if (dom.tenantAddress) dom.tenantAddress.value = '';
    if (dom.witnessName) dom.witnessName.value = '';
    if (dom.witnessRole) dom.witnessRole.value = '';
    if (dom.disposalFeeInput) dom.disposalFeeInput.value = 0;
    if (dom.laborFeeInput) dom.laborFeeInput.value = 0;
    if (dom.storageFeeInput) dom.storageFeeInput.value = 0;
    if (dom.securityDepositInput) dom.securityDepositInput.value = 0;

    if (dom.btnClearTenantSig) dom.btnClearTenantSig.click();
    if (dom.btnClearLandlordSig) dom.btnClearLandlordSig.click();

    renderItemsTable();
    updateFeeSummary();
    renderA4Preview();
  }

  // 匯出圖卡 (Canvas 840 x 1080px)
  function downloadCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, canvas.width, 100);

    // 香檳金線條
    ctx.fillStyle = '#c8a96d';
    ctx.fillRect(0, 100, canvas.width, 6);

    // 品牌標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('港居不動產開發有限公司', 36, 48);

    ctx.fillStyle = '#c8a96d';
    ctx.font = '16px sans-serif';
    ctx.fillText('租賃住宅承租人遺留物授權處置與拋棄切結書存證卡', 36, 80);

    // 單號與日期
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`單號: ${state.docNo || 'AP-20261025-01'}`, canvas.width - 36, 50);
    ctx.fillText(`簽立日期: ${state.date || '2026-10-25'}`, canvas.width - 36, 78);
    ctx.textAlign = 'left';

    // 內容主資訊框
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(36, 126, canvas.width - 72, 130);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(36, 126, canvas.width - 72, 130);

    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`標的物地址：${state.propertyAddress || '未填寫'}`, 54, 156);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`立切結人（承租人）：${state.tenantName || '陳志明'} (身分證: ${state.tenantId || '未載'})`, 54, 186);
    ctx.fillText(`受託代管公司：${state.landlordName} (統編: ${state.landlordTaxId})`, 54, 214);
    ctx.fillText(`陪同見證人員：${state.witnessName ? `${state.witnessName} (${state.witnessRole})` : '承租人現場親自確認'}`, 54, 240);

    // 法定聲明摘要
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(36, 276, canvas.width - 72, 80);
    ctx.strokeStyle = '#fde68a';
    ctx.strokeRect(36, 276, canvas.width - 72, 80);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('【法務拋棄與免責聲明】', 54, 302);
    ctx.font = '12px sans-serif';
    ctx.fillText('依《租賃住宅市場發展及管理條例》第12條及《民法》第764條，切結人自願拋棄所有留置物所有權。', 54, 326);
    ctx.fillText('具結所留置物品確無任何現金珠寶貴重物品，日後絕不對出租人提出侵占、毀損之任何民刑事告訴。', 54, 346);

    // 清冊清單表格
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 現場留置物品造冊明細（前 4 項存證）', 36, 386);

    // 表格標頭
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(36, 400, canvas.width - 72, 30);
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('#', 50, 420);
    ctx.fillText('類別', 80, 420);
    ctx.fillText('物品名稱與特徵描述', 180, 420);
    ctx.fillText('數量', 530, 420);
    ctx.fillText('處置方式', 630, 420);

    // 表格列
    let curY = 430;
    const itemsToShow = state.items.slice(0, 4);
    itemsToShow.forEach((it, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(36, curY, canvas.width - 72, 34);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(36, curY, canvas.width - 72, 34);

      ctx.fillStyle = '#334155';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${i + 1}`, 50, curY + 22);
      ctx.fillText(it.category, 80, curY + 22);
      
      const nameStr = it.name.length > 22 ? it.name.slice(0, 22) + '...' : it.name;
      ctx.fillText(nameStr, 180, curY + 22);
      ctx.fillText(`${it.qty} ${it.unit}`, 530, curY + 22);
      ctx.fillText(it.action, 630, curY + 22);
      curY += 34;
    });

    // 費用結算區
    curY += 16;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(36, curY, canvas.width - 72, 60);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(36, curY, canvas.width - 72, 60);

    const disposal = parseFloat(state.disposalFee) || 0;
    const labor = parseFloat(state.laborFee) || 0;
    const total = disposal + labor + (parseFloat(state.storageFee) || 0);
    const deposit = parseFloat(state.securityDeposit) || 0;
    const net = deposit - total;

    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`清運處置總規費：NT$ ${total.toLocaleString()} 元（已自押金 NT$ ${deposit.toLocaleString()} 扣抵）`, 54, curY + 26);
    
    if (net >= 0) {
      ctx.fillStyle = '#059669';
      ctx.fillText(`扣抵後剩餘保證金應退還：NT$ ${net.toLocaleString()} 元整`, 54, curY + 48);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`押金不足扣抵，承租人應補繳差額：NT$ ${Math.abs(net).toLocaleString()} 元整`, 54, curY + 48);
    }

    // 現場照片縮圖區 (若有)
    curY += 80;
    ctx.fillStyle = '#0a192f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('■ 現場拍照存證紀錄', 36, curY);

    curY += 12;
    const photoWidth = 175;
    const photoHeight = 110;
    const photoKeys = ['photo1', 'photo2', 'photo3', 'photo4'];

    photoKeys.forEach((k, idx) => {
      const pX = 36 + idx * (photoWidth + 22);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pX, curY, photoWidth, photoHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(pX, curY, photoWidth, photoHeight);

      if (state.photos[k]) {
        const tempImg = new Image();
        tempImg.onload = () => {
          ctx.drawImage(tempImg, pX, curY, photoWidth, photoHeight);
        };
        tempImg.src = state.photos[k];
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`圖${idx + 1} 存證照片`, pX + photoWidth / 2, curY + photoHeight / 2);
        ctx.textAlign = 'left';
      }
    });

    // 底部簽章區
    curY += photoHeight + 30;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(36, curY, canvas.width - 72, 1);

    curY += 20;
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('承租人（切結人親簽）：', 54, curY + 20);
    ctx.fillText('港居不動產開發（受託人簽章）：', 440, curY + 20);

    // 承租人簽名圖案
    if (dom.previewTenantSigImg && dom.previewTenantSigImg.style.display !== 'none') {
      ctx.drawImage(dom.previewTenantSigImg, 54, curY + 30, 160, 50);
    } else {
      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(電子親筆已認證簽收)', 54, curY + 50);
    }

    // 代管專員簽名圖案
    if (dom.previewLandlordSigImg && dom.previewLandlordSigImg.style.display !== 'none') {
      ctx.drawImage(dom.previewLandlordSigImg, 440, curY + 30, 160, 50);
    } else {
      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(公司代管專員簽章)', 440, curY + 50);
    }

    // 頁尾
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司｜高雄市小港區中安路488號1樓｜電話: 07-793-3997｜統編: 96797997', canvas.width / 2, canvas.height - 24);

    // 觸發下載
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `港居不動產_遺留物拋棄切結書_${state.docNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (window.showToast) window.showToast('已成功匯出高清存證圖卡！');
    }, 200);
  }

  // 複製 LINE 通報文字
  function copyLineText() {
    const total = (parseFloat(state.disposalFee) || 0) + (parseFloat(state.laborFee) || 0) + (parseFloat(state.storageFee) || 0);
    const deposit = parseFloat(state.securityDeposit) || 0;
    const net = deposit - total;

    let balanceDesc = '';
    if (net >= 0) {
      balanceDesc = `💰 自原押金全數抵扣後，退還剩餘保證金：NT$ ${net.toLocaleString()} 元整`;
    } else {
      balanceDesc = `⚠️ 押金不足扣抵，承租人應補繳清運差額：NT$ ${Math.abs(net).toLocaleString()} 元整`;
    }

    const itemsSummary = state.items.map((it, idx) => `  ${idx + 1}. ${it.category}：${it.name} (${it.qty}${it.unit}) ➔ [${it.action}]`).join('\n');

    const text = `【港居不動產】承租人退租遺留物處理授權與拋棄切結存證通報
──────────────────────
📋 報告單號：${state.docNo}
📅 切結日期：${state.date}
🏠 標的地址：${state.propertyAddress || '未填寫'}
👤 切結人（承租人）：${state.tenantName || '陳志明'} (${state.tenantPhone || '未載電話'})
🏢 受託代管：港居不動產開發（統編 96797997）
👥 見證人員：${state.witnessName ? `${state.witnessName} (${state.witnessRole})` : '承租人現場親簽點收'}

■ 留置物造冊明細（共 ${state.items.length} 項）：
${itemsSummary}

■ 費用結算與押金抵扣：
  • 清運及處置總規費：NT$ ${total.toLocaleString()} 元
  • 承租人原預繳押金：NT$ ${deposit.toLocaleString()} 元
${balanceDesc}

⚖️ 法務具結宣告：
立切結人依《租賃專法》第12條自願拋棄上述留置物品所有權，具結絕無貴重金飾證券，授權代管公司全權清運處置，日後絕不提出任何民刑事告訴。

（本通報由港居不動產租務系統自動生成存查）`;

    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) {
        window.showToast('已複製 LINE 存證通報文字至剪貼簿！');
      } else {
        alert('已複製 LINE 存證通報文字！');
      }
    }).catch(err => {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動複製。');
    });
  }

  // 工具函式：HTML 轉義
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // DOM 載入後初始化
  document.addEventListener('DOMContentLoaded', () => {
    initDefaults();
    setupModeSelector();
    setupFormInputs();
    setupPhotoSlots();
    setupSignaturePads();

    if (dom.btnDemoData) dom.btnDemoData.addEventListener('click', loadDemoData);
    if (dom.btnClearForm) dom.btnClearForm.addEventListener('click', clearForm);
    if (dom.btnPrint) dom.btnPrint.addEventListener('click', () => window.print());
    if (dom.btnDownloadCard) dom.btnDownloadCard.addEventListener('click', downloadCard);
    if (dom.btnCopyLine) dom.btnCopyLine.addEventListener('click', copyLineText);
  });
})();
