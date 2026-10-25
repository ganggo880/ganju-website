/**
 * 港居不動產 - 住宅租賃合租公約與共同承租連帶責任協議書產生器
 * 檔案：js/roommate-agreement.js
 * 法源依據：《民法》第272/273/280/443條、《公寓大廈管理條例》第16條
 */

(function () {
    "use strict";

    // 初始狀態資料
    const state = {
        propertyAddress: "高雄市前鎮區民權二路388號12樓之2",
        leaseStart: "2026-08-01",
        leaseEnd: "2027-07-31",
        totalRent: 32000,
        totalDeposit: 64000,
        rentDueDay: 5,
        paymentBank: "臺灣銀行 (004) 高雄分行 帳號：012-004-967979 (戶名：林郁庭)",
        utilityMode: "equal", // equal: 均攤, weighted: 套房加權, submeter: 獨立冷氣電表+公電均攤
        roommates: [
            {
                id: 1,
                name: "林郁庭",
                idNo: "E223456789",
                phone: "0912-345-678",
                room: "A室主臥套房 (含獨立衛浴)",
                rentShare: 13000,
                depositShare: 26000,
                isLead: true,
                emergencyContact: "林父",
                emergencyPhone: "0910-123-456"
            },
            {
                id: 2,
                name: "陳奕安",
                idNo: "S124567890",
                phone: "0928-765-432",
                room: "B室陽台景觀雅房",
                rentShare: 10000,
                depositShare: 20000,
                isLead: false,
                emergencyContact: "陳母",
                emergencyPhone: "0921-987-654"
            },
            {
                id: 3,
                name: "黃品瑄",
                idNo: "T225678901",
                phone: "0933-888-999",
                room: "C室靜巷採光雅房",
                rentShare: 9000,
                depositShare: 18000,
                isLead: false,
                emergencyContact: "黃姊",
                emergencyPhone: "0935-666-777"
            }
        ],
        rules: {
            quietHours: true,
            guestCurfew: true,
            guestOvernight: true,
            kitchenSafety: true,
            noSmoking: true,
            petPolicy: true,
            fridgeOrder: true,
            choreRotation: true
        },
        ruleParams: {
            quietStart: "22:30",
            quietEnd: "08:00",
            guestLimit: 3,
            guestOvernightFee: 100,
            smokingFine: 3000
        }
    };

    // 簽章畫布實例快取
    const signaturePads = {};

    // 數字格式化
    function formatCurrency(num) {
        return Number(num || 0).toLocaleString("zh-TW");
    }

    // 初始化頁面
    function init() {
        bindGeneralInputs();
        bindUtilityMode();
        bindRulesInputs();
        renderRoommatesEditor();
        updatePreview();
        bindActionButtons();
    }

    // 綁定通用租約基本欄位
    function bindGeneralInputs() {
        const fieldMap = [
            { id: "inputPropertyAddress", key: "propertyAddress" },
            { id: "inputLeaseStart", key: "leaseStart" },
            { id: "inputLeaseEnd", key: "leaseEnd" },
            { id: "inputTotalRent", key: "totalRent", isNum: true },
            { id: "inputTotalDeposit", key: "totalDeposit", isNum: true },
            { id: "inputRentDueDay", key: "rentDueDay", isNum: true },
            { id: "inputPaymentBank", key: "paymentBank" }
        ];

        fieldMap.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.value = state[item.key];
                el.addEventListener("input", e => {
                    state[item.key] = item.isNum ? Number(e.target.value) || 0 : e.target.value;
                    checkRentDelta();
                    updatePreview();
                });
            }
        });
    }

    // 綁定公用事業費用分攤模式
    function bindUtilityMode() {
        const options = document.querySelectorAll(".utility-option");
        options.forEach(opt => {
            opt.addEventListener("click", () => {
                options.forEach(o => o.classList.remove("active"));
                opt.classList.add("active");
                state.utilityMode = opt.dataset.mode;
                updatePreview();
            });
        });
    }

    // 綁定生活公約勾選與參數
    function bindRulesInputs() {
        const ruleCheckboxes = document.querySelectorAll(".rule-checkbox");
        ruleCheckboxes.forEach(cb => {
            cb.checked = state.rules[cb.dataset.rule] !== false;
            cb.addEventListener("change", () => {
                state.rules[cb.dataset.rule] = cb.checked;
                updatePreview();
            });
        });

        const paramInputs = [
            { id: "inputQuietStart", key: "quietStart" },
            { id: "inputQuietEnd", key: "quietEnd" },
            { id: "inputGuestLimit", key: "guestLimit", isNum: true },
            { id: "inputGuestFee", key: "guestOvernightFee", isNum: true },
            { id: "inputSmokingFine", key: "smokingFine", isNum: true }
        ];

        paramInputs.forEach(p => {
            const el = document.getElementById(p.id);
            if (el) {
                el.value = state.ruleParams[p.key];
                el.addEventListener("input", e => {
                    state.ruleParams[p.key] = p.isNum ? Number(e.target.value) || 0 : e.target.value;
                    updatePreview();
                });
            }
        });
    }

    // 渲染室友成員編輯卡片
    function renderRoommatesEditor() {
        const container = document.getElementById("roommatesListContainer");
        if (!container) return;

        container.innerHTML = "";

        state.roommates.forEach((rm, index) => {
            const card = document.createElement("div");
            card.className = `roommate-card ${rm.isLead ? "is-lead" : ""}`;
            card.innerHTML = `
                <div class="roommate-card-header">
                    <div class="roommate-badge-title">
                        <span>合租人 ${index + 1}</span>
                        ${rm.isLead ? '<span class="lead-tag"><i class="fa-solid fa-crown"></i> 主約代表人</span>' : ""}
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        ${!rm.isLead ? `
                            <button type="button" class="sig-clear-btn btn-set-lead" data-id="${rm.id}" title="設為統籌繳租代表人">
                                <i class="fa-solid fa-crown"></i> 設為代表
                            </button>
                        ` : ""}
                        ${state.roommates.length > 2 ? `
                            <button type="button" class="btn-remove-roommate" data-id="${rm.id}">
                                <i class="fa-solid fa-trash-can"></i> 刪除
                            </button>
                        ` : ""}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">姓名 <span class="required">*</span></label>
                        <input type="text" class="form-control rm-input" data-id="${rm.id}" data-key="name" value="${rm.name}" placeholder="姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">身分證字號 <span class="required">*</span></label>
                        <input type="text" class="form-control rm-input" data-id="${rm.id}" data-key="idNo" value="${rm.idNo}" placeholder="身分證字號">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">聯絡電話 <span class="required">*</span></label>
                        <input type="tel" class="form-control rm-input" data-id="${rm.id}" data-key="phone" value="${rm.phone}" placeholder="手機號碼">
                    </div>
                    <div class="form-group">
                        <label class="form-label">承租房型／空間</label>
                        <input type="text" class="form-control rm-input" data-id="${rm.id}" data-key="room" value="${rm.room}" placeholder="例如：主臥套房">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">分攤月租金 ($ NTD) <span class="required">*</span></label>
                        <input type="number" class="form-control rm-input rm-rent" data-id="${rm.id}" data-key="rentShare" value="${rm.rentShare}" step="500">
                    </div>
                    <div class="form-group">
                        <label class="form-label">分攤押金 ($ NTD) <span class="required">*</span></label>
                        <input type="number" class="form-control rm-input rm-dep" data-id="${rm.id}" data-key="depositShare" value="${rm.depositShare}" step="1000">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">緊急聯絡人</label>
                        <input type="text" class="form-control rm-input" data-id="${rm.id}" data-key="emergencyContact" value="${rm.emergencyContact}" placeholder="關係或姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">緊急聯絡電話</label>
                        <input type="tel" class="form-control rm-input" data-id="${rm.id}" data-key="emergencyPhone" value="${rm.emergencyPhone}" placeholder="聯絡電話">
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // 綁定輸入即時更新
        container.querySelectorAll(".rm-input").forEach(input => {
            input.addEventListener("input", e => {
                const id = Number(e.target.dataset.id);
                const key = e.target.dataset.key;
                const rm = state.roommates.find(r => r.id === id);
                if (rm) {
                    rm[key] = (key === "rentShare" || key === "depositShare") ? Number(e.target.value) || 0 : e.target.value;
                    checkRentDelta();
                    updatePreview();
                }
            });
        });

        // 綁定刪除按鈕
        container.querySelectorAll(".btn-remove-roommate").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                removeRoommate(id);
            });
        });

        // 綁定設為代表按鈕
        container.querySelectorAll(".btn-set-lead").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                setLeadRoommate(id);
            });
        });

        checkRentDelta();
        renderSignaturesEditor();
    }

    // 新增合租人 (最多 4 人)
    function addRoommate() {
        if (state.roommates.length >= 4) {
            alert("目前系統最多支援 4 位共同承租人同時簽署協議書。");
            return;
        }

        const newId = Date.now();
        state.roommates.push({
            id: newId,
            name: `合租人 ${state.roommates.length + 1}`,
            idNo: "",
            phone: "",
            room: "雅房",
            rentShare: 8000,
            depositShare: 16000,
            isLead: false,
            emergencyContact: "",
            emergencyPhone: ""
        });

        renderRoommatesEditor();
        updatePreview();
    }

    // 刪除合租人 (至少 2 人)
    function removeRoommate(id) {
        if (state.roommates.length <= 2) {
            alert("合租協議書至少須包含 2 位共同承租人。");
            return;
        }

        const removed = state.roommates.find(r => r.id === id);
        state.roommates = state.roommates.filter(r => r.id !== id);

        // 若刪除的是主代表，將首位設為主代表
        if (removed && removed.isLead && state.roommates.length > 0) {
            state.roommates[0].isLead = true;
        }

        renderRoommatesEditor();
        updatePreview();
    }

    // 設為主代表
    function setLeadRoommate(id) {
        state.roommates.forEach(r => {
            r.isLead = (r.id === id);
        });
        renderRoommatesEditor();
        updatePreview();
    }

    // 檢查分攤金額防呆與試算
    function checkRentDelta() {
        const sumRent = state.roommates.reduce((acc, r) => acc + (Number(r.rentShare) || 0), 0);
        const sumDep = state.roommates.reduce((acc, r) => acc + (Number(r.depositShare) || 0), 0);

        const deltaRent = sumRent - state.totalRent;
        const deltaDep = sumDep - state.totalDeposit;

        const sumRentEl = document.getElementById("sumRentShare");
        const deltaRentPill = document.getElementById("deltaRentPill");

        if (sumRentEl) sumRentEl.textContent = `$${formatCurrency(sumRent)} 元`;

        if (deltaRentPill) {
            if (deltaRent === 0) {
                deltaRentPill.className = "share-status-pill match";
                deltaRentPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> 租金分攤完全相符 (100%)';
            } else if (deltaRent > 0) {
                deltaRentPill.className = "share-status-pill mismatch";
                deltaRentPill.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> 超出總租金 $${formatCurrency(deltaRent)} 元`;
            } else {
                deltaRentPill.className = "share-status-pill mismatch";
                deltaRentPill.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> 尚差 $${formatCurrency(Math.abs(deltaRent))} 元未分攤`;
            }
        }
    }

    // 渲染簽名板編輯區
    function renderSignaturesEditor() {
        const container = document.getElementById("signaturesContainer");
        if (!container) return;

        container.innerHTML = "";

        state.roommates.forEach((rm, index) => {
            const box = document.createElement("div");
            box.className = "signature-box";
            box.innerHTML = `
                <div class="sig-box-header">
                    <span class="sig-party-name">
                        ${rm.isLead ? '<i class="fa-solid fa-crown" style="color: #c5a059;"></i> ' : ""}${rm.name || `室友 ${index + 1}`} 親簽
                    </span>
                    <button type="button" class="sig-clear-btn" data-sig-id="${rm.id}">
                        <i class="fa-solid fa-rotate-left"></i> 清除
                    </button>
                </div>
                <div class="canvas-wrapper">
                    <canvas id="sigCanvas_${rm.id}" class="sig-canvas"></canvas>
                    <div class="canvas-hint">請在此簽名</div>
                </div>
            `;
            container.appendChild(box);

            // 綁定清除
            box.querySelector(".sig-clear-btn").addEventListener("click", () => {
                clearSignature(rm.id);
            });
        });

        // 初始化畫布
        setTimeout(() => {
            initSignaturePads();
        }, 50);
    }

    // 初始化高解析度 Retina 簽名板
    function initSignaturePads() {
        state.roommates.forEach(rm => {
            const canvas = document.getElementById(`sigCanvas_${rm.id}`);
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 2;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext("2d");
            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#111827";

            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            const wrapper = canvas.parentElement;
            const hint = wrapper.querySelector(".canvas-hint");

            function getPos(e) {
                const r = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: clientX - r.left,
                    y: clientY - r.top
                };
            }

            function startDraw(e) {
                isDrawing = true;
                const pos = getPos(e);
                lastX = pos.x;
                lastY = pos.y;
                if (hint) hint.style.display = "none";
            }

            function draw(e) {
                if (!isDrawing) return;
                e.preventDefault();
                const pos = getPos(e);
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                lastX = pos.x;
                lastY = pos.y;
            }

            function stopDraw() {
                if (!isDrawing) return;
                isDrawing = false;
                syncSignatureToPreview(rm.id, canvas);
            }

            canvas.addEventListener("mousedown", startDraw);
            canvas.addEventListener("mousemove", draw);
            window.addEventListener("mouseup", stopDraw);

            canvas.addEventListener("touchstart", startDraw, { passive: false });
            canvas.addEventListener("touchmove", draw, { passive: false });
            window.addEventListener("touchend", stopDraw);

            signaturePads[rm.id] = { canvas, ctx, hint };
        });
    }

    // 同步簽名到預覽區
    function syncSignatureToPreview(id, canvas) {
        const previewContainer = document.getElementById(`docSigContainer_${id}`);
        if (!previewContainer) return;

        const dataUrl = canvas.toDataURL("image/png");
        previewContainer.innerHTML = `<img src="${dataUrl}" class="doc-sig-preview-img" alt="簽章">`;
    }

    // 清除單一簽名
    function clearSignature(id) {
        const pad = signaturePads[id];
        if (pad && pad.canvas) {
            const ctx = pad.ctx;
            ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
            if (pad.hint) pad.hint.style.display = "block";

            const previewContainer = document.getElementById(`docSigContainer_${id}`);
            if (previewContainer) {
                previewContainer.innerHTML = `<div class="doc-sig-empty-line">(簽署人親筆簽名捺印)</div>`;
            }
        }
    }

    // 更新右側 A4 即時預覽公約內容
    function updatePreview() {
        // 基本資料
        setText("docPropertyAddress", state.propertyAddress);
        setText("docLeasePeriod", `${state.leaseStart} 至 ${state.leaseEnd}`);
        setText("docTotalRent", `$${formatCurrency(state.totalRent)} 元整`);
        setText("docTotalDeposit", `$${formatCurrency(state.totalDeposit)} 元整`);
        setText("docRentDueDay", `每月 ${state.rentDueDay} 日前`);
        setText("docPaymentBank", state.paymentBank);

        const leadRoommate = state.roommates.find(r => r.isLead) || state.roommates[0];
        setText("docLeadRoommate", leadRoommate ? `${leadRoommate.name} (${leadRoommate.phone})` : "全體協商");

        // 費用分攤表
        const sharesTbody = document.getElementById("docSharesTbody");
        if (sharesTbody) {
            sharesTbody.innerHTML = "";
            let sumRent = 0;
            let sumDep = 0;

            state.roommates.forEach((rm, i) => {
                const rent = Number(rm.rentShare) || 0;
                const dep = Number(rm.depositShare) || 0;
                sumRent += rent;
                sumDep += dep;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${rm.name} ${rm.isLead ? '<strong style="color: #c5a059;">(主約代表)</strong>' : ""}</td>
                    <td>${rm.room || "一般雅房"}</td>
                    <td>$${formatCurrency(rent)} 元</td>
                    <td>$${formatCurrency(dep)} 元</td>
                    <td>${rm.emergencyContact ? `${rm.emergencyContact} (${rm.emergencyPhone})` : "—"}</td>
                `;
                sharesTbody.appendChild(tr);
            });

            // 總計列
            const totalTr = document.createElement("tr");
            totalTr.className = "total-row";
            totalTr.innerHTML = `
                <td colspan="2" style="text-align: right;">合計金額：</td>
                <td>$${formatCurrency(sumRent)} 元</td>
                <td>$${formatCurrency(sumDep)} 元</td>
                <td>${sumRent === state.totalRent ? "✓ 完全相符" : `<span style="color: #dc2626;">⚠ 差額 $${formatCurrency(Math.abs(sumRent - state.totalRent))}</span>`}</td>
            `;
            sharesTbody.appendChild(totalTr);
        }

        // 水電瓦斯分攤模式說明
        let utilDesc = "";
        if (state.utilityMode === "equal") {
            utilDesc = `台電電費、自來水費、天然瓦斯、大樓管理費、寬頻網路費由全體合租人（共 ${state.roommates.length} 人）平均分攤繳納。`;
        } else if (state.utilityMode === "weighted") {
            utilDesc = `獨立套房（含專屬衛浴）負擔公共水電與瓦斯 40%，其餘雅房合租人平均分擔剩餘 60% 費用；網路及管理費均攤。`;
        } else {
            utilDesc = `寢室內裝設獨立冷氣分表者，依獨立分表實際度數按台電當期平均電價自付；客廳公電、冰箱公用設備、水瓦斯由全員均攤。`;
        }
        setText("docUtilityModeDesc", utilDesc);

        // 生活公約條款
        renderDocRules();

        // 簽章區塊
        renderDocSignatures();
    }

    // 渲染 A4 預覽中的公約卡片
    function renderDocRules() {
        const container = document.getElementById("docRulesContainer");
        if (!container) return;

        const rulesList = [
            {
                key: "quietHours",
                title: "① 寧靜作息時段",
                icon: "fa-volume-xmark",
                desc: `每日 ${state.ruleParams.quietStart} 至翌日 ${state.ruleParams.quietEnd} 為寧靜時段，禁止高音量娛樂、喧嘩或使用洗衣機。`
            },
            {
                key: "guestCurfew",
                title: "② 日間訪客門禁",
                icon: "fa-user-group",
                desc: `日間訪客需於每日 22:00 前離場，訪客在室期間該室友需全程陪同，不得將鑰匙交予非承租人。`
            },
            {
                key: "guestOvernight",
                title: "③ 訪客留宿規範",
                icon: "fa-bed",
                desc: `非同住親友過夜需提前 24 小時於合租群組報備，每人每月留宿上限 ${state.ruleParams.guestLimit} 晚，逾期每日補貼公水電費 $${formatCurrency(state.ruleParams.guestOvernightFee)} 元。`
            },
            {
                key: "kitchenSafety",
                title: "④ 用火用電安全",
                icon: "fa-fire-burner",
                desc: `廚房用火完畢即刻關閉爐火瓦斯；寢室內嚴禁使用高耗能電爐/電暖器；嚴禁私自改裝水電插座。`
            },
            {
                key: "noSmoking",
                title: "⑤ 室內全面禁菸",
                icon: "fa-ban-smoking",
                desc: `依《菸害防制法》室內及陽台全面嚴禁吸菸（含電子煙），違者負擔全戶除臭清消費用，並處違約金 $${formatCurrency(state.ruleParams.smokingFine)} 元充作公費。`
            },
            {
                key: "petPolicy",
                title: "⑥ 寵物飼養約定",
                icon: "fa-paw",
                desc: `合租處所飼養寵物需經全體合租人書面合意，飼主須負擔氣味防制、排泄物清理、設備損毀賠償及退租除臭消毒全責。`
            },
            {
                key: "fridgeOrder",
                title: "⑦ 冰箱與公物秩序",
                icon: "fa-kitchen-set",
                desc: `冰箱分層存放個人食材需貼標示姓名與日期；公共消耗品由公費統一支應；逾期腐敗食材全員皆得代為丟棄。`
            },
            {
                key: "choreRotation",
                title: "⑧ 公區輪值清潔",
                icon: "fa-broom",
                desc: `客廳、廚房、公共衛浴及垃圾分類每週輪值值日生，值日生負責垃圾清運與公共區域整潔維護。`
            }
        ];

        container.innerHTML = "";
        rulesList.forEach(item => {
            if (state.rules[item.key] !== false) {
                const card = document.createElement("div");
                card.className = "doc-rule-card";
                card.innerHTML = `
                    <div class="doc-rule-card-title">
                        <i class="fa-solid ${item.icon}"></i> ${item.title}
                    </div>
                    <div class="doc-rule-card-body">${item.desc}</div>
                `;
                container.appendChild(card);
            }
        });
    }

    // 渲染 A4 預覽中的簽章卡片
    function renderDocSignatures() {
        const container = document.getElementById("docSignaturesContainer");
        if (!container) return;

        container.innerHTML = "";
        state.roommates.forEach((rm, i) => {
            const card = document.createElement("div");
            card.className = "doc-sig-card";
            card.innerHTML = `
                <div class="doc-sig-name-line">
                    合租立約人 ${i + 1}：${rm.name} ${rm.isLead ? '<strong style="color: #c5a059;">(主約代表)</strong>' : ""}
                </div>
                <div class="doc-sig-details">
                    身分證字號：${rm.idNo || "—"}<br>
                    聯絡手機：${rm.phone || "—"}<br>
                    分攤月租：$${formatCurrency(rm.rentShare)} 元整
                </div>
                <div id="docSigContainer_${rm.id}">
                    <div class="doc-sig-empty-line">(簽署人親筆簽名捺印)</div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 工具文字設值
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // 綁定所有操作按鈕
    function bindActionButtons() {
        // 新增室友
        const btnAdd = document.getElementById("btnAddRoommate");
        if (btnAdd) {
            btnAdd.addEventListener("click", addRoommate);
        }

        // 列印 A4
        const btnPrint = document.getElementById("btnPrintAgreement");
        if (btnPrint) {
            btnPrint.addEventListener("click", () => {
                window.print();
            });
        }

        // 複製 LINE
        const btnCopyLine = document.getElementById("btnCopyLine");
        if (btnCopyLine) {
            btnCopyLine.addEventListener("click", copyLineText);
        }

        // 下載圖卡
        const btnDownloadImage = document.getElementById("btnDownloadImage");
        if (btnDownloadImage) {
            btnDownloadImage.addEventListener("click", exportCanvasImage);
        }

        // 載入示範資料
        const btnLoadSample = document.getElementById("btnLoadSample");
        if (btnLoadSample) {
            btnLoadSample.addEventListener("click", () => {
                if (confirm("確定要載入標準家庭式合租示範資料嗎？現有填寫內容將被替換。")) {
                    loadSampleData();
                }
            });
        }

        // 清空重設
        const btnReset = document.getElementById("btnReset");
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                if (confirm("確定要清空所有資料並重設為空白嗎？")) {
                    resetForm();
                }
            });
        }
    }

    // 產生 LINE 格式化文字並複製
    function copyLineText() {
        const sumRent = state.roommates.reduce((acc, r) => acc + (Number(r.rentShare) || 0), 0);
        const leadRoommate = state.roommates.find(r => r.isLead) || state.roommates[0];

        let text = `🏠【港居房屋 住宅合租生活公約與費用分攤速報】\n`;
        text += `───────────────────────\n`;
        text += `📍 承租處所：${state.propertyAddress}\n`;
        text += `📅 租賃期間：${state.leaseStart} ～ ${state.leaseEnd}\n`;
        text += `💰 總月租金：$${formatCurrency(state.totalRent)} 元 (每月 ${state.rentDueDay} 號前繳交)\n`;
        text += `👑 主約代表：${leadRoommate ? leadRoommate.name : "全體協商"} (${leadRoommate ? leadRoommate.phone : ""})\n`;
        text += `🏦 繳費帳戶：${state.paymentBank}\n\n`;

        text += `👥【各室友分攤月租與押金明細】\n`;
        state.roommates.forEach((rm, i) => {
            text += `🔹 ${i + 1}. ${rm.name}（${rm.room || "雅房"}）：\n`;
            text += `   • 分攤月租：$${formatCurrency(rm.rentShare)} 元\n`;
            text += `   • 分攤押金：$${formatCurrency(rm.depositShare)} 元\n`;
        });
        text += `\n⚡【水電公費分攤模式】：\n`;
        if (state.utilityMode === "equal") {
            text += `全體合租人平均均攤 (水電瓦斯、管理費、寬頻網路)。\n`;
        } else if (state.utilityMode === "weighted") {
            text += `套房負擔 40%，其餘雅房均攤 60%。\n`;
        } else {
            text += `冷氣依各室分表計費，客廳公電與水瓦斯均攤。\n`;
        }

        text += `\n📜【合租生活關鍵三大公約】：\n`;
        text += `1. 寧靜時段：${state.ruleParams.quietStart} ～ ${state.ruleParams.quietEnd} 嚴禁喧嘩洗衣。\n`;
        text += `2. 訪客留宿：需提前24hr報備，每月上限 ${state.ruleParams.guestLimit} 晚，超額補貼公費 $${state.ruleParams.guestOvernightFee}/天。\n`;
        text += `3. 嚴禁吸菸：全戶禁菸，違者罰款 $${formatCurrency(state.ruleParams.smokingFine)} 元並負擔清潔全責。\n`;
        text += `───────────────────────\n`;
        text += `⚖️ 本約依民法第272/280條具完全連帶清償與求償效力。\n`;
        text += `港居不動產開發有限公司 數位線上合約備查系統`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert("已成功複製合租費用與公約速報！可直接貼上至室友 LINE 群組。");
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
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
            alert("已複製合租費用速報至剪貼簿！");
        } catch (err) {
            alert("複製失敗，請手動複製。");
        }
        document.body.removeChild(ta);
    }

    // 匯出 840x1080px 高畫質合租存證圖卡
    function exportCanvasImage() {
        const canvas = document.createElement("canvas");
        canvas.width = 840;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");

        // 背景
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 840, 1080);

        // 頂部港居深藍橫幅
        ctx.fillStyle = "#1a365d";
        ctx.fillRect(0, 0, 840, 110);

        // 金色裝飾底線
        ctx.fillStyle = "#c5a059";
        ctx.fillRect(0, 110, 840, 6);

        // 頂部標題
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px -apple-system, sans-serif";
        ctx.fillText("港居不動產開發有限公司 ｜ 租賃管理部 法務稽核", 40, 42);

        ctx.font = "900 26px 'Noto Serif TC', serif, sans-serif";
        ctx.fillText("住宅租賃合租公約與共同承租連帶責任書", 40, 82);

        // 基本資料卡
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(40, 136, 760, 100);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 136, 760, 100);

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 15px -apple-system, sans-serif";
        ctx.fillText(`📍 承租標的：${state.propertyAddress}`, 60, 168);
        ctx.font = "14px -apple-system, sans-serif";
        ctx.fillText(`📅 租賃期間：${state.leaseStart} ～ ${state.leaseEnd}`, 60, 196);
        ctx.fillText(`💰 總額：月租 $${formatCurrency(state.totalRent)} 元 ｜ 押金 $${formatCurrency(state.totalDeposit)} 元 ｜ 每月 ${state.rentDueDay} 號前繳交`, 60, 222);

        // 室友分攤表
        ctx.fillStyle = "#1a365d";
        ctx.fillRect(40, 256, 760, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("合租人姓名", 60, 280);
        ctx.fillText("承租房型", 220, 280);
        ctx.fillText("分攤月租金", 380, 280);
        ctx.fillText("分攤押金", 520, 280);
        ctx.fillText("身分識別", 680, 280);

        let rowY = 322;
        state.roommates.forEach((rm, i) => {
            ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f1f5f9";
            ctx.fillRect(40, rowY - 26, 760, 36);
            ctx.strokeRect(40, rowY - 26, 760, 36);

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 14px -apple-system, sans-serif";
            ctx.fillText(rm.name || `室友 ${i + 1}`, 60, rowY);

            ctx.font = "13px -apple-system, sans-serif";
            ctx.fillText(rm.room || "一般雅房", 220, rowY);
            ctx.fillText(`$${formatCurrency(rm.rentShare)} 元`, 380, rowY);
            ctx.fillText(`$${formatCurrency(rm.depositShare)} 元`, 520, rowY);

            if (rm.isLead) {
                ctx.fillStyle = "#c5a059";
                ctx.font = "bold 13px -apple-system, sans-serif";
                ctx.fillText("★ 主約代表", 680, rowY);
            } else {
                ctx.fillStyle = "#64748b";
                ctx.fillText("共同承租人", 680, rowY);
            }
            rowY += 36;
        });

        // 法律效力與生活公約核心
        const legalY = rowY + 16;
        ctx.fillStyle = "#fefce8";
        ctx.fillRect(40, legalY, 760, 110);
        ctx.strokeStyle = "#fef08a";
        ctx.strokeRect(40, legalY, 760, 110);

        ctx.fillStyle = "#854d0e";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("⚖️ 法律連帶效力宣告（民法第272/280條）：", 60, legalY + 28);

        ctx.fillStyle = "#713f12";
        ctx.font = "13px -apple-system, sans-serif";
        ctx.fillText("1. 全體合租人向出租人連帶負擔全部租金、水電瓦斯、公用雜費及房屋損壞之清償責任。", 60, legalY + 54);
        ctx.fillText("2. 任一合租人中途搬離，負自覓替補人之責；未完成合法換約前，其租金分擔與連帶責任不消滅。", 60, legalY + 76);
        ctx.fillText(`3. 寧靜時段 ${state.ruleParams.quietStart}~${state.ruleParams.quietEnd} ｜ 全面禁菸違者罰 $${formatCurrency(state.ruleParams.smokingFine)} ｜ 留宿上限 ${state.ruleParams.guestLimit} 晚。`, 60, legalY + 98);

        // 簽章展示區
        const sigY = legalY + 130;
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 15px -apple-system, sans-serif";
        ctx.fillText("✍️ 全體共同立約人親筆簽章備查：", 40, sigY);

        const cardWidth = (760 - (state.roommates.length - 1) * 16) / state.roommates.length;
        state.roommates.forEach((rm, i) => {
            const cardX = 40 + i * (cardWidth + 16);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(cardX, sigY + 12, cardWidth, 120);
            ctx.strokeStyle = "#cbd5e1";
            ctx.strokeRect(cardX, sigY + 12, cardWidth, 120);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 13px -apple-system, sans-serif";
            ctx.fillText(`${rm.name} (${rm.room})`, cardX + 10, sigY + 34);

            const pad = signaturePads[rm.id];
            if (pad && pad.canvas) {
                ctx.drawImage(pad.canvas, cardX + 10, sigY + 44, cardWidth - 20, 76);
            } else {
                ctx.fillStyle = "#94a3b8";
                ctx.font = "12px -apple-system, sans-serif";
                ctx.fillText("(已於線上親簽核定)", cardX + 10, sigY + 80);
            }
        });

        // 底部防偽章
        ctx.fillStyle = "#64748b";
        ctx.font = "12px -apple-system, sans-serif";
        const today = new Date().toISOString().split("T")[0];
        ctx.fillText(`核定產出日期：${today} ｜ 統編：96797997 ｜ 港居不動產開發有限公司 認證`, 40, 1050);

        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
        ctx.strokeRect(660, 1014, 140, 42);
        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 14px 'Noto Serif TC', serif";
        ctx.fillText("港居數位鑑證", 676, 1040);

        // 下載圖片
        const link = document.createElement("a");
        link.download = `港居住宅合租生活公約協議書_${state.roommates[0].name}_${today}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    // 載入示範資料
    function loadSampleData() {
        state.propertyAddress = "高雄市前鎮區民權二路388號12樓之2";
        state.leaseStart = "2026-08-01";
        state.leaseEnd = "2027-07-31";
        state.totalRent = 32000;
        state.totalDeposit = 64000;
        state.rentDueDay = 5;
        state.paymentBank = "臺灣銀行 (004) 高雄分行 帳號：012-004-967979 (戶名：林郁庭)";
        state.utilityMode = "equal";
        state.roommates = [
            {
                id: 1,
                name: "林郁庭",
                idNo: "E223456789",
                phone: "0912-345-678",
                room: "A室主臥套房 (含獨立衛浴)",
                rentShare: 13000,
                depositShare: 26000,
                isLead: true,
                emergencyContact: "林父",
                emergencyPhone: "0910-123-456"
            },
            {
                id: 2,
                name: "陳奕安",
                idNo: "S124567890",
                phone: "0928-765-432",
                room: "B室陽台景觀雅房",
                rentShare: 10000,
                depositShare: 20000,
                isLead: false,
                emergencyContact: "陳母",
                emergencyPhone: "0921-987-654"
            },
            {
                id: 3,
                name: "黃品瑄",
                idNo: "T225678901",
                phone: "0933-888-999",
                room: "C室靜巷採光雅房",
                rentShare: 9000,
                depositShare: 18000,
                isLead: false,
                emergencyContact: "黃姊",
                emergencyPhone: "0935-666-777"
            }
        ];

        bindGeneralInputs();
        renderRoommatesEditor();
        updatePreview();
    }

    // 重設空白表單
    function resetForm() {
        state.propertyAddress = "";
        state.leaseStart = "";
        state.leaseEnd = "";
        state.totalRent = 0;
        state.totalDeposit = 0;
        state.rentDueDay = 5;
        state.paymentBank = "";
        state.roommates = [
            {
                id: 1,
                name: "",
                idNo: "",
                phone: "",
                room: "套房",
                rentShare: 0,
                depositShare: 0,
                isLead: true,
                emergencyContact: "",
                emergencyPhone: ""
            },
            {
                id: 2,
                name: "",
                idNo: "",
                phone: "",
                room: "雅房",
                rentShare: 0,
                depositShare: 0,
                isLead: false,
                emergencyContact: "",
                emergencyPhone: ""
            }
        ];

        bindGeneralInputs();
        renderRoommatesEditor();
        updatePreview();
    }

    // 啟動程式
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
