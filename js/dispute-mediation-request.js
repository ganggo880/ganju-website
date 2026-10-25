/**
 * 港居不動產 - 住宅租賃爭議調處與調解聲請書產生器
 * File: js/dispute-mediation-request.js
 * 依據《租賃住宅市場發展及管理條例》第16條與《鄉鎮市調解條例》合規設計
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- 狀態庫 (State Store) ---
  const state = {
    // 1. 管轄機關與爭議類型
    venueType: 'municipal', // 'municipal' (地政局住宅租賃爭議調處) | 'district' (區公所調解)
    disputeType: 'deposit_refund', // 'deposit_refund' | 'repair_liability' | 'early_termination' | 'arrears_claim' | 'restore_damage'

    // 2. 租賃標的與契約
    propertyAddress: '高雄市小港區中安路 825 號 5 樓 A 室',
    leaseCode: 'GJ-202611-DM01',
    leaseStart: '2025-11-01',
    leaseEnd: '2026-10-31',
    monthlyRent: 18000,
    depositAmount: 36000,

    // 3. 立約當事人與代理人
    applicantRole: 'tenant', // 'tenant' | 'landlord' | 'manager'
    applicantName: '陳國華',
    applicantId: 'E123456789',
    applicantPhone: '0912-345-678',
    applicantAddress: '高雄市小港區中安路 825 號 6 樓',

    respondentName: '林大榮',
    respondentPhone: '0988-777-666',
    respondentAddress: '高雄市小港區中安路 825 號 5 樓 A 室',

    agentName: '港居不動產開發有限公司（受託代管機構）',
    agentPhone: '0968-863-880',
    agentLicense: '(112)登字第013739號',

    // 4. 調解請求事項與爭端事實
    claimAmount: 36000,
    claimStatement: '一、相對人應即時返還聲請人原承租標的物之押租保證金新臺幣 36,000 元整。\n二、調解/調處程序規費由相對人負擔。',
    factSummary: '聲請人於民國 114 年 11 月 1 日向相對人承租系爭住宅標的，租期至 115 年 10 月 31 日屆滿。聲請人已於租期屆滿日前依約無條件騰空交屋並返還門禁磁扣與鑰匙，現場設備均無任何毀損，且結清所有水電瓦斯費用。相對人於點交後以牆面正常使用微塵自然折舊為由，惡意拒絕返還押金新臺幣 36,000 元。聲請人業已於 115 年 11 月 3 日發存證信函催告返還，相對人收訖後仍置之不理，爰依法聲請調處。',

    // 5. 證物清單
    evidenceList: [
      { no: '證一', name: '住宅租賃契約書影本', purpose: '證明租賃關係存續與押金 36,000 元約定' },
      { no: '證二', name: '退租點交存證紀錄單與照片', purpose: '證明房屋點交無瑕疵且已返還鑰匙' },
      { no: '證三', name: '郵局存證信函及送達掛號回執', purpose: '證明聲請人已正式踐行催告返還程序' }
    ],

    // 6. 法務安全遵守守則
    rules: {
      directMediation: true,
      enforceability: true,
      noticeDelivery: true,
      confidentiality: true
    },

    // 7. 電子簽章
    signatureApplicant: null
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

  // --- 手寫簽名板封裝 (Retina 2x) ---
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
      const width = rect.width > 0 ? rect.width : 300;
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
      this.ctx.clearRect(0, 0, rect.width || 300, rect.height || 120);
      this.savedData = null;
      if (this.onEnd) this.onEnd(null);
    }
  }

  let padApplicant = null;

  function initSignaturePad() {
    padApplicant = new RetinaSignaturePad('sigCanvasApplicant', 'btnClearSigApplicant', (dataUrl) => {
      state.signatureApplicant = dataUrl;
      renderPreview();
    });
  }

  // --- 證物清單動態表格渲染 ---
  function renderEvidenceTable() {
    const tbody = document.getElementById('evidenceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    state.evidenceList.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; text-align: center; width: 15%;">
          <input type="text" value="${item.no}" data-idx="${idx}" class="input-ev-no" style="text-align:center;">
        </td>
        <td style="width: 45%;">
          <input type="text" value="${item.name}" data-idx="${idx}" class="input-ev-name">
        </td>
        <td style="width: 30%;">
          <input type="text" value="${item.purpose}" data-idx="${idx}" class="input-ev-purpose">
        </td>
        <td style="text-align: center; width: 10%;">
          <button type="button" class="evidence-btn-del" data-idx="${idx}" title="刪除本項證物" aria-label="刪除本項證物">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.input-ev-no').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        if (state.evidenceList[i]) {
          state.evidenceList[i].no = e.target.value;
          renderPreview();
        }
      });
    });

    tbody.querySelectorAll('.input-ev-name').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        if (state.evidenceList[i]) {
          state.evidenceList[i].name = e.target.value;
          renderPreview();
        }
      });
    });

    tbody.querySelectorAll('.input-ev-purpose').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        if (state.evidenceList[i]) {
          state.evidenceList[i].purpose = e.target.value;
          renderPreview();
        }
      });
    });

    tbody.querySelectorAll('.evidence-btn-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = Number(btn.getAttribute('data-idx'));
        state.evidenceList.splice(i, 1);
        renderEvidenceTable();
        renderPreview();
      });
    });
  }

  // --- 同步表單控制元件 ---
  function syncInputsFromState() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('inputPropertyAddress', state.propertyAddress);
    setVal('inputLeaseCode', state.leaseCode);
    setVal('inputLeaseStart', state.leaseStart);
    setVal('inputLeaseEnd', state.leaseEnd);
    setVal('inputMonthlyRent', state.monthlyRent);
    setVal('inputDepositAmount', state.depositAmount);

    setVal('selectApplicantRole', state.applicantRole);
    setVal('inputApplicantName', state.applicantName);
    setVal('inputApplicantId', state.applicantId);
    setVal('inputApplicantPhone', state.applicantPhone);
    setVal('inputApplicantAddress', state.applicantAddress);

    setVal('inputRespondentName', state.respondentName);
    setVal('inputRespondentPhone', state.respondentPhone);
    setVal('inputRespondentAddress', state.respondentAddress);

    setVal('inputAgentName', state.agentName);
    setVal('inputAgentPhone', state.agentPhone);
    setVal('inputAgentLicense', state.agentLicense);

    setVal('inputClaimAmount', state.claimAmount);
    setVal('inputClaimStatement', state.claimStatement);
    setVal('inputFactSummary', state.factSummary);

    const setChk = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };
    setChk('chkRuleDirectMediation', state.rules.directMediation);
    setChk('chkRuleEnforceability', state.rules.enforceability);
    setChk('chkRuleNoticeDelivery', state.rules.noticeDelivery);
    setChk('chkRuleConfidentiality', state.rules.confidentiality);

    // 啟動機關與爭議類型卡片 Active 狀態
    document.querySelectorAll('.venue-card').forEach(btn => {
      const isMatch = btn.getAttribute('data-venue') === state.venueType;
      btn.classList.toggle('active', isMatch);
    });

    document.querySelectorAll('.dispute-card').forEach(btn => {
      const isMatch = btn.getAttribute('data-dispute') === state.disputeType;
      btn.classList.toggle('active', isMatch);
    });
  }

  // --- 渲染右側 A4 預覽公文書 ---
  function renderPreview() {
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // 機關標題連動
    let venueHeader = '高雄市政府住宅租賃爭議調處委員會';
    let venueName = '高雄市政府地政局（住宅租賃爭議調處委員會）';
    let docCategoryTitle = '住宅租賃爭議調處聲請書';

    if (state.venueType === 'district') {
      venueHeader = '高雄市小港區公所調解委員會';
      venueName = '高雄市小港區公所（民事調解委員會）';
      docCategoryTitle = '民事租賃爭議調解聲請書';
    }

    setTxt('docVenueHeader', venueHeader);
    setTxt('docVenueName', venueName);
    setTxt('docMainTitle', docCategoryTitle);

    // 爭議類型名稱
    const disputeMap = {
      deposit_refund: '押租金返還與非理性扣抵爭議',
      repair_liability: '住宅修繕責任與代修費用償還爭議',
      early_termination: '提前終止租約與違約金上限爭議',
      arrears_claim: '欠繳租金與水電雜費清償爭議',
      restore_damage: '退租回復原狀與設備折舊損耗賠償爭議'
    };
    setTxt('docDisputeTypeName', disputeMap[state.disputeType] || '租賃爭議');

    setTxt('docLeaseCode', state.leaseCode || 'GJ-202611-DM01');
    setTxt('docPropertyAddress', state.propertyAddress);
    setTxt('docLeasePeriod', `${state.leaseStart} 起至 ${state.leaseEnd} 止`);
    setTxt('docRentDepositInfo', `每月租金 NT$ ${Number(state.monthlyRent).toLocaleString()} 元 ｜ 押租保證金 NT$ ${Number(state.depositAmount).toLocaleString()} 元`);

    // 當事人
    const roleLabels = { tenant: '承租人', landlord: '出租人', manager: '受託代管業' };
    setTxt('docApplicantInfo', `${state.applicantName}（${roleLabels[state.applicantRole]}｜身分證：${state.applicantId}｜電話：${state.applicantPhone}｜住址：${state.applicantAddress}）`);
    setTxt('docRespondentInfo', `${state.respondentName}（電話：${state.respondentPhone}｜住址：${state.respondentAddress}）`);
    setTxt('docAgentInfo', state.agentName ? `${state.agentName}（證號：${state.agentLicense}｜電話：${state.agentPhone}）` : '無受任代理人');

    // 請求事項與金額
    const claimAmt = Number(state.claimAmount) || 0;
    setTxt('docClaimAmount', `${toChineseCurrency(claimAmt)} (NT$ ${claimAmt.toLocaleString()} 元)`);
    setTxt('docClaimStatement', state.claimStatement);
    setTxt('docFactSummary', state.factSummary);

    // 證物清單附表
    const evTbody = document.getElementById('docEvidenceTbody');
    if (evTbody) {
      evTbody.innerHTML = '';
      state.evidenceList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; text-align: center;">${item.no}</td>
          <td>${item.name}</td>
          <td>${item.purpose}</td>
        `;
        evTbody.appendChild(tr);
      });
    }

    // 簽章更新
    setTxt('docSigApplicantName', state.applicantName);
    const sigImg = document.getElementById('docSigApplicantImg');
    const sigHint = document.getElementById('docSigApplicantHint');
    if (sigImg && sigHint) {
      if (state.signatureApplicant) {
        sigImg.src = state.signatureApplicant;
        sigImg.style.display = 'block';
        sigHint.style.display = 'none';
      } else {
        sigImg.style.display = 'none';
        sigHint.style.display = 'inline';
      }
    }
  }

  // --- 下載 HTML5 Canvas 840x1080px 高畫質調處存證圖卡 ---
  function downloadCanvasCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 840, 1080);

    // 頂部海軍藍橫幅
    const grad = ctx.createLinearGradient(0, 0, 840, 135);
    grad.addColorStop(0, '#1a365d');
    grad.addColorStop(1, '#2a4365');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 840, 135);

    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, 135, 840, 6);

    ctx.fillStyle = '#f6e05e';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('港居不動產線上工具中心 ｜ 租賃專法第16條直轄市調處合規憑證', 40, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Noto Sans TC", sans-serif';
    const vTitle = state.venueType === 'municipal' ? '高雄市政府住宅租賃爭議調處聲請憑證' : '高雄市小港區公所調解聲請憑證';
    ctx.fillText(vTitle, 40, 86);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText(`聲請案號：${state.leaseCode} ｜ 爭端標的：${state.propertyAddress}`, 40, 116);

    const drawBox = (x, y, w, h, title) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1a365d';
      ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
      ctx.fillText(title, x + 20, y + 30);

      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 42);
      ctx.lineTo(x + w - 20, y + 42);
      ctx.stroke();
    };

    // 區塊一：管轄機關與爭端雙方
    drawBox(36, 160, 768, 175, '🏛️ 調處受理機關與立約當事人');
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    const vDesc = state.venueType === 'municipal' ? '高雄市政府地政局住宅租賃爭議調處委員會（依法免收規費）' : '高雄市小港區公所民事調解委員會';
    ctx.fillText(`受理主管機關：${vDesc}`, 56, 198);
    ctx.fillText(`聲請人（${state.applicantRole === 'tenant' ? '承租人' : '出租人'}）：${state.applicantName}（電話：${state.applicantPhone}｜身分證：${state.applicantId}）`, 56, 226);
    ctx.fillText(`相對人：${state.respondentName}（服務電話：${state.respondentPhone}）`, 56, 254);
    ctx.fillText(`委任代理人：${state.agentName || '無'}（證號：${state.agentLicense || '—'}）`, 56, 282);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText(`聲請調處請求標的金額：${toChineseCurrency(state.claimAmount)} (NT$ ${Number(state.claimAmount).toLocaleString()})`, 56, 312);

    // 區塊二：請求調解事項與爭執事實
    drawBox(36, 350, 768, 240, '⚖️ 調解請求事項與爭執事實要旨');
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('請求事項：', 56, 386);
    ctx.font = '13.5px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';

    const claimLines = state.claimStatement.split('\n');
    let cy = 410;
    claimLines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 66, cy);
      cy += 24;
    });

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('爭執事實要旨：', 56, 470);
    ctx.font = '13.5px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#475569';

    // 簡易排版事實
    const factSub = state.factSummary.length > 95 ? state.factSummary.substring(0, 95) + '...' : state.factSummary;
    ctx.fillText(factSub.substring(0, 50), 66, 495);
    if (factSub.length > 50) {
      ctx.fillText(factSub.substring(50), 66, 520);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '12.5px "Noto Sans TC", sans-serif';
    ctx.fillText(`檢附證物：${state.evidenceList.map(e => `${e.no}(${e.name})`).join('、')}`, 56, 560);

    // 區塊三：法律保障與效力
    drawBox(36, 605, 768, 195, '🚨 司法效力與調處法律守則');
    ctx.fillStyle = '#1e293b';
    ctx.font = '13.5px "Noto Sans TC", sans-serif';
    ctx.fillText('• 法定免費調處：《租賃住宅市場發展及管理條例》第16條規定，直轄市住宅租賃調處免繳調處規費。', 56, 642);
    ctx.fillText('• 判決同一效力：調處成立作成調處書送經法院核定後，與民事確定判決有同一之效力，得為執行名義。', 56, 670);
    ctx.fillText('• 起訴前強制調解：依民事訴訟法第403條，租賃住宅紛爭起訴前應先經法院或行政機關調解。', 56, 698);
    ctx.fillText('• 誠信出席原則：相對人無正當理由不於調處期日到場者，得由主管機關依法逕行調處作成裁處。', 56, 726);
    ctx.fillText('• 全程保密承諾：調處程序不公開，調處委員與當事人對調處中所陳述之內容負保密責任。', 56, 754);

    // 區塊四：簽署確認
    drawBox(36, 815, 768, 190, '✍️ 聲請人親筆手寫簽章確認');
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(56, 865, 340, 110);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText(`聲請人（具狀人）親簽：${state.applicantName}`, 66, 888);

    ctx.strokeRect(436, 865, 340, 110);
    ctx.fillText(`受託代管專業經紀人員簽署：`, 446, 888);
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillText(`港居不動產開發有限公司（統編：96797997）`, 446, 920);
    ctx.fillText(`租賃住宅管理人員：(112)登字第013739號`, 446, 946);

    const finalize = () => {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText('港居不動產線上工具中心產製 ｜ 純前端本地零上傳加密運算 ｜ 服務電話：0968-863-880', 140, 1045);

      const link = document.createElement('a');
      link.download = `港居住宅租賃爭議調處聲請憑證_${state.leaseCode}_${state.applicantName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (state.signatureApplicant) {
      const sImg = new Image();
      sImg.onload = () => {
        ctx.drawImage(sImg, 70, 895, 260, 75);
        finalize();
      };
      sImg.onerror = () => finalize();
      sImg.src = state.signatureApplicant;
    } else {
      finalize();
    }
  }

  // --- 一鍵複製 LINE 格式化摘要 ---
  function copyLineSummary() {
    const vName = state.venueType === 'municipal' ? '高雄市政府住宅租賃爭議調處委員會（地政局）' : '高雄市小港區公所調解委員會';
    const lines = [
      '⚖️【港居不動產｜住宅租賃爭議調處與調解聲請摘要】',
      `🏛️ 受理調處機關：${vName}`,
      `📄 聲請案號：${state.leaseCode}`,
      `🏠 租賃標的：${state.propertyAddress}`,
      `👤 聲請人：${state.applicantName}（電話：${state.applicantPhone}）`,
      `👥 相對人：${state.respondentName}（電話：${state.respondentPhone}）`,
      `💼 受託代管機構：港居不動產（電話：0968-863-880）`,
      '------------------------',
      `💰 請求標的金額：${toChineseCurrency(state.claimAmount)} (NT$ ${Number(state.claimAmount).toLocaleString()})`,
      '📋 請求事項要旨：',
      state.claimStatement,
      '------------------------',
      '🚨 依《租賃住宅市場發展及管理條例》第16條，住宅租賃調處免收規費。調處成立經法院核定後與民事判決有同一效力。',
      '📞 港居不動產法務租務中心：0968-863-880（陳經理）'
    ];

    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLine');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> 已複製 LINE 調處聲請摘要！';
          setTimeout(() => { btn.innerHTML = orig; }, 2200);
        }
      });
    }
  }

  // --- 綁定表單互動事件 ---
  function bindFormEvents() {
    // 機關切換
    document.querySelectorAll('.venue-card').forEach(btn => {
      btn.addEventListener('click', () => {
        state.venueType = btn.getAttribute('data-venue');
        document.querySelectorAll('.venue-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPreview();
      });
    });

    // 爭議類型快速切換
    const disputeTemplates = {
      deposit_refund: {
        claimAmount: 36000,
        claimStatement: '一、相對人應即時返還聲請人原承租標的物之押租保證金新臺幣 36,000 元整。\n二、調解/調處程序規費由相對人負擔。',
        factSummary: '聲請人於租期屆滿日前已依約無條件騰空交屋並返還門禁磁扣與鑰匙，現場設備均無任何毀損，且結清所有水電瓦斯費用。相對人於點交後以牆面微塵自然折舊為由，惡意拒絕返還押金新臺幣 36,000 元。經存證信函催告仍置之不理，爰依法聲請調處。'
      },
      repair_liability: {
        claimAmount: 22000,
        claimStatement: '一、相對人應即刻償還聲請人代為修繕房屋主暗管滲漏水之代墊工程費用新臺幣 22,000 元整。\n二、相對人應於 7 日內僱工完成浴室天花板防水修繕。',
        factSummary: '系爭承租房屋於租期內發生牆內冷水暗管破裂嚴重漏水，聲請人多次通知相對人修繕均遭推諉拖延。聲請人依《民法》第 430 條定相當期限催告無效後，自行僱請水電工程行搶修支出 22,000 元，相對人拒絕補償償還，爰聲請調處。'
      },
      early_termination: {
        claimAmount: 18000,
        claimStatement: '一、相對人請求提前終止租約之賠償違約金應核減為一個月租金新臺幣 18,000 元。\n二、相對人應返還超額扣留之租金與押金差額新臺幣 18,000 元整。',
        factSummary: '承租人因工作職務跨縣市調動提出提前終止租約，依定型化契約應記載事項第 13 點，違約金最高上限不得超過一個月租金。相對人主張契約特約要求沒收二個月全額押金，明顯牴觸強制法令而無效，爰聲請調解核減返還。'
      },
      arrears_claim: {
        claimAmount: 54000,
        claimStatement: '一、相對人應給付聲請人積欠之租金新臺幣 48,000 元及代墊水電費新臺幣 6,000 元，合計新臺幣 54,000 元整。\n二、相對人應騰空遷讓交還房屋。',
        factSummary: '相對人自民國 115 年 8 月起即未依約繳納租金，積欠金額已達二個月租額以上，且拒繳水電公電分攤費。聲請人定相當期限催告清償無效，爰依法聲請調解返還欠費並遷讓房屋。'
      },
      restore_damage: {
        claimAmount: 15000,
        claimStatement: '一、確認聲請人就系爭承租住宅之回復原狀義務已完全消滅。\n二、相對人應退還扣留之履約保證金新臺幣 15,000 元整。',
        factSummary: '聲請人承租滿 3 年退租，相對人以木地板局部色澤淡化與沙發皮面自然壓痕為由要求全室重新裝修並索賠 4 萬元。依固定資產折舊與民法第 432 條善良管理人義務，自然耗損由出租人承擔，相對人漫天開價扣款於法無據。'
      }
    };

    document.querySelectorAll('.dispute-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const dType = btn.getAttribute('data-dispute');
        state.disputeType = dType;
        document.querySelectorAll('.dispute-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (disputeTemplates[dType]) {
          state.claimAmount = disputeTemplates[dType].claimAmount;
          state.claimStatement = disputeTemplates[dType].claimStatement;
          state.factSummary = disputeTemplates[dType].factSummary;
          syncInputsFromState();
          renderPreview();
        }
      });
    });

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

    bindInput('inputPropertyAddress', 'propertyAddress');
    bindInput('inputLeaseCode', 'leaseCode');
    bindInput('inputLeaseStart', 'leaseStart');
    bindInput('inputLeaseEnd', 'leaseEnd');
    bindInput('inputMonthlyRent', 'monthlyRent', true);
    bindInput('inputDepositAmount', 'depositAmount', true);

    bindInput('selectApplicantRole', 'applicantRole');
    bindInput('inputApplicantName', 'applicantName');
    bindInput('inputApplicantId', 'applicantId');
    bindInput('inputApplicantPhone', 'applicantPhone');
    bindInput('inputApplicantAddress', 'applicantAddress');

    bindInput('inputRespondentName', 'respondentName');
    bindInput('inputRespondentPhone', 'respondentPhone');
    bindInput('inputRespondentAddress', 'respondentAddress');

    bindInput('inputAgentName', 'agentName');
    bindInput('inputAgentPhone', 'agentPhone');
    bindInput('inputAgentLicense', 'agentLicense');

    bindInput('inputClaimAmount', 'claimAmount', true);
    bindInput('inputClaimStatement', 'claimStatement');
    bindInput('inputFactSummary', 'factSummary');

    // 增加證物按鈕
    const btnAddEvidence = document.getElementById('btnAddEvidence');
    if (btnAddEvidence) {
      btnAddEvidence.addEventListener('click', () => {
        const nextNo = `證${['一','二','三','四','五','六','七','八','九','十'][state.evidenceList.length] || state.evidenceList.length + 1}`;
        state.evidenceList.push({
          no: nextNo,
          name: '通訊軟體對話紀錄截圖或存證相片',
          purpose: '證明爭端協商未果與事實存證'
        });
        renderEvidenceTable();
        renderPreview();
      });
    }

    // 快速範本按鈕
    const btnSampleDeposit = document.getElementById('btnSampleDeposit');
    if (btnSampleDeposit) {
      btnSampleDeposit.addEventListener('click', () => {
        state.venueType = 'municipal';
        state.disputeType = 'deposit_refund';
        state.applicantRole = 'tenant';
        state.applicantName = '陳國華';
        state.applicantId = 'E123456789';
        state.applicantPhone = '0912-345-678';
        state.respondentName = '林大榮';
        state.respondentPhone = '0988-777-666';
        state.claimAmount = 36000;
        state.claimStatement = '一、相對人應即時返還聲請人原承租標的物之押租保證金新臺幣 36,000 元整。\n二、調處程序費用由相對人負擔。';
        state.factSummary = '聲請人於租期屆滿日前已依約無條件騰空交屋並返還門禁磁扣與鑰匙，現場設備均無任何毀損，且結清所有水電瓦斯費用。相對人於點交後以牆面正常使用微塵自然折舊為由，惡意拒絕返還押金新臺幣 36,000 元。經存證信函催告仍置之不理，爰依法聲請調處。';
        syncInputsFromState();
        renderEvidenceTable();
        renderPreview();
      });
    }

    const btnSampleRepair = document.getElementById('btnSampleRepair');
    if (btnSampleRepair) {
      btnSampleRepair.addEventListener('click', () => {
        state.venueType = 'district';
        state.disputeType = 'repair_liability';
        state.applicantRole = 'tenant';
        state.applicantName = '林怡君';
        state.applicantId = 'E223456789';
        state.applicantPhone = '0933-222-111';
        state.respondentName = '張建銘';
        state.respondentPhone = '0977-888-999';
        state.claimAmount = 22000;
        state.claimStatement = '一、相對人應償還聲請人代墊之漏水水電搶修費用新臺幣 22,000 元整。\n二、相對人應限期完成浴室天花板防漏整修。';
        state.factSummary = '房屋暗管漏水浸泡家具，經通知相對人修繕未果，聲請人依民法第430條自行僱工搶修，相對人拒絕補償代墊費用，爰聲請小港區公所調解。';
        syncInputsFromState();
        renderEvidenceTable();
        renderPreview();
      });
    }

    const btnResetForm = document.getElementById('btnResetForm');
    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        state.applicantName = '';
        state.applicantId = '';
        state.applicantPhone = '';
        state.applicantAddress = '';
        state.respondentName = '';
        state.respondentPhone = '';
        state.respondentAddress = '';
        state.claimAmount = 0;
        state.claimStatement = '';
        state.factSummary = '';
        state.evidenceList = [];
        if (padApplicant) padApplicant.clear();
        syncInputsFromState();
        renderEvidenceTable();
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
  initSignaturePad();
  syncInputsFromState();
  renderEvidenceTable();
  bindFormEvents();
  renderPreview();
});
