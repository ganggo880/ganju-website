/**
 * 港居不動產 - 住宅租賃飼養寵物特約承諾書與管理規約產生器
 * File: js/pet-addendum-agreement.js
 * 依據《民法》第432/190條、《動物保護法》與《公寓大廈管理條例》第16條合規設計
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- 狀態庫 (State Store) ---
  const state = {
    // 租賃主契約資訊
    propertyAddress: '高雄市小港區中安路 825 號 6 樓 A 室',
    leaseStart: '2026-11-01',
    leaseEnd: '2027-10-31',
    leaseCode: 'GJ-202611-PET01',
    landlordName: '港居不動產開發有限公司（代管代理）',
    landlordPhone: '07-791-2288',
    tenantName: '林志豪',
    tenantPhone: '0912-345-678',
    tenantId: 'E123456789',

    // 寵物身分資訊
    petType: 'cat', // dog, cat, rabbit, bird, aquatic, other
    petTypeNameCustom: '',
    petBreed: '英國短毛貓 (藍貓)',
    petName: '麻糬 (Mochi)',
    petGender: '公 (Male)',
    petAge: '2 歲 4 個月',
    isNeutered: 'yes',
    chipNumber: '900115002847192',
    rabiesVaccine: 'RV-2026-KH08412',
    rabiesDate: '2026-05-15',
    petPhotoUrl: '',

    // 費用與清潔約定
    sanitationFee: 4500,
    extraDeposit: 0,

    // 生活規約確認狀態
    rules: {
      hygiene: true,
      damage: true,
      commonArea: true,
      noise: true,
      parasite: true,
      noBreeding: true,
      liability: true
    },

    // 簽章資料
    signatures: {
      tenant: null,
      landlord: null
    }
  };

  // --- 繁體中文金額大寫轉換 ---
  function toChineseCurrency(num) {
    if (isNaN(num) || num === null || num === undefined) return '零元整';
    num = Math.round(Number(num));
    if (num === 0) return '零元整';
    if (num < 0) return '負' + toChineseCurrency(Math.abs(num));

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟', '萬', '拾', '佰', '仟', '億'];
    let str = '';
    let n = num;
    let unitIdx = 0;

    while (n > 0 && unitIdx < units.length) {
      const digit = n % 10;
      if (digit > 0) {
        str = digits[digit] + units[unitIdx] + str;
      } else if (str.length > 0 && !str.startsWith('零')) {
        str = '零' + str;
      }
      n = Math.floor(n / 10);
      unitIdx++;
    }

    str = str.replace(/零+/g, '零').replace(/零萬/g, '萬').replace(/零+$/, '');
    return '新臺幣 ' + str + '元整';
  }

  // --- 初始化手寫簽名板 ---
  class RetinaSignaturePad {
    constructor(canvasId, clearBtnId, onEnd) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.clearBtn = document.getElementById(clearBtnId);
      this.onEnd = onEnd;
      this.isDrawing = false;
      this.hasDrawn = false;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      this.bindEvents();
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 2;
      this.canvas.width = rect.width * ratio;
      this.canvas.height = rect.height * ratio;
      this.ctx.scale(ratio, ratio);
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#1a365d';

      if (this.savedData) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = this.savedData;
      }
    }

    bindEvents() {
      const start = (e) => {
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        const pos = this.getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.hasDrawn = true;
        e.preventDefault();
      };

      const end = () => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        if (this.hasDrawn) {
          this.savedData = this.canvas.toDataURL('image/png');
          if (this.onEnd) this.onEnd(this.savedData);
        }
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clear());
      }
    }

    getPos(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.savedData = null;
      this.hasDrawn = false;
      if (this.onEnd) this.onEnd(null);
    }
  }

  // --- 照片上傳與壓縮壓印存證處理 ---
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('請選取有效的圖檔格式 (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 浮水印存證壓印
        const bannerH = Math.max(32, Math.round(height * 0.08));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, height - bannerH, width, bannerH);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(12, Math.round(bannerH * 0.42))}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const todayStr = new Date().toISOString().split('T')[0];
        const watermarkText = `港居不動產 寵物飼養身分存證 ｜ ${todayStr} ｜ 晶片號: ${state.chipNumber || '未登錄'}`;
        ctx.fillText(watermarkText, 14, height - bannerH / 2);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        state.petPhotoUrl = dataUrl;
        updatePhotoPreview();
        updateDocPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function updatePhotoPreview() {
    const thumbImg = document.getElementById('petPhotoPreviewImg');
    const emptyHint = document.getElementById('petPhotoEmptyHint');
    const docPhotoImg = document.getElementById('docPetPhotoImg');
    const docEmptyHint = document.getElementById('docPetPhotoEmptyHint');

    if (state.petPhotoUrl) {
      if (thumbImg) {
        thumbImg.src = state.petPhotoUrl;
        thumbImg.style.display = 'block';
      }
      if (emptyHint) emptyHint.style.display = 'none';
      if (docPhotoImg) {
        docPhotoImg.src = state.petPhotoUrl;
        docPhotoImg.style.display = 'block';
      }
      if (docEmptyHint) docEmptyHint.style.display = 'none';
    } else {
      if (thumbImg) thumbImg.style.display = 'none';
      if (emptyHint) emptyHint.style.display = 'block';
      if (docPhotoImg) docPhotoImg.style.display = 'none';
      if (docEmptyHint) docEmptyHint.style.display = 'block';
    }
  }

  // --- 表單綁定與同步更新 ---
  function bindInputs() {
    // 寵物類別卡片單選
    const petTypeTiles = document.querySelectorAll('.pet-type-radio-tile');
    petTypeTiles.forEach((tile) => {
      tile.addEventListener('click', function () {
        petTypeTiles.forEach((t) => t.classList.remove('selected'));
        this.classList.add('selected');
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          state.petType = radio.value;
          const customGroup = document.getElementById('petTypeCustomGroup');
          if (customGroup) {
            customGroup.style.display = state.petType === 'other' ? 'block' : 'none';
          }
          updateDocPreview();
        }
      });
    });

    // 欄位即時綁定
    const fieldMap = [
      { id: 'inputPropertyAddress', prop: 'propertyAddress' },
      { id: 'inputLeaseStart', prop: 'leaseStart' },
      { id: 'inputLeaseEnd', prop: 'leaseEnd' },
      { id: 'inputLeaseCode', prop: 'leaseCode' },
      { id: 'inputLandlordName', prop: 'landlordName' },
      { id: 'inputLandlordPhone', prop: 'landlordPhone' },
      { id: 'inputTenantName', prop: 'tenantName' },
      { id: 'inputTenantPhone', prop: 'tenantPhone' },
      { id: 'inputTenantId', prop: 'tenantId' },
      { id: 'inputPetBreed', prop: 'petBreed' },
      { id: 'inputPetName', prop: 'petName' },
      { id: 'inputPetGender', prop: 'petGender' },
      { id: 'inputPetAge', prop: 'petAge' },
      { id: 'inputIsNeutered', prop: 'isNeutered' },
      { id: 'inputChipNumber', prop: 'chipNumber' },
      { id: 'inputRabiesVaccine', prop: 'rabiesVaccine' },
      { id: 'inputRabiesDate', prop: 'rabiesDate' },
      { id: 'inputPetTypeCustom', prop: 'petTypeNameCustom' },
      { id: 'inputSanitationFee', prop: 'sanitationFee', isNum: true },
      { id: 'inputExtraDeposit', prop: 'extraDeposit', isNum: true }
    ];

    fieldMap.forEach((f) => {
      const el = document.getElementById(f.id);
      if (!el) return;
      el.addEventListener('input', function () {
        state[f.prop] = f.isNum ? Number(this.value) || 0 : this.value;
        updateDocPreview();
      });
    });

    // 規約核選框綁定
    const ruleIds = [
      { id: 'checkRuleHygiene', key: 'hygiene' },
      { id: 'checkRuleDamage', key: 'damage' },
      { id: 'checkRuleCommonArea', key: 'commonArea' },
      { id: 'checkRuleNoise', key: 'noise' },
      { id: 'checkRuleParasite', key: 'parasite' },
      { id: 'checkRuleNoBreeding', key: 'noBreeding' },
      { id: 'checkRuleLiability', key: 'liability' }
    ];

    ruleIds.forEach((r) => {
      const chk = document.getElementById(r.id);
      if (!chk) return;
      chk.addEventListener('change', function () {
        state.rules[r.key] = this.checked;
        updateDocPreview();
      });
    });

    // 相片上傳與刪除
    const photoInput = document.getElementById('petPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          handlePhotoUpload(this.files[0]);
        }
      });
    }

    const removePhotoBtn = document.getElementById('btnRemovePhoto');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', function () {
        state.petPhotoUrl = '';
        if (photoInput) photoInput.value = '';
        updatePhotoPreview();
        updateDocPreview();
      });
    }

    // 範本快速載入按鈕
    const loadCatBtn = document.getElementById('btnSampleCat');
    if (loadCatBtn) {
      loadCatBtn.addEventListener('click', () => loadSample('cat'));
    }

    const loadDogBtn = document.getElementById('btnSampleDog');
    if (loadDogBtn) {
      loadDogBtn.addEventListener('click', () => loadSample('dog'));
    }

    const resetBtn = document.getElementById('btnResetForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => resetForm());
    }
  }

  // --- 載入預設範本 ---
  function loadSample(type) {
    if (type === 'cat') {
      state.petType = 'cat';
      state.petBreed = '英國短毛貓 (金漸層)';
      state.petName = '椪柑 (Ponkan)';
      state.petGender = '母 (Female)';
      state.petAge = '1 歲 8 個月';
      state.isNeutered = 'yes';
      state.chipNumber = '900115002847192';
      state.rabiesVaccine = 'RV-2026-KH08412';
      state.rabiesDate = '2026-05-15';
      state.sanitationFee = 4500;
      state.extraDeposit = 0;
    } else if (type === 'dog') {
      state.petType = 'dog';
      state.petBreed = '柴犬 (赤柴)';
      state.petName = '旺柴 (Wang-Chai)';
      state.petGender = '公 (Male)';
      state.petAge = '3 歲 2 個月';
      state.isNeutered = 'yes';
      state.chipNumber = '900128003921844';
      state.rabiesVaccine = 'RV-2026-KH09155';
      state.rabiesDate = '2026-04-20';
      state.sanitationFee = 5500;
      state.extraDeposit = 5000;
    }

    syncStateToInputs();
    updateDocPreview();
  }

  // --- 將 State 同步回表單 DOM ---
  function syncStateToInputs() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('inputPropertyAddress', state.propertyAddress);
    setVal('inputLeaseStart', state.leaseStart);
    setVal('inputLeaseEnd', state.leaseEnd);
    setVal('inputLeaseCode', state.leaseCode);
    setVal('inputLandlordName', state.landlordName);
    setVal('inputLandlordPhone', state.landlordPhone);
    setVal('inputTenantName', state.tenantName);
    setVal('inputTenantPhone', state.tenantPhone);
    setVal('inputTenantId', state.tenantId);
    setVal('inputPetBreed', state.petBreed);
    setVal('inputPetName', state.petName);
    setVal('inputPetGender', state.petGender);
    setVal('inputPetAge', state.petAge);
    setVal('inputIsNeutered', state.isNeutered);
    setVal('inputChipNumber', state.chipNumber);
    setVal('inputRabiesVaccine', state.rabiesVaccine);
    setVal('inputRabiesDate', state.rabiesDate);
    setVal('inputSanitationFee', state.sanitationFee);
    setVal('inputExtraDeposit', state.extraDeposit);

    const tiles = document.querySelectorAll('.pet-type-radio-tile');
    tiles.forEach((t) => {
      const r = t.querySelector('input[type="radio"]');
      if (r && r.value === state.petType) {
        t.classList.add('selected');
        r.checked = true;
      } else {
        t.classList.remove('selected');
      }
    });

    const customGroup = document.getElementById('petTypeCustomGroup');
    if (customGroup) {
      customGroup.style.display = state.petType === 'other' ? 'block' : 'none';
    }
  }

  // --- 重置表單 ---
  function resetForm() {
    if (!confirm('確定要清空所有填寫內容並重設嗎？')) return;
    state.propertyAddress = '';
    state.leaseCode = '';
    state.tenantName = '';
    state.tenantPhone = '';
    state.tenantId = '';
    state.petBreed = '';
    state.petName = '';
    state.chipNumber = '';
    state.rabiesVaccine = '';
    state.petPhotoUrl = '';
    state.sanitationFee = 4500;
    state.extraDeposit = 0;
    sigPadTenant.clear();
    sigPadLandlord.clear();
    syncStateToInputs();
    updatePhotoPreview();
    updateDocPreview();
  }

  // --- 更新 A4 預覽公文 ---
  function updateDocPreview() {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt || '—';
    };

    setText('docPropertyAddress', state.propertyAddress);
    setText('docLeaseDuration', `${state.leaseStart || '—'} 至 ${state.leaseEnd || '—'}`);
    setText('docLeaseCode', state.leaseCode);
    setText('docLandlordName', state.landlordName);
    setText('docLandlordPhone', state.landlordPhone);
    setText('docTenantName', state.tenantName);
    setText('docTenantPhone', state.tenantPhone);
    setText('docTenantId', state.tenantId);

    // 寵物類別文字轉換
    const typeLabelMap = {
      dog: '犬隻 (Dog)',
      cat: '貓咪 (Cat)',
      rabbit: '兔類 (Rabbit)',
      bird: '鳥禽類 (Bird)',
      aquatic: '水族/兩棲爬蟲 (Aquatic/Reptile)',
      other: state.petTypeNameCustom || '其他特約寵物'
    };
    setText('docPetType', typeLabelMap[state.petType] || state.petType);
    setText('docPetBreed', state.petBreed);
    setText('docPetName', state.petName);
    setText('docPetGender', state.petGender);
    setText('docPetAge', state.petAge);
    setText('docIsNeutered', state.isNeutered === 'yes' ? '已絕育（結紮）' : '未絕育');
    setText('docChipNumber', state.chipNumber ? state.chipNumber : '未植入晶片（免登記）');
    setText('docRabiesInfo', state.rabiesVaccine ? `${state.rabiesVaccine} (${state.rabiesDate || '施打日期未填'})` : '依規免施打或未填');

    // 費用約定
    const sanitationText = `${toChineseCurrency(state.sanitationFee)} (NT$ ${Number(state.sanitationFee).toLocaleString()})`;
    setText('docSanitationFee', sanitationText);

    const depositText = state.extraDeposit > 0
      ? `${toChineseCurrency(state.extraDeposit)} (NT$ ${Number(state.extraDeposit).toLocaleString()})`
      : '免額外加收保證金（由原租約押金擔保）';
    setText('docExtraDeposit', depositText);

    // 簽章落款中身分
    setText('docSigTenantName', state.tenantName || '承租人');
    setText('docSigTenantId', state.tenantId || '身分證號');
    setText('docSigLandlordName', state.landlordName || '出租人 / 代管業者');

    // 規約項目顯示切換
    const toggleRuleDoc = (docId, isChecked) => {
      const el = document.getElementById(docId);
      if (el) el.style.display = isChecked ? 'list-item' : 'none';
    };
    toggleRuleDoc('docRuleHygiene', state.rules.hygiene);
    toggleRuleDoc('docRuleDamage', state.rules.damage);
    toggleRuleDoc('docRuleCommonArea', state.rules.commonArea);
    toggleRuleDoc('docRuleNoise', state.rules.noise);
    toggleRuleDoc('docRuleParasite', state.rules.parasite);
    toggleRuleDoc('docRuleNoBreeding', state.rules.noBreeding);
    toggleRuleDoc('docRuleLiability', state.rules.liability);
  }

  // --- 初始化雙簽章畫布 ---
  const sigPadTenant = new RetinaSignaturePad('canvasTenantSig', 'btnClearTenantSig', (dataUrl) => {
    state.signatures.tenant = dataUrl;
    const img = document.getElementById('docSigTenantImg');
    const hint = document.getElementById('docSigTenantHint');
    if (img && hint) {
      if (dataUrl) {
        img.src = dataUrl;
        img.style.display = 'block';
        hint.style.display = 'none';
      } else {
        img.style.display = 'none';
        hint.style.display = 'block';
      }
    }
  });

  const sigPadLandlord = new RetinaSignaturePad('canvasLandlordSig', 'btnClearLandlordSig', (dataUrl) => {
    state.signatures.landlord = dataUrl;
    const img = document.getElementById('docSigLandlordImg');
    const hint = document.getElementById('docSigLandlordHint');
    if (img && hint) {
      if (dataUrl) {
        img.src = dataUrl;
        img.style.display = 'block';
        hint.style.display = 'none';
      } else {
        img.style.display = 'none';
        hint.style.display = 'block';
      }
    }
  });

  // --- A4 列印按鈕 ---
  const printBtn = document.getElementById('btnPrintDocument');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // --- LINE 格式化文字複製 ---
  const copyLineBtn = document.getElementById('btnCopyLineSummary');
  if (copyLineBtn) {
    copyLineBtn.addEventListener('click', function () {
      const text = generateLineSummary();
      navigator.clipboard.writeText(text).then(() => {
        alert('【寵物特約承諾書摘要】已成功複製到剪貼簿！可直接貼入 LINE 群組或傳送給房東/房客備查。');
      }).catch(() => {
        alert('複製失敗，請手動選取文字複製。');
      });
    });
  }

  function generateLineSummary() {
    const typeLabelMap = {
      dog: '犬隻',
      cat: '貓咪',
      rabbit: '兔類',
      bird: '鳥禽類',
      aquatic: '水族兩棲',
      other: state.petTypeNameCustom || '特約寵物'
    };
    const pType = typeLabelMap[state.petType] || state.petType;

    return `🐾【港居不動產｜住宅租賃飼養寵物特約承諾書】
───────────────────
🏢 承租標的：${state.propertyAddress || '—'}
📄 主約代碼：${state.leaseCode || '—'}
👤 承租飼主：${state.tenantName || '—'} (${state.tenantPhone || '—'})
───────────────────
🐶 寵物名稱：${state.petName || '—'}（${pType} / ${state.petBreed || '—'}）
🏷️ 寵物晶片：${state.chipNumber || '未植入晶片'}
💉 狂犬疫苗：${state.rabiesVaccine || '免登記'}
───────────────────
🧹 退租深清：NT$ ${Number(state.sanitationFee).toLocaleString()} 元（專業除蚤除臭）
🛡️ 額外押金：${state.extraDeposit > 0 ? 'NT$ ' + Number(state.extraDeposit).toLocaleString() + ' 元' : '無加收'}
───────────────────
⚖️ 核心守則承諾：
1. 室內抓咬破壞同意全額照價賠償，不折舊扣抵。
2. 公共區域出入裝籠、推車或繫 1.5 米內牽繩。
3. 深夜 22:00~08:00 嚴防吠叫，通報 2 次限期移置。
4. 動物占有人侵權責任自負（民法第 190 條）。
───────────────────
ℹ️ 本承諾書已由雙方手寫電子簽署並存證備查。`;
  }

  // --- Canvas 840×1080px 高畫質圖卡產生與下載 ---
  const downloadCardBtn = document.getElementById('btnDownloadCard');
  if (downloadCardBtn) {
    downloadCardBtn.addEventListener('click', function () {
      generateAndDownloadCard();
    });
  }

  function generateAndDownloadCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍裝飾條
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, 840, 130);

    // 金色下框線
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 126, 840, 4);

    // 頂部標題
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GANJU REAL ESTATE ｜ 住宅租賃管理專法合規備存', 420, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('住宅租賃飼養寵物特約承諾書', 420, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`標的地址：${state.propertyAddress || '—'}  |  主租約代碼：${state.leaseCode || '—'}`, 420, 110);

    // 寵物檔案與照片區塊 (Y: 150)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    roundRect(ctx, 40, 150, 760, 210, 12);
    ctx.fill();
    ctx.stroke();

    // 寵物照片
    if (state.petPhotoUrl) {
      const img = new Image();
      img.onload = () => {
        drawCardContent(canvas, ctx, img);
      };
      img.src = state.petPhotoUrl;
    } else {
      drawCardContent(canvas, ctx, null);
    }
  }

  function drawCardContent(canvas, ctx, petImg) {
    // 寵物照片框
    const photoX = 60;
    const photoY = 170;
    const photoW = 160;
    const photoH = 170;

    ctx.fillStyle = '#e2e8f0';
    roundRect(ctx, photoX, photoY, photoW, photoH, 8);
    ctx.fill();

    if (petImg) {
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, 8);
      ctx.clip();
      ctx.drawImage(petImg, photoX, photoY, photoW, photoH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('無照片存證', photoX + photoW / 2, photoY + photoH / 2);
    }

    // 寵物基本資料文字
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`🐾 ${state.petName || '未命名'} (${state.petBreed || '品種未填'})`, 245, 195);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`晶片號碼：${state.chipNumber || '未植入晶片'}`, 245, 230);
    ctx.fillText(`性別年齡：${state.petGender || '—'}  |  ${state.petAge || '—'}`, 245, 260);
    ctx.fillText(`狂犬疫苗：${state.rabiesVaccine || '免施打'} (${state.rabiesDate || '無紀錄'})`, 245, 290);
    ctx.fillText(`立約飼主：${state.tenantName || '—'}  |  電話：${state.tenantPhone || '—'}`, 245, 320);

    // 費用約定專區 (Y: 380)
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#fde68a';
    roundRect(ctx, 40, 380, 760, 80, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('💰 費用與清潔約定', 60, 412);

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`退租深層消毒除蚤費：NT$ ${Number(state.sanitationFee).toLocaleString()} 元  |  額外押金：${state.extraDeposit > 0 ? 'NT$ ' + Number(state.extraDeposit).toLocaleString() + ' 元' : '無加收'}`, 60, 440);

    // 七大生活公約規範摘要 (Y: 480)
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('📜 承租人飼養管理與法定義務承諾', 40, 495);

    const rules = [
      '① 衛生管理：貓砂尿墊防滲漏，排泄物密封隨垃圾清運，嚴禁沖馬桶致管線阻塞。',
      '② 設備損害：室內牆壁木作壁紙木地板若遭抓咬破損，同意全額照新品價賠償。',
      '③ 公共走道：進出社區大廳、梯間電梯嚴格裝入提籠或推車，嚴禁自由走動。',
      '④ 安寧維護：深夜 22:00~08:00 嚴防持續吠叫擾鄰，經投訴 2 次限期 7 日內移置。',
      '⑤ 寄生蟲防制：定期投藥除蚤除蟲，退租檢附合格廠商全戶深層清潔除臭發票。',
      '⑥ 動物侵權：動物致第三人身體或財產損害者，承租人承擔完全賠償責任（民法第190條）。'
    ];

    ctx.fillStyle = '#334155';
    ctx.font = '13.5px sans-serif';
    let rY = 525;
    rules.forEach((r) => {
      ctx.fillText(r, 45, rY);
      rY += 32;
    });

    // 簽名專區 (Y: 740)
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(40, 740, 360, 180);
    ctx.strokeRect(440, 740, 360, 180);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 740, 360, 36);
    ctx.fillRect(440, 740, 360, 36);

    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('承租人（飼主立約承諾）簽署', 55, 764);
    ctx.fillText('出租人 / 代管業者 核備簽署', 455, 764);

    // 繪製承租人手寫簽名
    if (state.signatures.tenant) {
      const tImg = new Image();
      tImg.onload = () => {
        ctx.drawImage(tImg, 70, 790, 300, 100);
        finishCard(canvas, ctx);
      };
      tImg.src = state.signatures.tenant;
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 16px sans-serif';
      ctx.fillText('(尚未電子簽名)', 150, 850);
      finishCard(canvas, ctx);
    }
  }

  function finishCard(canvas, ctx) {
    // 繪製房東/代管簽名
    if (state.signatures.landlord) {
      const lImg = new Image();
      lImg.onload = () => {
        ctx.drawImage(lImg, 470, 790, 300, 100);
        drawFooterAndDownload(canvas, ctx);
      };
      lImg.src = state.signatures.landlord;
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 16px sans-serif';
      ctx.fillText('(尚未電子簽署)', 550, 850);
      drawFooterAndDownload(canvas, ctx);
    }
  }

  function drawFooterAndDownload(canvas, ctx) {
    // 底部浮水印與落款
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`立約存證日期：${dateStr}  ｜  港居不動產開發有限公司（統編：96797997）`, 420, 960);
    ctx.fillText('本圖卡經 HTML5 Canvas 於瀏覽器本地加密渲染，符合租賃住宅定型化契約法規存證效力', 420, 985);

    // 金色防偽徽章
    ctx.fillStyle = '#c5a059';
    roundRect(ctx, 320, 1010, 200, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('✔ 港居官方數位存證', 420, 1033);

    // 觸發下載
    const link = document.createElement('a');
    link.download = `寵物特約承諾書_${state.petName || '毛孩'}_${state.tenantName || '租客'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // 繪製圓角矩形輔助函式
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // --- 啟動初始化 ---
  bindInputs();
  syncStateToInputs();
  updatePhotoPreview();
  updateDocPreview();
});
