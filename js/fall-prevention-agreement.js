/**
 * 港居不動產開發有限公司 — 住宅租賃陽台窗戶防墜安全與隱形鐵窗特約切結書產生器
 * 檔案：js/fall-prevention-agreement.js
 * 法規依據：《公寓大廈管理條例》第8條第2項、《公寓大廈防墜設施設置原則》、《兒少法》第43/51條、《民法》第431/432/184/191條
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ganju_fall_prevention_draft_v1';

  /**
   * 阿拉伯數字轉繁體中文金融大寫金額
   */
  function numberToTaiwanCurrency(num) {
    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return '零元整';

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億', '兆'];

    let str = String(n);
    let result = '';
    let zeroFlag = false;
    let groupCount = Math.ceil(str.length / 4);

    for (let g = 0; g < groupCount; g++) {
      let start = Math.max(0, str.length - (groupCount - g) * 4);
      let end = str.length - (groupCount - g - 1) * 4;
      let groupStr = str.slice(start, end);
      let groupVal = parseInt(groupStr, 10);

      if (groupVal === 0) {
        zeroFlag = true;
        continue;
      }

      let groupRes = '';
      for (let i = 0; i < groupStr.length; i++) {
        let d = parseInt(groupStr[i], 10);
        let pos = groupStr.length - 1 - i;
        if (d === 0) {
          zeroFlag = true;
        } else {
          if (zeroFlag && (result !== '' || groupRes !== '')) {
            groupRes += '零';
          }
          groupRes += digits[d] + units[pos];
          zeroFlag = false;
        }
      }
      result += groupRes + bigUnits[groupCount - 1 - g];
      zeroFlag = false;
    }

    return result + '元整';
  }

  function formatNumber(n) {
    const val = Math.floor(Math.abs(Number(n) || 0));
    return val.toLocaleString('zh-TW');
  }

  /**
   * Retina 2x 高靈敏電子手寫簽名板
   */
  class SignaturePad {
    constructor(canvasId, placeholderId, onUpdate) {
      this.canvas = document.getElementById(canvasId);
      this.placeholder = document.getElementById(placeholderId);
      this.onUpdate = onUpdate || function () {};
      this.isDrawing = false;
      this.hasSignature = false;

      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.initCanvas();
      this.bindEvents();
    }

    initCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const w = rect.width || 300;
      const h = rect.height || 130;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.scale(dpr, dpr);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineWidth = 2.4;
      this.ctx.strokeStyle = '#0f2341';
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
        if (!this.hasSignature) {
          this.hasSignature = true;
          if (this.placeholder) this.placeholder.style.display = 'none';
        }
      };

      const end = () => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();
        this.onUpdate();
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width || 600, rect.height || 300);
      this.hasSignature = false;
      if (this.placeholder) this.placeholder.style.display = 'flex';
      this.onUpdate();
    }

    toDataURL() {
      return this.hasSignature ? this.canvas.toDataURL('image/png') : '';
    }
  }

  const MODE_META = {
    mode_a: {
      title: '模式 A：屋況既有防墜設施交屋保管模式（定期檢視鋼索與逃生鉗）',
      desc: '本建物起租時已配備合格隱形鐵窗／防墜安全窗扣，承租人負定期檢視鋼索張力、鎖扣完好與火警逃生鉗定點保管義務；退租時應完整點交返還，如有人為剪斷或損壞應照價賠償。',
      shortLabel: '模式A：既有防墜設施交屋保管'
    },
    mode_b: {
      title: '模式 B：承租人自費增設隱形鐵窗（退租無償留歸免拆除模式）',
      desc: '因承租人家庭有 12 歲以下兒童、65 歲以上長者或特約寵物防護需求，出租人同意承租人依《公寓大廈管理條例》第 8 條第 2 項自費聘請合格廠商安裝不突出外牆滴水線之隱形鐵窗；退租時無償留歸出租人所有（免拆除以保護外牆防水層），承租人並自願拋棄《民法》第 431 條有益費用償還請求權。',
      shortLabel: '模式B：自費增設退租無償留歸'
    },
    mode_c: {
      title: '模式 C：承租人自費增設防墜設施（退租自費拆除填補防水模式）',
      desc: '承租人自費增設之防墜網或安全限制器，應於租賃期滿或提前終止返還房屋前，由承租人自費聘請專業廠商拆卸移除，並以建築級高耐候防水矽利康填補鑽孔、批土粉刷回復原狀。',
      shortLabel: '模式C：自費增設退租拆除復原'
    }
  };

  let sigLandlord = null;
  let sigTenant = null;

  function getVal(id, fallback = '') {
    const el = document.getElementById(id);
    return el ? el.value.trim() : fallback;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getSelectedMode() {
    const checked = document.querySelector('input[name="fallMode"]:checked');
    return checked ? checked.value : 'mode_a';
  }

  function updateModeCardUI() {
    const mode = getSelectedMode();
    document.querySelectorAll('.fall-mode-card').forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && radio.value === mode) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  /**
   * 同步更新右側 A4 預覽
   */
  function syncPreview() {
    updateModeCardUI();

    const docNo = getVal('docNo', 'GJ-FALL-20261027-01');
    const signDate = getVal('signDate', '2026-10-27');
    const propAddr = getVal('propAddr', '高雄市小港區中安路 825 號 11 樓之 2');
    const floorProtected = getVal('floorProtected', '11樓／家有 5 歲幼童與高齡長者');
    const landlordName = getVal('landlordName', '港居不動產開發有限公司（代理：陳俊銘）');
    const landlordId = getVal('landlordId', '96797997');
    const landlordPhone = getVal('landlordPhone', '0968-863-880');
    const tenantName = getVal('tenantName', '林品言');
    const tenantId = getVal('tenantId', 'E224681357');
    const tenantPhone = getVal('tenantPhone', '0928-668-512');
    const equipSpec = getVal(
      'equipSpec',
      '前陽台及主臥窗戶：316不鏽鋼隱形鐵窗（鋼索間距5cm，不突出外牆滴水線）；次臥氣密窗：兒童安全開口限制器（限制開度≤10cm）；附火警逃生專用鋼絲剪 2 把掛置於陽台門側高處。'
    );
    const repairDepositNum = Math.max(0, parseInt(getVal('repairDeposit', '12000'), 10) || 0);
    const repairDepositCn = numberToTaiwanCurrency(repairDepositNum);
    const specialNote = getVal(
      'specialNote',
      '承租人承諾陽台女兒牆與窗台內側 80 公分內絕不擺設桌椅、矮櫃或堆置紙箱供幼童攀爬，逃生鋼絲剪固定掛置於陽台落地門高處備用。'
    );

    setText('repairDepositCnPreview', `大寫：新臺幣${repairDepositCn}`);

    setText('pvDocNo', docNo);
    setText('pvSignDate', signDate);
    setText('pvPropAddr', propAddr);
    setText('pvFloorProtected', floorProtected);
    setText('pvLandlordName', `${landlordName}（統編/證號：${landlordId}｜電話：${landlordPhone}）`);
    setText('pvTenantName', `${tenantName}（身分證號：${tenantId}｜電話：${tenantPhone}）`);
    setText('pvEquipSpec', equipSpec);
    setText('pvRepairDeposit', `新臺幣 ${formatNumber(repairDepositNum)} 元整（${repairDepositCn}）`);
    setText('pvRepairDepositInline', `新臺幣 ${formatNumber(repairDepositNum)} 元整（大寫：${repairDepositCn}）`);
    setText('pvSpecialNote', specialNote);

    const mode = getSelectedMode();
    const meta = MODE_META[mode] || MODE_META.mode_a;
    setText('pvModeTitle', meta.title);
    setText('pvModeDesc', meta.desc);

    // 計算勾選數
    let checkedCount = 0;
    for (let i = 1; i <= 6; i++) {
      const cb = document.getElementById(`fall_c${i}`);
      const li = document.getElementById(`pv_clause_${i}`);
      if (cb && cb.checked) {
        checkedCount++;
        if (li) li.style.opacity = '1';
      } else if (li) {
        li.style.opacity = '0.45';
      }
    }
    setText('checkedCountBadge', `已核取 ${checkedCount} / 6 項核心防墜義務`);

    // 簽章區同步
    setText('pvSigLandlordMeta', `姓名/名稱：${landlordName}\n電話：${landlordPhone}`);
    setText('pvSigTenantMeta', `姓名：${tenantName}（${tenantId}）\n電話：${tenantPhone}`);

    if (sigLandlord) {
      const boxL = document.getElementById('pvSigLandlordBox');
      const dataL = sigLandlord.toDataURL();
      if (boxL) {
        boxL.innerHTML = dataL
          ? `<img src="${dataL}" alt="出租人簽章">`
          : '<span class="a4-sig-empty">（出租人／代管方簽章處）</span>';
      }
    }

    if (sigTenant) {
      const boxT = document.getElementById('pvSigTenantBox');
      const dataT = sigTenant.toDataURL();
      if (boxT) {
        boxT.innerHTML = dataT
          ? `<img src="${dataT}" alt="承租人簽章">`
          : '<span class="a4-sig-empty">（承租人／立切結書人親簽處）</span>';
      }
    }

    saveDraft();
  }

  function saveDraft() {
    try {
      const data = {
        docNo: getVal('docNo'),
        signDate: getVal('signDate'),
        propAddr: getVal('propAddr'),
        floorProtected: getVal('floorProtected'),
        landlordName: getVal('landlordName'),
        landlordId: getVal('landlordId'),
        landlordPhone: getVal('landlordPhone'),
        tenantName: getVal('tenantName'),
        tenantId: getVal('tenantId'),
        tenantPhone: getVal('tenantPhone'),
        fallMode: getSelectedMode(),
        equipSpec: getVal('equipSpec'),
        repairDeposit: getVal('repairDeposit'),
        specialNote: getVal('specialNote'),
        clauses: [1, 2, 3, 4, 5, 6].map((i) => {
          const cb = document.getElementById(`fall_c${i}`);
          return cb ? cb.checked : true;
        })
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const fields = [
        'docNo',
        'signDate',
        'propAddr',
        'floorProtected',
        'landlordName',
        'landlordId',
        'landlordPhone',
        'tenantName',
        'tenantId',
        'tenantPhone',
        'equipSpec',
        'repairDeposit',
        'specialNote'
      ];
      fields.forEach((f) => {
        if (data[f] !== undefined && document.getElementById(f)) {
          document.getElementById(f).value = data[f];
        }
      });
      if (data.fallMode) {
        const r = document.querySelector(`input[name="fallMode"][value="${data.fallMode}"]`);
        if (r) r.checked = true;
      }
      if (Array.isArray(data.clauses)) {
        data.clauses.forEach((val, idx) => {
          const cb = document.getElementById(`fall_c${idx + 1}`);
          if (cb) cb.checked = Boolean(val);
        });
      }
    } catch (e) {
      // ignore
    }
  }

  function applyPreset(type) {
    if (type === 'child_grille') {
      document.querySelector('input[name="fallMode"][value="mode_b"]').checked = true;
      document.getElementById('floorProtected').value = '11樓高樓層／家有 12 歲以下學齡前幼童';
      document.getElementById('equipSpec').value =
        '前陽台及客廳落地窗：316不鏽鋼隱形鐵窗（鋼索間距5cm，緊貼外牆內側不突出滴水線）；主次臥氣密窗：兒童安全開口限制器（開度≤10cm）；附火警逃生鋼絲剪 2 把掛置於陽台門側高處。';
      document.getElementById('repairDeposit').value = '12000';
      document.getElementById('specialNote').value =
        '依《公寓大廈管理條例》第8條第2項合法設置，退租時無償留歸出租人免拆，以維持外牆防水完整；窗邊80cm內嚴禁擺放桌椅供幼童攀爬。';
    } else if (type === 'existing_keep') {
      document.querySelector('input[name="fallMode"][value="mode_a"]').checked = true;
      document.getElementById('floorProtected').value = '8樓集合住宅／一般家庭與長輩同住';
      document.getElementById('equipSpec').value =
        '房屋起租既有配備：前後陽台隱形鐵窗全組、全室氣密窗安全防墜鎖扣 4 組、專用火警逃生鋼絲剪 1 把（掛置於客廳電視櫃側牆）。';
      document.getElementById('repairDeposit').value = '10000';
      document.getElementById('specialNote').value =
        '承租人應定期檢查鋼索張力與鎖扣功能，嚴禁私自剪斷鋼索或遺失逃生鉗；退租時應完整點交返還。';
    } else if (type === 'pet_mesh') {
      document.querySelector('input[name="fallMode"][value="mode_c"]').checked = true;
      document.getElementById('floorProtected').value = '14樓景觀戶／特約飼養家貓防墜保護';
      document.getElementById('equipSpec').value =
        '工作陽台與臥室窗扇：高強度耐候防貓墜落防護網及安全窗扣（以不鏽鋼束帶與微孔固定，不突出外牆滴水線），附緊急逃生剪具 1 把。';
      document.getElementById('repairDeposit').value = '15000';
      document.getElementById('specialNote').value =
        '承租人於退租返還房屋前，應自費拆除防貓網並以建築級防水矽利康填補孔洞回復原狀，若未拆除或造成滲水同意由押金扣抵。';
    }
    syncPreview();
    if (window.showToast) {
      window.showToast('已套用防墜安全情境範本！', 'success');
    }
  }

  /**
   * 繪製並下載 840x1180px 高畫質 Canvas 存證圖卡
   */
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1180;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 840, 1180);

    // 頂部深海藍橫幅
    const grad = ctx.createLinearGradient(0, 0, 840, 130);
    grad.addColorStop(0, '#0f2341');
    grad.addColorStop(0.55, '#115e59');
    grad.addColorStop(1, '#1a365d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 840, 135);

    ctx.fillStyle = '#5eead4';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('港居不動產開發有限公司｜包租代管高空安全法務憑證 (統編：96797997)', 36, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('住宅租賃陽台窗戶防墜安全與隱形鐵窗特約切結書', 36, 82);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      `單據編號：${getVal('docNo')}   ｜   立約日期：${getVal('signDate')}   ｜   公寓大廈管理條例第8條第2項合規`,
      36,
      114
    );

    // 基本資料卡片
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.fillRect(32, 155, 776, 195);
    ctx.strokeRect(32, 155, 776, 195);

    ctx.fillStyle = '#0f2341';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('一、租賃標的與當事人基本資料', 48, 185);

    ctx.fillStyle = '#334155';
    ctx.font = '14.5px sans-serif';
    ctx.fillText(`• 租賃標的物地址：${getVal('propAddr')}`, 48, 215);
    ctx.fillText(`• 樓層與防護對象：${getVal('floorProtected')}`, 48, 243);
    ctx.fillText(`• 出租人／代管業：${getVal('landlordName')}（證號/統編：${getVal('landlordId')}｜電話：${getVal('landlordPhone')}）`, 48, 271);
    ctx.fillText(`• 承租人／切結人：${getVal('tenantName')}（身分證號：${getVal('tenantId')}｜電話：${getVal('tenantPhone')}）`, 48, 299);

    const repairNum = Math.max(0, parseInt(getVal('repairDeposit', '12000'), 10) || 0);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 14.5px sans-serif';
    ctx.fillText(
      `• 防水損壞與復原賠償基準：新臺幣 ${formatNumber(repairNum)} 元整（${numberToTaiwanCurrency(repairNum)}）`,
      48,
      329
    );

    // 特約模式區塊
    const mode = getSelectedMode();
    const meta = MODE_META[mode] || MODE_META.mode_a;
    ctx.fillStyle = '#f0fdfa';
    ctx.strokeStyle = '#0d9488';
    ctx.fillRect(32, 368, 776, 115);
    ctx.strokeRect(32, 368, 776, 115);

    ctx.fillStyle = '#115e59';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`二、選定防墜設施處置模式：${meta.title}`, 48, 398);

    ctx.fillStyle = '#0f766e';
    ctx.font = '13.5px sans-serif';
    const specShort = getVal('equipSpec').slice(0, 95);
    ctx.fillText(`• 設施規格與區域：${specShort}`, 48, 428);
    const noteShort = getVal('specialNote').slice(0, 95);
    ctx.fillText(`• 特約備註事項：${noteShort}`, 48, 458);

    // 六大防墜安全規範
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillRect(32, 500, 776, 380);
    ctx.strokeRect(32, 500, 776, 380);

    ctx.fillStyle = '#0f2341';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('三、六大防墜安全與高空防護自律規範（承租人承諾恪遵）', 48, 532);

    const rules = [
      '1. 合規安裝與外牆防水層保護：隱形鐵窗緊貼外牆內側不突出滴水線，鑽孔處注入防水矽利康防漏。',
      '2. 窗邊與陽台禁擺可攀爬家具：窗台及陽台女兒牆內側 80cm 內嚴禁擺放沙發、椅子、矮櫃或紙箱。',
      '3. 兒童安全窗扣鎖定與照護義務：開口限制器維持安全開度（≤10cm），絕不讓幼童獨處於屋內或陽台。',
      '4. 火警逃生鋼絲剪定點懸掛保管：逃生鋼絲剪固定懸掛於室內窗邊高處，確保火警時 3 秒剪斷鋼索逃生。',
      '5. 嚴禁高空拋物與女兒牆頂置放物品：嚴禁於女兒牆頂或冷氣室外機置放盆栽雜物，墜落傷人自負民刑全責。',
      '6. 人身安全注意與出租人免責切結：因未鎖窗扣、放任攀爬或私拆設施致墜落意外，出租人免除民刑事責任。'
    ];

    ctx.font = '14px sans-serif';
    rules.forEach((line, idx) => {
      const cb = document.getElementById(`fall_c${idx + 1}`);
      const isChecked = cb ? cb.checked : true;
      ctx.fillStyle = isChecked ? '#0f766e' : '#94a3b8';
      ctx.fillText(isChecked ? `☑ ${line}` : `☐ ${line}`, 48, 570 + idx * 50);
    });

    // 簽章區
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillRect(32, 900, 376, 210);
    ctx.strokeRect(32, 900, 376, 210);
    ctx.fillRect(432, 900, 376, 210);
    ctx.strokeRect(432, 900, 376, 210);

    ctx.fillStyle = '#0f2341';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('出租人／受託代管業簽章', 48, 930);
    ctx.fillText('承租人／立切結書人親簽', 448, 930);

    ctx.fillStyle = '#475569';
    ctx.font = '13px sans-serif';
    ctx.fillText(getVal('landlordName'), 48, 954);
    ctx.fillText(`${getVal('tenantName')}（${getVal('tenantId')}）`, 448, 954);

    if (sigLandlord && sigLandlord.hasSignature) {
      ctx.drawImage(sigLandlord.canvas, 48, 968, 340, 125);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('（未手寫簽名，可列印後親簽）', 110, 1035);
    }

    if (sigTenant && sigTenant.hasSignature) {
      ctx.drawImage(sigTenant.canvas, 448, 968, 340, 125);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('（未手寫簽名，可列印後親簽）', 510, 1035);
    }

    // 底部法律聲明
    ctx.fillStyle = '#64748b';
    ctx.font = '12.5px sans-serif';
    ctx.fillText(
      '港居不動產開發有限公司｜(113)高市租登字第0012號｜本切結書於瀏覽器本地端產製，零雲端上傳保障個資安全。',
      95,
      1148
    );

    const link = document.createElement('a');
    link.download = `港居_陽台窗戶防墜安全切結書_${getVal('tenantName', '承租人')}_${getVal('signDate')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (window.showToast) {
      window.showToast('已下載高畫質防墜安全切結書存證圖卡！', 'success');
    }
  }

  /**
   * 複製 LINE 格式化切結摘要
   */
  function copyLineText() {
    const mode = getSelectedMode();
    const meta = MODE_META[mode] || MODE_META.mode_a;
    const repairNum = Math.max(0, parseInt(getVal('repairDeposit', '12000'), 10) || 0);

    const text = [
      '🛡️【港居不動產｜住宅租賃陽台窗戶防墜安全與隱形鐵窗特約切結摘要】',
      `📄 單據編號：${getVal('docNo')}`,
      `📅 立約日期：${getVal('signDate')}`,
      `🏠 租賃地址：${getVal('propAddr')}`,
      `👶 樓層與防護對象：${getVal('floorProtected')}`,
      `👤 承租立書人：${getVal('tenantName')}（${getVal('tenantPhone')}）`,
      `📌 處置模式：${meta.shortLabel}`,
      `🔧 防墜設施規格：${getVal('equipSpec')}`,
      `💰 防水損壞與復原賠償基準：NT$ ${formatNumber(repairNum)} 元整（${numberToTaiwanCurrency(repairNum)}）`,
      '✅ 核心防墜安全承諾：',
      '1️⃣ 隱形鐵窗緊貼外牆內側不突出滴水線，鑽孔做好防水矽利康。',
      '2️⃣ 窗邊及陽台女兒牆內側 80cm 內嚴禁擺放沙發、椅子或矮櫃供攀爬。',
      '3️⃣ 安全窗扣維持安全開度（≤10cm），絕不讓幼童獨處於屋內或陽台。',
      '4️⃣ 火警逃生鋼絲剪固定懸掛於窗邊高處，確保緊急時 3 秒剪斷逃生。',
      '5️⃣ 嚴禁高空拋物或於女兒牆頂置放盆栽雜物。',
      '🏢 港居不動產開發有限公司｜07-791-2288 / 0968-863-880'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.showToast) window.showToast('已複製 LINE 防墜安全切結摘要！', 'success');
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (window.showToast) window.showToast('已複製 LINE 防墜安全切結摘要！', 'success');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('signDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = today;
    }

    loadDraft();

    sigLandlord = new SignaturePad('sigCanvasLandlord', 'sigPlaceholderLandlord', syncPreview);
    sigTenant = new SignaturePad('sigCanvasTenant', 'sigPlaceholderTenant', syncPreview);

    document.querySelectorAll('.fall-form-panel input, .fall-form-panel textarea, .fall-form-panel select').forEach((el) => {
      el.addEventListener('input', syncPreview);
      el.addEventListener('change', syncPreview);
    });

    const btnClearL = document.getElementById('btnClearSigLandlord');
    if (btnClearL) btnClearL.addEventListener('click', () => sigLandlord.clear());

    const btnClearT = document.getElementById('btnClearSigTenant');
    if (btnClearT) btnClearT.addEventListener('click', () => sigTenant.clear());

    document.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.getAttribute('data-preset')));
    });

    const btnPrint = document.getElementById('btnPrintA4');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    const btnPrintTop = document.getElementById('btnPrintTop');
    if (btnPrintTop) btnPrintTop.addEventListener('click', () => window.print());

    const btnDownloadCard = document.getElementById('btnDownloadCard');
    if (btnDownloadCard) btnDownloadCard.addEventListener('click', downloadCanvasCard);

    const btnCopyLine = document.getElementById('btnCopyLine');
    if (btnCopyLine) btnCopyLine.addEventListener('click', copyLineText);

    const btnResetForm = document.getElementById('btnResetForm');
    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      });
    }

    syncPreview();
  });
})();
