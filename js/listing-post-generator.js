/**
 * 港居不動產開發有限公司 - 591／社群招租文案與第 33 條法定揭露合成器 (js/listing-post-generator.js)
 * 依據：
 *  1. 《租賃住宅市場發展及管理條例》第 33 條、第 36-1 條：租賃住宅服務業刊登廣告應註明服務業名稱及法定證號，內容應與事實相符
 *  2. 2024.07.15《住宅租賃定型化契約應記載事項》電費新制：明確揭露台水台電帳單計費或當期每度平均電價上限
 *  3. 業主規範：嚴格禁止顯示「不動產經紀營業員證號」（港居為租賃住宅服務業，非不動產經紀仲介業）
 */

import { showToast } from './utils.js';

const STORAGE_KEY = 'ganju_listing_post_gen_v1';

// 港居法定強制揭露常數（《租賃專法》第 33 條合規護欄）
const GANJU_STATUTORY_BLOCK = [
  '🛡️【法定租賃住宅服務業資訊揭露（依租賃專法第33條規定）】',
  '• 服務業名稱：港居不動產開發有限公司（統編：96797997）',
  '• 租賃住宅服務業登記證字號：(113)高市租登字第0012號',
  '• 租賃住宅管理人員證書字號：(112) 登字第013739號',
  '• 同業公會會員證號：高雄市租賃住宅證字第 115-046 號',
  '• 預約看房專線：0968-863-880（陳俊銘 經理）／市話 07-791-2288',
  '• 官方 LINE 預約看房：https://lin.ee/Q71pw2I',
  '• 門市地址：高雄市小港區合作里中安路825號'
].join('\n');

const PRESETS = {
  xiaogangSuite: {
    platform: '591',
    serviceMode: '包租轉租（免收仲介服務費）',
    district: '高雄市小港區',
    communityName: '中安路陽光電梯精品寓所',
    headline: '近捷運草衙／小港站・獨洗獨曬陽台美套房・可申請300億租補',
    layoutType: '獨立套房（1房1衛1陽台）',
    areaPing: 8.5,
    floorInfo: '3F / 共 6F（電梯大樓）',
    rentMonthly: 9500,
    depositMonths: '2 個月',
    mgmtFee: 500,
    parkingInfo: '一樓專屬機車位（隨到隨停）',
    utilityRule: '獨立分表計費（嚴格依台電當期每度平均電價計收、絕不超收）',
    highlights: '變頻冷暖空調、獨立滾筒洗衣機、雙門節能冰箱、乾濕分離衛浴、電子感應門鎖、24H公區監控',
    nearbyInfo: '騎車 3 分鐘達大魯閣草衙道／SKM Park、小港醫院、中安路商圈，生活採買超便利',
    allowSubsidy: true,
    allowHousehold: true,
    allowPet: false,
    allowShortTerm: false,
    includeFurniture: true,
    includeUtilityNewLaw: true
  },
  fengshan3Room: {
    platform: '591',
    serviceMode: '代管招租（港居專業租期代管）',
    district: '高雄市鳳山區',
    communityName: '文山特區綠園道景觀名邸',
    headline: '文山特區高樓層採光三房平車・台水台電帳單計費・可租補入籍',
    layoutType: '整層住家（3房2廳2衛2陽台）',
    areaPing: 38.2,
    floorInfo: '11F / 共 15F（24H飯店式管理大樓）',
    rentMonthly: 26500,
    depositMonths: '2 個月',
    mgmtFee: 2400,
    parkingInfo: '含 B2 坡道平面大車位 1 席＋固定機車位',
    utilityRule: '依台灣電力公司、台灣自來水公司正式帳單由房客自行繳納',
    highlights: '全室大金變頻冷氣、系統衣櫃、林內廚具設備、雙衛浴皆開窗、代收包裹與環保室免追垃圾車',
    nearbyInfo: '步行 2 分鐘即達文山特區美食街、全聯、星巴克，近澄清湖與正義車站，優質明星學區',
    allowSubsidy: true,
    allowHousehold: true,
    allowPet: true,
    allowShortTerm: false,
    includeFurniture: true,
    includeUtilityNewLaw: true
  },
  qianzhen2Room: {
    platform: 'fb',
    serviceMode: '包租轉租（免收仲介服務費）',
    district: '高雄市前鎮區',
    communityName: '三多商圈亞灣輕奢寓所',
    headline: '三多捷運步行5分鐘・北歐風質感兩房・可養貓可申請300億租補',
    layoutType: '整層住家（2房2廳1衛1陽台）',
    areaPing: 22.0,
    floorInfo: '8F / 共 14F（電梯管理大樓）',
    rentMonthly: 21000,
    depositMonths: '2 個月',
    mgmtFee: 1500,
    parkingInfo: '含固定室內機車位，大樓另可租平面車位',
    utilityRule: '依台水、台電正式帳單自行繳費，透明公開',
    highlights: '全新系統裝潢、貓咪友善空間、IH感應爐廚房、洗脫烘衣機、55吋智慧聯網電視',
    nearbyInfo: '緊鄰大遠百、SOGO、新光三越三多商圈，近亞洲新灣區與總圖書館，通勤上班族最愛',
    allowSubsidy: true,
    allowHousehold: true,
    allowPet: true,
    allowShortTerm: false,
    includeFurniture: true,
    includeUtilityNewLaw: true
  }
};

