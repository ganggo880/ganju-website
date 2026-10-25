/**
 * 港居不動產 - 住宅租賃緊急避難與緊急開門進入授權協議書產生器
 * 檔案路徑: js/emergency-entry-agreement.js
 * 依據: 《刑法》第 24/306 條、《民法》第 150/432 條及《公寓大廈管理條例》第 6 條
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

  // 簽名板類別
  class RetinaSignPad {
    constructor(canvasId, clearBtnId, previewImgId) {
      this.canvas = document.getElementById(canvasId);
      this.clearBtn = document.getElementById(clearBtnId);
      this.previewImg = document.getElementById(previewImgId);
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
      };

      const end = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        this.isDrawing = false;
        this.updatePreview();
      };

      this.canvas.addEventListener("mousedown", start);
      this.canvas.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);

      this.canvas.addEventListener("touchstart", start, { passive: false });
      this.canvas.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end, { passive: false });

      if (this.clearBtn) {
        this.clearBtn.addEventListener("click", () => {
          this.clear();
        });
      }

      window.addEventListener("resize", () => {
        if (!this.hasSigned) {
          this.setupCanvas();
        }
      });
    }

    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.hasSigned = false;
      if (this.previewImg) {
        this.previewImg.src = "";
        this.previewImg.style.display = "none";
      }
    }

    updatePreview() {
      if (!this.hasSigned || !this.previewImg) return;
      const dataUrl = this.canvas.toDataURL("image/png");
      this.previewImg.src = dataUrl;
      this.previewImg.style.display = "block";
    }

    getImageData() {
      return this.hasSigned ? this.canvas.toDataURL("image/png") : null;
    }
  }

  // 工具核心邏輯與資料綁定
  document.addEventListener("DOMContentLoaded", function () {
    // 預設日期為今日
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 表單元素參照
    const docNoInput = document.getElementById("docNo");
    const agreementDateInput = document.getElementById("agreementDate");
    const propertyAddressInput = document.getElementById("propertyAddress");
    const leasePeriodStartInput = document.getElementById("leasePeriodStart");
    const leasePeriodEndInput = document.getElementById("leasePeriodEnd");

    const landlordNameInput = document.getElementById("landlordName");
    const landlordIdInput = document.getElementById("landlordId");
    const landlordPhoneInput = document.getElementById("landlordPhone");
    const agencyRepInput = document.getElementById("agencyRep");

    const tenantNameInput = document.getElementById("tenantName");
    const tenantIdInput = document.getElementById("tenantId");
    const tenantPhoneInput = document.getElementById("tenantPhone");

    const emergencyContactNameInput = document.getElementById("emergencyContactName");
    const emergencyContactRelationInput = document.getElementById("emergencyContactRelation");
    const emergencyContactPhoneInput = document.getElementById("emergencyContactPhone");

    // 緊急情境核取方塊
    const scenarioGas = document.getElementById("scenarioGas");
    const scenarioFire = document.getElementById("scenarioFire");
    const scenarioWater = document.getElementById("scenarioWater");
    const scenarioMissing = document.getElementById("scenarioMissing");
    const scenarioOdor = document.getElementById("scenarioOdor");
    const scenarioPet = document.getElementById("scenarioPet");

    // 會同與SOP設定
    const witnessTypeSelect = document.getElementById("witnessType");
    const missingHoursSelect = document.getElementById("missingHours");
    const expenseLimitInput = document.getElementById("expenseLimit");

    // 紙本預覽元素參照
    const pvDocNo = document.getElementById("pvDocNo");
    const pvAgreementDate = document.getElementById("pvAgreementDate");
    const pvPropertyAddress = document.getElementById("pvPropertyAddress");
    const pvLeasePeriod = document.getElementById("pvLeasePeriod");

    const pvLandlordName = document.getElementById("pvLandlordName");
    const pvLandlordId = document.getElementById("pvLandlordId");
    const pvLandlordPhone = document.getElementById("pvLandlordPhone");
    const pvAgencyRep = document.getElementById("pvAgencyRep");

    const pvTenantName = document.getElementById("pvTenantName");
    const pvTenantId = document.getElementById("pvTenantId");
    const pvTenantPhone = document.getElementById("pvTenantPhone");

    const pvContactInfo = document.getElementById("pvContactInfo");
    const pvWitnessType = document.getElementById("pvWitnessType");
    const pvMissingHours = document.getElementById("pvMissingHours");
    const pvExpenseLimit = document.getElementById("pvExpenseLimit");
    const pvExpenseLimitWords = document.getElementById("pvExpenseLimitWords");

    const pvScenarioList = document.getElementById("pvScenarioList");

    const pvSignLandlordName = document.getElementById("pvSignLandlordName");
    const pvSignTenantName = document.getElementById("pvSignTenantName");
    const pvSignDate = document.getElementById("pvSignDate");

    // 初始化預設值
    if (docNoInput && !docNoInput.value) {
      const randSeq = Math.floor(100 + Math.random() * 900);
      docNoInput.value = `EEA-${yyyy}${mm}${dd}-${randSeq}`;
    }
    if (agreementDateInput && !agreementDateInput.value) {
      agreementDateInput.value = todayStr;
    }
    if (leasePeriodStartInput && !leasePeriodStartInput.value) {
      leasePeriodStartInput.value = todayStr;
    }
    if (leasePeriodEndInput && !leasePeriodEndInput.value) {
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      nextYear.setDate(nextYear.getDate() - 1);
      const n_yyyy = nextYear.getFullYear();
      const n_mm = String(nextYear.getMonth() + 1).padStart(2, "0");
      const n_dd = String(nextYear.getDate()).padStart(2, "0");
      leasePeriodEndInput.value = `${n_yyyy}-${n_mm}-${n_dd}`;
    }

    // 初始化簽章板
    const landlordPad = new RetinaSignPad("landlordSigPad", "btnClearLandlordSig", "pvLandlordSigImg");
    const tenantPad = new RetinaSignPad("tenantSigPad", "btnClearTenantSig", "pvTenantSigImg");

    // 更新預覽畫面函式
    function updatePreview() {
      const docNo = docNoInput ? docNoInput.value.trim() : "";
      const agreeDate = agreementDateInput ? agreementDateInput.value : todayStr;
      const address = propertyAddressInput ? propertyAddressInput.value.trim() : "高雄市小港區中安路";
      const startD = leasePeriodStartInput ? leasePeriodStartInput.value : todayStr;
      const endD = leasePeriodEndInput ? leasePeriodEndInput.value : todayStr;

      const landlord = landlordNameInput ? landlordNameInput.value.trim() : "港居不動產開發有限公司";
      const landlordId = landlordIdInput ? landlordIdInput.value.trim() : "96797997";
      const landlordPhone = landlordPhoneInput ? landlordPhoneInput.value.trim() : "07-7933669";
      const agencyRep = agencyRepInput ? agencyRepInput.value.trim() : "陳俊銘經理";

      const tenant = tenantNameInput ? tenantNameInput.value.trim() : "李承租";
      const tenantId = tenantIdInput ? tenantIdInput.value.trim() : "E123456789";
      const tenantPhone = tenantPhoneInput ? tenantPhoneInput.value.trim() : "0912-345-678";

      const cName = emergencyContactNameInput ? emergencyContactNameInput.value.trim() : "王小明";
      const cRel = emergencyContactRelationInput ? emergencyContactRelationInput.value.trim() : "家屬/父母";
      const cPhone = emergencyContactPhoneInput ? emergencyContactPhoneInput.value.trim() : "0988-888-888";

      const witness = witnessTypeSelect ? witnessTypeSelect.value : "轄區派出所巡邏員警、里長或社區大樓管委會總幹事/保全隊長";
      const missingH = missingHoursSelect ? missingHoursSelect.value : "48";
      const limitVal = expenseLimitInput ? Number(expenseLimitInput.value) || 5000 : 5000;

      // 填入預覽公文
      if (pvDocNo) pvDocNo.textContent = docNo;
      if (pvAgreementDate) pvAgreementDate.textContent = agreeDate;
      if (pvPropertyAddress) pvPropertyAddress.textContent = address;
      if (pvLeasePeriod) pvLeasePeriod.textContent = `${startD} 至 ${endD}`;

      if (pvLandlordName) pvLandlordName.textContent = landlord;
      if (pvLandlordId) pvLandlordId.textContent = landlordId;
      if (pvLandlordPhone) pvLandlordPhone.textContent = landlordPhone;
      if (pvAgencyRep) pvAgencyRep.textContent = agencyRep;

      if (pvTenantName) pvTenantName.textContent = tenant;
      if (pvTenantId) pvTenantId.textContent = tenantId;
      if (pvTenantPhone) pvTenantPhone.textContent = tenantPhone;

      if (pvContactInfo) pvContactInfo.textContent = `${cName}（關係：${cRel}／緊急聯絡電話：${cPhone}）`;
      if (pvWitnessType) pvWitnessType.textContent = witness;
      if (pvMissingHours) pvMissingHours.textContent = missingH;
      if (pvExpenseLimit) pvExpenseLimit.textContent = limitVal.toLocaleString();
      if (pvExpenseLimitWords) pvExpenseLimitWords.textContent = toChineseFinancialNumber(limitVal);

      if (pvSignLandlordName) pvSignLandlordName.textContent = landlord;
      if (pvSignTenantName) pvSignTenantName.textContent = tenant;
      if (pvSignDate) pvSignDate.textContent = agreeDate;

      // 動態更新緊急情境清單
      if (pvScenarioList) {
        pvScenarioList.innerHTML = "";
        const scenarios = [
          {
            checked: scenarioGas ? scenarioGas.checked : true,
            title: "【瓦斯外洩／立即氣爆危害】",
            desc: "室內傳出強烈瓦斯氣味或天然氣警報鳴響，有立即發生氣爆、火警之虞者。",
          },
          {
            checked: scenarioFire ? scenarioFire.checked : true,
            title: "【火警煙霧警報／失火冒煙】",
            desc: "獨立式住警器或社區消防廣播持續作響、門縫竄出濃煙或有明火之虞者。",
          },
          {
            checked: scenarioWater ? scenarioWater.checked : true,
            title: "【水管爆裂／大量漏水淹水溢流】",
            desc: "室內給排水管爆裂，大量積水自大門外溢至公共梯間、電梯井或滲漏至樓下住戶造成裝潢毀損擴大者。",
          },
          {
            checked: scenarioMissing ? scenarioMissing.checked : true,
            title: `【失聯失蹤逾 ${missingH} 小時／人身安危急難】`,
            desc: `承租人失聯逾 ${missingH} 小時且緊急聯絡人無回應，大門包裹外賣多日堆積或室內寵物長時間哀鳴無人照料者。`,
          },
          {
            checked: scenarioOdor ? scenarioOdor.checked : true,
            title: "【異常惡臭異味／公衛安全通報】",
            desc: "門縫傳出異常屍臭、強烈腐敗異味，經鄰居、警消或管委會通報需開門查驗者。",
          },
          {
            checked: scenarioPet ? scenarioPet.checked : true,
            title: "【特約寵物受困受虐／緊急救助】",
            desc: "承租人外出數日未歸，屋內寵物連續多時哀號狂吠，疑似嚴重脫水、受傷或面臨生命危險者。",
          },
        ];

        scenarios.forEach((sc) => {
          if (sc.checked) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${sc.title}</strong> ${sc.desc}`;
            pvScenarioList.appendChild(li);
          }
        });
      }

      // 同步情境卡片 active class
      [
        { cb: scenarioGas, id: "cardGas" },
        { cb: scenarioFire, id: "cardFire" },
        { cb: scenarioWater, id: "cardWater" },
        { cb: scenarioMissing, id: "cardMissing" },
        { cb: scenarioOdor, id: "cardOdor" },
        { cb: scenarioPet, id: "cardPet" },
      ].forEach((item) => {
        const card = document.getElementById(item.id);
        if (card && item.cb) {
          if (item.cb.checked) {
            card.classList.add("active");
          } else {
            card.classList.remove("active");
          }
        }
      });
    }

    // 監聽所有輸入與變動
    const formInputs = document.querySelectorAll(
      ".emergency-entry-workspace input, .emergency-entry-workspace select, .emergency-entry-workspace textarea"
    );
    formInputs.forEach((input) => {
      input.addEventListener("input", updatePreview);
      input.addEventListener("change", updatePreview);
    });

    // 儲存草稿至 LocalStorage
    function saveDraft() {
      const data = {
        docNo: docNoInput ? docNoInput.value : "",
        agreementDate: agreementDateInput ? agreementDateInput.value : "",
        propertyAddress: propertyAddressInput ? propertyAddressInput.value : "",
        leasePeriodStart: leasePeriodStartInput ? leasePeriodStartInput.value : "",
        leasePeriodEnd: leasePeriodEndInput ? leasePeriodEndInput.value : "",
        landlordName: landlordNameInput ? landlordNameInput.value : "",
        landlordId: landlordIdInput ? landlordIdInput.value : "",
        landlordPhone: landlordPhoneInput ? landlordPhoneInput.value : "",
        agencyRep: agencyRepInput ? agencyRepInput.value : "",
        tenantName: tenantNameInput ? tenantNameInput.value : "",
        tenantId: tenantIdInput ? tenantIdInput.value : "",
        tenantPhone: tenantPhoneInput ? tenantPhoneInput.value : "",
        emergencyContactName: emergencyContactNameInput ? emergencyContactNameInput.value : "",
        emergencyContactRelation: emergencyContactRelationInput ? emergencyContactRelationInput.value : "",
        emergencyContactPhone: emergencyContactPhoneInput ? emergencyContactPhoneInput.value : "",
        witnessType: witnessTypeSelect ? witnessTypeSelect.value : "",
        missingHours: missingHoursSelect ? missingHoursSelect.value : "",
        expenseLimit: expenseLimitInput ? expenseLimitInput.value : "",
        scenarioGas: scenarioGas ? scenarioGas.checked : true,
        scenarioFire: scenarioFire ? scenarioFire.checked : true,
        scenarioWater: scenarioWater ? scenarioWater.checked : true,
        scenarioMissing: scenarioMissing ? scenarioMissing.checked : true,
        scenarioOdor: scenarioOdor ? scenarioOdor.checked : true,
        scenarioPet: scenarioPet ? scenarioPet.checked : true,
      };
      try {
        localStorage.setItem("ganju_emergency_entry_draft_v1", JSON.stringify(data));
      } catch (err) {
        console.warn("無法儲存草稿至 LocalStorage:", err);
      }
    }

    // 讀取草稿
    function loadDraft() {
      try {
        const raw = localStorage.getItem("ganju_emergency_entry_draft_v1");
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.docNo && docNoInput) docNoInput.value = d.docNo;
        if (d.agreementDate && agreementDateInput) agreementDateInput.value = d.agreementDate;
        if (d.propertyAddress && propertyAddressInput) propertyAddressInput.value = d.propertyAddress;
        if (d.leasePeriodStart && leasePeriodStartInput) leasePeriodStartInput.value = d.leasePeriodStart;
        if (d.leasePeriodEnd && leasePeriodEndInput) leasePeriodEndInput.value = d.leasePeriodEnd;
        if (d.landlordName && landlordNameInput) landlordNameInput.value = d.landlordName;
        if (d.landlordId && landlordIdInput) landlordIdInput.value = d.landlordId;
        if (d.landlordPhone && landlordPhoneInput) landlordPhoneInput.value = d.landlordPhone;
        if (d.agencyRep && agencyRepInput) agencyRepInput.value = d.agencyRep;
        if (d.tenantName && tenantNameInput) tenantNameInput.value = d.tenantName;
        if (d.tenantId && tenantIdInput) tenantIdInput.value = d.tenantId;
        if (d.tenantPhone && tenantPhoneInput) tenantPhoneInput.value = d.tenantPhone;
        if (d.emergencyContactName && emergencyContactNameInput) emergencyContactNameInput.value = d.emergencyContactName;
        if (d.emergencyContactRelation && emergencyContactRelationInput) emergencyContactRelationInput.value = d.emergencyContactRelation;
        if (d.emergencyContactPhone && emergencyContactPhoneInput) emergencyContactPhoneInput.value = d.emergencyContactPhone;
        if (d.witnessType && witnessTypeSelect) witnessTypeSelect.value = d.witnessType;
        if (d.missingHours && missingHoursSelect) missingHoursSelect.value = d.missingHours;
        if (d.expenseLimit && expenseLimitInput) expenseLimitInput.value = d.expenseLimit;
        if (typeof d.scenarioGas === "boolean" && scenarioGas) scenarioGas.checked = d.scenarioGas;
        if (typeof d.scenarioFire === "boolean" && scenarioFire) scenarioFire.checked = d.scenarioFire;
        if (typeof d.scenarioWater === "boolean" && scenarioWater) scenarioWater.checked = d.scenarioWater;
        if (typeof d.scenarioMissing === "boolean" && scenarioMissing) scenarioMissing.checked = d.scenarioMissing;
        if (typeof d.scenarioOdor === "boolean" && scenarioOdor) scenarioOdor.checked = d.scenarioOdor;
        if (typeof d.scenarioPet === "boolean" && scenarioPet) scenarioPet.checked = d.scenarioPet;
      } catch (err) {
        console.warn("無法讀取草稿:", err);
      }
    }

    loadDraft();
    updatePreview();

    // 每 5 秒自動儲存一次
    setInterval(saveDraft, 5000);

    // 操作按鈕：列印
    const btnPrint = document.getElementById("btnPrintAgreement");
    if (btnPrint) {
      btnPrint.addEventListener("click", function () {
        saveDraft();
        window.print();
      });
    }

    // 操作按鈕：下載 Canvas 840×1180px 圖卡
    const btnDownloadImg = document.getElementById("btnDownloadImage");
    if (btnDownloadImg) {
      btnDownloadImg.addEventListener("click", function () {
        saveDraft();
        generateCanvasImage();
      });
    }

    // 繪製與匯出高畫質存證圖卡
    function generateCanvasImage() {
      const canvas = document.createElement("canvas");
      canvas.width = 840;
      canvas.height = 1180;
      const ctx = canvas.getContext("2d");

      // 背景白色
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 外框與裝飾線
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#0f2b48";
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "#c5a059";
      ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

      // 頂部抬頭
      ctx.fillStyle = "#0f2b48";
      ctx.font = "bold 20px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("港居不動產開發有限公司", canvas.width / 2, 65);

      ctx.font = "900 25px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText("住宅租賃緊急避難與緊急開門進入授權協議書", canvas.width / 2, 102);

      ctx.font = "13px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#64748b";
      const docNo = docNoInput ? docNoInput.value : "EEA-20261026-001";
      ctx.fillText(`合約編號: ${docNo}   |   立書日期: ${agreementDateInput ? agreementDateInput.value : todayStr}`, canvas.width / 2, 126);

      // 水平分割線
      ctx.beginPath();
      ctx.moveTo(40, 138);
      ctx.lineTo(canvas.width - 40, 138);
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();

      // 基本資訊表格繪製
      let curY = 168;
      ctx.textAlign = "left";
      ctx.font = "bold 14px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#0f2b48";
      ctx.fillText("【標的物及租約當事人資訊】", 44, curY);

      curY += 24;
      ctx.font = "13px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(`租賃地址: ${propertyAddressInput ? propertyAddressInput.value : ""}`, 44, curY);

      curY += 20;
      ctx.fillText(`約定租期: ${leasePeriodStartInput ? leasePeriodStartInput.value : ""} 至 ${leasePeriodEndInput ? leasePeriodEndInput.value : ""}`, 44, curY);

      curY += 20;
      const landlord = landlordNameInput ? landlordNameInput.value : "";
      const landlordPhone = landlordPhoneInput ? landlordPhoneInput.value : "";
      const agencyRep = agencyRepInput ? agencyRepInput.value : "";
      ctx.fillText(`出租人/受託代管: ${landlord} (經辦: ${agencyRep}) | 電話: ${landlordPhone}`, 44, curY);

      curY += 20;
      const tenant = tenantNameInput ? tenantNameInput.value : "";
      const tenantPhone = tenantPhoneInput ? tenantPhoneInput.value : "";
      ctx.fillText(`承租人 (立書人): ${tenant} | 電話: ${tenantPhone}`, 44, curY);

      curY += 20;
      const cName = emergencyContactNameInput ? emergencyContactNameInput.value : "";
      const cRel = emergencyContactRelationInput ? emergencyContactRelationInput.value : "";
      const cPhone = emergencyContactPhoneInput ? emergencyContactPhoneInput.value : "";
      ctx.fillText(`緊急聯絡人: ${cName} (關係: ${cRel} | 電話: ${cPhone})`, 44, curY);

      // 緊急情境授權清單
      curY += 34;
      ctx.font = "bold 14px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#0f2b48";
      ctx.fillText("【經雙方合意得緊急破門開門進入之法定情境】", 44, curY);

      curY += 22;
      ctx.font = "12px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#334155";
      const missingH = missingHoursSelect ? missingHoursSelect.value : "48";
      const scItems = [
        "1. 瓦斯外洩／立即氣爆危害: 濃烈瓦斯味或瓦斯警報作響，有立即氣爆與火災危害。",
        "2. 火警煙霧警報／失火冒煙: 獨立式住警器鳴響、門縫冒煙或疑似室內火災危險。",
        "3. 室內爆管漏水／大量溢流: 給排水管爆裂自大門溢出或嚴重滲漏樓下裝潢毀損。",
        `4. 承租人失聯失蹤逾 ${missingH} 小時: 緊急聯絡人無回應且人身生命安全面臨重大急難。`,
        "5. 異常惡臭異味／公衛通報: 門縫傳出異常屍臭或強烈腐敗異味，需開門查驗。",
        "6. 寵物連續哀鳴受困: 承租人外出失聯，室內寵物面臨嚴重脫水或生命受困急難。",
      ];

      scItems.forEach((text) => {
        ctx.fillText(text, 44, curY);
        curY += 19;
      });

      // 會同程序與SOP守則
      curY += 16;
      ctx.font = "bold 14px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#0f2b48";
      ctx.fillText("【法定會同第三方見證人與全程錄影錄音 SOP】", 44, curY);

      curY += 22;
      ctx.font = "12px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillStyle = "#334155";
      const witness = witnessTypeSelect ? witnessTypeSelect.value : "轄區警員、里長或社區主委";
      ctx.fillText(`• 會同公正第三方見證人: 至少兩人同行，強制會同【${witness}】。`, 44, curY);
      curY += 19;
      ctx.fillText("• 全程手機/密錄器錄影錄音存證，詳實拍攝開門前、進入後室內現況及退離上鎖全貌。", 44, curY);
      curY += 19;
      ctx.fillText("• 權限嚴格限制: 僅限關閉水電瓦斯總閥、傷病通報119、寵物安置或必要排除危險範圍。", 44, curY);
      curY += 19;
      ctx.fillText("• 嚴禁翻動承租人無關之個人私密抽屜、金庫或私人隱私財物，非危險物品嚴格保持原狀。", 44, curY);
      curY += 19;
      const limitVal = expenseLimitInput ? Number(expenseLimitInput.value) || 5000 : 5000;
      ctx.fillText(`• 事後通知與費用: 24小時內LINE通知，破鎖換鎖費用限額 NT$ ${limitVal.toLocaleString()} 元整由責任方負擔。`, 44, curY);

      // 免除刑法第306條侵入住宅罪合意宣告
      curY += 26;
      ctx.fillStyle = "#fef2f2";
      ctx.fillRect(40, curY, canvas.width - 80, 52);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fecaca";
      ctx.strokeRect(40, curY, canvas.width - 80, 52);

      ctx.fillStyle = "#991b1b";
      ctx.font = "bold 12px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText("【阻卻違法合意宣告】", 52, curY + 20);
      ctx.font = "11px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText("本約定書基於刑法第24條、民法第150條緊急避難及事前授權，雙方合意排除刑法第306條侵入住宅罪之違法性。", 52, curY + 38);

      curY += 72;

      // 簽名欄框線
      const sigBoxW = (canvas.width - 100) / 2;
      const sigBoxH = 100;

      // 出租方
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(40, curY, sigBoxW, sigBoxH);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(41, curY + 1, sigBoxW - 2, 24);
      ctx.fillStyle = "#0f2b48";
      ctx.font = "bold 12px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText("受託管理機構 / 出租人簽署:", 48, curY + 17);

      // 承租方
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(40 + sigBoxW + 20, curY, sigBoxW, sigBoxH);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(41 + sigBoxW + 20, curY + 1, sigBoxW - 2, 24);
      ctx.fillStyle = "#0f2b48";
      ctx.font = "bold 12px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
      ctx.fillText("承租人 (授權立書人) 親筆簽署:", 48 + sigBoxW + 20, curY + 17);

      // 繪入簽名圖檔（若有）
      const landImgData = landlordPad.getImageData();
      const tenImgData = tenantPad.getImageData();

      const finishCanvas = () => {
        // 浮水印防偽章
        ctx.save();
        ctx.translate(canvas.width - 130, canvas.height - 110);
        ctx.rotate(-0.15);
        ctx.strokeStyle = "rgba(192, 57, 43, 0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-65, -28, 130, 56);
        ctx.fillStyle = "rgba(192, 57, 43, 0.7)";
        ctx.font = "bold 13px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("港居不動產", 0, -8);
        ctx.fillText("安全存證認證章", 0, 14);
        ctx.restore();

        // 頁尾官方註記
        ctx.textAlign = "center";
        ctx.font = "11px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("港居不動產開發有限公司 | 高雄市小港區中安路468號 | 統編: 96797997 | 本憑證具完整契約效力", canvas.width / 2, canvas.height - 30);

        // 下載圖檔
        const link = document.createElement("a");
        link.download = `住宅租賃緊急避難授權書_${docNo}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };

      let pendingImages = 0;
      if (landImgData) {
        pendingImages++;
        const imgL = new Image();
        imgL.onload = () => {
          ctx.drawImage(imgL, 60, curY + 30, sigBoxW - 40, 60);
          pendingImages--;
          if (pendingImages === 0) finishCanvas();
        };
        imgL.src = landImgData;
      }
      if (tenImgData) {
        pendingImages++;
        const imgT = new Image();
        imgT.onload = () => {
          ctx.drawImage(imgT, 60 + sigBoxW + 20, curY + 30, sigBoxW - 40, 60);
          pendingImages--;
          if (pendingImages === 0) finishCanvas();
        };
        imgT.src = tenImgData;
      }

      if (pendingImages === 0) {
        finishCanvas();
      }
    }

    // 操作按鈕：LINE 摘要複製
    const btnCopyLine = document.getElementById("btnCopyLineSummary");
    if (btnCopyLine) {
      btnCopyLine.addEventListener("click", function () {
        saveDraft();

        const docNo = docNoInput ? docNoInput.value : "";
        const agreeDate = agreementDateInput ? agreementDateInput.value : todayStr;
        const address = propertyAddressInput ? propertyAddressInput.value : "";
        const landlord = landlordNameInput ? landlordNameInput.value : "";
        const tenant = tenantNameInput ? tenantNameInput.value : "";
        const tenantPhone = tenantPhoneInput ? tenantPhoneInput.value : "";
        const cName = emergencyContactNameInput ? emergencyContactNameInput.value : "";
        const cPhone = emergencyContactPhoneInput ? emergencyContactPhoneInput.value : "";
        const witness = witnessTypeSelect ? witnessTypeSelect.value : "轄區員警/里長/管委會總幹事";
        const missingH = missingHoursSelect ? missingHoursSelect.value : "48";
        const limitVal = expenseLimitInput ? Number(expenseLimitInput.value) || 5000 : 5000;

        const summaryText = `【港居不動產】住宅租賃緊急避難與安全開門進入授權協議備忘
==================================
📄 授權編號：${docNo}
📅 簽訂日期：${agreeDate}
🏠 標的地址：${address}
----------------------------------
👤 承租人 (立書人)：${tenant} (電話: ${tenantPhone})
🏢 受託代管機構：港居不動產開發有限公司 (統編: 96797997)
🚨 緊急聯絡人：${cName} (電話: ${cPhone})
----------------------------------
【授權緊急開門進入情境】
1. 瓦斯外洩 / 異常濃烈氣味 (有氣爆危害)
2. 火警煙霧警報鳴響 / 疑似室內冒煙失火
3. 給排水管爆裂 / 大量漏水淹水溢出公設或樓下
4. 承租人失聯失蹤逾 ${missingH} 小時且聯絡人無回應
5. 門縫傳出異常屍臭或強烈腐敗異味
6. 屋內寵物連續多時哀鳴無人照料有生命危險
----------------------------------
【標準開門作業 SOP 承諾】
• 至少二人同行，強制會同【${witness}】
• 全程手機或密錄器錄影錄音存證
• 嚴禁翻動承租人私密抽屜金庫，僅限排除危險
• 事後24小時內正式通知承租人並交付換新鎖具
• 破鎖搶修必要費用額度：NT$ ${limitVal.toLocaleString()} 元整
==================================
※ 本備忘係依刑法第24/306條及民法第150/432條合意簽立，保障人身安全與物業資產。
官方網站: https://ganggo880.github.io/ganju-website/emergency-entry-agreement.html`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(summaryText)
            .then(() => {
              alert("已成功複製「住宅租賃緊急避難授權備忘」至剪貼簿！可直接貼至 LINE 群組通報。");
            })
            .catch(() => {
              fallbackCopy(summaryText);
            });
        } else {
          fallbackCopy(summaryText);
        }
      });
    }

    function fallbackCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        alert("已成功複製「住宅租賃緊急避難授權備忘」至剪貼簿！");
      } catch (err) {
        alert("複製失敗，請手動複製。");
      }
      document.body.removeChild(ta);
    }
  });
})();
