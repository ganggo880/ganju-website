/**
 * js/household-registration-agreement.js
 * 港居不動產 - 住宅租賃設籍約定暨退租遷出切結書產生器
 * 依據《戶籍法》第50條第1項與內政部住宅租賃定型化契約規範設計
 */

(function () {
  'use strict';

  // 繁體中文金融大寫數字轉換函式
  function toChineseFinanceNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return '零元整';
    num = Math.floor(Math.abs(Number(num)));
    if (num === 0) return '零元整';

    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億', '兆'];

    let str = num.toString();
    let result = '';
    let zeroCount = 0;
    const len = str.length;

    for (let i = 0; i < len; i++) {
      const n = parseInt(str.charAt(i), 10);
      const pos = len - i - 1;
      const unitIndex = pos % 4;
      const bigUnitIndex = Math.floor(pos / 4);

      if (n === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          result += digits[0];
          zeroCount = 0;
        }
        result += digits[n] + units[unitIndex];
      }

      if (unitIndex === 0) {
        if (zeroCount < 4) {
          result += bigUnits[bigUnitIndex];
        }
        zeroCount = 0;
      }
    }

    result = result.replace(/零+/g, '零').replace(/零+$/, '');
    return '新臺幣 ' + result + '元整';
  }

  // 設籍人員資料結構
  let householdMembers = [
    { name: '王小明', idNo: 'A123456789', relation: '承租人本人' }
  ];

  // DOM 元素載入
  document.addEventListener('DOMContentLoaded', function () {
    // 綁定輸入欄位
    const propAddress = document.getElementById('propAddress');
    const landlordName = document.getElementById('landlordName');
    const landlordPhone = document.getElementById('landlordPhone');
    const landlordIdNo = document.getElementById('landlordIdNo');
    const tenantName = document.getElementById('tenantName');
    const tenantPhone = document.getElementById('tenantPhone');
    const tenantIdNo = document.getElementById('tenantIdNo');
    const leaseStartDate = document.getElementById('leaseStartDate');
    const leaseEndDate = document.getElementById('leaseEndDate');
    const vacateDays = document.getElementById('vacateDays');
    const dailyPenalty = document.getElementById('dailyPenalty');
    const specialTerms = document.getElementById('specialTerms');

    // 預覽元素
    const pvDocNo = document.getElementById('pvDocNo');
    const pvPropAddress = document.getElementById('pvPropAddress');
    const pvLandlord = document.getElementById('pvLandlord');
    const pvTenant = document.getElementById('pvTenant');
    const pvLeasePeriod = document.getElementById('pvLeasePeriod');
    const pvVacateDays = document.getElementById('pvVacateDays');
    const pvDailyPenalty = document.getElementById('pvDailyPenalty');
    const pvDailyPenaltyWords = document.getElementById('pvDailyPenaltyWords');
    const pvMembersList = document.getElementById('pvMembersList');
    const pvSpecialTerms = document.getElementById('pvSpecialTerms');
    const pvDateText = document.getElementById('pvDateText');

    // 自動產生協議編號
    const today = new Date();
    const docNo = 'HR-' + today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0') + '-' +
      Math.floor(1000 + Math.random() * 9000);
    if (pvDocNo) pvDocNo.textContent = docNo;

    // 設定今日民國日期
    const rocYear = today.getFullYear() - 1911;
    const dateStr = `中華民國 ${rocYear} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
    if (pvDateText) pvDateText.textContent = dateStr;

    // 更新預覽畫面函式
    function updatePreview() {
      if (pvPropAddress) pvPropAddress.textContent = propAddress.value || '未填寫租賃住宅地址';
      if (pvLandlord) {
        pvLandlord.textContent = `${landlordName.value || '出租人姓名'}（身分證/統編：${landlordIdNo.value || '---'}，電話：${landlordPhone.value || '---'}）`;
      }
      if (pvTenant) {
        pvTenant.textContent = `${tenantName.value || '承租人姓名'}（身分證字號：${tenantIdNo.value || '---'}，電話：${tenantPhone.value || '---'}）`;
      }

      if (pvLeasePeriod) {
        const start = leaseStartDate.value || '---';
        const end = leaseEndDate.value || '---';
        pvLeasePeriod.textContent = `自民國 ${formatRocDate(start)} 起至民國 ${formatRocDate(end)} 止`;
      }

      const daysVal = vacateDays.value || '14';
      if (pvVacateDays) pvVacateDays.textContent = daysVal;

      const penaltyVal = parseInt(dailyPenalty.value, 10) || 500;
      if (pvDailyPenalty) pvDailyPenalty.textContent = penaltyVal.toLocaleString();
      if (pvDailyPenaltyWords) pvDailyPenaltyWords.textContent = toChineseFinanceNumber(penaltyVal);

      if (pvSpecialTerms) {
        pvSpecialTerms.textContent = specialTerms.value || '無其他特別加註約定事項。';
      }

      renderPreviewMembers();
    }

    // 格式化民國日期字串
    function formatRocDate(dateStr) {
      if (!dateStr) return '---';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10) - 1911;
        return `${y} 年 ${parseInt(parts[1], 10)} 月 ${parseInt(parts[2], 10)} 日`;
      }
      return dateStr;
    }

    // 渲染預覽中的人員表格
    function renderPreviewMembers() {
      if (!pvMembersList) return;
      if (householdMembers.length === 0) {
        pvMembersList.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">暫無登記設籍人員</td></tr>';
        return;
      }

      let html = '';
      householdMembers.forEach((m, idx) => {
        html += `<tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${escapeHtml(m.name || '---')}</strong></td>
          <td>${escapeHtml(m.idNo || '---')}</td>
          <td>${escapeHtml(m.relation || '---')}</td>
        </tr>`;
      });
      pvMembersList.innerHTML = html;
    }

    // 渲染編輯面板中的人員列表
    function renderEditorMembers() {
      const container = document.getElementById('membersContainer');
      if (!container) return;

      container.innerHTML = '';
      householdMembers.forEach((member, index) => {
        const row = document.createElement('div');
        row.className = 'member-item-row';
        row.innerHTML = `
          <input type="text" class="form-control member-name" placeholder="姓名" value="${escapeHtml(member.name)}" data-index="${index}" min-height="44">
          <input type="text" class="form-control member-id" placeholder="身分證字號" value="${escapeHtml(member.idNo)}" data-index="${index}">
          <input type="text" class="form-control member-rel" placeholder="與承租人關係" value="${escapeHtml(member.relation)}" data-index="${index}">
          <button type="button" class="btn-del-item" data-index="${index}" title="刪除此設籍人員" aria-label="刪除此設籍人員">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        `;
        container.appendChild(row);
      });

      // 監聽變更
      container.querySelectorAll('.member-name').forEach(input => {
        input.addEventListener('input', e => {
          const idx = parseInt(e.target.dataset.index, 10);
          householdMembers[idx].name = e.target.value;
          renderPreviewMembers();
        });
      });

      container.querySelectorAll('.member-id').forEach(input => {
        input.addEventListener('input', e => {
          const idx = parseInt(e.target.dataset.index, 10);
          householdMembers[idx].idNo = e.target.value;
          renderPreviewMembers();
        });
      });

      container.querySelectorAll('.member-rel').forEach(input => {
        input.addEventListener('input', e => {
          const idx = parseInt(e.target.dataset.index, 10);
          householdMembers[idx].relation = e.target.value;
          renderPreviewMembers();
        });
      });

      container.querySelectorAll('.btn-del-item').forEach(btn => {
        btn.addEventListener('click', e => {
          const idx = parseInt(btn.dataset.index, 10);
          householdMembers.splice(idx, 1);
          renderEditorMembers();
          renderPreviewMembers();
        });
      });
    }

    // 新增設籍人員按鈕
    const btnAddMember = document.getElementById('btnAddMember');
    if (btnAddMember) {
      btnAddMember.addEventListener('click', function () {
        householdMembers.push({ name: '', idNo: '', relation: '家屬' });
        renderEditorMembers();
        renderPreviewMembers();
      });
    }

    // 監聽所有輸入欄位即時同步
    const inputs = [
      propAddress, landlordName, landlordPhone, landlordIdNo,
      tenantName, tenantPhone, tenantIdNo,
      leaseStartDate, leaseEndDate, vacateDays, dailyPenalty, specialTerms
    ];
    inputs.forEach(el => {
      if (el) {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
      }
    });

    // 初始化渲染
    renderEditorMembers();
    updatePreview();

    // 雙簽章畫布初始化
    initSignatureCanvas('landlordSigCanvas', 'btnClearLandlordSig', 'docLandlordSigImg');
    initSignatureCanvas('tenantSigCanvas', 'btnClearTenantSig', 'docTenantSigImg');

    // 列印按鈕
    const btnPrint = document.getElementById('btnPrintDocument');
    if (btnPrint) {
      btnPrint.addEventListener('click', function () {
        window.print();
      });
    }

    // 複製 LINE 格式文字按鈕
    const btnCopyLine = document.getElementById('btnCopyLineText');
    if (btnCopyLine) {
      btnCopyLine.addEventListener('click', function () {
        copyLineSummary();
      });
    }

    // 匯出圖卡按鈕
    const btnDownloadCard = document.getElementById('btnDownloadCard');
    if (btnDownloadCard) {
      btnDownloadCard.addEventListener('click', function () {
        downloadCertificateCard();
      });
    }
  });

  // HTML 轉義防注入
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 高精度電子手寫簽名畫布函式
  function initSignatureCanvas(canvasId, clearBtnId, previewImgId) {
    const canvas = document.getElementById(canvasId);
    const clearBtn = document.getElementById(clearBtnId);
    const previewImg = document.getElementById(previewImgId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasDrawn = false;

    // Retina 2x 縮放
    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const currentData = hasDrawn ? canvas.toDataURL() : null;

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentData) {
        const img = new Image();
        img.onload = function () {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = currentData;
      }
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

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
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function moveDraw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      syncToPreview();
    }

    function endDraw(e) {
      if (!isDrawing) return;
      isDrawing = false;
      syncToPreview();
    }

    function syncToPreview() {
      if (previewImg && hasDrawn) {
        previewImg.src = canvas.toDataURL('image/png');
        previewImg.style.display = 'block';
      }
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width * 2, rect.height * 2);
        hasDrawn = false;
        if (previewImg) {
          previewImg.src = '';
          previewImg.style.display = 'none';
        }
      });
    }
  }

  // 複製 LINE 備忘存證摘要
  function copyLineSummary() {
    const propAddress = document.getElementById('propAddress').value || '未填寫地址';
    const landlordName = document.getElementById('landlordName').value || '出租人';
    const tenantName = document.getElementById('tenantName').value || '承租人';
    const vacateDays = document.getElementById('vacateDays').value || '14';
    const dailyPenalty = parseInt(document.getElementById('dailyPenalty').value, 10) || 500;
    const membersText = householdMembers.map(m => ` • ${m.name || '未填'}（${m.relation || '家屬'}，${m.idNo || '---'}）`).join('\n');

    const lineText = `【港居不動產｜住宅租賃設籍約定暨遷出切結書備忘】
───────────────
📍 租賃物標的：${propAddress}
👤 出租人：${landlordName}
👤 承租人：${tenantName}
📋 設籍人員名冊（共 ${householdMembers.length} 人）：
${membersText || ' • 無'}
───────────────
⚖️ 核心法律約定事項：
1. 依內政部租賃契約規定准予設籍，承租人保證僅供居住合法用途。
2. 租約期滿或提前終止後【${vacateDays} 日內】，承租人及全體設籍人員應無條件將戶籍全部遷出。
3. 逾期未遷出者，每日計付違約金【新臺幣 ${dailyPenalty} 元】整，出租人得自押金優先扣抵。
4. 承租人無條件授權出租人得逕依《戶籍法》第50條第1項規定，檢附租約與本切結書向戶政事務所申辦將其全戶戶籍暫遷至該戶政事務所。
───────────────
港居不動產開發有限公司 統編 96797997
法務證書存證代碼：${document.getElementById('pvDocNo').textContent || 'HR-2026'}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lineText).then(() => {
        alert('✅ LINE 格式設籍約定備忘已成功複製到剪貼簿！');
      }).catch(() => {
        fallbackCopy(lineText);
      });
    } else {
      fallbackCopy(lineText);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('✅ LINE 格式設籍約定備忘已複製到剪貼簿！');
  }

  // Canvas 高畫質存證圖卡下載 (840×1180px)
  function downloadCertificateCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 1180;
    const ctx = canvas.getContext('2d');

    // 背景底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 840, 1180);

    // 外框裝飾
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 800, 1140);

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 784, 1124);

    // 頂部抬頭
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(30, 30, 780, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司', 420, 64);
    ctx.font = '15px "Noto Sans TC", sans-serif';
    ctx.fillText('住宅租賃設籍約定暨退租遷出切結書（存證備忘憑證）', 420, 94);

    // 存證文號與日期
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '13px "Noto Sans TC", sans-serif';
    const docNo = document.getElementById('pvDocNo').textContent || 'HR-2026';
    ctx.fillText(`存證編號：${docNo}`, 45, 140);
    ctx.textAlign = 'right';
    const dateText = document.getElementById('pvDateText').textContent || '';
    ctx.fillText(dateText, 795, 140);

    // 基本資料區塊
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(45, 155, 750, 130);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 155, 750, 130);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('租賃住宅標的：', 60, 185);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    const addr = document.getElementById('propAddress').value || '未填寫地址';
    ctx.fillText(addr, 175, 185);

    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('出租人（產權）：', 60, 220);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    const lName = document.getElementById('landlordName').value || '---';
    const lId = document.getElementById('landlordIdNo').value || '---';
    ctx.fillText(`${lName}（身分證/統編：${lId}）`, 185, 220);

    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillText('承租人（設籍）：', 60, 255);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    const tName = document.getElementById('tenantName').value || '---';
    const tId = document.getElementById('tenantIdNo').value || '---';
    ctx.fillText(`${tName}（身分證字號：${tId}）`, 185, 255);

    // 設籍人員名冊表
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('一、約定設籍人員名冊', 45, 315);

    // 表格標題
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(45, 325, 750, 32);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.fillText('項次', 65, 346);
    ctx.fillText('設籍人員姓名', 150, 346);
    ctx.fillText('身分證統一編號', 360, 346);
    ctx.fillText('與承租人關係', 620, 346);

    let curY = 357;
    householdMembers.forEach((m, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(45, curY, 750, 30);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(45, curY, 750, 30);

      ctx.fillStyle = '#1e293b';
      ctx.font = '13px "Noto Sans TC", sans-serif';
      ctx.fillText(String(i + 1), 75, curY + 20);
      ctx.fillText(m.name || '---', 150, curY + 20);
      ctx.fillText(m.idNo || '---', 360, curY + 20);
      ctx.fillText(m.relation || '---', 620, curY + 20);
      curY += 30;
    });

    // 切結約定核心法律條款
    curY += 25;
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('二、設籍與退租遷出切結條款（依戶籍法第50條合規設計）', 45, curY);

    const vacateDaysVal = document.getElementById('vacateDays').value || '14';
    const penaltyVal = parseInt(document.getElementById('dailyPenalty').value, 10) || 500;

    const clauses = [
      `1. 合法設籍保證：出租人同意承租人於租期內申辦戶籍遷入，承租人保證僅供居住設籍，絕不用於營利事業登記或非法用途。`,
      `2. 退租遷出期限：租賃契約期滿、終止或解除之日起【${vacateDaysVal} 日內】，承租人及全體設籍人員應無條件將戶籍全部遷離。`,
      `3. 懲罰性違約金：逾期未遷出者，承租人願自遲延之日起每日計付新臺幣【${penaltyVal} 元】整之懲罰性違約金，出租人得自押金逕行抵扣。`,
      `4. 授權逕為遷徙：承租人無條件授權出租人，得逕依《戶籍法》第50條第1項規定，檢附本切結書及契約終止證明，向主管戶政事務所申辦將其全戶戶籍暫遷至該戶政事務所，承租人絕無異議並自負相關行政法規罰鍰。`
    ];

    curY += 20;
    ctx.font = '13px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#334155';
    clauses.forEach(cl => {
      ctx.fillText(cl, 45, curY);
      curY += 26;
    });

    // 簽章展示區
    curY += 30;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(45, curY);
    ctx.lineTo(795, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    curY += 25;
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('立書人簽章：', 45, curY);

    const landlordSigCanvas = document.getElementById('landlordSigCanvas');
    const tenantSigCanvas = document.getElementById('tenantSigCanvas');

    // 出租人簽名欄
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(45, curY + 15, 340, 95);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(45, curY + 15, 340, 95);
    ctx.font = '12px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('出租人（或受託租賃住宅管理業）：', 55, curY + 35);
    if (landlordSigCanvas) {
      ctx.drawImage(landlordSigCanvas, 55, curY + 40, 260, 65);
    }

    // 承租人簽名欄
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(455, curY + 15, 340, 95);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(455, curY + 15, 340, 95);
    ctx.font = '12px "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('承租人（戶籍設籍切結立書人）：', 465, curY + 35);
    if (tenantSigCanvas) {
      ctx.drawImage(tenantSigCanvas, 465, curY + 40, 260, 65);
    }

    // 頁尾資訊
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('港居不動產開發有限公司 GANJU Real Estate ｜ 統編 96797997 ｜ 高市字第 01625 號', 420, 1140);

    // 下載觸發
    const link = document.createElement('a');
    link.download = `港居設籍約定切結書_${docNo}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

})();
