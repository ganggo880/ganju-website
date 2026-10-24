/**
 * ==========================================================================
 * 港居不動產 租賃修繕點交與屋況瑕疵存證紀錄神器核心引擎
 * Repair & Defect Inspection Report Engine
 * 依據《租賃專法》第11條與民法第429/432條，支援分區瑕疵存證、浮水印壓印與電子簽章
 * ==========================================================================
 */

import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 預設空間分區資料模板
  const DEFAULT_ZONES = [
    { id: 'zone-entrance', name: '🚪 玄關與大門門廳', defects: [] },
    { id: 'zone-living', name: '🛋️ 客廳與公共起居空間', defects: [] },
    { id: 'zone-bedroom', name: '🛏️ 主臥室與寢居空間', defects: [] },
    { id: 'zone-kitchen', name: '🍳 廚房與烹飪設備區', defects: [] },
    { id: 'zone-bathroom', name: '🚿 衛浴浴廁與給排水設備', defects: [] },
    { id: 'zone-balcony', name: '🌿 工作陽台與曬衣區', defects: [] }
  ];

  // 2. 狀態管理
  let state = {
    mode: 'checkin', // checkin | checkout | repair
    address: '高雄市小港區中安路825號 3F',
    landlord: '港居不動產開發有限公司（代理人）',
    tenant: '',
    inspector: '陳俊銘 經理',
    date: new Date().toISOString().split('T')[0],
    powerMeter: '',
    subMeter: '',
    waterMeter: '',
    gasMeter: '',
    zones: JSON.parse(JSON.stringify(DEFAULT_ZONES))
  };

  // 3. DOM 節點引用
  const modeBtns = document.querySelectorAll('.mode-btn');
  const inpAddress = document.getElementById('inpAddress');
  const inpLandlord = document.getElementById('inpLandlord');
  const inpTenant = document.getElementById('inpTenant');
  const inpInspector = document.getElementById('inpInspector');
  const inpDate = document.getElementById('inpDate');

  const inpPowerMeter = document.getElementById('inpPowerMeter');
  const inpSubMeter = document.getElementById('inpSubMeter');
  const inpWaterMeter = document.getElementById('inpWaterMeter');
  const inpGasMeter = document.getElementById('inpGasMeter');

  const zonesContainer = document.getElementById('zonesContainer');
  const btnQuickSample = document.getElementById('btnQuickSample');
  const btnResetForm = document.getElementById('btnResetForm');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const jsonFileInput = document.getElementById('jsonFileInput');

  const btnPrintInspection = document.getElementById('btnPrintInspection');
  const btnLineShare = document.getElementById('btnLineShare');

  // 列印表頭
  const printDocTitle = document.getElementById('printDocTitle');
  const printDocMeta = document.getElementById('printDocMeta');

  // 4. 初始化畫布簽名板 (Signature Pads)
  const landlordCanvas = document.getElementById('landlordSignatureCanvas');
  const tenantCanvas = document.getElementById('tenantSignatureCanvas');
  const btnClearLandlordSig = document.getElementById('btnClearLandlordSig');
  const btnClearTenantSig = document.getElementById('btnClearTenantSig');

  function initSignaturePad(canvas, hintId) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hint = document.getElementById(hintId);

    // 支援 Retina 螢幕清晰度
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0F172A';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let isDrawing = false;
    let hasDrawn = false;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      if (hint) hint.style.display = 'none';
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stopDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      saveDraft();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw, { passive: false });

    return {
      clear: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
        if (hint) hint.style.display = 'block';
      },
      hasSignature: () => hasDrawn,
      toDataURL: () => canvas.toDataURL('image/png')
    };
  }

  const landlordSigPad = initSignaturePad(landlordCanvas, 'hintLandlordSig');
  const tenantSigPad = initSignaturePad(tenantCanvas, 'hintTenantSig');

  if (btnClearLandlordSig && landlordSigPad) {
    btnClearLandlordSig.addEventListener('click', landlordSigPad.clear);
  }
  if (btnClearTenantSig && tenantSigPad) {
    btnClearTenantSig.addEventListener('click', tenantSigPad.clear);
  }

  // 5. 照片水印與壓縮處理引擎
  async function processDefectPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 限制最大寬度 1200px
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          // 壓印存證浮水印 (右下角半透明標籤)
          const now = new Date();
          const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const markText = `港居不動產 屋況點交存證 ｜ ${timestamp}`;

          const fontSize = Math.max(14, Math.round(w / 40));
          ctx.font = `600 ${fontSize}px "Noto Sans TC", sans-serif`;

          const textWidth = ctx.measureText(markText).width;
          const barHeight = fontSize * 2.2;
          const barY = h - barHeight;

          // 漸層背景
          const grad = ctx.createLinearGradient(0, barY, w, h);
          grad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
          grad.addColorStop(1, 'rgba(26, 54, 93, 0.9)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, barY, w, barHeight);

          // 金色品牌點綴小方塊
          ctx.fillStyle = '#C5A059';
          ctx.fillRect(w - textWidth - 36, barY + (barHeight - fontSize) / 2, 8, fontSize);

          // 浮水印白色文字
          ctx.fillStyle = '#FFFFFF';
          ctx.textBaseline = 'middle';
          ctx.fillText(markText, w - textWidth - 20, barY + barHeight / 2);

          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.82),
            timestamp
          });
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 6. 渲染空間分區與瑕疵卡片
  function renderZones() {
    if (!zonesContainer) return;
    zonesContainer.replaceChildren();

    state.zones.forEach((zone, zIndex) => {
      const zoneBlock = document.createElement('div');
      zoneBlock.className = 'zone-block';
      zoneBlock.dataset.zoneId = zone.id;

      // 分區表頭
      const header = document.createElement('div');
      header.className = 'zone-block-header';

      const nameBox = document.createElement('div');
      nameBox.className = 'zone-name-box';
      nameBox.innerHTML = `<span>${zone.name}</span> <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">(${zone.defects.length} 項紀錄)</span>`;

      const actions = document.createElement('div');
      actions.className = 'zone-actions';

      const btnAdd = document.createElement('button');
      btnAdd.type = 'button';
      btnAdd.className = 'btn-add-defect';
      btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i> 新增瑕疵紀錄';
      btnAdd.addEventListener('click', () => {
        addDefect(zIndex);
      });

      actions.appendChild(btnAdd);
      header.append(nameBox, actions);

      // 分區內容
      const body = document.createElement('div');
      body.className = 'zone-body';

      if (zone.defects.length === 0) {
        body.innerHTML = '<div style="color: var(--text-muted); font-size: 0.88rem; font-style: italic; padding: 6px 0;">目前現況良好無瑕疵，點擊右上角「新增瑕疵紀錄」拍照存證。</div>';
      } else {
        const defectsGrid = document.createElement('div');
        defectsGrid.className = 'defects-grid';

        zone.defects.forEach((defect, dIndex) => {
          const defectCard = createDefectCard(zIndex, dIndex, defect);
          defectsGrid.appendChild(defectCard);
        });

        body.appendChild(defectsGrid);
      }

      zoneBlock.append(header, body);
      zonesContainer.appendChild(zoneBlock);
    });

    updatePrintHeader();
  }

  function createDefectCard(zIndex, dIndex, defect) {
    const card = document.createElement('div');
    card.className = 'defect-card';

    // 1. 照片上傳框
    const photoBox = document.createElement('div');
    photoBox.className = 'defect-photo-box';
    if (defect.photoDataUrl) {
      photoBox.innerHTML = `<img src="${defect.photoDataUrl}" alt="屋況瑕疵存證照片"><span style="position: absolute; bottom: 2px; right: 4px; font-size: 0.68rem; color: #FFF; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${defect.photoTimestamp || ''}</span>`;
    } else {
      photoBox.innerHTML = `
        <div class="defect-photo-prompt">
          <i class="fa-solid fa-camera"></i>
          <div>點擊拍照<br>或上傳照片</div>
        </div>
      `;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'defect-photo-input';
    fileInput.setAttribute('aria-label', '上傳瑕疵存證照片');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          showToast('正在壓印港居點交存證浮水印...', 'info');
          const result = await processDefectPhoto(file);
          defect.photoDataUrl = result.dataUrl;
          defect.photoTimestamp = result.timestamp;
          renderZones();
          saveDraft();
          showToast('瑕疵存證照片已成功壓印並存檔！', 'success');
        } catch (err) {
          showToast('照片處理失敗，請重試', 'error');
        }
      }
    });

    photoBox.appendChild(fileInput);

    // 2. 瑕疵描述與責任判定內容
    const content = document.createElement('div');
    content.className = 'defect-content';

    const row1 = document.createElement('div');
    row1.className = 'defect-row-1';

    // 瑕疵類型
    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-control defect-type-select';
    typeSelect.innerHTML = `
      <option value="牆面漆面瑕疵" ${defect.defectType === '牆面漆面瑕疵' ? 'selected' : ''}>牆面油漆髒污／泛黃／壁癌</option>
      <option value="釘孔掛鉤痕跡" ${defect.defectType === '釘孔掛鉤痕跡' ? 'selected' : ''}>牆面釘孔／無痕掛鉤脫膠損壞</option>
      <option value="地磚木地板刮傷" ${defect.defectType === '地磚木地板刮傷' ? 'selected' : ''}>地磚破裂／空心／木地板刮痕</option>
      <option value="門窗紗窗五金" ${defect.defectType === '門窗紗窗五金' ? 'selected' : ''}>門窗鎖具卡榫／紗窗破損老化</option>
      <option value="衛浴給排水設備" ${defect.defectType === '衛浴給排水設備' ? 'selected' : ''}>衛浴龍頭水滴漏／排水緩慢不順</option>
      <option value="冷氣家電設備" ${defect.defectType === '冷氣家電設備' ? 'selected' : ''}>冷氣運轉異音／不冷／遙控器失靈</option>
      <option value="廚具櫥櫃五金" ${defect.defectType === '廚具櫥櫃五金' ? 'selected' : ''}>流理台滲漏／排油煙機油網髒污</option>
      <option value="其他屋況瑕疵" ${defect.defectType === '其他屋況瑕疵' ? 'selected' : ''}>其他屋況瑕疵（見備註說明）</option>
    `;
    typeSelect.addEventListener('change', (e) => {
      defect.defectType = e.target.value;
      saveDraft();
    });

    // 責任判定
    const respSelect = document.createElement('select');
    respSelect.className = 'form-control defect-resp-select';
    respSelect.innerHTML = `
      <option value="normal" ${defect.responsibility === 'normal' ? 'selected' : ''}>🟢 正常自然折舊（免責）</option>
      <option value="landlord" ${defect.responsibility === 'landlord' ? 'selected' : ''}>🔵 出租人應行修繕改善</option>
      <option value="tenant" ${defect.responsibility === 'tenant' ? 'selected' : ''}>🔴 承租人注意義務疏失（需賠償/還原）</option>
      <option value="asis" ${defect.responsibility === 'asis' ? 'selected' : ''}>⚪ 雙方合意現況點交（不修繕）</option>
    `;
    respSelect.addEventListener('change', (e) => {
      defect.responsibility = e.target.value;
      saveDraft();
    });

    row1.append(typeSelect, respSelect);

    // 現況備註與修繕預估
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'form-control defect-desc-input';
    descInput.placeholder = '請詳細描述瑕疵位置與現況（例如：客廳主牆有約 3cm 釘孔痕跡，起租時已存在）';
    descInput.value = defect.desc || '';
    descInput.addEventListener('input', (e) => {
      defect.desc = e.target.value;
      saveDraft();
    });

    content.append(row1, descInput);

    // 3. 刪除按鈕
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn-remove-defect';
    btnRemove.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    btnRemove.title = '刪除此瑕疵紀錄';
    btnRemove.setAttribute('aria-label', '刪除此瑕疵紀錄');
    btnRemove.addEventListener('click', () => {
      removeDefect(zIndex, dIndex);
    });

    card.append(photoBox, content, btnRemove);
    return card;
  }

  function addDefect(zIndex) {
    state.zones[zIndex].defects.push({
      id: 'defect_' + Date.now(),
      photoDataUrl: '',
      photoTimestamp: '',
      defectType: '牆面漆面瑕疵',
      responsibility: 'normal',
      desc: ''
    });
    renderZones();
    saveDraft();
  }

  function removeDefect(zIndex, dIndex) {
    state.zones[zIndex].defects.splice(dIndex, 1);
    renderZones();
    saveDraft();
  }

  // 7. 更新模式與列印表頭
  function updatePrintHeader() {
    const modeNames = {
      checkin: '起租交付點交確認書',
      checkout: '退租返還核銷點交確認書',
      repair: '租賃住宅修繕存證現況紀錄表'
    };

    if (printDocTitle) {
      printDocTitle.textContent = `港居不動產 ｜ ${modeNames[state.mode] || '屋況瑕疵點交確認書'}`;
    }

    if (printDocMeta) {
      printDocMeta.textContent = `房屋標的：${state.address} ｜ 點交日期：${state.date} ｜ 出租人：${state.landlord} ｜ 承租人：${state.tenant || '未填寫'} ｜ 物業專員：${state.inspector}`;
    }

    // LINE 預約分享文字
    if (btnLineShare) {
      let defectCount = 0;
      state.zones.forEach((z) => (defectCount += z.defects.length));
      const modeText = modeNames[state.mode];
      const msg = `【港居不動產 ｜ ${modeText}】
房屋標的：${state.address}
點交日期：${state.date}
承租人：${state.tenant || '點交確認中'}
水電指針：電表 ${state.powerMeter || '—'} 度 / 水表 ${state.waterMeter || '—'} 度
現場存證瑕疵項數：共 ${defectCount} 項
管理專員：${state.inspector}

現場屋況存證點交紀錄已完成，請陳經理查照！`;
      btnLineShare.href = `https://lin.ee/Q71pw2I?text=${encodeURIComponent(msg)}`;
    }
  }

  // 8. 模式按鈕切換
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      updatePrintHeader();
      saveDraft();
    });
  });

  // 9. 基本資訊雙向連動
  if (inpAddress) {
    inpAddress.value = state.address;
    inpAddress.addEventListener('input', (e) => {
      state.address = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpLandlord) {
    inpLandlord.value = state.landlord;
    inpLandlord.addEventListener('input', (e) => {
      state.landlord = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpTenant) {
    inpTenant.value = state.tenant;
    inpTenant.addEventListener('input', (e) => {
      state.tenant = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpInspector) {
    inpInspector.value = state.inspector;
    inpInspector.addEventListener('input', (e) => {
      state.inspector = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpDate) {
    inpDate.value = state.date;
    inpDate.addEventListener('input', (e) => {
      state.date = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }

  // 水電度數連動
  if (inpPowerMeter) {
    inpPowerMeter.addEventListener('input', (e) => {
      state.powerMeter = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpSubMeter) {
    inpSubMeter.addEventListener('input', (e) => {
      state.subMeter = e.target.value;
      saveDraft();
    });
  }
  if (inpWaterMeter) {
    inpWaterMeter.addEventListener('input', (e) => {
      state.waterMeter = e.target.value;
      updatePrintHeader();
      saveDraft();
    });
  }
  if (inpGasMeter) {
    inpGasMeter.addEventListener('input', (e) => {
      state.gasMeter = e.target.value;
      saveDraft();
    });
  }

  // 10. LocalStorage 草稿存取
  const DRAFT_KEY = 'ganju_inspection_draft';

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Draft save error:', e);
    }
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.zones && Array.isArray(parsed.zones)) {
          state = { ...state, ...parsed };
          applyStateToInputs();
          return true;
        }
      }
    } catch (e) {
      console.warn('Draft load error:', e);
    }
    return false;
  }

  function applyStateToInputs() {
    if (inpAddress) inpAddress.value = state.address || '';
    if (inpLandlord) inpLandlord.value = state.landlord || '';
    if (inpTenant) inpTenant.value = state.tenant || '';
    if (inpInspector) inpInspector.value = state.inspector || '';
    if (inpDate) inpDate.value = state.date || '';

    if (inpPowerMeter) inpPowerMeter.value = state.powerMeter || '';
    if (inpSubMeter) inpSubMeter.value = state.subMeter || '';
    if (inpWaterMeter) inpWaterMeter.value = state.waterMeter || '';
    if (inpGasMeter) inpGasMeter.value = state.gasMeter || '';

    modeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });

    renderZones();
  }

  // 11. 快捷範本示範 (Demo Sample)
  if (btnQuickSample) {
    btnQuickSample.addEventListener('click', () => {
      state.mode = 'checkin';
      state.address = '高雄市小港區合作里中安路 825 號 6 樓 A 室';
      state.landlord = '港居不動產開發有限公司（特許包租業）';
      state.tenant = '張建銘 先生（外商軟體架構工程師）';
      state.inspector = '陳俊銘 經理（租賃管理師第013739號）';
      state.date = new Date().toISOString().split('T')[0];
      state.powerMeter = '14,820';
      state.subMeter = '3,210.5';
      state.waterMeter = '285';
      state.gasMeter = '792';

      // 產生三處示範瑕疵存證
      state.zones = JSON.parse(JSON.stringify(DEFAULT_ZONES));
      state.zones[0].defects.push({
        id: 'def_sample_1',
        photoDataUrl: '',
        photoTimestamp: '起租交付存證',
        defectType: '門窗紗窗五金',
        responsibility: 'asis',
        desc: '玄關子母防暴門外門檻有些微搬運磨耗痕跡，功能正常，雙方合意現況交付。'
      });
      state.zones[1].defects.push({
        id: 'def_sample_2',
        photoDataUrl: '',
        photoTimestamp: '起租交付存證',
        defectType: '釘孔掛鉤痕跡',
        responsibility: 'normal',
        desc: '電視主牆上方遺留前手 3M 無痕掛鉤底膠 1 處（約 2cm），房客免除還原責任。'
      });
      state.zones[4].defects.push({
        id: 'def_sample_3',
        photoDataUrl: '',
        photoTimestamp: '起租交付存證',
        defectType: '衛浴給排水設備',
        responsibility: 'landlord',
        desc: '乾濕分離淋浴拉門下緣止水矽利康微黃，港居承諾於入住 3 日內派工修繕重打矽利康。'
      });

      applyStateToInputs();
      saveDraft();
      showToast('已成功載入港居官方標準點交示範範本！', 'success');
    });
  }

  // 12. 重設表單
  if (btnResetForm) {
    btnResetForm.addEventListener('click', () => {
      if (confirm('確定要清空當前點交紀錄嗎？未備份之照片與內容將被清除。')) {
        localStorage.removeItem(DRAFT_KEY);
        state.zones = JSON.parse(JSON.stringify(DEFAULT_ZONES));
        state.tenant = '';
        state.powerMeter = '';
        state.subMeter = '';
        state.waterMeter = '';
        state.gasMeter = '';
        if (landlordSigPad) landlordSigPad.clear();
        if (tenantSigPad) tenantSigPad.clear();
        applyStateToInputs();
        showToast('已重設為空白點交清單', 'info');
      }
    });
  }

  // 13. JSON 匯出與匯入
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `港居屋況點交存證_${state.date}_${state.address.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.json`);
      dlAnchor.click();
      showToast('已成功下載點交紀錄 JSON 備份檔！', 'success');
    });
  }

  if (btnImportJson && jsonFileInput) {
    btnImportJson.addEventListener('click', () => {
      jsonFileInput.click();
    });

    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.zones && Array.isArray(imported.zones)) {
            state = { ...state, ...imported };
            applyStateToInputs();
            saveDraft();
            showToast('已成功匯入點交備份資料！', 'success');
          } else {
            showToast('JSON 格式不符，請確認檔案內容', 'error');
          }
        } catch (err) {
          showToast('JSON 解析失敗，請確認檔案格式', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // 14. 列印按鈕
  if (btnPrintInspection) {
    btnPrintInspection.addEventListener('click', () => {
      window.print();
    });
  }

  // 15. 初始化載入
  if (!loadDraft()) {
    applyStateToInputs();
  }
});