let state = structuredClone(PRESETS.xiaogangSuite);
let uploadedPhotoImg = null;

function formatMoney(n) {
  return Math.round(Number(n) || 0).toLocaleString('zh-TW');
}

// 過濾違規字眼（嚴禁顯示不動產經紀營業員證號）
function sanitizeComplianceText(str) {
  return String(str || '').replace(/營業員證號|經紀營業員/g, '租賃住宅管理人員');
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
      state = { ...structuredClone(PRESETS.xiaogangSuite), ...parsed };
    }
  } catch (e) {
    // 忽略損壞快取
  }
}

function buildFeatureBadges() {
  const tags = [];
  if (state.allowSubsidy) tags.push('✅ 可申請300億租金補貼');
  if (state.allowHousehold) tags.push('✅ 可遷入戶籍／報稅');
  if (state.allowPet) tags.push('🐾 寵物友善（需簽寵物公約）');
  if (state.includeFurniture) tags.push('🛋️ 家具家電齊全・一卡皮箱入住');
  if (state.includeUtilityNewLaw) tags.push('⚡ 符合2024租賃電費新制');
  if (state.allowShortTerm) tags.push('📅 可談短期租約');
  return tags;
}

// 產生三大平台專屬招租文案
function generateCopyText() {
  const tags = buildFeatureBadges();
  const cleanHighlights = sanitizeComplianceText(state.highlights);
  const cleanNearby = sanitizeComplianceText(state.nearbyInfo);
  const cleanHeadline = sanitizeComplianceText(state.headline);

  if (state.platform === '591') {
    return [
      `【${state.district}｜${cleanHeadline}】`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📍 物件社區：${state.district}・${state.communityName}`,
      `🏠 格局型態：${state.layoutType}｜室內約 ${state.areaPing} 坪`,
      `🏢 所在樓層：${state.floorInfo}`,
      `💰 每月租金：NT$ ${formatMoney(state.rentMonthly)} 元／月（押金：${state.depositMonths}）`,
      `🛡️ 服務型態：${state.serviceMode}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✨【本案核心福利與租屋保障】`,
      tags.map((t) => `  • ${t}`).join('\n'),
      ``,
      `🛋️【室內設備與空間亮點】`,
      `  • ${cleanHighlights}`,
      `  • 港居專業包租代管團隊駐點服務，入住期間水電修繕、設備維護皆有專人線上報修追蹤！`,
      ``,
      `🚇【生活機能與交通優勢】`,
      `  • ${cleanNearby}`,
      ``,
      `💡【相關費用與計收標準（透明公開）】`,
      `  • 大樓管理／清潔費：${Number(state.mgmtFee) > 0 ? `NT$ ${formatMoney(state.mgmtFee)} 元／月` : '已含於租金內'}`,
      `  • 車位配置：${state.parkingInfo}`,
      `  • 水電計費：${state.utilityRule}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      GANJU_STATUTORY_BLOCK
    ].join('\n');
  }

  if (state.platform === 'fb') {
    const districtShort = state.district.replace('高雄市', '');
    return [
      `🔥【#${districtShort}租屋｜${cleanHeadline}】🔥`,
      `💰 月租只要 NT$ ${formatMoney(state.rentMonthly)} 元！${state.allowSubsidy ? '（還可申請300億租金補貼🎉）' : ''}`,
      ``,
      `📌 地區社區：${state.district} ${state.communityName}`,
      `📌 空間格局：${state.layoutType}（約 ${state.areaPing} 坪｜${state.floorInfo}）`,
      `📌 車位資訊：${state.parkingInfo}`,
      `📌 水電計費：${state.utilityRule}`,
      ``,
      `🌟 必看亮點特色：`,
      ...tags.map((t) => `✔ ${t}`),
      `✔ 設備齊全：${cleanHighlights}`,
      `✔ 機能便利：${cleanNearby}`,
      `✔ 服務型態：${state.serviceMode}`,
      ``,
      `📲 好房不等人！立即點擊官方 LINE 預約看房：`,
      `👉 https://lin.ee/Q71pw2I （私訊請截圖本貼文）`,
      ``,
      GANJU_STATUTORY_BLOCK,
      `#高雄租屋 #${districtShort}租屋 #高雄包租代管 #可申請租金補貼 #台水台電 #港居不動產`
    ].join('\n');
  }

  // LINE 社群／VIP 招租速報短文版
  return [
    `📢【港居精選招租速報｜${state.district}】`,
    `🏠 ${cleanHeadline}`,
    `━━━━━━━━━━━━━━`,
    `• 格局坪數：${state.layoutType}（${state.areaPing} 坪｜${state.floorInfo}）`,
    `• 每月租金：NT$ ${formatMoney(state.rentMonthly)} 元（管理費 ${Number(state.mgmtFee) > 0 ? `${formatMoney(state.mgmtFee)} 元` : '內含'}）`,
    `• 專屬福利：${tags.slice(0, 3).join('｜')}`,
    `• 亮點設備：${cleanHighlights}`,
    `• 水電計費：${state.utilityRule}`,
    `━━━━━━━━━━━━━━`,
    `📲 一鍵加 LINE 預約看房：https://lin.ee/Q71pw2I`,
    `📞 專員電話：0968-863-880（陳俊銘經理）`,
    `🛡️ 港居不動產開發有限公司｜(113)高市租登字第0012號｜(112)登字第013739號（${state.serviceMode}）`
  ].join('\n');
}

