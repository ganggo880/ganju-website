/**
 * 港居不動產 - 住宅租賃租約公證聲請暨逕受強制執行約定書產生器
 * 檔案路徑: js/lease-notarization-agreement.js
 * 依據: 《公證法》第 13 條、《公證法》第 109 條、《強制執行法》第 4 條及司法院公證費用標準
 */

(function () {
  "use strict";

  // 金融繁體大寫國字轉換函數
  function toChineseFinancialNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return "零元整";
    num = Math.floor(Math.abs(Number(num)));
    if (num === 0) return "零元整";

    const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
    const units = ["", "拾", "佰", "仟"];
    const bigUnits = ["", "萬", "億", "兆"];

    let str = "";
    let unitPos = 0;
    let zero = true;

    while (num > 0) {
      const section = num % 10000;
      if (section > 0) {
        let secStr = "";
        let secZero = false;
        let temp = section;
        for (let i = 0; i < 4; i++) {
          const d = temp % 10;
          if (d === 0) {
            if (!secZero && secStr !== "") {
              secStr = digits[0] + secStr;
              secZero = true;
            }
          } else {
            secStr = digits[d] + units[i] + secStr;
            secZero = false;
          }
          temp = Math.floor(temp / 10);
        }
        str = secStr + bigUnits[unitPos] + str;
      } else if (str !== "" && !str.startsWith(digits[0])) {
        str = digits[0] + str;
      }
      unitPos++;
      num = Math.floor(num / 10000);
    }
    return str.replace(/零+/g, "零").replace(/零萬/g, "萬") + "元整";
  }

  // 司法院公證費用計費標準（依公證法與司法院標準）
  function calculateJudicialNotaryFee(baseAmount, hasEnforcement) {
    let fee = 1000;
    if (baseAmount <= 200000) {
      fee = 1000;
    } else if (baseAmount <= 500000) {
      fee = 2000;
    } else if (baseAmount <= 1000000) {
      fee = 3000;
    } else if (baseAmount <= 2000000) {
      fee = 4000;
    } else if (baseAmount <= 5000000) {
      fee = 5000;
    } else if (baseAmount <= 10000000) {
      fee = 6000;
    } else if (baseAmount <= 20000000) {
      fee = 8000;
    } else if (baseAmount <= 50000000) {
      fee = 10000;
    } else {
      const excess = Math.ceil((baseAmount - 50000000) / 10000000);
      fee = 10000 + excess * 2000;
    }

    // 依《公證法》第 109 條：載明逕受強制執行者，加收二分之一 (50%)
    if (hasEnforcement) {
      fee = Math.round(fee * 1.5);
    }

    return fee;
  }

  // 簽名板類別
  class RetinaSignPad {
    constructor(canvasId, clearBtnId) {
      this.canvas = document.getElementById(canvasId);
      this.clearBtn = document.getElementById(clearBtnId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext("2d");
      this.isDrawing = false;
      this.hasSigned = false;

      this.setupCanvas();
      this.bindEvents();
    }

    setupCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.ctx.strokeStyle = "#0f2b48";
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
    }

    bindEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top,
        };
      };

      const start = (e) => {
        e.preventDefault();
        this.isDrawing = true;
        const pos = getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      };

      const move = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.hasSigned = true;
        updatePreviewSignatures();
      };

      const end = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
      };

      this.canvas.addEventListener("mousedown", start);
      this.canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);

      this.canvas.addEventListener("touchstart", start, { passive: false });
      this.canvas.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end);

      if (this.clearBtn) {
        this.clearBtn.addEventListener("click", () => {
          this.clear();
        });
      }

      window.addEventListener("resize", () => {
        // 重置時保留已簽
      });
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 2;
      this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
      this.hasSigned = false;
      updatePreviewSignatures();
    }

    toDataURL() {
      if (!this.hasSigned) return null;
      return this.canvas.toDataURL("image/png");
    }
  }

  // 實例化狀態
  let landlordPad = null;
  let tenantPad = null;

  // DOM 元素引用
  const elements = {
    // 房屋資訊
    propertyAddress: document.getElementById("propertyAddress"),
    leaseStartDate: document.getElementById("leaseStartDate"),
    leaseEndDate: document.getElementById("leaseEndDate"),
    leaseMonths: document.getElementById("leaseMonths"),
    monthlyRent: document.getElementById("monthlyRent"),
    depositAmount: document.getElementById("depositAmount"),
    taxableHouseValue: document.getElementById("taxableHouseValue"),

    // 出租人
    landlordName: document.getElementById("landlordName"),
    landlordId: document.getElementById("landlordId"),
    landlordPhone: document.getElementById("landlordPhone"),
    landlordAddress: document.getElementById("landlordAddress"),
    landlordAgent: document.getElementById("landlordAgent"),

    // 承租人
    tenantName: document.getElementById("tenantName"),
    tenantId: document.getElementById("tenantId"),
    tenantPhone: document.getElementById("tenantPhone"),
    tenantAddress: document.getElementById("tenantAddress"),
    tenantAgent: document.getElementById("tenantAgent"),

    // 連帶保證人
    guarantorName: document.getElementById("guarantorName"),
    guarantorId: document.getElementById("guarantorId"),
    guarantorPhone: document.getElementById("guarantorPhone"),

    // 強制執行勾選項目
    enforceEviction: document.getElementById("enforceEviction"),
    enforceRentArrears: document.getElementById("enforceRentArrears"),
    enforceDepositReturn: document.getElementById("enforceDepositReturn"),
    enforceGuarantor: document.getElementById("enforceGuarantor"),

    // 費用負擔
    feePayer: document.getElementById("feePayer"),

    // 公證處
    notaryOfficeName: document.getElementById("notaryOfficeName"),
    docSerialNo: document.getElementById("docSerialNo"),

    // 費用試算輸出
    totalRentCalc: document.getElementById("totalRentCalc"),
    higherValCalc: document.getElementById("higherValCalc"),
    enforceExtraCalc: document.getElementById("enforceExtraCalc"),
    totalFeeCalc: document.getElementById("totalFeeCalc"),
    splitFeeCalc: document.getElementById("splitFeeCalc"),

    // 預覽區元素
    previewDocSerial: document.getElementById("previewDocSerial"),
    previewOffice: document.getElementById("previewOffice"),
    previewAddress: document.getElementById("previewAddress"),
    previewPeriod: document.getElementById("previewPeriod"),
    previewRentWords: document.getElementById("previewRentWords"),
    previewDepositWords: document.getElementById("previewDepositWords"),
    previewTotalRentWords: document.getElementById("previewTotalRentWords"),
    previewHouseValue: document.getElementById("previewHouseValue"),
    previewFeeTotal: document.getElementById("previewFeeTotal"),
    previewFeePayer: document.getElementById("previewFeePayer"),

    previewLandlordName: document.getElementById("previewLandlordName"),
    previewLandlordId: document.getElementById("previewLandlordId"),
    previewLandlordPhone: document.getElementById("previewLandlordPhone"),
    previewLandlordAddress: document.getElementById("previewLandlordAddress"),

    previewTenantName: document.getElementById("previewTenantName"),
    previewTenantId: document.getElementById("previewTenantId"),
    previewTenantPhone: document.getElementById("previewTenantPhone"),
    previewTenantAddress: document.getElementById("previewTenantAddress"),

    previewGuarantorRow: document.getElementById("previewGuarantorRow"),
    previewGuarantorMeta: document.getElementById("previewGuarantorMeta"),

    previewEnforceClauses: document.getElementById("previewEnforceClauses"),

    previewLandlordSigImg: document.getElementById("previewLandlordSigImg"),
    previewTenantSigImg: document.getElementById("previewTenantSigImg"),
    previewPrintDate: document.getElementById("previewPrintDate"),

    // 操作按鈕
    btnPrint: document.getElementById("btnPrint"),
    btnDownloadCard: document.getElementById("btnDownloadCard"),
    btnCopyLine: document.getElementById("btnCopyLine"),
  };

  // 取得數值工具
  function getNum(elem) {
    if (!elem) return 0;
    const v = parseFloat(elem.value);
    return isNaN(v) ? 0 : v;
  }

  // 格式化千分位
  function fmt(num) {
    return Number(num || 0).toLocaleString("zh-TW");
  }

  // 即時計算公證費用並更新
  function updateCalculations() {
    const monthly = getNum(elements.monthlyRent);
    const months = Math.max(1, getNum(elements.leaseMonths));
    const totalRent = monthly * months;
    const houseVal = getNum(elements.taxableHouseValue);
    const deposit = getNum(elements.depositAmount);

    // 比較總租金與房屋現值，以較高者為公證標的價額
    const baseValue = Math.max(totalRent, houseVal);

    // 檢查是否有勾選強制執行條款
    const hasEnforce =
      elements.enforceEviction.checked ||
      elements.enforceRentArrears.checked ||
      elements.enforceDepositReturn.checked ||
      elements.enforceGuarantor.checked;

    const totalFee = calculateJudicialNotaryFee(baseValue, hasEnforce);

    // 費用分擔
    let splitText = "";
    const payer = elements.feePayer.value;
    if (payer === "split") {
      splitText = `雙方各負擔一半：NT$ ${fmt(Math.round(totalFee / 2))} 元 / 人`;
    } else if (payer === "landlord") {
      splitText = `出租人全額負擔：NT$ ${fmt(totalFee)} 元`;
    } else {
      splitText = `承租人全額負擔：NT$ ${fmt(totalFee)} 元`;
    }

    // 更新計算箱
    if (elements.totalRentCalc) elements.totalRentCalc.textContent = `NT$ ${fmt(totalRent)}`;
    if (elements.higherValCalc) {
      const compLabel = totalRent >= houseVal ? "（租金總額較高）" : "（房屋現值較高）";
      elements.higherValCalc.textContent = `NT$ ${fmt(baseValue)} ${compLabel}`;
    }
    if (elements.enforceExtraCalc) {
      elements.enforceExtraCalc.textContent = hasEnforce ? "是（+50% 加成）" : "無（標準規費）";
    }
    if (elements.totalFeeCalc) elements.totalFeeCalc.textContent = `NT$ ${fmt(totalFee)} 元`;
    if (elements.splitFeeCalc) elements.splitFeeCalc.textContent = splitText;

    // 更新右側預覽
    if (elements.previewDocSerial) elements.previewDocSerial.textContent = elements.docSerialNo.value || "GJ-NOTARY-2026";
    if (elements.previewOffice) elements.previewOffice.textContent = elements.notaryOfficeName.value || "臺灣高雄地方法院所屬民間公證人事務所";
    if (elements.previewAddress) elements.previewAddress.textContent = elements.propertyAddress.value || "高雄市前鎮區中華五路 888 號 12 樓";
    if (elements.previewPeriod) {
      elements.previewPeriod.textContent = `自民國 ${elements.leaseStartDate.value || "2026-11-01"} 起至民國 ${elements.leaseEndDate.value || "2027-10-31"} 止（計 ${months} 個月）`;
    }
    if (elements.previewRentWords) elements.previewRentWords.textContent = `新臺幣 ${fmt(monthly)} 元（${toChineseFinancialNumber(monthly)}）`;
    if (elements.previewDepositWords) elements.previewDepositWords.textContent = `新臺幣 ${fmt(deposit)} 元（${toChineseFinancialNumber(deposit)}）`;
    if (elements.previewTotalRentWords) elements.previewTotalRentWords.textContent = `新臺幣 ${fmt(totalRent)} 元（${toChineseFinancialNumber(totalRent)}）`;
    if (elements.previewHouseValue) elements.previewHouseValue.textContent = `新臺幣 ${fmt(houseVal)} 元（${toChineseFinancialNumber(houseVal)}）`;
    if (elements.previewFeeTotal) elements.previewFeeTotal.textContent = `新臺幣 ${fmt(totalFee)} 元整（核算標的額：NT$ ${fmt(baseValue)}）`;
    if (elements.previewFeePayer) elements.previewFeePayer.textContent = splitText;

    // 出租人預覽
    if (elements.previewLandlordName) elements.previewLandlordName.textContent = elements.landlordName.value || "港居不動產開發有限公司";
    if (elements.previewLandlordId) elements.previewLandlordId.textContent = elements.landlordId.value || "96797997";
    if (elements.previewLandlordPhone) elements.previewLandlordPhone.textContent = elements.landlordPhone.value || "07-7933993";
    if (elements.previewLandlordAddress) elements.previewLandlordAddress.textContent = elements.landlordAddress.value || "高雄市小港區中安路 880 號";

    // 承租人預覽
    if (elements.previewTenantName) elements.previewTenantName.textContent = elements.tenantName.value || "陳○明";
    if (elements.previewTenantId) elements.previewTenantId.textContent = elements.tenantId.value || "E123456789";
    if (elements.previewTenantPhone) elements.previewTenantPhone.textContent = elements.tenantPhone.value || "0912-345-678";
    if (elements.previewTenantAddress) elements.previewTenantAddress.textContent = elements.tenantAddress.value || "高雄市前鎮區成功二路 100 號";

    // 連帶保證人
    const guarName = elements.guarantorName.value.trim();
    if (guarName) {
      if (elements.previewGuarantorRow) elements.previewGuarantorRow.style.display = "table-row";
      if (elements.previewGuarantorMeta) {
        elements.previewGuarantorMeta.textContent = `${guarName}（身分證號：${elements.guarantorId.value || "未提供"}，電話：${elements.guarantorPhone.value || "未提供"}）`;
      }
    } else {
      if (elements.previewGuarantorRow) elements.previewGuarantorRow.style.display = "none";
    }

    // 強制執行約定清單
    updateEnforcePreviewList();

    // 更新日期
    if (elements.previewPrintDate) {
      const today = new Date();
      elements.previewPrintDate.textContent = `中華民國 ${today.getFullYear() - 1911} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
    }
  }

  // 更新強制執行條款預覽
  function updateEnforcePreviewList() {
    if (!elements.previewEnforceClauses) return;
    elements.previewEnforceClauses.innerHTML = "";

    const clauses = [];
    if (elements.enforceEviction.checked) {
      clauses.push({
        law: "《公證法》第 13 條第 1 項第 3 款",
        text: "承租人於租期屆滿或租約終止交還住宅時，應即將租賃住宅騰空遷讓交還出租人；如不履行，願逕受強制執行。",
      });
    }
    if (elements.enforceRentArrears.checked) {
      clauses.push({
        law: "《公證法》第 13 條第 1 項第 1、4 款",
        text: "承租人約定應給付之租金、水費、電費、瓦斯費、管理費及違反租約所生之懲罰性違約金或損害賠償金；如不給付，願逕受強制執行。",
      });
    }
    if (elements.enforceDepositReturn.checked) {
      clauses.push({
        law: "《公證法》第 13 條第 1 項第 1 款",
        text: "出租人於租賃契約關係終止或租期屆滿，承租人將住宅騰空交還並扣除各項積欠費用後所餘之押租保證金；如不返還，願逕受強制執行。",
      });
    }
    if (elements.enforceGuarantor.checked && elements.guarantorName.value.trim()) {
      clauses.push({
        law: "《公證法》第 13 條第 1 項第 1 款",
        text: `連帶保證人（${elements.guarantorName.value.trim()}）對於承租人依本約所負之一切積欠租金、違約金、稅賦及各項代墊費用願負連帶清償之責；如不履行，願逕受強制執行。`,
      });
    }

    if (clauses.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "paper-article-item";
      emptyLi.textContent = "（本件租約未約定載明逕受強制執行條款）";
      elements.previewEnforceClauses.appendChild(emptyLi);
      return;
    }

    clauses.forEach((c, idx) => {
      const li = document.createElement("li");
      li.className = "paper-article-item";
      li.innerHTML = `<strong>第 ${idx + 1} 條（${c.law}）：</strong>${c.text}`;
      elements.previewEnforceClauses.appendChild(li);
    });
  }

  // 簽名即時反映在預覽中
  function updatePreviewSignatures() {
    if (elements.previewLandlordSigImg) {
      const lUrl = landlordPad ? landlordPad.toDataURL() : null;
      if (lUrl) {
        elements.previewLandlordSigImg.src = lUrl;
        elements.previewLandlordSigImg.style.display = "block";
      } else {
        elements.previewLandlordSigImg.style.display = "none";
      }
    }

    if (elements.previewTenantSigImg) {
      const tUrl = tenantPad ? tenantPad.toDataURL() : null;
      if (tUrl) {
        elements.previewTenantSigImg.src = tUrl;
        elements.previewTenantSigImg.style.display = "block";
      } else {
        elements.previewTenantSigImg.style.display = "none";
      }
    }
  }

  // 產生並下載 840×1180px 存證圖卡
  function generateNotarizationCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 840;
    canvas.height = 1180;
    const ctx = canvas.getContext("2d");

    // 背景底色
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 840, 1180);

    // 頂部海軍藍裝飾條
    const topGrad = ctx.createLinearGradient(0, 0, 840, 0);
    topGrad.addColorStop(0, "#091a2c");
    topGrad.addColorStop(1, "#0f2b48");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 840, 110);

    // 標題
    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("港居不動產開發有限公司 GANJU REAL ESTATE", 40, 42);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("住宅租賃租約公證暨逕受強制執行存證單", 40, 82);

    // 文號與標註
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`公證文號: ${elements.docSerialNo.value || "GJ-NOTARY-2026"}`, 800, 82);
    ctx.textAlign = "left";

    // 核心內容區
    ctx.fillStyle = "#1e293b";
    let y = 145;

    // 基本資訊框
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(40, y, 760, 215);
    ctx.strokeRect(40, y, 760, 215);

    ctx.fillStyle = "#0f2b48";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("【租賃標的與公證基本資料】", 55, y + 30);

    ctx.fillStyle = "#334155";
    ctx.font = "14px sans-serif";
    ctx.fillText(`租賃標的：${elements.propertyAddress.value || "高雄市前鎮區中華五路 888 號 12 樓"}`, 55, y + 62);
    ctx.fillText(`租賃期間：自 ${elements.leaseStartDate.value || "2026-11-01"} 起至 ${elements.leaseEndDate.value || "2027-10-31"} 止（計 ${elements.leaseMonths.value || "12"} 個月）`, 55, y + 92);
    ctx.fillText(`約定月租：新臺幣 ${fmt(elements.monthlyRent.value || 0)} 元 ｜ 押租金：新臺幣 ${fmt(elements.depositAmount.value || 0)} 元`, 55, y + 122);
    ctx.fillText(`公證處所：${elements.notaryOfficeName.value || "臺灣高雄地方法院所屬民間公證人事務所"}`, 55, y + 152);
    ctx.fillText(`公證規費：${elements.totalFeeCalc ? elements.totalFeeCalc.textContent : "計算中"}（${elements.splitFeeCalc ? elements.splitFeeCalc.textContent : ""}）`, 55, y + 182);

    y += 245;

    // 當事人雙方
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(40, y, 760, 110);
    ctx.strokeRect(40, y, 760, 110);

    ctx.fillStyle = "#0f2b48";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("出租人（請求人）", 55, y + 30);
    ctx.fillText("承租人（請求人）", 435, y + 30);

    ctx.fillStyle = "#334155";
    ctx.font = "13px sans-serif";
    ctx.fillText(`姓名/名稱：${elements.landlordName.value || "港居不動產開發"}`, 55, y + 58);
    ctx.fillText(`統編/身分證：${elements.landlordId.value || "96797997"}`, 55, y + 84);

    ctx.fillText(`姓名：${elements.tenantName.value || "陳○明"}`, 435, y + 58);
    ctx.fillText(`身分證字號：${elements.tenantId.value || "E123456789"}`, 435, y + 84);

    y += 140;

    // 逕受強制執行約定事項
    ctx.fillStyle = "#0f2b48";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("【載明逕受強制執行特約條款（公證法第 13 條）】", 40, y);
    y += 15;

    const clauses = [];
    if (elements.enforceEviction.checked) {
      clauses.push("一、承租人於租期屆滿應交還住宅而不履行者，應逕受強制執行。");
    }
    if (elements.enforceRentArrears.checked) {
      clauses.push("二、承租人給付租金、水電瓦斯管理費、違約金而不給付者，應逕受強制執行。");
    }
    if (elements.enforceDepositReturn.checked) {
      clauses.push("三、出租人返還押租保證金而不返還者，應逕受強制執行。");
    }
    if (elements.enforceGuarantor.checked && elements.guarantorName.value.trim()) {
      clauses.push(`四、連帶保證人（${elements.guarantorName.value.trim()}）清償欠繳租金費用而不履行者，應逕受強制執行。`);
    }

    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#334155";
    if (clauses.length === 0) {
      ctx.fillText("（未勾選載明逕受強制執行條款）", 55, y + 20);
      y += 35;
    } else {
      clauses.forEach((c) => {
        y += 24;
        ctx.fillText(c, 50, y);
      });
    }

    y += 45;

    // 簽名專區
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(40, y, 365, 140);
    ctx.strokeRect(435, y, 365, 140);

    ctx.fillStyle = "#0f2b48";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("出租人 / 代理人數位簽章", 55, y + 26);
    ctx.fillText("承租人 / 代理人數位簽章", 450, y + 26);

    // 繪製簽名
    const lSig = landlordPad ? landlordPad.toDataURL() : null;
    const tSig = tenantPad ? tenantPad.toDataURL() : null;

    let loadedCount = 0;
    const checkDrawComplete = () => {
      // 頁尾官方註記
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("本圖卡依《公證法》及《住宅租賃市場發展及管理條例》規格由港居不動產系統產出，僅供存證核對使用。", 40, 1145);

      const today = new Date();
      ctx.textAlign = "right";
      ctx.fillText(`產製日期：${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`, 800, 1145);

      // 下載觸發
      const link = document.createElement("a");
      link.download = `租賃公證強執存證單_${elements.tenantName.value || "承租人"}_${today.getTime()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    const lImg = new Image();
    const tImg = new Image();

    if (lSig && tSig) {
      lImg.onload = () => {
        ctx.drawImage(lImg, 55, y + 36, 260, 90);
        loadedCount++;
        if (loadedCount === 2) checkDrawComplete();
      };
      lImg.src = lSig;

      tImg.onload = () => {
        ctx.drawImage(tImg, 450, y + 36, 260, 90);
        loadedCount++;
        if (loadedCount === 2) checkDrawComplete();
      };
      tImg.src = tSig;
    } else if (lSig) {
      lImg.onload = () => {
        ctx.drawImage(lImg, 55, y + 36, 260, 90);
        checkDrawComplete();
      };
      lImg.src = lSig;
    } else if (tSig) {
      tImg.onload = () => {
        ctx.drawImage(tImg, 450, y + 36, 260, 90);
        checkDrawComplete();
      };
      tImg.src = tSig;
    } else {
      checkDrawComplete();
    }
  }

  // 複製 LINE 備忘摘要文字
  function copyLineSummary() {
    const monthly = getNum(elements.monthlyRent);
    const months = Math.max(1, getNum(elements.leaseMonths));
    const totalRent = monthly * months;
    const totalFee = elements.totalFeeCalc ? elements.totalFeeCalc.textContent : "計算中";
    const splitFee = elements.splitFeeCalc ? elements.splitFeeCalc.textContent : "";

    const lines = [
      "【港居不動產｜住宅租賃租約公證暨強制執行約定備忘】",
      `📋 公證聲請案號：${elements.docSerialNo.value || "GJ-NOTARY-2026"}`,
      `🏢 公證機構：${elements.notaryOfficeName.value || "民間公證人事務所"}`,
      `📍 租賃地址：${elements.propertyAddress.value || "未填寫"}`,
      `📅 租賃期間：自 ${elements.leaseStartDate.value || ""} 至 ${elements.leaseEndDate.value || ""}（共 ${months} 個月）`,
      `💰 月租金額：NT$ ${fmt(monthly)} 元（總額 NT$ ${fmt(totalRent)} 元）`,
      `💵 押租保證金：NT$ ${fmt(elements.depositAmount.value || 0)} 元`,
      "--------------------------",
      "⚖️ 【司法院法定公證規費精算】",
      `• 公證規費總計：${totalFee}`,
      `• 費用分擔約定：${splitFee}`,
      "--------------------------",
      "⚡ 【約定逕受強制執行事項】",
      elements.enforceEviction.checked ? "✅ 租期屆滿不交還房屋逕受強制執行" : "⬜ 遷讓交還未勾選",
      elements.enforceRentArrears.checked ? "✅ 欠繳租金、水電、違約金逕受強制執行" : "⬜ 欠租費用未勾選",
      elements.enforceDepositReturn.checked ? "✅ 退租所餘押金不返還逕受強制執行" : "⬜ 押金返還未勾選",
      elements.enforceGuarantor.checked && elements.guarantorName.value.trim() ? `✅ 連帶保證人（${elements.guarantorName.value.trim()}）連帶清償逕受強制執行` : "",
      "--------------------------",
      "雙方已合意依《公證法》第13條辦理公證並作成執行名義，本摘要供承租雙方核對備忘。",
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(lines)
        .then(() => {
          alert("✅ 已成功複製公證約定備忘至剪貼簿！可直接貼至 LINE 傳送給雙方與公證人。");
        })
        .catch(() => {
          fallbackCopyText(lines);
        });
    } else {
      fallbackCopyText(lines);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      alert("✅ 已成功複製公證約定備忘至剪貼簿！");
    } catch (e) {
      alert("⚠️ 複製失敗，請手動複製。");
    }
    document.body.removeChild(ta);
  }

  // 初始化綁定
  function init() {
    // 實例化雙簽名板
    landlordPad = new RetinaSignPad("landlordSigCanvas", "btnClearLandlordSig");
    tenantPad = new RetinaSignPad("tenantSigCanvas", "btnClearTenantSig");

    // 監聽所有表單元素輸入
    const inputIds = [
      "propertyAddress",
      "leaseStartDate",
      "leaseEndDate",
      "leaseMonths",
      "monthlyRent",
      "depositAmount",
      "taxableHouseValue",
      "landlordName",
      "landlordId",
      "landlordPhone",
      "landlordAddress",
      "landlordAgent",
      "tenantName",
      "tenantId",
      "tenantPhone",
      "tenantAddress",
      "tenantAgent",
      "guarantorName",
      "guarantorId",
      "guarantorPhone",
      "enforceEviction",
      "enforceRentArrears",
      "enforceDepositReturn",
      "enforceGuarantor",
      "feePayer",
      "notaryOfficeName",
      "docSerialNo",
    ];

    inputIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateCalculations);
        el.addEventListener("change", updateCalculations);
      }
    });

    // 列印按鈕
    if (elements.btnPrint) {
      elements.btnPrint.addEventListener("click", () => {
        window.print();
      });
    }

    // 下載圖卡
    if (elements.btnDownloadCard) {
      elements.btnDownloadCard.addEventListener("click", () => {
        generateNotarizationCard();
      });
    }

    // 複製 LINE
    if (elements.btnCopyLine) {
      elements.btnCopyLine.addEventListener("click", () => {
        copyLineSummary();
      });
    }

    // 預設日期設定
    const today = new Date();
    const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), 0);
    const endStr = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, "0")}-${String(nextYear.getDate()).padStart(2, "0")}`;

    if (elements.leaseStartDate && !elements.leaseStartDate.value) elements.leaseStartDate.value = startStr;
    if (elements.leaseEndDate && !elements.leaseEndDate.value) elements.leaseEndDate.value = endStr;

    // 首次計算與渲染
    updateCalculations();
  }

  // DOM 就緒後執行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
