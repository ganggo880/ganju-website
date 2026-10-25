/**
 * 港居不動產 住宅租賃委託管理（包租／代管）契約書線上產生器核心邏輯
 * 檔案名稱：js/mandate-contract.js
 * 
 * 功能亮點：
 * 1. 雙模式自由切換（委託代管 10% 服務費 vs 保證包租二房東模式）
 * 2. 內政部定型化契約應記載及不得記載事項標準合規
 * 3. 六大受託管理權限動態授權（含 $5,000 元快速免報備修繕代墊條款）
 * 4. 金融繁體中文大寫金額自動轉換
 * 5. 雙畫布 Retina 2x 高靈敏電子手寫簽章與 A4 排版即時連動
 * 6. HTML5 Canvas 840×1080px 高畫質圖卡匯出 ＋ LINE 速報一鍵複製
 */

(function () {
  'use strict';

  // 1. 港居不動產官方特許業者法定資料
  const GANJU_INFO = {
    companyName: '港居不動產開發有限公司',
    taxId: '96797997',
    licenseNo: '(113)高市租登字第0012號',
    guaranteeNo: '高市租管保字第112003號',
    managerName: '陳俊銘',
    managerCertNo: '(112)登字第013739號',
    address: '高雄市小港區中安路825號',
    tel: '07-791-2288',
    mobile: '0968-863-880'
  };

  // 2. 金融繁體中文大寫金額轉換
  function toChineseCurrency(num) {
    if (!num || isNaN(num) || num <= 0) return '零元整';
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟', '萬', '拾', '佰', '仟', '億'];
    let strNum = Math.floor(num).toString();
    if (strNum.length > 9) return num.toLocaleString() + ' 元整';

    let result = '';
    let len = strNum.length;
    let prevZero = false;

    for (let i = 0; i < len; i++) {
      let n = parseInt(strNum[i], 10);
      let unitIndex = len - 1 - i;

      if (n !== 0) {
        if (prevZero) {
          result += '零';
          prevZero = false;
        }
        result += digits[n] + units[unitIndex];
      } else {
        if (unitIndex === 4 && result.length > 0) {
          result += '萬';
        }
        prevZero = true;
      }
    }

    return '新臺幣 ' + result + '元整';
  }

  // 3. 狀態管理 State
  let currentMode = 'management'; // 'management' (代管) 或 'masterlease' (包租)
  let ownerSignaturePad = null;
  let ganjuSignaturePad = null;

  // DOM 元素快取
  const dom = {};

  function cacheDom() {
    dom.tabManagement = document.getElementById('tab-mode-mgmt');
    dom.tabMasterLease = document.getElementById('tab-mode-master');

    // 委託人
    dom.ownerName = document.getElementById('input-owner-name');
    dom.ownerId = document.getElementById('input-owner-id');
    dom.ownerPhone = document.getElementById('input-owner-phone');
    dom.ownerAddress = document.getElementById('input-owner-address');

    // 租賃標的
    dom.propAddress = document.getElementById('input-prop-address');
    dom.propBuildingId = document.getElementById('input-prop-bld-id');
    dom.propLayout = document.getElementById('input-prop-layout');

    // 費用與撥款
    dom.monthlyRent = document.getElementById('input-monthly-rent');
    dom.feeRate = document.getElementById('input-fee-rate');
    dom.payoutDay = document.getElementById('input-payout-day');
    dom.bankName = document.getElementById('input-bank-name');
    dom.bankBranch = document.getElementById('input-bank-branch');
    dom.bankAccount = document.getElementById('input-bank-account');
    dom.bankOwner = document.getElementById('input-bank-owner');

    // 委託期限與修繕授權
    dom.mandateYears = document.getElementById('input-mandate-years');
    dom.startDate = document.getElementById('input-start-date');
    dom.repairAuthCap = document.getElementById('input-repair-auth-cap');

    // 權限核取項
    dom.checkScreening = document.getElementById('check-perm-screening');
    dom.checkCheckin = document.getElementById('check-perm-checkin');
    dom.checkRentCollect = document.getElementById('check-perm-rent');
    dom.checkRepair = document.getElementById('check-perm-repair');
    dom.checkInspection = document.getElementById('check-perm-inspection');
    dom.checkDispute = document.getElementById('check-perm-dispute');

    // KPI 顯示
    dom.kpiRent = document.getElementById('val-kpi-rent');
    dom.kpiFee = document.getElementById('val-kpi-fee');
    dom.kpiPayout = document.getElementById('val-kpi-payout');
    dom.kpiFeeLabel = document.getElementById('lbl-kpi-fee');
    dom.kpiPayoutLabel = document.getElementById('lbl-kpi-payout');

    // 紙張合約預覽元素
    dom.docContractTitle = document.getElementById('doc-contract-title');
    dom.docContractSub = document.getElementById('doc-contract-sub');
    dom.docOwnerName = document.getElementById('doc-owner-name');
    dom.docOwnerId = document.getElementById('doc-owner-id');
    dom.docOwnerPhone = document.getElementById('doc-owner-phone');
    dom.docOwnerAddress = document.getElementById('doc-owner-address');
    dom.docPropAddress = document.getElementById('doc-prop-address');
    dom.docPropDesc = document.getElementById('doc-prop-desc');
    dom.docPeriod = document.getElementById('doc-period');
    dom.docRent = document.getElementById('doc-rent');
    dom.docFee = document.getElementById('doc-fee');
    dom.docPayout = document.getElementById('doc-payout');
    dom.docRepairAuth = document.getElementById('doc-repair-auth');
    dom.docPermissionsList = document.getElementById('doc-permissions-list');
    dom.docSignDate = document.getElementById('doc-sign-date');

    // 簽名畫布
    dom.canvasOwner = document.getElementById('canvas-owner');
    dom.canvasGanju = document.getElementById('canvas-ganju');
    dom.btnClearOwner = document.getElementById('btn-clear-owner');
    dom.btnClearGanju = document.getElementById('btn-clear-ganju');
    dom.imgSigOwner = document.getElementById('doc-sig-owner-img');
    dom.imgSigGanju = document.getElementById('doc-sig-ganju-img');

    // 操作按鈕
    dom.btnPrint = document.getElementById('btn-print-contract');
    dom.btnDownload = document.getElementById('btn-download-card');
    dom.btnCopyLine = document.getElementById('btn-copy-line');
    dom.btnSaveDraft = document.getElementById('btn-save-draft');
    dom.btnLoadDraft = document.getElementById('btn-load-draft');
  }

  // 4. 高靈敏 Retina 2x 電子手寫簽章板
  class SignaturePad {
    constructor(canvas, onChange) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onChange = onChange;
      this.isDrawing = false;
      this.hasContent = false;
      this.initCanvas();
      this.bindEvents();
    }

    initCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
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
      };

      const draw = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.hasContent = true;
      };

      const stop = () => {
        if (this.isDrawing) {
          this.isDrawing = false;
          if (this.onChange) this.onChange(this.toDataURL());
        }
      };

      this.canvas.addEventListener('mousedown', start);
      this.canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stop);

      this.canvas.addEventListener('touchstart', start, { passive: false });
      this.canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stop);
    }

    clear() {
      const dpr = window.devicePixelRatio || 2;
      this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
      this.hasContent = false;
      if (this.onChange) this.onChange(null);
    }

    toDataURL() {
      if (!this.hasContent) return null;
      return this.canvas.toDataURL('image/png');
    }
  }

  // 5. 計算合約與即時連動
  function updateCalculations() {
    const rent = parseFloat(dom.monthlyRent.value) || 0;
    const feeRate = parseFloat(dom.feeRate.value) || 0;
    const authCap = parseFloat(dom.repairAuthCap.value) || 5000;
    const years = parseInt(dom.mandateYears.value, 10) || 1;
    const startDateVal = dom.startDate.value || new Date().toISOString().split('T')[0];

    // 計算起迄日
    const start = new Date(startDateVal);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + years);
    end.setDate(end.getDate() - 1);

    const fmtDate = (d) => `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
    const periodText = `自民國 ${start.getFullYear() - 1911} 年 ${start.getMonth() + 1} 月 ${start.getDate()} 日起，至民國 ${end.getFullYear() - 1911} 年 ${end.getMonth() + 1} 月 ${end.getDate()} 日止（共計 ${years} 年整）。`;

    let monthlyFee = 0;
    let netPayout = 0;

    if (currentMode === 'management') {
      // 委託代管模式
      monthlyFee = Math.round(rent * (feeRate / 100));
      netPayout = rent - monthlyFee;

      dom.kpiFeeLabel.textContent = `每月代管服務費 (${feeRate}%)`;
      dom.kpiPayoutLabel.textContent = '預估每月實匯屋主淨額';
      dom.kpiFee.textContent = `NT$ ${monthlyFee.toLocaleString()}`;
      dom.kpiPayout.textContent = `NT$ ${netPayout.toLocaleString()}`;

      dom.docContractTitle.textContent = '住宅租賃委託管理契約書';
      dom.docContractSub.textContent = '（符合內政部租賃住宅委託管理定型化契約範本與法規標準）';
      dom.docRent.textContent = `預定月租金 ${toChineseCurrency(rent)}（NT$ ${rent.toLocaleString()} 元/月）`;
      dom.docFee.textContent = `每月代管服務報酬按月租金 ${feeRate}% 計收，每月扣取 ${toChineseCurrency(monthlyFee)}（NT$ ${monthlyFee.toLocaleString()} 元）`;
      dom.docPayout.textContent = `受託人於每月 ${dom.payoutDay.value} 日前，將扣除代管費後之租金淨額 NT$ ${netPayout.toLocaleString()} 元匯入委託人指定之 ${dom.bankName.value} ${dom.bankBranch.value}（帳號：${dom.bankAccount.value}，戶名：${dom.bankOwner.value}）`;
    } else {
      // 保證包租模式
      monthlyFee = 0;
      netPayout = rent;

      dom.kpiFeeLabel.textContent = '屋主代管費負擔';
      dom.kpiPayoutLabel.textContent = '保證實拿包租租金';
      dom.kpiFee.textContent = 'NT$ 0 (港居全額承擔)';
      dom.kpiPayout.textContent = `NT$ ${netPayout.toLocaleString()}`;

      dom.docContractTitle.textContent = '租賃住宅包租合約書';
      dom.docContractSub.textContent = '（港居不動產直營保證承租・長期穩定現金流合約）';
      dom.docRent.textContent = `包租約定租金 ${toChineseCurrency(rent)}（NT$ ${rent.toLocaleString()} 元/月，無論空置皆由港居保證給付）`;
      dom.docFee.textContent = '包租期間所有招租、維運、代管成本及租客違約風險全數由港居不動產承擔，屋主免收任何代管手續費。';
      dom.docPayout.textContent = `港居不動產於每月 ${dom.payoutDay.value} 日前，固定撥付租金 NT$ ${netPayout.toLocaleString()} 元至屋主指定之 ${dom.bankName.value} ${dom.bankBranch.value}（帳號：${dom.bankAccount.value}，戶名：${dom.bankOwner.value}）`;
    }

    dom.kpiRent.textContent = `NT$ ${rent.toLocaleString()}`;

    // 更新基本資料
    dom.docOwnerName.textContent = dom.ownerName.value || '未填寫';
    dom.docOwnerId.textContent = dom.ownerId.value || '未填寫';
    dom.docOwnerPhone.textContent = dom.ownerPhone.value || '未填寫';
    dom.docOwnerAddress.textContent = dom.ownerAddress.value || '未填寫';

    dom.docPropAddress.textContent = dom.propAddress.value || '未填寫';
    dom.docPropDesc.textContent = `建號/門牌：${dom.propBuildingId.value || '依登記謄本'} ｜ 格局現況：${dom.propLayout.value || '整層住宅'}`;
    dom.docPeriod.textContent = periodText;
    dom.docRepairAuth.textContent = `單次新台幣 ${toChineseCurrency(authCap)}（NT$ ${authCap.toLocaleString()} 元）以下之突發急迫性修繕，受託人得先行代辦處理並於次期結算，超逾額度需報請委託人同意後施作。`;

    // 更新管理權限清單
    const perms = [];
    if (dom.checkScreening.checked) perms.push('優質租客招募、資格背景審查與租賃信用評鑑 (Tenant Screening)');
    if (dom.checkCheckin.checked) perms.push('住宅交付起租點交、設備現況存證清冊製作與退租點收交還 (Check-in/out)');
    if (dom.checkRentCollect.checked) perms.push('每月租金、水電瓦斯費用代收代繳與專戶明細撥轉 (Rent Collection)');
    if (dom.checkRepair.checked) perms.push(`附屬設備維修報價、廠商調度代辦（單次授權限額 NT$ ${authCap.toLocaleString()} 元）`);
    if (dom.checkInspection.checked) perms.push('定期屋況與消防安防設備巡查存證紀錄 (Safety Inspection)');
    if (dom.checkDispute.checked) perms.push('公寓大廈住戶公約監督、違約欠租存證信函催告與糾紛協調 (Legal Notice)');

    dom.docPermissionsList.innerHTML = perms.map((p, idx) => `<li><strong>(${idx + 1})</strong> ${p}</li>`).join('');

    // 簽署日期
    const today = new Date();
    dom.docSignDate.textContent = `中 華 民 國 ${today.getFullYear() - 1911} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  }

  // 6. 模式切換邏輯
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'management') {
      dom.tabManagement.classList.add('active');
      dom.tabMasterLease.classList.remove('active');
      dom.feeRate.disabled = false;
      dom.feeRate.value = '10';
    } else {
      dom.tabMasterLease.classList.add('active');
      dom.tabManagement.classList.remove('active');
      dom.feeRate.disabled = true;
      dom.feeRate.value = '0';
    }
    updateCalculations();
  }

  // 7. 本地草稿暫存與載入
  const DRAFT_KEY = 'ganju_mandate_draft_v1';

  function saveDraft() {
    const data = {
      mode: currentMode,
      ownerName: dom.ownerName.value,
      ownerId: dom.ownerId.value,
      ownerPhone: dom.ownerPhone.value,
      ownerAddress: dom.ownerAddress.value,
      propAddress: dom.propAddress.value,
      propBuildingId: dom.propBuildingId.value,
      propLayout: dom.propLayout.value,
      monthlyRent: dom.monthlyRent.value,
      feeRate: dom.feeRate.value,
      payoutDay: dom.payoutDay.value,
      bankName: dom.bankName.value,
      bankBranch: dom.bankBranch.value,
      bankAccount: dom.bankAccount.value,
      bankOwner: dom.bankOwner.value,
      mandateYears: dom.mandateYears.value,
      startDate: dom.startDate.value,
      repairAuthCap: dom.repairAuthCap.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    showToast('✅ 委託契約草稿已安全儲存於本機！');
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      showToast('⚠️ 尚無已儲存的草稿紀錄');
      return;
    }
    try {
      const data = JSON.parse(raw);
      setMode(data.mode || 'management');
      dom.ownerName.value = data.ownerName || '';
      dom.ownerId.value = data.ownerId || '';
      dom.ownerPhone.value = data.ownerPhone || '';
      dom.ownerAddress.value = data.ownerAddress || '';
      dom.propAddress.value = data.propAddress || '';
      dom.propBuildingId.value = data.propBuildingId || '';
      dom.propLayout.value = data.propLayout || '';
      dom.monthlyRent.value = data.monthlyRent || '25000';
      dom.feeRate.value = data.feeRate || '10';
      dom.payoutDay.value = data.payoutDay || '10';
      dom.bankName.value = data.bankName || '國泰世華銀行';
      dom.bankBranch.value = data.bankBranch || '小港分行';
      dom.bankAccount.value = data.bankAccount || '035-50-1234567';
      dom.bankOwner.value = data.bankOwner || '陳大明';
      dom.mandateYears.value = data.mandateYears || '2';
      dom.startDate.value = data.startDate || new Date().toISOString().split('T')[0];
      dom.repairAuthCap.value = data.repairAuthCap || '5000';

      updateCalculations();
      showToast('✅ 已成功讀取歷史草稿！');
    } catch (e) {
      showToast('❌ 讀取草稿失敗');
    }
  }

  // 8. LINE 委託摘要複製
  function copyLineSummary() {
    const rent = parseFloat(dom.monthlyRent.value) || 0;
    const modeText = currentMode === 'management' ? '【住宅委託代管方案】' : '【長期保證包租方案】';
    const text = `📋 港居不動產・${modeText} 委託契約摘要
━━━━━━━━━━━━━━━
🏠 委託標的：${dom.propAddress.value}
👤 委託業主：${dom.ownerName.value} 先生/小姐
💵 約定月租：NT$ ${rent.toLocaleString()} 元/月
💼 管理模式：${currentMode === 'management' ? `代管服務 (費率 ${dom.feeRate.value}%)` : '全額保證包租 (0代管費)'}
📅 委託期間：${dom.docPeriod.textContent}
🔧 修繕授權：單次 NT$ ${parseFloat(dom.repairAuthCap.value || 5000).toLocaleString()} 元免報備快速代辦
🏦 撥付帳戶：${dom.bankName.value}（${dom.bankAccount.value}）
━━━━━━━━━━━━━━━
特許受託機構：港居不動產開發有限公司
營業登記證號：(113)高市租登字第0012號
專案經理：陳俊銘 (0968-863-880)`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 LINE 委託摘要已成功複製！');
    }).catch(() => {
      showToast('❌ 複製失敗，請手動選取複製');
    });
  }

  // 9. Canvas 840×1080px 高畫質委託確認圖卡下載
  function downloadCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景底色
    ctx.fillStyle = '#0f1f38';
    ctx.fillRect(0, 0, 840, 1080);

    // 金色外框與裝飾
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 800, 1040);

    // 標題與品牌
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產開發有限公司 ｜ GANJU REAL ESTATE', 48, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px "Noto Sans TC", sans-serif';
    const title = currentMode === 'management' ? '住宅租賃委託管理合約確認卡' : '租賃住宅保證包租協議確認卡';
    ctx.fillText(title, 48, 120);

    // 白色資訊卡
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(48, 150, 744, 760, 12);
    ctx.fill();

    // 內文字體
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
    ctx.fillText('一、委託標的與業主資料', 72, 195);

    ctx.font = '17px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`• 委託物件地址：${dom.propAddress.value}`, 72, 235);
    ctx.fillText(`• 建物現況格局：${dom.propLayout.value}`, 72, 270);
    ctx.fillText(`• 委託業主姓名：${dom.ownerName.value}（身分證字號：${dom.ownerId.value}）`, 72, 305);
    ctx.fillText(`• 業主聯絡電話：${dom.ownerPhone.value}`, 72, 340);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
    ctx.fillText('二、費用方案與匯款撥付', 72, 395);

    ctx.font = '17px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';
    const rent = parseFloat(dom.monthlyRent.value) || 0;
    ctx.fillText(`• 約定月租金額：NT$ ${rent.toLocaleString()} 元/月`, 72, 435);
    ctx.fillText(`• 受託管理方案：${currentMode === 'management' ? `代管服務方案（每月代管費率 ${dom.feeRate.value}%）` : '保證包租方案（港居保證給付租金，免代管費）'}`, 72, 470);
    ctx.fillText(`• 每月撥款基準：每月 ${dom.payoutDay.value} 日前匯入指定帳戶`, 72, 505);
    ctx.fillText(`• 撥款銀行帳號：${dom.bankName.value} ${dom.bankBranch.value}（${dom.bankAccount.value}）`, 72, 540);
    ctx.fillText(`• 單次修繕授權：新台幣 NT$ ${parseFloat(dom.repairAuthCap.value || 5000).toLocaleString()} 元免報備快速處理`, 72, 575);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
    ctx.fillText('三、法定特許受託機構宣告', 72, 630);

    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`• 受託業者：${GANJU_INFO.companyName}（統編：${GANJU_INFO.taxId}）`, 72, 668);
    ctx.fillText(`• 特許登記證：${GANJU_INFO.licenseNo} ｜ 營業保證金：${GANJU_INFO.guaranteeNo}`, 72, 700);
    ctx.fillText(`• 專業租賃住宅管理人員：${GANJU_INFO.managerName}（${GANJU_INFO.managerCertNo}）`, 72, 732);
    ctx.fillText(`• 營業處所：${GANJU_INFO.address} ｜ 專員專線：${GANJU_INFO.mobile}`, 72, 764);

    // 簽章縮圖區域
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(72, 790, 696, 100);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(72, 790, 696, 100);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('【委託人（屋主）親簽】：', 90, 835);
    ctx.fillText('【受託人（港居專業人員）】：', 440, 835);

    const ownerSigData = ownerSignaturePad ? ownerSignaturePad.toDataURL() : null;
    const ganjuSigData = ganjuSignaturePad ? ganjuSignaturePad.toDataURL() : null;

    let loaded = 0;
    const finish = () => {
      // 底部浮水印與版權
      ctx.fillStyle = '#ffd27d';
      ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
      ctx.fillText('合法合規包租代管・高質感住宅物業資產首選・港居不動產', 180, 960);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Noto Sans TC", sans-serif';
      ctx.fillText('本契約書依據內政部《租賃住宅委託管理定型化契約應記載及不得記載事項》合法產製', 160, 990);

      const link = document.createElement('a');
      link.download = `港居租賃委託契約憑證_${dom.ownerName.value || '屋主'}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('📥 委託契約高畫質圖卡下載成功！');
    };

    if (ownerSigData) {
      const img1 = new Image();
      img1.onload = () => {
        ctx.drawImage(img1, 260, 800, 140, 80);
        loaded++;
        if (loaded >= (ganjuSigData ? 2 : 1)) finish();
      };
      img1.src = ownerSigData;
    }

    if (ganjuSigData) {
      const img2 = new Image();
      img2.onload = () => {
        ctx.drawImage(img2, 630, 800, 140, 80);
        loaded++;
        if (loaded >= (ownerSigData ? 2 : 1)) finish();
      };
      img2.src = ganjuSigData;
    }

    if (!ownerSigData && !ganjuSigData) {
      finish();
    }
  }

  // 10. 顯示 Toast
  function showToast(msg) {
    let toast = document.getElementById('ganju-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ganju-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(15, 23, 42, 0.95);
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 0.92rem;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 999999;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2800);
  }

  // 11. 初始化流程
  function init() {
    cacheDom();

    // 初始化簽章板
    if (dom.canvasOwner) {
      ownerSignaturePad = new SignaturePad(dom.canvasOwner, (dataUrl) => {
        if (dom.imgSigOwner) {
          if (dataUrl) {
            dom.imgSigOwner.src = dataUrl;
            dom.imgSigOwner.hidden = false;
          } else {
            dom.imgSigOwner.hidden = true;
          }
        }
      });
    }

    if (dom.canvasGanju) {
      ganjuSignaturePad = new SignaturePad(dom.canvasGanju, (dataUrl) => {
        if (dom.imgSigGanju) {
          if (dataUrl) {
            dom.imgSigGanju.src = dataUrl;
            dom.imgSigGanju.hidden = false;
          } else {
            dom.imgSigGanju.hidden = true;
          }
        }
      });
    }

    if (dom.btnClearOwner) {
      dom.btnClearOwner.addEventListener('click', () => ownerSignaturePad.clear());
    }
    if (dom.btnClearGanju) {
      dom.btnClearGanju.addEventListener('click', () => ganjuSignaturePad.clear());
    }

    // 模式切換按鈕事件
    if (dom.tabManagement) {
      dom.tabManagement.addEventListener('click', () => setMode('management'));
    }
    if (dom.tabMasterLease) {
      dom.tabMasterLease.addEventListener('click', () => setMode('masterlease'));
    }

    // 表單輸入即時連動
    const watchInputs = [
      dom.ownerName, dom.ownerId, dom.ownerPhone, dom.ownerAddress,
      dom.propAddress, dom.propBuildingId, dom.propLayout,
      dom.monthlyRent, dom.feeRate, dom.payoutDay,
      dom.bankName, dom.bankBranch, dom.bankAccount, dom.bankOwner,
      dom.mandateYears, dom.startDate, dom.repairAuthCap,
      dom.checkScreening, dom.checkCheckin, dom.checkRentCollect,
      dom.checkRepair, dom.checkInspection, dom.checkDispute
    ];

    watchInputs.forEach((el) => {
      if (el) {
        el.addEventListener('input', updateCalculations);
        el.addEventListener('change', updateCalculations);
      }
    });

    // 操作按鈕綁定
    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', () => window.print());
    }
    if (dom.btnDownload) {
      dom.btnDownload.addEventListener('click', downloadCardImage);
    }
    if (dom.btnCopyLine) {
      dom.btnCopyLine.addEventListener('click', copyLineSummary);
    }
    if (dom.btnSaveDraft) {
      dom.btnSaveDraft.addEventListener('click', saveDraft);
    }
    if (dom.btnLoadDraft) {
      dom.btnLoadDraft.addEventListener('click', loadDraft);
    }

    // 預設日期為今日
    if (dom.startDate && !dom.startDate.value) {
      dom.startDate.value = new Date().toISOString().split('T')[0];
    }

    // 初始計算
    updateCalculations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
