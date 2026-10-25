/**
 * 港居不動產 - 住宅租賃汽機車停車位租用與管理協議書產生器
 * File: js/parking-lease-agreement.js
 * 依據《民法》第421/432/443條、《公寓大廈管理條例》第15/16/23條與機械停車設備安全規範設計
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- 狀態庫 (State Store) ---
  const state = {
    // 1. 租賃型態與立約人
    leaseMode: 'bundled', // bundled (隨屋附租), standalone (社區住戶單租), combo (汽機車雙位組合)
    communityName: '港居仰森高質感住宅大樓',
    propertyAddress: '高雄市小港區中安路 825 號 10 樓 A 室',
    leaseCode: 'GJ-202611-PK01',
    leaseStart: '2026-11-01',
    leaseEnd: '2027-10-31',
    landlordName: '港居不動產開發有限公司（受託代管）',
    landlordPhone: '07-791-2288',
    tenantName: '陳冠宇',
    tenantId: 'E128976543',
    tenantPhone: '0928-668-168',
    tenantUnit: 'A 棟 10 樓 A 室',

    // 2. 停車位規格與車籍建檔
    spaceType: 'flat', // flat (坡道平面), mech_ramp (坡道機械), mech_tower (昇降機械塔), scooter (專屬機車位)
    carSpaceFloor: '地下二樓 (B2)',
    carSpaceNo: 'B2-088 號',
    scooterSpaceNo: 'B1-機062 號',

    // 機械車位安全限制 (cm / kg)
    mechLimitLength: 500,
    mechLimitWidth: 190,
    mechLimitHeight: 155,
    mechLimitWeight: 2000,

    // 停放車輛車籍
    carPlate: 'BGH-8899',
    carModelColor: 'Tesla Model 3 (珍珠白)',
    scooterPlate: 'NPB-6677',
    scooterModel: 'Gogoro VIVA MIX (石墨灰)',
    vehiclePhotoUrl: '',

    // 3. 租金、清潔保養費、門禁遙控器與電動車充電
    monthlyRent: 3200,
    cleaningFeeMode: 'tenant', // included (含於租金內), tenant (承租人另行負擔)
    cleaningFeeAmount: 400,
    payDay: 5,
    remoteCount: 1,
    etagCount: 1,
    mechKeyCount: 0,
    remoteDeposit: 1000,
    evChargePolicy: 'existing_meter', // none (無充電設備), existing_meter (既有充電樁獨立電表計費), self_install (自費經管委會核准安裝)
    evRateNote: '依獨立分表度數×台電當期每度平均電價據實結算',

    // 4. 停車場使用安全與管理守則
    rules: {
      registeredOnly: true,
      noClutter: true,
      withinLines: true,
      mechSafety: true,
      oilLeakClean: true,
      custodyDisclaimer: true,
      noRemoteCopy: true
    },

    // 5. 雙方簽章
    signatures: {
      tenant: null,
      landlord: null
    }
  };

  // --- 繁體中文金額大寫轉換 ---
  function toChineseCurrency(num) {
    if (isNaN(num) || num === null || num === undefined) return '新臺幣 零元整';
    num = Math.round(Number(num));
    if (num === 0) return '新臺幣 零元整';
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

  // --- 名稱對照字典 ---
  const LEASE_MODE_LABELS = {
    bundled: '隨屋附租特約（與住宅主租約連動）',
    standalone: '同社區住戶獨立單租車位',
    combo: '汽車位＋專屬機車位雙位組合附租'
  };

  const SPACE_TYPE_LABELS = {
    flat: '坡道平面標準車位',
    mech_ramp: '坡道機械車位（平移升降）',
    mech_tower: '昇降機械車塔車位',
    scooter: '專屬固定機車停車位'
  };

  const EV_POLICY_LABELS = {
    none: '純燃油/一般車位（禁止私接公共電源充電）',
    existing_meter: '配有專用充電樁（依獨立電表或台電電價據實計收）',
    self_install: '承租人自費向管委會申請合規裝設（退租須回復原狀或留歸出租人）'
  };

  // --- 初始化 Retina 2x 手寫簽名板 ---
  class RetinaSignaturePad {
    constructor(canvasId, clearBtnId, onEnd) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.clearBtn = document.getElementById(clearBtnId);
      this.onEnd = onEnd;
      this.isDrawing = false;
      this.savedData = null;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.bindEvents();
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : 260;
      const height = rect.height > 0 ? rect.height : 120;
      const ratio = window.devicePixelRatio || 2;
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(ratio, ratio);
      this.ctx.lineWidth = 2.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = '#1a365d';

      if (this.savedData) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = this.savedData;
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

    bindEvents() {
      const start = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      };

      const end = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        this.savedData = this.canvas.toDataURL('image/png');
        if (this.onEnd) this.onEnd(this.savedData);
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      this.canvas.addEventListener('touchend', end);

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clear());
      }
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width || 300, rect.height || 150);
      this.savedData = null;
      if (this.onEnd) this.onEnd(null);
    }
  }

  let padTenant = null;
  let padLandlord = null;

  function initSignaturePads() {
    padTenant = new RetinaSignaturePad('sigCanvasTenant', 'btnClearSigTenant', (dataUrl) => {
      state.signatures.tenant = dataUrl;
      renderPreview();
    });

    padLandlord = new RetinaSignaturePad('sigCanvasLandlord', 'btnClearSigLandlord', (dataUrl) => {
      state.signatures.landlord = dataUrl;
      renderPreview();
    });
  }

  // --- 計算每月應繳與首期總額 ---
  function calculateTotals() {
    const rent = Number(state.monthlyRent) || 0;
    const clean = state.cleaningFeeMode === 'tenant' ? (Number(state.cleaningFeeAmount) || 0) : 0;
    const monthlyTotal = rent + clean;
    const deposit = Number(state.remoteDeposit) || 0;
    const firstPaymentTotal = monthlyTotal + deposit;
    return {
      rent,
      clean,
      monthlyTotal,
      deposit,
      firstPaymentTotal
    };
  }

  // --- 同步表單輸入至 State ---
  function syncInputsFromState() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('inputCommunityName', state.communityName);
    setVal('inputPropertyAddress', state.propertyAddress);
    setVal('inputLeaseCode', state.leaseCode);
    setVal('inputLeaseStart', state.leaseStart);
    setVal('inputLeaseEnd', state.leaseEnd);
    setVal('inputLandlordName', state.landlordName);
    setVal('inputLandlordPhone', state.landlordPhone);
    setVal('inputTenantName', state.tenantName);
    setVal('inputTenantId', state.tenantId);
    setVal('inputTenantPhone', state.tenantPhone);
    setVal('inputTenantUnit', state.tenantUnit);

    setVal('inputCarSpaceFloor', state.carSpaceFloor);
    setVal('inputCarSpaceNo', state.carSpaceNo);
    setVal('inputScooterSpaceNo', state.scooterSpaceNo);

    setVal('inputMechLength', state.mechLimitLength);
    setVal('inputMechWidth', state.mechLimitWidth);
    setVal('inputMechHeight', state.mechLimitHeight);
    setVal('inputMechWeight', state.mechLimitWeight);

    setVal('inputCarPlate', state.carPlate);
    setVal('inputCarModelColor', state.carModelColor);
    setVal('inputScooterPlate', state.scooterPlate);
    setVal('inputScooterModel', state.scooterModel);

    setVal('inputMonthlyRent', state.monthlyRent);
    setVal('selectCleaningFeeMode', state.cleaningFeeMode);
    setVal('inputCleaningFeeAmount', state.cleaningFeeAmount);
    setVal('inputPayDay', state.payDay);
    setVal('inputRemoteCount', state.remoteCount);
    setVal('inputEtagCount', state.etagCount);
    setVal('inputMechKeyCount', state.mechKeyCount);
    setVal('inputRemoteDeposit', state.remoteDeposit);
    setVal('selectEvChargePolicy', state.evChargePolicy);
    setVal('inputEvRateNote', state.evRateNote);

    // 卡片選擇器高亮
    document.querySelectorAll('[data-lease-mode]').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-lease-mode') === state.leaseMode);
    });

    document.querySelectorAll('[data-space-type]').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-space-type') === state.spaceType);
    });

    // 守則勾選
    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };
    setChk('chkRuleRegisteredOnly', state.rules.registeredOnly);
    setChk('chkRuleNoClutter', state.rules.noClutter);
    setChk('chkRuleWithinLines', state.rules.withinLines);
    setChk('chkRuleMechSafety', state.rules.mechSafety);
    setChk('chkRuleOilLeakClean', state.rules.oilLeakClean);
    setChk('chkRuleCustodyDisclaimer', state.rules.custodyDisclaimer);
    setChk('chkRuleNoRemoteCopy', state.rules.noRemoteCopy);
  }

  // --- 渲染右側 A4 預覽與左側財務卡片 ---
  function renderPreview() {
    const totals = calculateTotals();

    // 左側金額摘要更新
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setTxt('summaryMonthlyTotal', `NT$ ${totals.monthlyTotal.toLocaleString()}`);
    setTxt('summaryRemoteDeposit', `NT$ ${totals.deposit.toLocaleString()}`);
    setTxt('summaryFirstTotal', `NT$ ${totals.firstPaymentTotal.toLocaleString()}`);
    setTxt('summaryFirstTotalChinese', toChineseCurrency(totals.firstPaymentTotal));

    // A4 公文欄位更新
    setTxt('docLeaseCode', state.leaseCode || 'GJ-202611-PK01');
    setTxt('docLeaseMode', LEASE_MODE_LABELS[state.leaseMode] || LEASE_MODE_LABELS.bundled);
    setTxt('docCommunityAddress', `${state.communityName}（${state.propertyAddress}）`);
    setTxt('docLeasePeriod', `${state.leaseStart} 起至 ${state.leaseEnd} 止`);
    setTxt('docLandlordInfo', `${state.landlordName}（電話：${state.landlordPhone}）`);
    setTxt('docTenantInfo', `${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}｜戶別：${state.tenantUnit}）`);

    // 車位與車牌識別表
    setTxt('docSpaceType', SPACE_TYPE_LABELS[state.spaceType] || SPACE_TYPE_LABELS.flat);
    setTxt('docCarSpaceNo', `${state.carSpaceFloor} ${state.carSpaceNo}`);
    setTxt('docCarPlateInfo', `${state.carPlate || '未登記'} ｜ ${state.carModelColor || '—'}`);
    setTxt('docScooterInfo', `${state.scooterSpaceNo || '無'} ｜ ${state.scooterPlate || '無'} (${state.scooterModel || '—'})`);

    const isMech = state.spaceType === 'mech_ramp' || state.spaceType === 'mech_tower';
    const mechText = isMech
      ? `⚠️ 機械限尺：長≤${state.mechLimitLength}cm、寬≤${state.mechLimitWidth}cm、高≤${state.mechLimitHeight}cm、重≤${state.mechLimitWeight}kg`
      : '標準平面高度限制（依社區車道限高標示為準）';
    setTxt('docMechLimits', mechText);

    // 車位照片預覽
    const docImg = document.getElementById('docVehiclePhotoImg');
    const docHint = document.getElementById('docVehiclePhotoEmptyHint');
    if (docImg && docHint) {
      if (state.vehiclePhotoUrl) {
        docImg.src = state.vehiclePhotoUrl;
        docImg.style.display = 'block';
        docHint.style.display = 'none';
      } else {
        docImg.style.display = 'none';
        docHint.style.display = 'inline';
      }
    }

    // 費用與門禁配件表
    const cleanDesc = state.cleaningFeeMode === 'tenant'
      ? `每月另計 NT$ ${totals.clean.toLocaleString()} 元（每月合計應繳：${toChineseCurrency(totals.monthlyTotal)}）`
      : `已含於每月車位租金內（每月應繳：${toChineseCurrency(totals.rent)}）`;
    setTxt('docRentAndClean', `月租 NT$ ${totals.rent.toLocaleString()} 元 ｜ 清潔保養費：${cleanDesc}（每月 ${state.payDay} 日前繳納）`);

    setTxt(
      'docAccessRemotes',
      `車道遙控器 ${state.remoteCount} 顆、eTag/感應磁扣 ${state.etagCount} 張、機械車位鑰匙 ${state.mechKeyCount} 支 ｜ 保管押金：${toChineseCurrency(totals.deposit)} (NT$ ${totals.deposit.toLocaleString()})`
    );

    const evDesc = `${EV_POLICY_LABELS[state.evChargePolicy] || EV_POLICY_LABELS.none}${state.evRateNote ? '（' + state.evRateNote + '）' : ''}`;
    setTxt('docEvPolicy', evDesc);

    // 守則顯示控制
    const toggleRule = (id, show) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? 'list-item' : 'none';
    };
    toggleRule('docRuleRegisteredOnly', state.rules.registeredOnly);
    toggleRule('docRuleNoClutter', state.rules.noClutter);
    toggleRule('docRuleWithinLines', state.rules.withinLines);
    toggleRule('docRuleMechSafety', state.rules.mechSafety);
    toggleRule('docRuleOilLeakClean', state.rules.oilLeakClean);
    toggleRule('docRuleCustodyDisclaimer', state.rules.custodyDisclaimer);
    toggleRule('docRuleNoRemoteCopy', state.rules.noRemoteCopy);

    // 簽章渲染
    setTxt('docSigTenantName', state.tenantName);
    setTxt('docSigTenantId', state.tenantId);
    setTxt('docSigLandlordName', state.landlordName);

    const sigTImg = document.getElementById('docSigTenantImg');
    const sigTHint = document.getElementById('docSigTenantHint');
    if (sigTImg && sigTHint) {
      if (state.signatures.tenant) {
        sigTImg.src = state.signatures.tenant;
        sigTImg.style.display = 'block';
        sigTHint.style.display = 'none';
      } else {
        sigTImg.style.display = 'none';
        sigTHint.style.display = 'inline';
      }
    }

    const sigLImg = document.getElementById('docSigLandlordImg');
    const sigLHint = document.getElementById('docSigLandlordHint');
    if (sigLImg && sigLHint) {
      if (state.signatures.landlord) {
        sigLImg.src = state.signatures.landlord;
        sigLImg.style.display = 'block';
        sigLHint.style.display = 'none';
      } else {
        sigLImg.style.display = 'none';
        sigLHint.style.display = 'inline';
      }
    }
  }

  // --- 車輛與車位現況相片上傳並壓印防偽存證浮水印 ---
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 底部防偽時間與車牌浮水印條
        const barH = Math.max(32, Math.round(canvas.height * 0.1));
        ctx.fillStyle = 'rgba(26, 54, 93, 0.82)';
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        ctx.fillStyle = '#f6e05e';
        const fontSize = Math.max(12, Math.round(barH * 0.44));
        ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
        const today = new Date().toISOString().slice(0, 10);
        const stampText = `港居不動產 車位點交存證｜${today}｜車位:${state.carSpaceNo}｜車牌:${state.carPlate}`;
        ctx.fillText(stampText, 12, canvas.height - Math.round(barH * 0.3));

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        state.vehiclePhotoUrl = dataUrl;

        const previewEl = document.getElementById('vehiclePhotoPreview');
        const hintEl = document.getElementById('vehiclePhotoUploadHint');
        if (previewEl) {
          previewEl.src = dataUrl;
          previewEl.style.display = 'block';
        }
        if (hintEl) {
          hintEl.textContent = '✅ 已壓印防偽車位與車牌存證浮水印（點擊可更換相片）';
        }
        renderPreview();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- 下載 HTML5 Canvas 840x1080px 高畫質車位協議圖卡 ---
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const totals = calculateTotals();

    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍橫幅
    const grad = ctx.createLinearGradient(0, 0, 840, 130);
    grad.addColorStop(0, '#1a365d');
    grad.addColorStop(1, '#2a4365');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 840, 135);

    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 135, 840, 6);

    ctx.fillStyle = '#f6e05e';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ 統編：96797997 ｜ (113)高市租登字第0012號', 40, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Noto Sans TC", sans-serif';
    ctx.fillText('住宅租賃汽機車停車位租用與管理協議憑證', 40, 86);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`合約編號：${state.leaseCode} ｜ 租用期間：${state.leaseStart} ～ ${state.leaseEnd}`, 40, 116);

    // 區塊一：社區與雙方資訊
    const drawBox = (x, y, w, h, title) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1a365d';
      ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
      ctx.fillText(title, x + 20, y + 32);

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 44);
      ctx.lineTo(x + w - 20, y + 44);
      ctx.stroke();
    };

    drawBox(36, 160, 768, 165, '🏢 社區標的與立約當事人');
    ctx.fillStyle = '#1e293b';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`社區與地址：${state.communityName}（${state.propertyAddress}）`, 56, 200);
    ctx.fillText(`租用模式：${LEASE_MODE_LABELS[state.leaseMode]}`, 56, 230);
    ctx.fillText(`出租/代管方：${state.landlordName}（電話：${state.landlordPhone}）`, 56, 260);
    ctx.fillText(`承租使用人：${state.tenantName}（身分證：${state.tenantId}｜電話：${state.tenantPhone}｜戶別：${state.tenantUnit}）`, 56, 290);

    // 區塊二：車位規格與車籍資料
    drawBox(36, 340, 768, 210, '🚗 專屬停車位規格與核准停放車籍');
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`車位類別：${SPACE_TYPE_LABELS[state.spaceType]} ｜ 車位編號：${state.carSpaceFloor} ${state.carSpaceNo}`, 56, 382);
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`汽車車牌與車型：${state.carPlate} ｜ ${state.carModelColor}`, 56, 412);
    ctx.fillText(`附隨機車位與車牌：${state.scooterSpaceNo || '無'} ｜ ${state.scooterPlate || '無'} (${state.scooterModel || '—'})`, 56, 442);
    ctx.fillStyle = '#b45309';
    ctx.fillText(`機械車位安全限制：長≤${state.mechLimitLength}cm / 寬≤${state.mechLimitWidth}cm / 高≤${state.mechLimitHeight}cm / 重≤${state.mechLimitWeight}kg`, 56, 472);
    ctx.fillStyle = '#0f766e';
    ctx.fillText(`電動車充電約定：${EV_POLICY_LABELS[state.evChargePolicy]}`, 56, 502);
    ctx.fillStyle = '#475569';
    ctx.fillText(`門禁點交：遙控器 ${state.remoteCount} 顆、eTag/磁扣 ${state.etagCount} 張、機械鑰匙 ${state.mechKeyCount} 支`, 56, 530);

    // 區塊三：租金費用與管理承諾
    drawBox(36, 565, 768, 225, '💰 租金費用明細與停車安全管理切結');
    ctx.fillStyle = '#1a365d';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText(`每月應繳車位總額：NT$ ${totals.monthlyTotal.toLocaleString()} 元（${toChineseCurrency(totals.monthlyTotal)}）`, 56, 608);
    ctx.fillStyle = '#334155';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText(`• 門禁遙控器保管押金：NT$ ${totals.deposit.toLocaleString()} 元 ｜ 首期簽約應付總計：NT$ ${totals.firstPaymentTotal.toLocaleString()} 元`, 56, 638);
    ctx.fillText('• 專車專用：僅限契約登記車牌停放，嚴禁私自轉租、分租或借予外車停放（民法第443條）。', 56, 670);
    ctx.fillText('• 嚴禁堆放雜物：車位格內嚴禁堆置紙箱、輪胎、腳踏車或雜物（公寓大廈管理條例第16條）。', 56, 698);
    ctx.fillText('• 機械安全與漏油清潔：嚴禁超限停放；若有漏油污染地坪應負除油清潔與損壞賠償全責。', 56, 726);
    ctx.fillText('• 場地租用免責：本契約僅供車位場地出租，不負車輛與車內財物保管之責。', 56, 754);

    // 區塊四：簽章區
    drawBox(36, 805, 768, 200, '✍️ 立約雙方電子手寫簽章確認');

    // 承租人簽章框
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(56, 860, 340, 120);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(`承租人簽章：${state.tenantName}`, 66, 882);

    // 出租人簽章框
    ctx.strokeRect(436, 860, 340, 120);
    ctx.fillText(`出租/代管方簽章：${state.landlordName}`, 446, 882);

    const finalizeDownload = () => {
      // 頁尾
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產線上工具中心產製 ｜ 純前端本地零上傳加密運算 ｜ 服務專線：0968-863-880', 140, 1045);

      const link = document.createElement('a');
      link.download = `港居車位租用管理協議書_${state.carSpaceNo}_${state.tenantName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    // 繪製電子簽名影像
    const drawSig = (dataUrl, x, y, w, h, cb) => {
      if (!dataUrl) {
        cb();
        return;
      }
      const sImg = new Image();
      sImg.onload = () => {
        ctx.drawImage(sImg, x, y, w, h);
        cb();
      };
      sImg.onerror = () => cb();
      sImg.src = dataUrl;
    };

    drawSig(state.signatures.tenant, 70, 890, 260, 80, () => {
      drawSig(state.signatures.landlord, 450, 890, 260, 80, finalizeDownload);
    });
  }

  // --- 一鍵複製 LINE 格式化摘要 ---
  function copyLineSummary() {
    const totals = calculateTotals();
    const text = [
      '🅿️【港居不動產｜住宅租賃汽機車停車位租用與管理協議摘要】',
      `📄 合約編號：${state.leaseCode}`,
      `🏢 社區標的：${state.communityName}（${state.propertyAddress}）`,
      `📅 租用期間：${state.leaseStart} 至 ${state.leaseEnd}`,
      `👤 承租住戶：${state.tenantName}（戶別：${state.tenantUnit}｜電話：${state.tenantPhone}）`,
      '------------------------',
      `🚗 車位規格：${SPACE_TYPE_LABELS[state.spaceType]}`,
      `🔢 車位編號：${state.carSpaceFloor} ${state.carSpaceNo}（機車位：${state.scooterSpaceNo || '無'}）`,
      `🪪 登記車牌：汽車 ${state.carPlate} (${state.carModelColor}) ｜ 機車 ${state.scooterPlate || '無'}`,
      `📐 機械限尺：長≤${state.mechLimitLength}cm / 寬≤${state.mechLimitWidth}cm / 高≤${state.mechLimitHeight}cm / 重≤${state.mechLimitWeight}kg`,
      `⚡ 充電約定：${EV_POLICY_LABELS[state.evChargePolicy]}`,
      '------------------------',
      `💰 每月應繳總額：NT$ ${totals.monthlyTotal.toLocaleString()} 元（${toChineseCurrency(totals.monthlyTotal)}，每月 ${state.payDay} 日前繳納）`,
      `🔑 門禁配件：遙控器 ${state.remoteCount} 顆、eTag/磁扣 ${state.etagCount} 張、機械鑰匙 ${state.mechKeyCount} 支（押金 NT$ ${totals.deposit.toLocaleString()} 元）`,
      '⚠️ 重點守則：僅限登記車號停放禁轉租、車格內嚴禁堆放雜物、僅供場地租用不負保管責任。',
      '📞 港居不動產代管中心：0968-863-880（陳經理）'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLine');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> 已複製 LINE 車位協議摘要！';
          setTimeout(() => { btn.innerHTML = orig; }, 2200);
        }
      });
    }
  }

  // --- 綁定所有表單事件 ---
  function bindFormEvents() {
    const bindInput = (id, key, isNum = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        renderPreview();
      });
      el.addEventListener('change', () => {
        state[key] = isNum ? (Number(el.value) || 0) : el.value;
        renderPreview();
      });
    };

    bindInput('inputCommunityName', 'communityName');
    bindInput('inputPropertyAddress', 'propertyAddress');
    bindInput('inputLeaseCode', 'leaseCode');
    bindInput('inputLeaseStart', 'leaseStart');
    bindInput('inputLeaseEnd', 'leaseEnd');
    bindInput('inputLandlordName', 'landlordName');
    bindInput('inputLandlordPhone', 'landlordPhone');
    bindInput('inputTenantName', 'tenantName');
    bindInput('inputTenantId', 'tenantId');
    bindInput('inputTenantPhone', 'tenantPhone');
    bindInput('inputTenantUnit', 'tenantUnit');

    bindInput('inputCarSpaceFloor', 'carSpaceFloor');
    bindInput('inputCarSpaceNo', 'carSpaceNo');
    bindInput('inputScooterSpaceNo', 'scooterSpaceNo');

    bindInput('inputMechLength', 'mechLimitLength', true);
    bindInput('inputMechWidth', 'mechLimitWidth', true);
    bindInput('inputMechHeight', 'mechLimitHeight', true);
    bindInput('inputMechWeight', 'mechLimitWeight', true);

    bindInput('inputCarPlate', 'carPlate');
    bindInput('inputCarModelColor', 'carModelColor');
    bindInput('inputScooterPlate', 'scooterPlate');
    bindInput('inputScooterModel', 'scooterModel');

    bindInput('inputMonthlyRent', 'monthlyRent', true);
    bindInput('selectCleaningFeeMode', 'cleaningFeeMode');
    bindInput('inputCleaningFeeAmount', 'cleaningFeeAmount', true);
    bindInput('inputPayDay', 'payDay', true);
    bindInput('inputRemoteCount', 'remoteCount', true);
    bindInput('inputEtagCount', 'etagCount', true);
    bindInput('inputMechKeyCount', 'mechKeyCount', true);
    bindInput('inputRemoteDeposit', 'remoteDeposit', true);
    bindInput('selectEvChargePolicy', 'evChargePolicy');
    bindInput('inputEvRateNote', 'evRateNote');

    // 租用型態卡片切換
    document.querySelectorAll('[data-lease-mode]').forEach((card) => {
      card.addEventListener('click', () => {
        state.leaseMode = card.getAttribute('data-lease-mode');
        syncInputsFromState();
        renderPreview();
      });
    });

    // 車位類別卡片切換
    document.querySelectorAll('[data-space-type]').forEach((card) => {
      card.addEventListener('click', () => {
        state.spaceType = card.getAttribute('data-space-type');
        syncInputsFromState();
        renderPreview();
      });
    });

    // 守則勾選
    const bindChk = (id, ruleKey) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        state.rules[ruleKey] = el.checked;
        renderPreview();
      });
    };
    bindChk('chkRuleRegisteredOnly', 'registeredOnly');
    bindChk('chkRuleNoClutter', 'noClutter');
    bindChk('chkRuleWithinLines', 'withinLines');
    bindChk('chkRuleMechSafety', 'mechSafety');
    bindChk('chkRuleOilLeakClean', 'oilLeakClean');
    bindChk('chkRuleCustodyDisclaimer', 'custodyDisclaimer');
    bindChk('chkRuleNoRemoteCopy', 'noRemoteCopy');

    // 車輛與車位照片上傳
    const uploadBox = document.getElementById('vehiclePhotoUploadBox');
    const fileInput = document.getElementById('inputVehiclePhoto');
    if (uploadBox && fileInput) {
      uploadBox.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handlePhotoUpload(e.target.files[0]);
        }
      });
    }

    // 快速範本按鈕
    const btnSampleFlat = document.getElementById('btnSampleFlat');
    if (btnSampleFlat) {
      btnSampleFlat.addEventListener('click', () => {
        Object.assign(state, {
          leaseMode: 'bundled',
          communityName: '港居仰森高質感住宅大樓',
          propertyAddress: '高雄市小港區中安路 825 號 10 樓 A 室',
          leaseCode: 'GJ-202611-PK01',
          tenantName: '陳冠宇',
          tenantId: 'E128976543',
          tenantPhone: '0928-668-168',
          tenantUnit: 'A 棟 10 樓 A 室',
          spaceType: 'flat',
          carSpaceFloor: '地下二樓 (B2)',
          carSpaceNo: 'B2-088 號',
          scooterSpaceNo: 'B1-機062 號',
          carPlate: 'BGH-8899',
          carModelColor: 'Tesla Model 3 (珍珠白)',
          scooterPlate: 'NPB-6677',
          scooterModel: 'Gogoro VIVA MIX (石墨灰)',
          monthlyRent: 3200,
          cleaningFeeMode: 'tenant',
          cleaningFeeAmount: 400,
          remoteCount: 1,
          etagCount: 1,
          mechKeyCount: 0,
          remoteDeposit: 1000,
          evChargePolicy: 'existing_meter',
          evRateNote: '依獨立分表度數×台電當期每度平均電價據實結算'
        });
        syncInputsFromState();
        renderPreview();
      });
    }

    const btnSampleMech = document.getElementById('btnSampleMech');
    if (btnSampleMech) {
      btnSampleMech.addEventListener('click', () => {
        Object.assign(state, {
          leaseMode: 'standalone',
          communityName: '港居灣景星鑽大樓',
          propertyAddress: '高雄市前鎮區中山二路 268 號 15 樓 B 室',
          leaseCode: 'GJ-202611-MECH02',
          tenantName: '張雅婷',
          tenantId: 'E225678901',
          tenantPhone: '0958-321-999',
          tenantUnit: 'B 棟 8 樓之 3（同社區住戶單租）',
          spaceType: 'mech_ramp',
          carSpaceFloor: '地下三樓 (B3)',
          carSpaceNo: 'B3-112 號（機械下層平移）',
          scooterSpaceNo: '無附隨機車位',
          mechLimitLength: 495,
          mechLimitWidth: 185,
          mechLimitHeight: 155,
          mechLimitWeight: 1800,
          carPlate: 'BLT-5566',
          carModelColor: 'Toyota Altis (星河銀)',
          scooterPlate: '無',
          scooterModel: '無',
          monthlyRent: 2200,
          cleaningFeeMode: 'tenant',
          cleaningFeeAmount: 500,
          remoteCount: 1,
          etagCount: 1,
          mechKeyCount: 1,
          remoteDeposit: 1200,
          evChargePolicy: 'none',
          evRateNote: '機械車位嚴禁裝設充電樁與私接電源'
        });
        syncInputsFromState();
        renderPreview();
      });
    }

    const btnResetForm = document.getElementById('btnResetForm');
    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        Object.assign(state, {
          tenantName: '',
          tenantId: '',
          tenantPhone: '',
          carPlate: '',
          carModelColor: '',
          scooterPlate: '',
          scooterModel: '',
          vehiclePhotoUrl: ''
        });
        if (padTenant) padTenant.clear();
        if (padLandlord) padLandlord.clear();
        syncInputsFromState();
        renderPreview();
      });
    }

    // 三大輸出按鈕
    const btnPrint = document.getElementById('btnPrintDoc');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    const btnCanvas = document.getElementById('btnDownloadCanvas');
    if (btnCanvas) {
      btnCanvas.addEventListener('click', downloadCanvasCard);
    }

    const btnLine = document.getElementById('btnCopyLine');
    if (btnLine) {
      btnLine.addEventListener('click', copyLineSummary);
    }
  }

  // --- 啟動初始化 ---
  initSignaturePads();
  syncInputsFromState();
  bindFormEvents();
  renderPreview();
});