// 繪製 1080x1080 社群招租亮點首圖（含第33條法定證號底部合規條）
function renderSocialPosterCanvas() {
  const canvas = document.getElementById('posterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // 1. 底圖（若使用者已上傳照片則裁切鋪滿上半部，否則繪製奢華海軍藍建築幾何質感漸層）
  if (uploadedPhotoImg) {
    const imgRatio = uploadedPhotoImg.width / uploadedPhotoImg.height;
    const targetH = 680;
    const targetRatio = W / targetH;
    let sx = 0,
      sy = 0,
      sw = uploadedPhotoImg.width,
      sh = uploadedPhotoImg.height;
    if (imgRatio > targetRatio) {
      sw = uploadedPhotoImg.height * targetRatio;
      sx = (uploadedPhotoImg.width - sw) / 2;
    } else {
      sh = uploadedPhotoImg.width / targetRatio;
      sy = (uploadedPhotoImg.height - sh) / 2;
    }
    ctx.drawImage(uploadedPhotoImg, sx, sy, sw, sh, 0, 0, W, targetH);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, 680);
    grad.addColorStop(0, '#0F2341');
    grad.addColorStop(0.55, '#1A365D');
    grad.addColorStop(1, '#2A4A7F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 680);

    // 幾何裝飾格線與金色光暈
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.18)';
    ctx.lineWidth = 2;
    for (let x = 80; x < W; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 140, 680);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(197, 160, 89, 0.22)';
    ctx.font = '900 110px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GANJU LIVING', 70, 310);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 38px "Noto Sans TC", sans-serif';
    ctx.fillText(`📍 ${state.district}・${state.communityName}`, 70, 410);
  }

  // 2. 頂部左上角品牌與合法特許膠囊
  ctx.fillStyle = 'rgba(15, 35, 65, 0.9)';
  ctx.fillRect(44, 42, 470, 64);
  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 42, 470, 64);

  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
  ctx.fillText('🏆 港居不動產｜高質感住宅包租代管', 66, 83);

  // 3. 右上角「可申請300億租金補貼」金章
  if (state.allowSubsidy) {
    ctx.fillStyle = '#C5A059';
    ctx.fillRect(680, 42, 356, 64);
    ctx.fillStyle = '#0F2341';
    ctx.font = '900 25px "Noto Sans TC", sans-serif';
    ctx.fillText('🔥 可申請 300 億租金補貼', 704, 83);
  }

  // 4. 下半部深海藍主資訊面板
  ctx.fillStyle = '#0F2341';
  ctx.fillRect(0, 620, W, H - 620);

  ctx.fillStyle = '#C5A059';
  ctx.fillRect(0, 620, W, 8);

  // 區域＋格局膠囊列
  ctx.fillStyle = 'rgba(197, 160, 89, 0.2)';
  ctx.fillRect(54, 654, 620, 48);
  ctx.fillStyle = '#E2C785';
  ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
  ctx.fillText(`${state.district}｜${state.layoutType}｜約 ${state.areaPing} 坪｜${state.floorInfo}`, 72, 687);

  // 大標題（自動截斷保護）
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 40px "Noto Sans TC", sans-serif';
  const titleLine = state.headline.slice(0, 22);
  ctx.fillText(titleLine, 54, 756);

  // 3 個核心賣點標籤
  const badgeTexts = [
    state.allowSubsidy ? '✔ 可申請租金補貼' : '✔ 屋況優質免整理',
    state.allowHousehold ? '✔ 可入籍／報稅' : '✔ 專人修繕管理',
    state.includeUtilityNewLaw ? '✔ 符合2024電費新制' : '✔ 設備齊全拎包入住',
    state.allowPet ? '✔ 寵物友善空間' : `✔ ${state.serviceMode.slice(0, 8)}`
  ];
  ctx.fillStyle = '#CBD5E0';
  ctx.font = 'bold 23px "Noto Sans TC", sans-serif';
  ctx.fillText(badgeTexts.join('   '), 54, 815);

  // 醒目月租價格卡
  ctx.fillStyle = '#1A365D';
  ctx.fillRect(54, 845, W - 108, 118);
  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 845, W - 108, 118);

  ctx.fillStyle = '#E2C785';
  ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
  ctx.fillText('每月租金 (NT$)', 84, 892);

  ctx.fillStyle = '#C5A059';
  ctx.font = '900 54px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
  ctx.fillText(`NT$ ${formatMoney(state.rentMonthly)}`, 84, 946);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 23px "Noto Sans TC", sans-serif';
  ctx.fillText(`📞 賞屋專線：0968-863-880 陳經理`, 540, 892);
  ctx.fillStyle = '#68D391';
  ctx.fillText(`💬 官方 LINE：@ganju (點擊連結秒約)`, 540, 938);

  // 5. 底部《租賃專法》第 33 條強制法定揭露防罰條
  ctx.fillStyle = '#091526';
  ctx.fillRect(0, 990, W, 90);
  ctx.fillStyle = '#A0AEC0';
  ctx.font = '600 18px "Noto Sans TC", sans-serif';
  ctx.fillText(
    '【租賃專法第33條法定揭露】港居不動產開發有限公司｜統編：96797997｜服務業登記證：(113)高市租登字第0012號',
    44,
    1026
  );
  ctx.fillText(
    `租賃住宅管理人員證號：(112) 登字第013739號｜公會字號：高市租賃證字第115-046號｜型態：${state.serviceMode}`,
    44,
    1058
  );
}

