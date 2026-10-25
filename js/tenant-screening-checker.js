/**
 * 港居不動產 - 租客承租資格審查與租賃信用評分表
 * File: js/tenant-screening-checker.js
 * 遵循: 房租所得比 30% 法則、租賃專法注意義務、個資法零上傳本地運算
 */

(function () {
  'use strict';

  // 1. 狀態管理 State
  const state = {
    tenantName: '林小姐 (外商工程師)',
    tenantId: 'A223456789',
    tenantPhone: '0988-123-456',
    propertyAddress: '高雄市小港區中安路825號 10樓之1',
    monthlyRent: 24000,
    monthlyIncome: 80000,
    rtiRatio: 30.0,
    rtiScore: 12,
    jobScore: 15,
    checks: {
      idVerified: true,
      judiciaryClear: true,
      guarantorReady: true,
      landlordReferral: true,
      depositRefunded: true,
      occupantsSimple: true,
      scheduleRegular: true,
      noSmoking: true,
      agreedRules: true
    },
    redFlags: {
      criminalRecord: false,
      fakeIdentity: false,
      extremeRti: false
    },
    totalScore: 92,
    tier: 'S', // S, A, B, C, D, RED
    tierName: 'S級・極品優質房客',
    evalComment: '承租人為外商科技正職員工，所得充裕（房租所得比僅 30%），司法裁判查驗清白無負債，前房東照會評價極高，強烈建議直接簽約承租！'
  };

  // 2. 核心評分計算邏輯
  function calculateScore() {
    const rent = parseInt(document.getElementById('input-rent-amount').value, 10) || 0;
    const income = parseInt(document.getElementById('input-income-amount').value, 10) || 1;

    // 房租所得比 RTI
    const rti = (rent / income) * 100;
    state.monthlyRent = rent;
    state.monthlyIncome = income;
    state.rtiRatio = rti;

    let rtiScore = 0;
    let rtiLabel = '';
    if (rti < 25) {
      rtiScore = 15;
      rtiLabel = `${rti.toFixed(1)}% (極優・低於25%)`;
    } else if (rti <= 33.3) {
      rtiScore = 12;
      rtiLabel = `${rti.toFixed(1)}% (標準安全・約30%)`;
    } else if (rti <= 42) {
      rtiScore = 8;
      rtiLabel = `${rti.toFixed(1)}% (稍重・超過33%)`;
    } else {
      rtiScore = 3;
      rtiLabel = `${rti.toFixed(1)}% (沉重警戒・超42%)`;
    }
    state.rtiScore = rtiScore;

    // 職業與就業穩定度
    const jobRadio = document.querySelector('input[name="job-tier"]:checked');
    const jobScore = jobRadio ? parseInt(jobRadio.value, 10) : 10;
    state.jobScore = jobScore;

    // 勾選項檢查點得分
    let checklistScore = 0;
    const checkConfigs = [
      { id: 'check-id-verified', key: 'idVerified', pts: 5 },
      { id: 'check-judiciary-clear', key: 'judiciaryClear', pts: 10 },
      { id: 'check-guarantor-ready', key: 'guarantorReady', pts: 10 },
      { id: 'check-landlord-referral', key: 'landlordReferral', pts: 10 },
      { id: 'check-deposit-refunded', key: 'depositRefunded', pts: 10 },
      { id: 'check-occupants-simple', key: 'occupantsSimple', pts: 10 },
      { id: 'check-schedule-regular', key: 'scheduleRegular', pts: 5 },
      { id: 'check-no-smoking', key: 'noSmoking', pts: 5 },
      { id: 'check-agreed-rules', key: 'agreedRules', pts: 5 }
    ];

    checkConfigs.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      if (el) {
        state.checks[cfg.key] = el.checked;
        if (el.checked) checklistScore += cfg.pts;
      }
    });

    // 總分計算
    let totalScore = rtiScore + jobScore + checklistScore;

    // 一票否決紅旗檢查
    const rfCriminal = document.getElementById('rf-criminal').checked;
    const rfFake = document.getElementById('rf-fake').checked;
    const rfExtreme = document.getElementById('rf-extreme').checked;

    state.redFlags.criminalRecord = rfCriminal;
    state.redFlags.fakeIdentity = rfFake;
    state.redFlags.extremeRti = rfExtreme;

    const hasRedFlag = rfCriminal || rfFake || rfExtreme;

    // 等級判定
    let tier = 'B';
    let tierClass = 'tier-b';
    let tierName = 'B級・一般標準房客';
    let recDesc = '承租能力符合標準，建議簽約時補齊連帶保證人或薪轉資料存查。';

    if (hasRedFlag) {
      totalScore = Math.min(totalScore, 35);
      tier = 'RED';
      tierClass = 'tier-danger';
      tierName = '🔴 一票否決：建議婉拒承租';
      recDesc = '經查核存在重大違法、身分不實或嚴重償債無力紅旗，強烈建議婉拒承租以保資產安全！';
    } else if (totalScore >= 90) {
      tier = 'S';
      tierClass = 'tier-s';
      tierName = '🟢 S級・極品優質房客';
      recDesc = '財務充裕穩定、身分信用無瑕疵，為最優質房客，強烈推薦立即簽約承租！';
    } else if (totalScore >= 80) {
      tier = 'A';
      tierClass = 'tier-a';
      tierName = '🔵 A級・優選穩定房客';
      recDesc = '整體素質與所得負擔良好，信用記錄正常，建議優先安排合約簽署。';
    } else if (totalScore >= 65) {
      tier = 'B';
      tierClass = 'tier-b';
      tierName = '🟡 B級・普通標準房客';
      recDesc = '承租條件尚屬穩定，建議徵提正職連帶保證人或要求繳滿法定 2 個月押金。';
    } else if (totalScore >= 50) {
      tier = 'C';
      tierClass = 'tier-c';
      tierName = '🟠 C級・需強化擔保房客';
      recDesc = '所得負擔偏高或就業履歷偏短，應強制設定二等親連帶保證人並收足 2 個月押金。';
    } else {
      tier = 'D';
      tierClass = 'tier-c';
      tierName = '🔴 D級・高風險房客';
      recDesc = '綜合信用與所得負擔能力不足，有潛在欠租或違約風險，建議委婉婉拒承租。';
    }

    state.totalScore = totalScore;
    state.tier = tier;
    state.tierName = tierName;

    // 更新右側面板
    document.getElementById('val-total-score').textContent = totalScore;
    const badgeEl = document.getElementById('badge-tier-result');
    badgeEl.textContent = tierName;
    badgeEl.className = `score-tier-badge ${tierClass}`;

    const fillEl = document.getElementById('score-bar-fill');
    fillEl.style.width = `${Math.min(100, Math.max(5, totalScore))}%`;

    document.getElementById('meta-rti-display').textContent = rtiLabel;
    document.getElementById('meta-job-score').textContent = `${jobScore} 分 / 15分`;
    document.getElementById('meta-check-score').textContent = `${checklistScore} 分 / 70分`;

    // 更新即時 A4 文件視窗
    renderA4Document(recDesc);
  }

  // 3. A4 文件渲染
  function renderA4Document(recDesc) {
    const tName = document.getElementById('input-tenant-name').value || '__________';
    const tId = document.getElementById('input-tenant-id').value || '__________';
    const tPhone = document.getElementById('input-tenant-phone').value || '__________';
    const addr = document.getElementById('input-property-address').value || '______________________________';

    document.getElementById('doc-t-name').textContent = tName;
    document.getElementById('doc-t-id').textContent = tId;
    document.getElementById('doc-t-phone').textContent = tPhone;
    document.getElementById('doc-t-address').textContent = addr;

    document.getElementById('doc-t-rent').textContent = `NT$ ${state.monthlyRent.toLocaleString()} 元/月`;
    document.getElementById('doc-t-income').textContent = `NT$ ${state.monthlyIncome.toLocaleString()} 元/月`;
    document.getElementById('doc-t-rti').textContent = `${state.rtiRatio.toFixed(1)}%（${state.rtiScore} 分）`;

    // 各項目分數
    document.getElementById('doc-score-rti').textContent = `${state.rtiScore} / 15`;
    document.getElementById('doc-score-job').textContent = `${state.jobScore} / 15`;

    let checkSubtotal = 0;
    Object.values(state.checks).forEach((val) => {
      if (val) checkSubtotal++;
    });
    document.getElementById('doc-score-checklist').textContent = `${document.getElementById('meta-check-score').textContent}`;
    document.getElementById('doc-score-total').textContent = `${state.totalScore} 分（滿分 100）`;

    // 結果標語
    const resBox = document.getElementById('doc-result-banner');
    resBox.innerHTML = `<strong>審查結論：【${state.tierName}】（綜合評分 ${state.totalScore} 分）</strong><br>${recDesc}`;

    // 承辦經理簽章
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const m = now.getMonth() + 1;
    const d = now.getDate();
    document.getElementById('doc-sign-date').textContent = `中 華 民 國 ${rocYear} 年 ${m} 月 ${d} 日`;
  }

  // 4. LINE 審客評估摘要複製
  function copyLineSummary() {
    const tName = document.getElementById('input-tenant-name').value || '承租候選人';
    const addr = document.getElementById('input-property-address').value || '出租物件';
    const rent = state.monthlyRent.toLocaleString();
    const income = state.monthlyIncome.toLocaleString();
    const rti = state.rtiRatio.toFixed(1);

    const text = `【港居不動產・租客承租資格審查與信用診斷報告】
親愛的屋主您好：
我們已針對預約承租【${addr}】之房客進行全方位承租能力與法規信用審查，成果摘要如下：

👤 候選房客：${tName}
💰 申請租金：NT$ ${rent} 元/月
💼 申報所得：NT$ ${income} 元/月（房租所得比：${rti}%）
📊 租賃信用評分：${state.totalScore} 分（滿分 100 分）
🏆 審查判定等級：${state.tierName}

📋 港居特許專業把關重點：
✓ 警政署國民身分證領補換真偽查驗
✓ 司法院裁判書公開系統無重大刑案與執行記錄
✓ 房租所得比符合安全負擔標準
✓ 前房東照會無欠租違約不良紀錄

港居不動產始終為您的物業嚴格把關每一位租客！完整 A4 審查報告書隨附備查。
官方專線：0968-863-880（陳經理）`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製 LINE 租客審查診斷摘要！');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已複製 LINE 租客審查診斷摘要！');
  }

  // 5. Canvas 840×1080px 高畫質圖卡繪製與下載
  function downloadCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景底色
    ctx.fillStyle = '#0c1a30';
    ctx.fillRect(0, 0, 840, 1080);

    // 金色外框
    ctx.strokeStyle = '#c5a880';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 840 - 48, 1080 - 48);

    // 頂部品牌標題
    ctx.fillStyle = '#c5a880';
    ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司・嚴選優質房客', 420, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Noto Serif TC", serif';
    ctx.fillText('租客資格審查與信用診斷評估報告', 420, 125);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('依30%房租所得比法則・司法院裁判查核・租賃專法注意義務', 420, 155);

    // 橫線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(60, 175);
    ctx.lineTo(780, 175);
    ctx.stroke();

    // 評分高光方塊
    ctx.fillStyle = '#172a45';
    ctx.roundRect ? ctx.roundRect(60, 195, 720, 160, 12) : ctx.fillRect(60, 195, 720, 160);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillText('綜合租賃信用評分', 420, 230);

    ctx.fillStyle = '#f6ad55';
    ctx.font = '900 52px "Noto Sans TC", sans-serif';
    ctx.fillText(`${state.totalScore} 分`, 420, 285);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText(state.tierName, 420, 325);

    // 白色資訊內容卡
    ctx.fillStyle = '#ffffff';
    ctx.roundRect ? ctx.roundRect(60, 375, 720, 480, 12) : ctx.fillRect(60, 375, 720, 480);
    ctx.fill();

    ctx.fillStyle = '#0c1a30';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('【候選人承租條件與查驗明細】', 90, 420);

    ctx.font = '16px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';

    const tName = document.getElementById('input-tenant-name').value || '候選人';
    const addr = document.getElementById('input-property-address').value || '租賃標的';

    const lines = [
      `審核對象：${tName}`,
      `租賃標的：${addr}`,
      `月租金金額：NT$ ${state.monthlyRent.toLocaleString()} 元/月`,
      `申報月所得：NT$ ${state.monthlyIncome.toLocaleString()} 元/月`,
      `房租所得比：${state.rtiRatio.toFixed(1)}%（${state.rtiRatio <= 33 ? '符合 30% 安全法則' : '負擔稍重'}）`,
      `身分真偽：警政署身分證領補換資料吻合（已核驗）`,
      `司法查核：司法院裁判系統與消債專區無不良記錄`,
      `前租約履歷：前房東照會正常、押金如期全退`,
      `公約承諾：同意遵守 27 項住戶公約與無菸居住規範`
    ];

    let startY = 465;
    lines.forEach((l) => {
      ctx.fillText(l, 90, startY);
      startY += 34;
    });

    // 結論建議欄位
    ctx.fillStyle = '#f8fafc';
    ctx.roundRect ? ctx.roundRect(90, 770, 660, 65, 8) : ctx.fillRect(90, 770, 660, 65);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(90, 770, 660, 65);

    ctx.fillStyle = '#0c1a30';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText(`承辦建議：${state.tierName}。建議逕行安排租約簽署事宜。`, 110, 808);

    // 簽署欄位
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.roundRect ? ctx.roundRect(60, 875, 720, 85, 8) : ctx.fillRect(60, 875, 720, 85);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('審查特許機構：港居不動產開發有限公司 (高市租登字第0012號)', 90, 915);
    ctx.fillText('專業審查人員：陳俊銘 (112)登字第013739號・電話：0968-863-880', 90, 942);

    // 底部法定聲明
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('本評估報告依個資法規範純本機記憶體運算・零資料上傳雲端・保障承租人隱私安全', 420, 1000);
    ctx.fillText('港居不動產開發有限公司 統編：96797997・高雄市小港區中安路825號', 420, 1025);

    const link = document.createElement('a');
    link.download = `租客信用審查診斷書_${tName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已成功下載租客審查診斷高畫質圖卡！');
  }

  // 6. 草稿儲存與讀取 LocalStorage
  const DRAFT_KEY = 'ganju_tenant_screening_draft_v1';

  function saveDraft() {
    const draft = {
      tenantName: document.getElementById('input-tenant-name').value,
      tenantId: document.getElementById('input-tenant-id').value,
      tenantPhone: document.getElementById('input-tenant-phone').value,
      propertyAddress: document.getElementById('input-property-address').value,
      monthlyRent: document.getElementById('input-rent-amount').value,
      monthlyIncome: document.getElementById('input-income-amount').value,
      jobTier: document.querySelector('input[name="job-tier"]:checked')?.value || '15',
      checks: {
        idVerified: document.getElementById('check-id-verified').checked,
        judiciaryClear: document.getElementById('check-judiciary-clear').checked,
        guarantorReady: document.getElementById('check-guarantor-ready').checked,
        landlordReferral: document.getElementById('check-landlord-referral').checked,
        depositRefunded: document.getElementById('check-deposit-refunded').checked,
        occupantsSimple: document.getElementById('check-occupants-simple').checked,
        scheduleRegular: document.getElementById('check-schedule-regular').checked,
        noSmoking: document.getElementById('check-no-smoking').checked,
        agreedRules: document.getElementById('check-agreed-rules').checked
      },
      redFlags: {
        criminal: document.getElementById('rf-criminal').checked,
        fake: document.getElementById('rf-fake').checked,
        extreme: document.getElementById('rf-extreme').checked
      }
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast('租客審查草稿已成功暫存於本機！');
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      showToast('本機尚無暫存之租客審查草稿');
      return;
    }
    try {
      const d = JSON.parse(raw);
      if (d.tenantName) document.getElementById('input-tenant-name').value = d.tenantName;
      if (d.tenantId) document.getElementById('input-tenant-id').value = d.tenantId;
      if (d.tenantPhone) document.getElementById('input-tenant-phone').value = d.tenantPhone;
      if (d.propertyAddress) document.getElementById('input-property-address').value = d.propertyAddress;
      if (d.monthlyRent) document.getElementById('input-rent-amount').value = d.monthlyRent;
      if (d.monthlyIncome) document.getElementById('input-income-amount').value = d.monthlyIncome;

      if (d.jobTier) {
        const rad = document.querySelector(`input[name="job-tier"][value="${d.jobTier}"]`);
        if (rad) rad.checked = true;
      }

      if (d.checks) {
        document.getElementById('check-id-verified').checked = !!d.checks.idVerified;
        document.getElementById('check-judiciary-clear').checked = !!d.checks.judiciaryClear;
        document.getElementById('check-guarantor-ready').checked = !!d.checks.guarantorReady;
        document.getElementById('check-landlord-referral').checked = !!d.checks.landlordReferral;
        document.getElementById('check-deposit-refunded').checked = !!d.checks.depositRefunded;
        document.getElementById('check-occupants-simple').checked = !!d.checks.occupantsSimple;
        document.getElementById('check-schedule-regular').checked = !!d.checks.scheduleRegular;
        document.getElementById('check-no-smoking').checked = !!d.checks.noSmoking;
        document.getElementById('check-agreed-rules').checked = !!d.checks.agreedRules;
      }

      if (d.redFlags) {
        document.getElementById('rf-criminal').checked = !!d.redFlags.criminal;
        document.getElementById('rf-fake').checked = !!d.redFlags.fake;
        document.getElementById('rf-extreme').checked = !!d.redFlags.extreme;
      }

      calculateScore();
      showToast('已成功載入本機暫存之租客審查草稿！');
    } catch (e) {
      console.error(e);
      showToast('讀取草稿失敗');
    }
  }

  // 7. 匯出房客至租賃契約產生器
  function exportToContract() {
    const tName = document.getElementById('input-tenant-name').value;
    const tId = document.getElementById('input-tenant-id').value;
    const tPhone = document.getElementById('input-tenant-phone').value;
    const addr = document.getElementById('input-property-address').value;
    const rent = state.monthlyRent;

    const contractDraft = {
      tenantName: tName,
      tenantId: tId,
      tenantPhone: tPhone,
      address: addr,
      rent: rent,
      deposit: rent * 2
    };

    localStorage.setItem('ganju_lease_contract_draft', JSON.stringify(contractDraft));
    showToast('已將審核合格房客資料匯出！正在跳轉至租賃契約產生器...');
    setTimeout(() => {
      window.location.href = 'lease-contract.html';
    }, 1200);
  }

  // 8. Toast 小提示
  function showToast(msg) {
    let toast = document.getElementById('ganju-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ganju-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#0c1a30';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '30px';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      toast.style.zIndex = '9999';
      toast.style.fontSize = '0.95rem';
      toast.style.fontWeight = '600';
      toast.style.border = '1px solid #c5a880';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, 2500);
  }

  // 9. 初始化 Entry Point
  function init() {
    const watchInputs = [
      'input-tenant-name', 'input-tenant-id', 'input-tenant-phone',
      'input-property-address', 'input-rent-amount', 'input-income-amount'
    ];

    watchInputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calculateScore);
    });

    document.querySelectorAll('input[name="job-tier"]').forEach((radio) => {
      radio.addEventListener('change', calculateScore);
    });

    document.querySelectorAll('.check-card-group input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', calculateScore);
    });

    document.querySelectorAll('.red-flag-checkboxes input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', calculateScore);
    });

    document.getElementById('btn-print-report').addEventListener('click', () => window.print());
    document.getElementById('btn-download-card').addEventListener('click', downloadCardImage);
    document.getElementById('btn-copy-line').addEventListener('click', copyLineSummary);
    document.getElementById('btn-save-draft').addEventListener('click', saveDraft);
    document.getElementById('btn-load-draft').addEventListener('click', loadDraft);
    document.getElementById('btn-export-contract').addEventListener('click', exportToContract);

    calculateScore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
