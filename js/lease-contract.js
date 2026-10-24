/**
 * js/lease-contract.js
 * 港居不動產 租賃契約與住戶公約線上產生器核心邏輯
 * 
 * 功能亮點：
 * 1. 雙向即時資料綁定（左欄編輯、右欄標準 A4 仿真紙張無縫同步）
 * 2. 中文金額大寫全自動轉換（貳萬伍仟元整、參萬元整）
 * 3. 民國年份與租賃/搬遷免租天數自動運算
 * 4. 27 條住戶公約與點交清單動態排版
 * 5. LocalStorage 草稿自動存取與防丟失
 * 6. 標準 JSON 匯出備份與還原
 * 7. 一鍵標準 A4 無痕列印與 PDF 匯出
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ganju_lease_contract_draft';

  // 中文數字大寫對照
  const CHINESE_DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const CHINESE_UNITS = ['', '拾', '佰', '仟'];
  const CHINESE_BIG_UNITS = ['', '萬', '億', '兆'];

  /**
   * 將阿拉伯數字金額轉為繁體中文大寫（新台幣 XX 元整）
   * @param {number|string} n 金額數字
   * @returns {string} 中文大寫金額
   */
  function numberToChineseAmount(n) {
    const num = Math.floor(Number(n));
    if (isNaN(num) || num <= 0) return '零元整';
    if (num === 0) return '零元整';

    let numStr = num.toString();
    let result = '';
    let zeroCount = 0;

    // 將數字以 4 位數（萬、億）為一組切分
    const groups = [];
    while (numStr.length > 0) {
      groups.push(numStr.slice(Math.max(0, numStr.length - 4)));
      numStr = numStr.slice(0, Math.max(0, numStr.length - 4));
    }

    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      let groupStr = '';
      let hasNonZero = false;

      for (let j = 0; j < g.length; j++) {
        const digit = parseInt(g[j], 10);
        const unitIdx = g.length - 1 - j;

        if (digit !== 0) {
          if (zeroCount > 0) {
            groupStr += '零';
            zeroCount = 0;
          }
          groupStr += CHINESE_DIGITS[digit] + CHINESE_UNITS[unitIdx];
          hasNonZero = true;
        } else {
          zeroCount++;
        }
      }

      if (hasNonZero) {
        result += groupStr + CHINESE_BIG_UNITS[i];
      }
    }

    return '新台幣' + result + '元整';
  }

  /**
   * 將 YYYY-MM-DD 轉為民國年月日字串 (例：民國 115 年 11 月 01 日)
   */
  function toMinguoDateString(dateStr) {
    if (!dateStr) return '___ 年 ___ 月 ___ 日';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10) - 1911;
    const month = parts[1];
    const day = parts[2];
    return `${year}年${month}月${day}日`;
  }

  /**
   * 計算兩日間隔天數（含頭尾）
   */
  function calculateDaysDiff(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  }

  /**
   * 計算租賃期間幾年幾個月
   */
  function calculateLeaseDuration(startStr, endStr) {
    if (!startStr || !endStr) return '未指定';
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '日期設定有誤';

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate() + 1;

    if (days >= 28) {
      months += 1;
      days = 0;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years === 1 && months === 0) {
      return '整整 1 年 0 個月';
    } else if (years > 0 && months > 0) {
      return `${years} 年 ${months} 個月`;
    } else if (years > 0) {
      return `${years} 年整`;
    } else {
      return `${months} 個月`;
    }
  }

  // 取得 DOM 元素工具
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /**
   * 蒐集表單資料模型
   */
  function getFormData() {
    return {
      landlordCompany: $('#landlordCompany')?.value || '',
      landlordRep: $('#landlordRep')?.value || '',
      landlordTaxId: $('#landlordTaxId')?.value || '',
      landlordLicense: $('#landlordLicense')?.value || '',
      landlordPhone: $('#landlordPhone')?.value || '',
      landlordAddress: $('#landlordAddress')?.value || '',
      bankName: $('#bankName')?.value || '',
      bankAccount: $('#bankAccount')?.value || '',

      tenantName: $('#tenantName')?.value || '',
      tenantId: $('#tenantId')?.value || '',
      tenantPhone: $('#tenantPhone')?.value || '',
      tenantBirth: $('#tenantBirth')?.value || '',
      tenantAddress: $('#tenantAddress')?.value || '',

      coTenantName: $('#coTenantName')?.value || '',
      coTenantId: $('#coTenantId')?.value || '',
      guarantorName: $('#guarantorName')?.value || '',
      guarantorRelation: $('#guarantorRelation')?.value || '',
      guarantorId: $('#guarantorId')?.value || '',
      guarantorPhone: $('#guarantorPhone')?.value || '',

      emergencyName1: $('#emergencyName1')?.value || '',
      emergencyRel1: $('#emergencyRel1')?.value || '',
      emergencyPhone1: $('#emergencyPhone1')?.value || '',
      emergencyName2: $('#emergencyName2')?.value || '',
      emergencyRel2: $('#emergencyRel2')?.value || '',
      emergencyPhone2: $('#emergencyPhone2')?.value || '',

      propAddress: $('#propAddress')?.value || '',
      propRoomNo: $('#propRoomNo')?.value || '',
      propPattern: $('#propPattern')?.value || '',
      parkingCar: $('#parkingCar')?.value || '',
      parkingMoto: $('#parkingMoto')?.value || '',

      movingStartDate: $('#movingStartDate')?.value || '',
      movingEndDate: $('#movingEndDate')?.value || '',
      leaseStartDate: $('#leaseStartDate')?.value || '',
      leaseEndDate: $('#leaseEndDate')?.value || '',

      monthlyRent: $('#monthlyRent')?.value || '15000',
      rentDueDay: $('#rentDueDay')?.value || '5',
      depositAmount: $('#depositAmount')?.value || '30000',

      mgmtFeePayer: $('input[name="mgmtFeePayer"]:checked')?.value || 'tenant',
      mgmtFeeAmount: $('#mgmtFeeAmount')?.value || '1200',
      mgmtFreeMonths: $('#mgmtFreeMonths')?.value || '0',

      utilityType: $('input[name="utilityType"]:checked')?.value || 'submeter',
      elecPricePerUnit: $('#elecPricePerUnit')?.value || '5.0',
      waterFeePerPerson: $('#waterFeePerPerson')?.value || '150',

      chkStrictSmoking: $('#chkStrictSmoking')?.checked ?? true,
      petAllowed: $('input[name="petAllowed"]:checked')?.value || 'yes',
      petDetail: $('#petDetail')?.value || '',
      petAcCleanFee: $('#petAcCleanFee')?.value || '1250',
      chkStigmatized: $('#chkStigmatized')?.checked ?? true,
      chkEmergencyEntry: $('#chkEmergencyEntry')?.checked ?? true,
      chkSevenDayPlumbing: $('#chkSevenDayPlumbing')?.checked ?? true,
      chkWallDamageFee: $('#chkWallDamageFee')?.checked ?? true,
      chkIncludeRules: $('#chkIncludeRules')?.checked ?? true,

      invAc: $('#invAc')?.value || '',
      invWaterHeater: $('#invWaterHeater')?.value || '',
      invKeys: $('#invKeys')?.value || '',
      invFridge: $('#invFridge')?.value || '',
      invBed: $('#invBed')?.value || '',
      invWardrobe: $('#invWardrobe')?.value || '',
      invInitialElec: $('#invInitialElec')?.value || '',
      invInitialWater: $('#invInitialWater')?.value || '',
      invOtherNotes: $('#invOtherNotes')?.value || ''
    };
  }

  /**
   * 將資料還原填入表單
   */
  function setFormData(data) {
    if (!data) return;
    Object.keys(data).forEach((key) => {
      const el = $(`#${key}`);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = Boolean(data[key]);
        } else {
          el.value = data[key];
        }
      }
    });

    if (data.mgmtFeePayer) {
      const radio = $(`input[name="mgmtFeePayer"][value="${data.mgmtFeePayer}"]`);
      if (radio) radio.checked = true;
    }
    if (data.utilityType) {
      const radio = $(`input[name="utilityType"][value="${data.utilityType}"]`);
      if (radio) radio.checked = true;
    }
    if (data.petAllowed) {
      const radio = $(`input[name="petAllowed"][value="${data.petAllowed}"]`);
      if (radio) radio.checked = true;
    }

    renderPreview();
  }

  /**
   * 雙向同步更新 A4 預覽畫面
   */
  function renderPreview() {
    const data = getFormData();

    // 1. 中文大寫租金與押金計算
    const rentVal = Number(data.monthlyRent) || 0;
    const rentChinese = numberToChineseAmount(rentVal).replace('新台幣', '').replace('整', '');
    const depositVal = Number(data.depositAmount) || (rentVal * 2);
    const depositChinese = numberToChineseAmount(depositVal).replace('新台幣', '').replace('整', '');

    if ($('#monthlyRentChinese')) $('#monthlyRentChinese').value = numberToChineseAmount(rentVal);
    if ($('#depositAmountChinese')) $('#depositAmountChinese').value = numberToChineseAmount(depositVal);

    // 2. 租期與免租天數
    const movingDays = calculateDaysDiff(data.movingStartDate, data.movingEndDate);
    if ($('#movingDaysText')) $('#movingDaysText').textContent = movingDays;
    const leaseDuration = calculateLeaseDuration(data.leaseStartDate, data.leaseEndDate);
    if ($('#leaseDurationText')) $('#leaseDurationText').textContent = leaseDuration;

    // 3. 批次替換通用文字元素
    $$('.view-landlord-company').forEach(el => el.textContent = data.landlordCompany || '港居不動產開發有限公司');
    $$('.view-landlord-rep').forEach(el => el.textContent = data.landlordRep || '陳俊銘');
    $$('.view-landlord-taxid').forEach(el => el.textContent = data.landlordTaxId || '96797997');
    $$('.view-landlord-license').forEach(el => el.textContent = data.landlordLicense || '(112) 登字第013739號');
    $$('.view-landlord-phone').forEach(el => el.textContent = data.landlordPhone || '0968-863-880');
    $$('.view-landlord-address').forEach(el => el.textContent = data.landlordAddress || '高雄市小港區合作里中安路825號');
    $$('.view-bank-name').forEach(el => el.textContent = data.bankName || '中華郵政（代號：700）');
    $$('.view-bank-holder').forEach(el => el.textContent = data.landlordRep || '陳俊銘');
    $$('.view-bank-account').forEach(el => el.textContent = data.bankAccount || '0045003-0000167');

    $$('.view-tenant-name').forEach(el => el.textContent = data.tenantName || '__________');
    $$('.view-tenant-id').forEach(el => el.textContent = data.tenantId || '__________');
    $$('.view-tenant-phone').forEach(el => el.textContent = data.tenantPhone || '__________');
    $$('.view-tenant-address').forEach(el => el.textContent = data.tenantAddress || '__________');

    $$('.view-guarantor-name').forEach(el => el.textContent = data.guarantorName || '（無保證人）');
    $$('.view-guarantor-relation').forEach(el => el.textContent = data.guarantorRelation || '—');
    $$('.view-guarantor-phone').forEach(el => el.textContent = data.guarantorPhone || '—');

    const emText1 = data.emergencyName1 ? `${data.emergencyName1}（${data.emergencyRel1}／${data.emergencyPhone1}）` : '無';
    const emText2 = data.emergencyName2 ? `；${data.emergencyName2}（${data.emergencyRel2}／${data.emergencyPhone2}）` : '';
    $$('.view-emergency-1').forEach(el => el.textContent = emText1 + emText2);

    $$('.view-prop-address').forEach(el => el.textContent = data.propAddress || '________________');
    $$('.view-prop-room').forEach(el => el.textContent = data.propRoomNo || '____室');
    $$('.view-prop-pattern').forEach(el => el.textContent = data.propPattern || '套房');
    $$('.view-parking-car').forEach(el => el.textContent = data.parkingCar || '無附屬車位');
    $$('.view-parking-moto').forEach(el => el.textContent = data.parkingMoto || '無附屬車位');

    $$('.view-moving-start').forEach(el => el.textContent = toMinguoDateString(data.movingStartDate));
    $$('.view-moving-end').forEach(el => el.textContent = toMinguoDateString(data.movingEndDate));
    $$('.view-moving-days').forEach(el => el.textContent = movingDays);

    $$('.view-lease-start').forEach(el => el.textContent = toMinguoDateString(data.leaseStartDate));
    $$('.view-lease-end').forEach(el => el.textContent = toMinguoDateString(data.leaseEndDate));
    $$('.view-lease-duration').forEach(el => el.textContent = leaseDuration);

    $$('.view-monthly-rent').forEach(el => el.textContent = Number(data.monthlyRent || 0).toLocaleString());
    $$('.view-monthly-rent-chinese').forEach(el => el.textContent = rentChinese + '元整');
    $$('.view-deposit').forEach(el => el.textContent = Number(depositVal).toLocaleString());
    $$('.view-deposit-chinese').forEach(el => el.textContent = depositChinese + '元整');
    $$('.view-rent-due-day').forEach(el => el.textContent = data.rentDueDay || '5');

    // 簽署日期（以租期起算日或今天為基準）
    const signDate = data.leaseStartDate ? new Date(data.leaseStartDate) : new Date();
    $$('.view-sign-year').forEach(el => el.textContent = signDate.getFullYear() - 1911);
    $$('.view-sign-month').forEach(el => el.textContent = String(signDate.getMonth() + 1).padStart(2, '0'));
    $$('.view-sign-day').forEach(el => el.textContent = String(signDate.getDate()).padStart(2, '0'));

    // 4. 管理費約定呈現
    $$('.view-mgmt-clause').forEach(el => {
      if (data.mgmtFeePayer === 'landlord') {
        el.innerHTML = '大樓管理費由 <strong>甲方（出租人）</strong> 負擔。';
      } else {
        const freeNote = Number(data.mgmtFreeMonths) > 0 ? `（首 ${data.mgmtFreeMonths} 個月享免繳優惠）` : '';
        el.innerHTML = `每月新台幣 <strong>${Number(data.mgmtFeeAmount || 0).toLocaleString()}</strong> 元整，由 <strong>乙方（承租人）</strong> 負擔並按期繳納${freeNote}。`;
      }
    });

    // 5. 水電瓦斯約定呈現
    $$('.view-utility-clause').forEach(el => {
      if (data.utilityType === 'bills') {
        el.innerHTML = '台水、台電、天然瓦斯費依公用事業出具之獨立帳單，由 <strong>乙方憑單自行按期繳納</strong>。';
      } else {
        el.innerHTML = `採用獨立分表電度每度新台幣 <strong>${data.elecPricePerUnit}</strong> 元計收；定額水費每人每月新台幣 <strong>${data.waterFeePerPerson}</strong> 元整，每月隨租金一併向甲方結清找補。`;
      }
    });

    // 6. 寵物特別條款呈現
    $$('.view-pet-clause').forEach(el => {
      if (data.petAllowed === 'no') {
        el.innerHTML = '<strong>全區嚴禁飼養任何寵物</strong>。未經甲方書面同意，私自攜帶或飼養寵物者，處以違約金 <strong>新台幣 10,000 元整</strong>，並須於 24 小時內將寵物帶離租屋處，甲方並得據此立即解除租約。';
      } else {
        el.innerHTML = `雙方合意同意飼養指定寵物：<strong>${data.petDetail || '指定寵物 1 隻'}</strong>。乙方應嚴格防止寵物製造噪音吠叫、抓咬破壞傢俱裝潢及隨意便溺異味。租期屆滿退租時，除進行全屋無異味深層打掃外，室內冷氣機須進行專業深層清洗，乙方同意負擔每台新台幣 <strong>${Number(data.petAcCleanFee || 1250).toLocaleString()}</strong> 元之冷氣清洗分攤費。`;
      }
    });

    // 6b. 共同承租人（合租人）連帶責任特約
    const coTenantSec = $('#viewCoTenantSection');
    const articleNoJurisdiction = $('#viewArticleNoJurisdiction');
    if (coTenantSec) {
      if (data.coTenantName && data.coTenantName.trim() !== '') {
        coTenantSec.style.display = 'block';
        $$('.view-cotenant-name').forEach(el => el.textContent = data.coTenantName.trim());
        $$('.view-cotenant-id').forEach(el => el.textContent = data.coTenantId ? data.coTenantId.trim() : '___________');
        if (articleNoJurisdiction) articleNoJurisdiction.textContent = '十二';
      } else {
        coTenantSec.style.display = 'none';
        if (articleNoJurisdiction) articleNoJurisdiction.textContent = '十一';
      }
    }

    // 7. 附表一 住戶公約是否列印控制
    const sheetPage3 = $('#sheetPage3');
    const sheetBadge = $('#sheetCountBadge');
    if (sheetPage3) {
      if (data.chkIncludeRules) {
        sheetPage3.style.display = 'block';
        if (sheetBadge) sheetBadge.textContent = '4';
      } else {
        sheetPage3.style.display = 'none';
        if (sheetBadge) sheetBadge.textContent = '3';
      }
    }

    // 8. 附表二 設備點交表
    if ($('#viewInvAc')) $('#viewInvAc').textContent = data.invAc;
    if ($('#viewInvWaterHeater')) $('#viewInvWaterHeater').textContent = data.invWaterHeater;
    if ($('#viewInvKeys')) $('#viewInvKeys').textContent = data.invKeys;
    if ($('#viewInvFridge')) $('#viewInvFridge').textContent = data.invFridge;
    if ($('#viewInvBed')) $('#viewInvBed').textContent = data.invBed;
    if ($('#viewInvWardrobe')) $('#viewInvWardrobe').textContent = data.invWardrobe;
    if ($('#viewInvInitialElec')) $('#viewInvInitialElec').textContent = data.invInitialElec;
    if ($('#viewInvInitialWater')) $('#viewInvInitialWater').textContent = data.invInitialWater;
    if ($('#viewInvNotes')) $('#viewInvNotes').textContent = data.invOtherNotes;

    // 自動保存到 LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  /**
   * 載入標準展示資料
   */
  function loadStandardSample() {
    const sample = {
      landlordCompany: '港居不動產開發有限公司',
      landlordRep: '陳俊銘',
      landlordTaxId: '96797997',
      landlordLicense: '(112) 登字第013739號',
      landlordPhone: '0968-863-880',
      landlordAddress: '高雄市小港區合作里中安路825號',
      bankName: '中華郵政（代號：700）',
      bankAccount: '0045003-0000167',

      tenantName: '林志豪',
      tenantId: 'E123456789',
      tenantPhone: '0912-345-678',
      tenantBirth: '78年5月12日',
      tenantAddress: '高雄市三民區覺民路100號',

      coTenantName: '',
      coTenantId: '',
      guarantorName: '林大明',
      guarantorRelation: '父子',
      guarantorId: 'E100000000',
      guarantorPhone: '0933-111-222',

      emergencyName1: '陳美玉',
      emergencyRel1: '母親',
      emergencyPhone1: '0922-333-444',
      emergencyName2: '王建宏',
      emergencyRel2: '同事',
      emergencyPhone2: '0955-666-777',

      propAddress: '高雄市小港區中安路825號5樓之2',
      propRoomNo: '502室',
      propPattern: '獨立景觀套房',
      parkingCar: '無附屬汽車位',
      parkingMoto: '1樓戶外機車區第15號',

      movingStartDate: '2026-11-01',
      movingEndDate: '2026-11-05',
      leaseStartDate: '2026-11-06',
      leaseEndDate: '2027-11-05',

      monthlyRent: '15000',
      rentDueDay: '5',
      depositAmount: '30000',

      mgmtFeePayer: 'tenant',
      mgmtFeeAmount: '1200',
      mgmtFreeMonths: '0',

      utilityType: 'submeter',
      elecPricePerUnit: '5.0',
      waterFeePerPerson: '150',

      chkStrictSmoking: true,
      petAllowed: 'yes',
      petDetail: '貓（英國短毛貓）1 隻',
      petAcCleanFee: '1250',
      chkStigmatized: true,
      chkEmergencyEntry: true,
      chkSevenDayPlumbing: true,
      chkWallDamageFee: true,
      chkIncludeRules: true,

      invAc: '1 台（附遙控器 1 支，冷房功能正常）',
      invWaterHeater: '儲熱式電熱水器 1 台（功能正常）',
      invKeys: '大門磁扣 2 支、房門鑰匙 2 支',
      invFridge: '雙門一級能效冰箱 1 台（已退冰清潔）',
      invBed: '標準雙人獨立筒床墊 1 組、實木床架 1 組',
      invWardrobe: '雙門衣櫃 1 組、書桌椅 1 套',
      invInitialElec: '1285.4 度',
      invInitialWater: '定額水費（瓦斯無）',
      invOtherNotes: '全屋牆面新油漆無釘孔，窗簾無污損，蓮蓬頭與馬桶水流暢通，已全室細清完成。'
    };

    setFormData(sample);
    if (window.GanjuUtils && window.GanjuUtils.showToast) {
      window.GanjuUtils.showToast('已成功載入港居通用契約標準範本！', 'success');
    }
  }

  /**
   * 清空重填
   */
  function resetForm() {
    if (confirm('確定要清空目前填寫的所有資料嗎？此動作無法復原。')) {
      localStorage.removeItem(STORAGE_KEY);
      const inputs = $$('.contract-form-panel input, .contract-form-panel textarea');
      inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false;
        } else {
          input.value = '';
        }
      });
      // 預設保留港居出租人預設值
      $('#landlordCompany').value = '港居不動產開發有限公司';
      $('#landlordRep').value = '陳俊銘';
      $('#landlordTaxId').value = '96797997';
      $('#landlordLicense').value = '(112) 登字第013739號';
      $('#landlordPhone').value = '0968-863-880';
      $('#landlordAddress').value = '高雄市小港區合作里中安路825號';
      $('#bankName').value = '中華郵政（代號：700）';
      $('#bankAccount').value = '0045003-0000167';
      $('#chkIncludeRules').checked = true;

      renderPreview();
      if (window.GanjuUtils && window.GanjuUtils.showToast) {
        window.GanjuUtils.showToast('已重置為空白表單', 'info');
      }
    }
  }

  /**
   * 匯出合約 JSON
   */
  function downloadJson() {
    const data = getFormData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    const tenantName = data.tenantName ? data.tenantName.trim() : '合約';
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `港居租賃契約_${tenantName}_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (window.GanjuUtils && window.GanjuUtils.showToast) {
      window.GanjuUtils.showToast('合約資料 JSON 備份檔已下載', 'success');
    }
  }

  /**
   * 匯出合約 Markdown 檔案
   */
  function downloadMarkdown() {
    const data = getFormData();
    const rentVal = Number(data.monthlyRent) || 0;
    const rentChinese = numberToChineseAmount(rentVal);
    const depositVal = Number(data.depositAmount) || (rentVal * 2);
    const depositChinese = numberToChineseAmount(depositVal);
    const movingDays = calculateDaysDiff(data.movingStartDate, data.movingEndDate);
    const leaseDuration = calculateLeaseDuration(data.leaseStartDate, data.leaseEndDate);

    let md = `# 港居不動產開發有限公司 房屋租賃契約書（通用標準版）\n\n`;
    md += `> **立契約書人**：\n`;
    md += `> **出租人（甲方）**：${data.landlordCompany} / ${data.landlordRep}\n`;
    md += `> **承租人代表（乙方）**：${data.tenantName}\n`;
    if (data.coTenantName) {
      md += `> **共同承租人（乙方B）**：${data.coTenantName}（身分證字號：${data.coTenantId}）\n`;
    }
    if (data.guarantorName) {
      md += `> **連帶保證人**：${data.guarantorName}（關係：${data.guarantorRelation}，電話：${data.guarantorPhone}）\n`;
    }
    md += `\n---\n\n`;

    md += `### 第一條：租賃標的與使用範圍\n`;
    md += `1. **房屋所在地**：${data.propAddress}（房號代號：${data.propRoomNo}，格局房型：${data.propPattern}）。\n`;
    md += `2. **附屬車位**：汽車位：${data.parkingCar}；機車位：${data.parkingMoto}。\n`;
    md += `3. 附屬設備詳如【附表二：房屋附屬設備與現況點交清單】。\n\n`;

    md += `### 第二條：租賃期限與搬遷免租期\n`;
    md += `1. **免租金搬遷期**：自 ${toMinguoDateString(data.movingStartDate)} 起至 ${toMinguoDateString(data.movingEndDate)} 止（共計 ${movingDays} 天）。\n`;
    md += `2. **正式租賃期限**：自 ${toMinguoDateString(data.leaseStartDate)} 起至 ${toMinguoDateString(data.leaseEndDate)} 止（共計 ${leaseDuration}）。\n\n`;

    md += `### 第三條：租金約定、繳納方式與違約金\n`;
    md += `1. **月租金額**：${rentChinese}（NT$ ${rentVal.toLocaleString()} 元），每月 ${data.rentDueDay} 日前繳納。\n`;
    md += `2. **指定帳戶**：${data.bankName} ｜ 戶名：${data.landlordRep} ｜ 帳號：\`${data.bankAccount}\`\n`;
    md += `3. **遲延繳納與終止契約法定要件**：遲延超過5日每日按2%加收違約金；積欠租金總額達二個月之租額經相當期限催告仍未付清，甲方得終止租約。逾期返還房屋按房租日額貳倍計算懲罰性違約金。\n\n`;

    md += `### 第四條：押金（保證金）\n`;
    md += `押金額度為 ${depositChinese}（NT$ ${depositVal.toLocaleString()} 元），簽約時一次全額交付。\n\n`;

    md += `### 第五條：大樓管理費與公用事業水電\n`;
    if (data.mgmtFeePayer === 'landlord') {
      md += `1. **大樓管理費**：由甲方負擔。\n`;
    } else {
      md += `1. **大樓管理費**：每月 NT$ ${Number(data.mgmtFeeAmount).toLocaleString()} 元，由乙方按期負擔。\n`;
    }
    if (data.utilityType === 'bills') {
      md += `2. **水電費用**：依公用事業獨立帳單由乙方自行繳納。\n\n`;
    } else {
      md += `2. **水電費用**：獨立電表每度 NT$ ${data.elecPricePerUnit} 元；定額水費每人每月 NT$ ${data.waterFeePerPerson} 元。\n\n`;
    }

    md += `### 第六條：房屋用途與嚴禁神明廳\n`;
    md += `純供住宅使用，嚴禁轉租、分租或作非法用途；室內與陽台嚴禁設立神明廳、神壇或焚香祭拜。\n\n`;

    md += `### 第七條：全面禁菸香薰規範\n`;
    md += `室內及公共陽台、梯間全面禁止吸菸（含電子煙、加熱菸）與點燃薰香。違者第一次罰款新台幣 10,000 元整並負擔全屋除臭清潔費，累犯得終止租約。\n\n`;

    md += `### 第八條：寵物飼養約定\n`;
    if (data.petAllowed === 'no') {
      md += `全區嚴禁飼養任何寵物，違者罰款新台幣 10,000 元並限期帶離。\n\n`;
    } else {
      md += `同意飼養指定寵物：${data.petDetail}。退租時每台冷氣機須進行專業深層清洗，乙方分擔每台 NT$ ${Number(data.petAcCleanFee).toLocaleString()} 元。\n\n`;
    }

    md += `### 第九條：鑰匙磁扣遺失與到場開門費\n`;
    md += `忘帶鑰匙專人到場開門日間 NT$ 500 元、夜間 NT$ 1,000 元；磁扣或鑰匙補發每支 NT$ 300 元。\n\n`;

    md += `### 第十條：凶宅防範與緊急事故破門授權\n`;
    md += `若於屋內發生非自然死亡致成凶宅，乙方（或其法定繼承人/連帶保證人）應連帶賠償懲罰性違約金新台幣 300 萬元整。重大緊急事故乙方同意警消村里長會同甲方破門入內排險。\n\n`;

    if (data.coTenantName) {
      md += `### 第十一條：共同承租人連帶責任專章特約\n`;
      md += `共同承租人負全部連帶給付責任。一人提前退租時押金不提前拆分發還，待全案期滿騰空點交後由承租人代表受領結算。\n\n`;
    }

    const jurisdictionNo = data.coTenantName ? '十二' : '十一';
    md += `### 第${jurisdictionNo}條：通訊送達與管轄法院\n`;
    md += `雙方通訊送達得以 LINE 為準，傳送滿 24 小時即視為合法送達。爭訟合意以臺灣高雄地方法院為第一審管轄法院。\n\n`;

    if (data.chkIncludeRules) {
      md += `\n---\n\n## 【附表一】通用標準住戶公約 (Master 版 27 條款)\n\n`;
      md += `（詳如契約附件，含 22:00~07:00 夜間寧靜、洗衣機 22:00~08:00 禁用、入住前 7 日管線責任劃分、3M 無痕掛鉤損壞每處賠償 500 元等規範）。\n\n`;
    }

    md += `\n---\n\n## 【附表二】房屋附屬設備點交單\n\n`;
    md += `- 冷氣：${data.invAc}\n`;
    md += `- 熱水器：${data.invWaterHeater}\n`;
    md += `- 門禁鑰匙磁扣：${data.invKeys}\n`;
    md += `- 電冰箱：${data.invFridge}\n`;
    md += `- 床組床墊：${data.invBed}\n`;
    md += `- 衣櫃桌椅：${data.invWardrobe}\n`;
    md += `- 起租電度：${data.invInitialElec} ｜ 水表瓦斯：${data.invInitialWater}\n`;
    md += `- 現況特別備註：${data.invOtherNotes}\n\n`;

    md += `\n**立約日期**：中華民國 ${new Date().getFullYear() - 1911} 年 ${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const downloadAnchor = document.createElement('a');
    const tenantName = data.tenantName ? data.tenantName.trim() : '合約';
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `港居房屋租賃契約書_${tenantName}_${dateStr}.md`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (window.GanjuUtils && window.GanjuUtils.showToast) {
      window.GanjuUtils.showToast('合約 Markdown 檔案已成功匯出下載！', 'success');
    }
  }

  /**
   * 匯入合約 JSON
   */
  function uploadJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const importedData = JSON.parse(event.target.result);
        setFormData(importedData);
        if (window.GanjuUtils && window.GanjuUtils.showToast) {
          window.GanjuUtils.showToast('合約備份檔匯入成功！', 'success');
        }
      } catch (err) {
        alert('匯入失敗：檔案格式不正確');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  /**
   * 初始化事件綁定
   */
  function initEvents() {
    // 1. 分頁標籤點擊切換
    const tabBtns = $$('.form-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        $$('.form-tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        const targetPane = $(`#${targetTab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // 2. 行動端填表 vs 預覽模式切換
    const btnViewForm = $('#btnViewForm');
    const btnViewPreview = $('#btnViewPreview');
    if (btnViewForm && btnViewPreview) {
      btnViewForm.addEventListener('click', () => {
        document.body.classList.remove('viewing-preview');
        document.body.classList.add('viewing-form');
        btnViewForm.classList.add('active');
        btnViewPreview.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      btnViewPreview.addEventListener('click', () => {
        document.body.classList.remove('viewing-form');
        document.body.classList.add('viewing-preview');
        btnViewPreview.classList.add('active');
        btnViewForm.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 3. 所有輸入欄位即時雙向更新
    const formPanel = $('.contract-form-panel');
    if (formPanel) {
      formPanel.addEventListener('input', renderPreview);
      formPanel.addEventListener('change', renderPreview);
    }

    // 4. 租金改變時，自動聯動押金為 2 個月租金
    const monthlyRentInput = $('#monthlyRent');
    if (monthlyRentInput) {
      monthlyRentInput.addEventListener('change', () => {
        const val = Number(monthlyRentInput.value) || 0;
        const depositInput = $('#depositAmount');
        if (depositInput && (!depositInput.value || Number(depositInput.value) === 0 || Number(depositInput.value) === val * 2 || confirm('是否將押金額度自動同步為 2 個月租金（NT$ ' + (val * 2).toLocaleString() + '）？'))) {
          depositInput.value = val * 2;
        }
        renderPreview();
      });
    }

    // 5. 按鈕事件綁定
    $('#btnQuickSample')?.addEventListener('click', loadStandardSample);
    $('#btnResetForm')?.addEventListener('click', resetForm);
    $('#btnDownloadMd')?.addEventListener('click', downloadMarkdown);
    $('#btnDownloadJson')?.addEventListener('click', downloadJson);
    $('#btnUploadJson')?.addEventListener('change', uploadJson);
    $('#btnPrintContract')?.addEventListener('click', () => {
      window.print();
    });

    // 6. 試算與載入存檔或預設值
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        renderPreview();
      }
    } catch (e) {
      renderPreview();
    }
  }

  // DOM 載入完成後執行初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
  } else {
    initEvents();
  }

})();