function syncUI() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setVal('serviceModeSelect', state.serviceMode);
  setVal('districtSelect', state.district);
  setVal('communityNameInput', state.communityName);
  setVal('headlineInput', state.headline);
  setVal('layoutTypeInput', state.layoutType);
  setVal('areaPingInput', state.areaPing);
  setVal('floorInfoInput', state.floorInfo);
  setVal('rentMonthlyInput', state.rentMonthly);
  setVal('depositMonthsSelect', state.depositMonths);
  setVal('mgmtFeeInput', state.mgmtFee);
  setVal('parkingInfoInput', state.parkingInfo);
  setVal('utilityRuleSelect', state.utilityRule);
  setVal('highlightsInput', state.highlights);
  setVal('nearbyInfoInput', state.nearbyInfo);

  setCheck('allowSubsidyCheck', state.allowSubsidy);
  setCheck('allowHouseholdCheck', state.allowHousehold);
  setCheck('allowPetCheck', state.allowPet);
  setCheck('allowShortTermCheck', state.allowShortTerm);
  setCheck('includeFurnitureCheck', state.includeFurniture);
  setCheck('includeUtilityNewLawCheck', state.includeUtilityNewLaw);

  document.querySelectorAll('.platform-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.platform === state.platform);
  });

  const outputEl = document.getElementById('copyOutputTextarea');
  if (outputEl) {
    outputEl.value = generateCopyText();
  }

  renderSocialPosterCanvas();
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  syncUI();

  // 範例快速切換
  document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.preset;
      if (!PRESETS[key]) return;
      document.querySelectorAll('.preset-chip[data-preset]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state = structuredClone(PRESETS[key]);
      syncUI();
      saveState();
      showToast(`已載入「${chip.textContent.trim()}」招租範本！`, 'success');
    });
  });

  // 平台頁籤切換 (591 / FB / LINE)
  document.querySelectorAll('.platform-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.platform = btn.dataset.platform || '591';
      syncUI();
      saveState();
    });
  });

  // 綁定輸入框
  const bindField = (id, key, isNum = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = isNum ? Number(el.value) || 0 : el.value;
      syncUI();
      saveState();
    });
  };

  bindField('serviceModeSelect', 'serviceMode');
  bindField('districtSelect', 'district');
  bindField('communityNameInput', 'communityName');
  bindField('headlineInput', 'headline');
  bindField('layoutTypeInput', 'layoutType');
  bindField('areaPingInput', 'areaPing', true);
  bindField('floorInfoInput', 'floorInfo');
  bindField('rentMonthlyInput', 'rentMonthly', true);
  bindField('depositMonthsSelect', 'depositMonths');
  bindField('mgmtFeeInput', 'mgmtFee', true);
  bindField('parkingInfoInput', 'parkingInfo');
  bindField('utilityRuleSelect', 'utilityRule');
  bindField('highlightsInput', 'highlights');
  bindField('nearbyInfoInput', 'nearbyInfo');

  const bindCheck = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      state[key] = el.checked;
      syncUI();
      saveState();
    });
  };

  bindCheck('allowSubsidyCheck', 'allowSubsidy');
  bindCheck('allowHouseholdCheck', 'allowHousehold');
  bindCheck('allowPetCheck', 'allowPet');
  bindCheck('allowShortTermCheck', 'allowShortTerm');
  bindCheck('includeFurnitureCheck', 'includeFurniture');
  bindCheck('includeUtilityNewLawCheck', 'includeUtilityNewLaw');

  // 上傳房源實景照片合成首圖
  const photoInput = document.getElementById('posterPhotoInput');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          uploadedPhotoImg = img;
          renderSocialPosterCanvas();
          showToast('已套用房源實景照並合成第 33 條法定揭露首圖！', 'success');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  document.getElementById('resetPosterPhotoBtn')?.addEventListener('click', () => {
    uploadedPhotoImg = null;
    if (photoInput) photoInput.value = '';
    renderSocialPosterCanvas();
    showToast('已恢復預設品牌幾何質感底圖', 'info');
  });

  // 複製文案按鈕
  document.getElementById('copyPostTextBtn')?.addEventListener('click', () => {
    const outputEl = document.getElementById('copyOutputTextarea');
    const text = outputEl ? outputEl.value : generateCopyText();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('已複製含第 33 條法定證號之招租文案！可直接貼上 591／FB／LINE', 'success');
      })
      .catch(() => {
        showToast('複製失敗，請手動選取複製', 'error');
      });
  });

  // 下載 1080x1080 社群首圖 PNG
  document.getElementById('downloadPosterBtn')?.addEventListener('click', () => {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `港居招租首圖_${state.district}_${state.communityName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已下載 1080×1080 社群招租亮點首圖 (PNG)！', 'success');
  });

  // A4 物件招租 DM 列印
  document.getElementById('printDmBtn')?.addEventListener('click', () => {
    window.print();
  });
});
