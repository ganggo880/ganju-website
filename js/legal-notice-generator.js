/**
 * 港居不動產開發有限公司 - 欠租催告與終止租約「郵局存證信函」產生器 (js/legal-notice-generator.js)
 * 法令依據：
 *  1. 《民法》第 440 條第 1、2 項：遲付租金總額非達二個月之租額，不得終止契約；終止前應定相當期限催告。
 *  2. 《租賃住宅市場發展及管理條例》第 10 條：出租人提前終止租約之法定事由與書面檢附事證通知義務。
 *  3. 《民法》第 451 條：租期屆滿前預為反對續租之意思表示，防範轉為不定期租賃契約。
 *  4. 中華郵政標準存證信函格式：每行 20 格、每頁 10 行（每頁 200 格），首頁存證費 50 元、續頁每頁 30 元。
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_legal_notice_gen_v1';

const PRESETS = {
  rentArrearsNotice: {
    templateType: 'rentArrearsNotice',
    senderName: '港居不動產開發有限公司（法定代理人：陳俊銘）',
    senderAddress: '高雄市小港區合作里中安路825號',
    receiverName: '林志豪 先生',
    receiverAddress: '高雄市小港區宏平路168號5樓之2（承租標的物地址）',
    ccName: '無（或填寫連帶保證人姓名）',
    ccAddress: '',
    leaseStartDate: '民國115年03月01日',
    propertyAddress: '高雄市小港區宏平路168號5樓之2',
    monthlyRent: 15000,
    depositAmount: 30000,
    arrearsMonths: 2,
    arrearsTotal: 30000,
    arrearsPeriodDesc: '民國115年9月份及10月份共計二個月',
    graceDays: 7,
    bankAccountInfo: '合作金庫銀行小港分行（代碼006）帳號末五碼66812',
    prevNoticeInfo: '高雄小港郵局第000128號存證信函',
    moveOutDeadline: '民國115年11月15日',
    breachReasonDesc: '於室內違法飼養大型犬隻且深夜製造噪音妨害社區安寧，經管理委員會多次勸導仍未改善',
    customBodyOverride: ''
  },
  leaseTerminationNotice: {
    templateType: 'leaseTerminationNotice',
    senderName: '港居不動產開發有限公司（法定代理人：陳俊銘）',
    senderAddress: '高雄市小港區合作里中安路825號',
    receiverName: '林志豪 先生',
    receiverAddress: '高雄市小港區宏平路168號5樓之2（承租標的物地址）',
    ccName: '無',
    ccAddress: '',
    leaseStartDate: '民國115年03月01日',
    propertyAddress: '高雄市小港區宏平路168號5樓之2',
    monthlyRent: 15000,
    depositAmount: 30000,
    arrearsMonths: 2.5,
    arrearsTotal: 37500,
    arrearsPeriodDesc: '民國115年9月份、10月份及11月份上半月',
    graceDays: 7,
    bankAccountInfo: '合作金庫銀行小港分行（代碼006）帳號末五碼66812',
    prevNoticeInfo: '高雄小港郵局第000128號存證信函',
    moveOutDeadline: '民國115年11月25日',
    breachReasonDesc: '',
    customBodyOverride: ''
  },
  bylawBreachNotice: {
    templateType: 'bylawBreachNotice',
    senderName: '港居不動產開發有限公司（法定代理人：陳俊銘）',
    senderAddress: '高雄市小港區合作里中安路825號',
    receiverName: '張雅筑 小姐',
    receiverAddress: '高雄市鳳山區文衡路320號8樓（承租標的物地址）',
    ccName: '無',
    ccAddress: '',
    leaseStartDate: '民國115年01月15日',
    propertyAddress: '高雄市鳳山區文衡路320號8樓',
    monthlyRent: 22000,
    depositAmount: 44000,
    arrearsMonths: 0,
    arrearsTotal: 0,
    arrearsPeriodDesc: '無欠租',
    graceDays: 7,
    bankAccountInfo: '合作金庫銀行小港分行帳號末五碼66812',
    prevNoticeInfo: '',
    moveOutDeadline: '民國115年11月30日',
    breachReasonDesc: '未經出租人書面同意擅自將承租房屋之一部轉租予第三人居住，並於公共走廊堆置雜物違反住戶規約',
    customBodyOverride: ''
  },
  expiryNonRenewalNotice: {
    templateType: 'expiryNonRenewalNotice',
    senderName: '港居不動產開發有限公司（法定代理人：陳俊銘）',
    senderAddress: '高雄市小港區合作里中安路825號',
    receiverName: '王建民 先生',
    receiverAddress: '高雄市前鎮區三多三路210號10樓之1',
    ccName: '無',
    ccAddress: '',
    leaseStartDate: '民國114年12月01日',
    propertyAddress: '高雄市前鎮區三多三路210號10樓之1',
    monthlyRent: 19500,
    depositAmount: 39000,
    arrearsMonths: 0,
    arrearsTotal: 0,
    arrearsPeriodDesc: '無欠租',
    graceDays: 10,
    bankAccountInfo: '合作金庫銀行小港分行帳號末五碼66812',
    prevNoticeInfo: '',
    moveOutDeadline: '民國115年11月30日',
    breachReasonDesc: '',
    customBodyOverride: ''
  }
};

let state = structuredClone(PRESETS.rentArrearsNotice);

export function toChineseCurrency(num) {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return '零元整';

  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '萬', '億', '兆'];

  const str = String(n);
  let result = '';
  let zeroFlag = false;
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const d = Number(str[i]);
    const pos = len - 1 - i;
    const unitIdx = pos % 4;
    const bigUnitIdx = Math.floor(pos / 4);

    if (d === 0) {
      zeroFlag = true;
    } else {
      if (zeroFlag) {
        result += '零';
        zeroFlag = false;
      }
      result += digits[d] + units[unitIdx];
    }

    if (unitIdx === 0 && bigUnitIdx > 0) {
      const groupStart = Math.max(0, len - (bigUnitIdx + 1) * 4);
      const groupEnd = len - bigUnitIdx * 4;
      const groupVal = Number(str.slice(groupStart, groupEnd));
      if (groupVal > 0) {
        result += bigUnits[bigUnitIdx];
      }
      zeroFlag = false;
    }
  }

  return `${result}元整`;
}

function formatMoney(n) {
  return Math.round(Number(n) || 0).toLocaleString('zh-TW');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // 忽略儲存限制
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      state = { ...structuredClone(PRESETS.rentArrearsNotice), ...parsed };
    }
  } catch (e) {
    // 忽略損壞快取
  }
}

// 依據範本與欄位自動合成標準存證信函法律內文
function composeDefaultLegalBody() {
  const rentChinese = toChineseCurrency(state.monthlyRent);
  const arrearsChinese = toChineseCurrency(state.arrearsTotal);

  if (state.templateType === 'rentArrearsNotice') {
    return `敬啟者：緣台端於${state.leaseStartDate}向本公司承租門牌號碼「${state.propertyAddress}」之房屋，雙方約定每月租金新臺幣（下同）${rentChinese}（NT$${formatMoney(state.monthlyRent)}），應於每月一日按期繳納。詎台端自近月起即未依約繳納租金，迄本函寄發之日止，已累計積欠${state.arrearsPeriodDesc}之租金共計${arrearsChinese}（NT$${formatMoney(state.arrearsTotal)}）。為此，特依民法第四百四十條第一項規定正式以本函催告，請台端務必於函到後${state.graceDays}日內，將上開積欠租金全數匯入指定帳戶（${state.bankAccountInfo}）。倘逾期仍未清償，且遲付租金總額達二個月之租額者，本公司即依法終止租賃契約並請求遷讓返還房屋及賠償一切損害，希勿自誤！`;
  }

  if (state.templateType === 'leaseTerminationNotice') {
    return `敬啟者：台端前向本公司承租門牌號碼「${state.propertyAddress}」之房屋，因積欠${state.arrearsPeriodDesc}之租金共計新臺幣${arrearsChinese}（NT$${formatMoney(state.arrearsTotal)}），遲付總額已達二個月之租額以上，前經本公司以「${state.prevNoticeInfo}」定相當期限催告台端清償在案。詎台端於催告期限屆滿後迄今仍置之不理，拒不給付。茲依民法第四百四十條第一項、第二項及租賃住宅市場發展及管理條例第十條第一項第二款規定，特以本函正式為「終止租賃契約」之意思表示！雙方法律關係於本函送達台端時即行消滅，請台端務必於${state.moveOutDeadline}前將屋內私人物品騰空、遷出戶籍並會同辦理屋況點交返還房屋；倘逾期未搬遷，本公司除自押金抵充欠款外，並將依法訴請強制執行及按日計收相當於租金之不當得利，特此通知。`;
  }

  if (state.templateType === 'bylawBreachNotice') {
    return `敬啟者：緣台端於${state.leaseStartDate}向本公司承租門牌號碼「${state.propertyAddress}」之房屋，依雙方租賃契約及住戶公約約定，承租人應以善良管理人之注意使用房屋並遵守社區規約。惟查台端近日有「${state.breachReasonDesc}」之違約情事，已嚴重影響社區居住品質並違反租賃住宅市場發展及管理條例第十條第一項及雙方租約規範。為此，特以本函正式催告台端，請於文到後${state.graceDays}日內立即完成改善並回復原狀；倘逾期仍未改善或再有違反，本公司即依法終止雙方租賃契約，並限期騰空返還租賃標的物，希請切實配合，以免訟累！`;
  }

  // expiryNonRenewalNotice: 租期屆滿不續租通知函（民法第451條防範默示更新）
  return `敬啟者：緣台端於${state.leaseStartDate}向本公司承租門牌號碼「${state.propertyAddress}」之房屋，雙方所訂租賃契約將於${state.moveOutDeadline}正式屆滿。茲依民法第四百五十一條規定，預先以本存證信函向台端明確表示「租期屆滿後不再續租（反對默示更新）」之意思表示。請台端於${state.moveOutDeadline}租期屆滿當日前，將屋內私人物品全數騰空、結清最後一期水電瓦斯與管理費用，並與本公司管理人員約定時間辦理現場屋況點交、鑰匙磁扣交還及押金結算退還手續。感謝承租期間之配合，特此正式通知。`;
}

function getEffectiveBodyText() {
  if (state.customBodyOverride && state.customBodyOverride.trim().length > 0) {
    return state.customBodyOverride.trim();
  }
  return composeDefaultLegalBody();
}

// 拆分為中華郵政 20格 × 10行（每頁 200 格）分頁陣列
function splitIntoPostalPages(text) {
  // 移除換行符號，以連續字元填入 20×10 格線
  const cleanChars = Array.from(String(text || '').replace(/\r?\n/g, ''));
  const CHARS_PER_ROW = 20;
  const ROWS_PER_PAGE = 10;
  const CHARS_PER_PAGE = CHARS_PER_ROW * ROWS_PER_PAGE;

  const totalChars = cleanChars.length;
  const pageCount = Math.max(1, Math.ceil(totalChars / CHARS_PER_PAGE));
  const pages = [];

  for (let p = 0; p < pageCount; p++) {
    const pageStart = p * CHARS_PER_PAGE;
    const rows = [];
    for (let r = 0; r < ROWS_PER_PAGE; r++) {
      const rowStart = pageStart + r * CHARS_PER_ROW;
      const rowCells = [];
      for (let c = 0; c < CHARS_PER_ROW; c++) {
        rowCells.push(cleanChars[rowStart + c] || '');
      }
      rows.push(rowCells);
    }
    pages.push(rows);
  }

  // 計算郵局存證費（首頁 50 元，續頁每頁 30 元）
  const postalFee = 50 + Math.max(0, pageCount - 1) * 30;

  return {
    totalChars,
    pageCount,
    postalFee,
    pages
  };
}

// 檢核《民法》第440條與《租賃專法》第10條之二個月欠租法定門檻
function renderStatutoryCheckBanner() {
  const banner = document.getElementById('statutoryAlertBanner');
  if (!banner) return;

  const months = Number(state.arrearsMonths) || 0;
  const rent = Number(state.monthlyRent) || 1;
  const totalArrears = Number(state.arrearsTotal) || 0;
  const ratio = rent > 0 ? totalArrears / rent : months;

  if (state.templateType === 'rentArrearsNotice' || state.templateType === 'leaseTerminationNotice') {
    if (ratio < 2 && months < 2) {
      banner.className = 'statutory-alert-banner warning';
      banner.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>【民法第 440 條第 2 項・法定二個月門檻防呆提醒】</strong><br>
          目前設定欠租金額（NT$ ${formatMoney(totalArrears)}）尚未達「二個月之租額（NT$ ${formatMoney(rent * 2)}）」。依《民法》第 440 條第 2 項及《租賃專法》第 10 條規定，<strong>遲付租金總額非達二個月之租額，尚不得主張終止租約</strong>，目前僅得寄發「第一階段限期繳納催告函」。
        </div>
      `;
    } else {
      banner.className = 'statutory-alert-banner';
      banner.innerHTML = `
        <i class="fa-solid fa-shield-check"></i>
        <div>
          <strong>【符合民法第 440 條＆租賃專法第 10 條法定催告／終止要件】</strong><br>
          累計欠租金額（NT$ ${formatMoney(totalArrears)}）已達二個月租額（NT$ ${formatMoney(rent * 2)}）以上！完成第一階段定相當期限（建議 ${state.graceDays} 日以上）催告後，若房客逾期仍未繳納，即可合法寄發第二階段「終止租賃契約存證信函」。
        </div>
      `;
    }
  } else {
    banner.className = 'statutory-alert-banner';
    banner.innerHTML = `
      <i class="fa-solid fa-scale-balanced"></i>
      <div>
        <strong>【符合租賃專法第 10 條＆民法第 451 條書面存證規範】</strong><br>
        以郵局存證信函（雙掛號）寄發，可由郵局留存副本三年，作為法院認定「意思表示已合法送達」之最強法律證據。
      </div>
    `;
  }
}

function renderPostalPreview() {
  renderStatutoryCheckBanner();

  const bodyText = getEffectiveBodyText();
  const bodyTextarea = document.getElementById('bodyTextPreviewInput');
  if (bodyTextarea && document.activeElement !== bodyTextarea) {
    bodyTextarea.value = bodyText;
  }

  const { totalChars, pageCount, postalFee, pages } = splitIntoPostalPages(bodyText);

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setText('statCharCount', `${totalChars} 字`);
  setText('statPageCount', `共 ${pageCount} 頁 (一式三份)`);
  setText('statPostalFee', `NT$ ${postalFee} 元 (郵局存證規費)`);

  const stack = document.getElementById('postalPagesStack');
  if (!stack) return;

  const colHeaders = Array.from({ length: 20 }, (_, i) => `<th class="col-idx">${i + 1}</th>`).join('');

  stack.innerHTML = pages
    .map((rows, pageIdx) => {
      const rowsHtml = rows
        .map((cells, rowIdx) => {
          const cellsHtml = cells.map((ch) => `<td>${escapeHtml(ch)}</td>`).join('');
          return `
            <tr>
              <td class="row-idx">${rowIdx + 1}</td>
              ${cellsHtml}
            </tr>
          `;
        })
        .join('');

      return `
        <article class="postal-sheet" aria-label="郵局存證信函第 ${pageIdx + 1} 頁">
          <div class="postal-sheet-header">
            <h3>郵局存證信函用紙（第 ${pageIdx + 1} 頁／共 ${pageCount} 頁）</h3>
            <div class="postal-sheet-sub">
              <span>存證信函字號：＿＿＿＿＿＿郵局第＿＿＿＿＿＿號</span>
              <span>交寄日期：中華民國 115 年 ＿＿ 月 ＿＿ 日</span>
            </div>
          </div>

          <div class="postal-parties-box">
            <div class="postal-party-row">
              <div class="postal-party-label">一、寄件人</div>
              <div class="postal-party-content">
                <strong>姓名：${escapeHtml(state.senderName)}</strong>
                <span>詳細地址：${escapeHtml(state.senderAddress)}</span>
              </div>
            </div>
            <div class="postal-party-row">
              <div class="postal-party-label">二、收件人</div>
              <div class="postal-party-content">
                <strong>姓名：${escapeHtml(state.receiverName)}</strong>
                <span>詳細地址：${escapeHtml(state.receiverAddress)}</span>
              </div>
            </div>
            <div class="postal-party-row">
              <div class="postal-party-label">三、副　本</div>
              <div class="postal-party-content">
                <strong>收件人：${escapeHtml(state.ccName || '無')}</strong>
                <span>詳細地址：${escapeHtml(state.ccAddress || '－')}</span>
              </div>
            </div>
          </div>

          <div class="postal-grid-wrap">
            <table class="postal-grid-table" aria-label="存證信函 20 乘 10 格線表">
              <thead>
                <tr>
                  <th class="col-idx">行\\格</th>
                  ${colHeaders}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <div class="postal-sheet-footer">
            <div>
              <span>本存證信函共 <strong>${pageCount}</strong> 頁，正本 1 份、副本 2 份，存證費新臺幣 <strong>${postalFee}</strong> 元整。</span>
              ${pageCount > 1 ? '<br><span>⚠️ 超過一頁請於各頁之間加蓋寄件人「騎縫章」。</span>' : ''}
            </div>
            <div class="postal-seal-tag">
              <i class="fa-solid fa-stamp"></i> 寄件人印章處：港居不動產(印)
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function syncFormFromState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  setVal('templateTypeSelect', state.templateType);
  setVal('senderNameInput', state.senderName);
  setVal('senderAddressInput', state.senderAddress);
  setVal('receiverNameInput', state.receiverName);
  setVal('receiverAddressInput', state.receiverAddress);
  setVal('ccNameInput', state.ccName);
  setVal('ccAddressInput', state.ccAddress);
  setVal('leaseStartDateInput', state.leaseStartDate);
  setVal('propertyAddressInput', state.propertyAddress);
  setVal('monthlyRentInput', state.monthlyRent);
  setVal('arrearsMonthsInput', state.arrearsMonths);
  setVal('arrearsTotalInput', state.arrearsTotal);
  setVal('arrearsPeriodDescInput', state.arrearsPeriodDesc);
  setVal('graceDaysInput', state.graceDays);
  setVal('bankAccountInfoInput', state.bankAccountInfo);
  setVal('prevNoticeInfoInput', state.prevNoticeInfo);
  setVal('moveOutDeadlineInput', state.moveOutDeadline);
  setVal('breachReasonDescInput', state.breachReasonDesc);

  document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.preset === state.templateType);
  });

  renderPostalPreview();
}

// 複製 LINE 最後通牒催告文字＋存證信函全文
function copyLineUltimatum() {
  const bodyText = getEffectiveBodyText();
  const lines = [
    `⚖️【港居不動產｜法務存證信函正式催告通知】`,
    `━━━━━━━━━━━━━━`,
    `收件人：${state.receiverName}`,
    `承租標的：${state.propertyAddress}`,
    `━━━━━━━━━━━━━━`,
    `【存證信函正式內文】`,
    bodyText,
    `━━━━━━━━━━━━━━`,
    `⚠️ 本函同步以中華郵政雙掛號存證信函寄送至台端通訊地址與戶籍地址，請務必於期限內處理並聯繫專員，以免進入法律強制執行程序！`,
    `📞 專員電話：0968-863-880（陳俊銘 經理）`
  ].join('\n');

  navigator.clipboard
    .writeText(lines)
    .then(() => {
      showToast('已複製「LINE 法務最後通牒＋存證信函全文」！可先傳給房客敦促立即處理', 'success');
    })
    .catch(() => {
      showToast('複製失敗，請手動複製', 'error');
    });
}

// 下載高畫質 900x1120 存證信函圖卡 (PNG)
function downloadPostalPngCard() {
  const bodyText = getEffectiveBodyText();
  const { totalChars, pageCount, postalFee, pages } = splitIntoPostalPages(bodyText);
  const firstPageRows = pages[0];

  const canvas = document.createElement('canvas');
  const W = 920;
  const H = 1120;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#1A365D';
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // 標題
  ctx.fillStyle = '#1A365D';
  ctx.font = '900 32px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('郵 局 存 證 信 函 用 紙（預覽正本）', W / 2, 72);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#4A5568';
  ctx.font = 'bold 16px "Noto Sans TC", sans-serif';
  ctx.fillText(`寄件人：${state.senderName}`, 48, 120);
  ctx.fillText(`寄件地址：${state.senderAddress}`, 48, 148);
  ctx.fillText(`收件人：${state.receiverName}`, 48, 182);
  ctx.fillText(`收件地址：${state.receiverAddress}`, 48, 210);

  // 繪製 20x10 格線
  const gridLeft = 48;
  const gridTop = 240;
  const cellW = 41;
  const cellH = 56;

  ctx.strokeStyle = '#1A365D';
  ctx.lineWidth = 2;
  ctx.strokeRect(gridLeft, gridTop, cellW * 20, cellH * 10);

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 20; c++) {
      const x = gridLeft + c * cellW;
      const y = gridTop + r * cellH;
      ctx.strokeStyle = '#CBD5E0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      const ch = firstPageRows[r][c];
      if (ch) {
        ctx.fillStyle = '#1A202C';
        ctx.font = 'bold 22px "Noto Sans TC", serif';
        ctx.textAlign = 'center';
        ctx.fillText(ch, x + cellW / 2, y + 36);
      }
    }
  }

  // 底部印鑑與資訊
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2D3748';
  ctx.font = 'bold 17px "Noto Sans TC", sans-serif';
  ctx.fillText(
    `全函字數：${totalChars} 字｜總頁數：共 ${pageCount} 頁｜預估郵局存證費：NT$ ${postalFee} 元`,
    48,
    850
  );
  ctx.fillStyle = '#718096';
  ctx.font = '15px "Noto Sans TC", sans-serif';
  ctx.fillText(
    '法規依據：《民法》第 440 條、第 451 條及《租賃住宅市場發展及管理條例》第 10 條規定辦理。',
    48,
    884
  );

  // 模擬紅色公司章與代表人小章
  ctx.save();
  ctx.translate(740, 960);
  ctx.rotate((-5 * Math.PI) / 180);
  ctx.strokeStyle = 'rgba(197, 48, 48, 0.88)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-75, -52, 150, 104);
  ctx.fillStyle = 'rgba(197, 48, 48, 0.9)';
  ctx.font = '900 17px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('港居不動產開發', 0, -18);
  ctx.fillText('法務存證專用章', 0, 10);
  ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
  ctx.fillText('統編 96797997', 0, 34);
  ctx.restore();

  const link = document.createElement('a');
  link.download = `港居存證信函_${state.receiverName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('已下載高畫質郵局存證信函預覽圖卡 (PNG)！', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  syncFormFromState();

  // 四大範本快速切換
  document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.preset;
      if (!PRESETS[key]) return;
      state = structuredClone(PRESETS[key]);
      syncFormFromState();
      saveState();
      showToast(`已載入「${chip.textContent.trim()}」標準法務範本！`, 'success');
    });
  });

  document.getElementById('templateTypeSelect')?.addEventListener('change', (e) => {
    const key = e.target.value;
    if (PRESETS[key]) {
      state = {
        ...state,
        templateType: key,
        customBodyOverride: ''
      };
      syncFormFromState();
      saveState();
    }
  });

  const bindInput = (id, key, isNum = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = isNum ? Number(el.value) || 0 : el.value;
      // 若調整每月租金或欠租月數，自動連動欠租總額
      if (key === 'monthlyRent' || key === 'arrearsMonths') {
        state.arrearsTotal = Math.round((Number(state.monthlyRent) || 0) * (Number(state.arrearsMonths) || 0));
        const totalEl = document.getElementById('arrearsTotalInput');
        if (totalEl) totalEl.value = state.arrearsTotal;
      }
      state.customBodyOverride = '';
      renderPostalPreview();
      saveState();
    });
  };

  bindInput('senderNameInput', 'senderName');
  bindInput('senderAddressInput', 'senderAddress');
  bindInput('receiverNameInput', 'receiverName');
  bindInput('receiverAddressInput', 'receiverAddress');
  bindInput('ccNameInput', 'ccName');
  bindInput('ccAddressInput', 'ccAddress');
  bindInput('leaseStartDateInput', 'leaseStartDate');
  bindInput('propertyAddressInput', 'propertyAddress');
  bindInput('monthlyRentInput', 'monthlyRent', true);
  bindInput('arrearsMonthsInput', 'arrearsMonths', true);
  bindInput('arrearsTotalInput', 'arrearsTotal', true);
  bindInput('arrearsPeriodDescInput', 'arrearsPeriodDesc');
  bindInput('graceDaysInput', 'graceDays', true);
  bindInput('bankAccountInfoInput', 'bankAccountInfo');
  bindInput('prevNoticeInfoInput', 'prevNoticeInfo');
  bindInput('moveOutDeadlineInput', 'moveOutDeadline');
  bindInput('breachReasonDescInput', 'breachReasonDesc');

  // 允許使用者直接微調存證信函內文並即時重排 20×10 格線
  const bodyTextarea = document.getElementById('bodyTextPreviewInput');
  if (bodyTextarea) {
    bodyTextarea.addEventListener('input', () => {
      state.customBodyOverride = bodyTextarea.value;
      renderPostalPreview();
      saveState();
    });
  }

  document.getElementById('resetAutoBodyBtn')?.addEventListener('click', () => {
    state.customBodyOverride = '';
    renderPostalPreview();
    saveState();
    showToast('已根據左側欄位重新自動合成標準法務正文！', 'info');
  });

  document.getElementById('copyLegalTextBtn')?.addEventListener('click', copyLineUltimatum);
  document.getElementById('downloadPostalCardBtn')?.addEventListener('click', downloadPostalPngCard);
  document.getElementById('printPostalSheetBtn')?.addEventListener('click', () => window.print());
});
